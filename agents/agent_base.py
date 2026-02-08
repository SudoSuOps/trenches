"""
Shared agent infrastructure — LLM clients, logging, feed writer.
"""

import os
import json
import time
import logging
from pathlib import Path
from datetime import datetime

import httpx

logger = logging.getLogger("trenches.agents")

# Agent feed file — shared with proxy
AGENT_LOG_FILE = os.getenv(
    "AGENT_LOG_FILE",
    str(Path(__file__).parent.parent / "proxy" / "agent_feed.jsonl"),
)

# Local vLLM on rails
VLLM_URL = os.getenv("VLLM_URL", "http://localhost:8000")

# HF Inference API
HF_TOKEN = os.getenv("HF_TOKEN", "")
HF_INFERENCE_URL = "https://router.huggingface.co/hf-inference/models"

# Heph API on whale
HEPH_API = os.getenv("HEPH_API", "http://192.168.0.99:8000")


def log_action(agent: str, action: str, detail: str, card_id: str | None = None):
    """Append an action to the agent feed JSONL."""
    entry = {
        "id": f"act_{int(time.time() * 1000)}",
        "agent": agent,
        "action": action,
        "detail": detail,
        "timestamp": datetime.utcnow().isoformat(),
    }
    if card_id:
        entry["card_id"] = card_id

    try:
        p = Path(AGENT_LOG_FILE)
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        logger.error(f"Feed write error: {e}")


async def chat_local(
    system: str,
    user: str,
    max_tokens: int = 512,
    temperature: float = 0.3,
) -> str | None:
    """Chat completion via local vLLM (Qwen 7B on rails)."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                f"{VLLM_URL}/v1/chat/completions",
                json={
                    "model": "Qwen/Qwen2.5-7B-Instruct",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"Local LLM error: {e}")
    return None


async def chat_hf_burst(
    system: str,
    user: str,
    model: str = "Qwen/Qwen2.5-72B-Instruct",
    max_tokens: int = 1024,
    temperature: float = 0.5,
) -> str | None:
    """Chat completion via HF Inference API (burst to 72B)."""
    if not HF_TOKEN:
        logger.error("HF_TOKEN not set — cannot burst")
        return None

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{HF_INFERENCE_URL}/{model}/v1/chat/completions",
                headers={"Authorization": f"Bearer {HF_TOKEN}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            if r.status_code == 200:
                data = r.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        logger.error(f"HF burst error: {e}")
    return None


async def fetch_heph(path: str) -> dict | list | None:
    """Fetch from Heph API."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{HEPH_API}{path}")
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        logger.debug(f"Heph fetch {path}: {e}")
    return None
