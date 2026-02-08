"""
SwarmTrenches Proxy — port 8091

Aggregates Heph API (coffee endpoints) on whale, serves agent feed,
SSE real-time stream, and static Next.js build.
"""

import os
import json
import time
import asyncio
import logging
from pathlib import Path
from datetime import datetime

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

WHALE_URL = os.getenv("WHALE_URL", "http://192.168.0.99")
HEPH_API = f"{WHALE_URL}:8080"
STATIC_DIR = os.getenv("STATIC_DIR", str(Path(__file__).parent.parent / "out"))
AGENT_LOG_FILE = os.getenv("AGENT_LOG_FILE", str(Path(__file__).parent / "agent_feed.jsonl"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger("trenches.proxy")

# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

_cache: dict[str, tuple[float, dict]] = {}


def _get_cached(key: str, ttl: float) -> dict | None:
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _set_cache(key: str, data: dict):
    _cache[key] = (time.time(), data)


# ---------------------------------------------------------------------------
# Upstream fetchers
# ---------------------------------------------------------------------------

async def _fetch_json(url: str, timeout: float = 10.0) -> dict | list | None:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(url)
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        logger.debug(f"Fetch {url}: {e}")
    return None


async def _post_json(url: str, body: dict | None = None, timeout: float = 30.0) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=body or {})
            if r.status_code == 200:
                return r.json()
    except Exception as e:
        logger.debug(f"Post {url}: {e}")
    return None


# ---------------------------------------------------------------------------
# Agent feed helpers
# ---------------------------------------------------------------------------

def _read_agent_feed(limit: int = 20) -> list[dict]:
    """Read recent agent actions from JSONL file."""
    try:
        p = Path(AGENT_LOG_FILE)
        if not p.exists():
            return []
        lines = p.read_text().strip().split("\n")
        actions = []
        for line in reversed(lines[-limit:]):
            try:
                actions.append(json.loads(line))
            except json.JSONDecodeError:
                pass
        return actions
    except Exception:
        return []


def _append_agent_feed(action: dict):
    """Append an agent action to the JSONL file."""
    try:
        p = Path(AGENT_LOG_FILE)
        with open(p, "a") as f:
            f.write(json.dumps(action) + "\n")
    except Exception as e:
        logger.error(f"Agent feed write: {e}")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="SwarmTrenches Proxy", version="1.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Trenches API routes — proxy to Heph coffee endpoints
# ---------------------------------------------------------------------------

@app.get("/api/trenches/cards")
async def trenches_cards(limit: int = 50, vertical: str | None = None):
    """Get coffee cards — proxy to Heph /api/coffee/today."""
    cache_key = f"cards_{vertical}_{limit}"
    cached = _get_cached(cache_key, 15)
    if cached:
        return cached

    params = f"?limit={limit}"
    if vertical:
        params += f"&vertical={vertical}"

    data = await _fetch_json(f"{HEPH_API}/api/coffee/today{params}")
    result = data if data else []
    _set_cache(cache_key, result)
    return result


@app.get("/api/trenches/card/{card_id}")
async def trenches_card(card_id: str):
    """Get single coffee card."""
    data = await _fetch_json(f"{HEPH_API}/api/coffee/{card_id}")
    if not data:
        return JSONResponse({"error": "Card not found"}, status_code=404)
    return data


@app.post("/api/trenches/brew")
async def trenches_brew(request: Request):
    """Brew new coffee cards."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    data = await _post_json(f"{HEPH_API}/api/coffee/brew", body, timeout=60.0)
    if not data:
        return JSONResponse({"error": "Brew failed — Heph API unreachable"}, status_code=502)

    # Clear card cache so next fetch gets fresh data
    for key in list(_cache.keys()):
        if key.startswith("cards_"):
            del _cache[key]

    return data


@app.post("/api/trenches/card/{card_id}/promote")
async def trenches_promote(card_id: str):
    """Promote card to pipeline."""
    data = await _post_json(f"{HEPH_API}/api/coffee/{card_id}/promote")
    if not data:
        return JSONResponse({"error": "Promote failed"}, status_code=502)

    _append_agent_feed({
        "id": f"act_{int(time.time())}",
        "agent": "qualifier",
        "action": "promote",
        "detail": f"Card {card_id[:8]} promoted to pipeline",
        "timestamp": datetime.utcnow().isoformat(),
        "card_id": card_id,
    })
    return data


@app.post("/api/trenches/card/{card_id}/status")
async def trenches_status(card_id: str, request: Request):
    """Update card status."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    data = await _post_json(f"{HEPH_API}/api/coffee/{card_id}/status", body)
    if not data:
        return JSONResponse({"error": "Status update failed"}, status_code=502)
    return data


@app.get("/api/trenches/stats")
async def trenches_stats():
    """Coffee stats."""
    cached = _get_cached("stats", 30)
    if cached:
        return cached

    data = await _fetch_json(f"{HEPH_API}/api/coffee/stats")
    result = data if data else {}
    _set_cache("stats", result)
    return result


# ---------------------------------------------------------------------------
# Agent endpoints
# ---------------------------------------------------------------------------

@app.get("/api/trenches/agents/feed")
async def agents_feed(limit: int = 20):
    """Get recent agent actions."""
    return _read_agent_feed(limit)


@app.post("/api/trenches/agents/x-draft")
async def agents_x_draft(request: Request):
    """Trigger X post draft generation for a card."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse({"error": "Invalid request"}, status_code=400)

    card_id = body.get("card_id")
    if not card_id:
        return JSONResponse({"error": "card_id required"}, status_code=400)

    # Get the card data
    card = await _fetch_json(f"{HEPH_API}/api/coffee/{card_id}")
    if not card:
        return JSONResponse({"error": "Card not found"}, status_code=404)

    # For now, return a placeholder — the x_outreach agent will handle real generation
    _append_agent_feed({
        "id": f"act_{int(time.time())}",
        "agent": "x_outreach",
        "action": "draft_requested",
        "detail": f"X post draft requested for {card.get('vertical', 'unknown')} card",
        "timestamp": datetime.utcnow().isoformat(),
        "card_id": card_id,
    })

    return {
        "status": "queued",
        "card_id": card_id,
        "message": "X draft generation queued. Check agent feed for updates.",
    }


# ---------------------------------------------------------------------------
# SSE real-time stream
# ---------------------------------------------------------------------------

@app.get("/api/trenches/stream")
async def trenches_stream(request: Request):
    """Server-Sent Events — combined push every 10s."""

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            cards, stats = await asyncio.gather(
                _fetch_json(f"{HEPH_API}/api/coffee/today?limit=50"),
                _fetch_json(f"{HEPH_API}/api/coffee/stats"),
            )

            payload = {
                "timestamp": datetime.utcnow().isoformat(),
                "cards": cards if cards else [],
                "stats": stats if stats else {},
                "agents": _read_agent_feed(10),
            }

            yield {"event": "trenches", "data": json.dumps(payload)}
            await asyncio.sleep(10)

    return EventSourceResponse(event_generator())


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "swarmtrenches-proxy",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ---------------------------------------------------------------------------
# Static file serving (Next.js export)
# ---------------------------------------------------------------------------

static_path = Path(STATIC_DIR)
if static_path.exists() and static_path.is_dir():
    from fastapi.staticfiles import StaticFiles

    @app.get("/")
    async def serve_index():
        index = static_path / "index.html"
        if index.exists():
            return FileResponse(str(index), media_type="text/html")
        return JSONResponse(
            {"error": "Not built yet. Run: cd .. && npm run build"},
            status_code=404,
        )

    app.mount("/", StaticFiles(directory=str(static_path), html=True), name="static")
else:
    @app.get("/")
    async def no_build():
        return JSONResponse(
            {"error": f"Static dir not found: {STATIC_DIR}. Run: cd .. && npm run build"},
            status_code=404,
        )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8091)
