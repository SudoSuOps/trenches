"""
X Outreach Agent — SwarmTrenches

Drafts X/Twitter posts from coffee card pitch angles using HF burst (72B).
Draft-only in v1 — broker approves before posting.

Usage:
    Called on-demand via proxy endpoint, or:
    python -m agents.x_outreach --card-id <id>
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path
from datetime import datetime

from agent_base import chat_hf_burst, chat_local, fetch_heph, log_action

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("trenches.x_outreach")

SYSTEM_PROMPT = (Path(__file__).parent / "prompts" / "draft_x_post.txt").read_text()
DRAFTS_FILE = Path(__file__).parent / "x_drafts.jsonl"


def save_draft(card_id: str, text: str) -> dict:
    """Save a draft X post to JSONL storage."""
    draft = {
        "id": f"xd_{int(datetime.utcnow().timestamp() * 1000)}",
        "card_id": card_id,
        "text": text,
        "status": "draft",
        "created_at": datetime.utcnow().isoformat(),
    }
    try:
        with open(DRAFTS_FILE, "a") as f:
            f.write(json.dumps(draft) + "\n")
    except Exception as e:
        logger.error(f"Draft save error: {e}")
    return draft


async def draft_x_post(card_id: str) -> dict | None:
    """Generate an X post draft for a coffee card."""
    card = await fetch_heph(f"/api/coffee/{card_id}")
    if not card:
        logger.error(f"Card {card_id} not found")
        return None

    pain = card.get("pain_summary", "")
    vertical = card.get("vertical", "unknown")
    pitch = card.get("pitch_angle", "")
    gpu = f"{card.get('inferred_gpu_count', '?')}x {card.get('inferred_gpu_type', '?')}"
    tcv = card.get("estimated_tcv", 0)
    playbook = card.get("recommended_playbook", "grind")

    user_prompt = f"""Generate an X/Twitter post for this compute pain lead:

PAIN: {pain}
VERTICAL: {vertical}
PITCH: {pitch}
GPU NEEDS: {gpu}
DEAL SIZE: ${tcv:,.0f}
PLAYBOOK: {playbook}

Write a post that speaks to this developer's pain and positions dedicated compute as the solution."""

    log_action(
        agent="x_outreach",
        action="drafting",
        detail=f"Drafting X post for {vertical} card: {pain[:40]}",
        card_id=card_id,
    )

    # Try HF burst (72B) first for quality, fall back to local 7B
    text = await chat_hf_burst(
        system=SYSTEM_PROMPT,
        user=user_prompt,
        max_tokens=200,
        temperature=0.6,
    )

    if not text:
        logger.info("HF burst unavailable, falling back to local 7B")
        text = await chat_local(
            system=SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=200,
            temperature=0.6,
        )

    if not text:
        logger.error("Both LLM backends failed")
        log_action(
            agent="x_outreach",
            action="error",
            detail="Failed to generate X draft — both LLM backends down",
            card_id=card_id,
        )
        return None

    # Clean up the text — remove quotes if wrapped
    text = text.strip().strip('"').strip("'")

    # Enforce 280 char limit
    if len(text) > 280:
        text = text[:277] + "..."

    draft = save_draft(card_id, text)

    log_action(
        agent="x_outreach",
        action="drafted",
        detail=f"X draft ready: \"{text[:60]}...\"",
        card_id=card_id,
    )

    return draft


async def main():
    if len(sys.argv) < 3 or sys.argv[1] != "--card-id":
        print("Usage: python x_outreach.py --card-id <card_id>")
        sys.exit(1)

    card_id = sys.argv[2]
    draft = await draft_x_post(card_id)
    if draft:
        print(f"\nDraft X Post:")
        print(f"  {draft['text']}")
        print(f"\nDraft ID: {draft['id']}")
        print(f"Status: {draft['status']}")
    else:
        print("Failed to generate draft")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
