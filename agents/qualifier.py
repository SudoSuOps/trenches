"""
Lead Qualifier Agent — SwarmTrenches

Runs continuously on swarmrails, checks for new pain claims every 5 minutes,
scores them for broker relevance using local vLLM (Qwen 7B).

Usage:
    python -m agents.qualifier
"""

import asyncio
import json
import logging
import os
from pathlib import Path

from agent_base import chat_local, fetch_heph, log_action

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("trenches.qualifier")

INTERVAL = int(os.getenv("QUALIFIER_INTERVAL", "300"))  # 5 min default
SYSTEM_PROMPT = (Path(__file__).parent / "prompts" / "qualify_claim.txt").read_text()

# Track which claims we've already processed
SEEN_FILE = Path(__file__).parent / ".qualifier_seen.json"


def load_seen() -> set[str]:
    try:
        if SEEN_FILE.exists():
            return set(json.loads(SEEN_FILE.read_text()))
    except Exception:
        pass
    return set()


def save_seen(seen: set[str]):
    try:
        SEEN_FILE.write_text(json.dumps(list(seen)[-5000:]))  # Keep last 5000
    except Exception as e:
        logger.error(f"Save seen error: {e}")


async def qualify_claims():
    """Fetch recent pain claims and qualify them."""
    seen = load_seen()

    # Get today's coffee cards to see what's already been processed
    cards = await fetch_heph("/api/coffee/today?limit=100")
    if not cards:
        logger.info("No cards from Heph — API may be down")
        return

    existing_ids = set()
    if isinstance(cards, list):
        for c in cards:
            # Extract claim IDs from each card
            try:
                claim_ids = json.loads(c.get("pain_claim_ids", "[]"))
                existing_ids.update(claim_ids)
            except (json.JSONDecodeError, TypeError):
                pass

    # Get recent pain claims from Heph stats
    stats = await fetch_heph("/api/coffee/stats")
    if not stats:
        logger.info("No stats from Heph")
        return

    graph_data = stats.get("graph", {})
    total_claims = graph_data.get("total_claims", 0)
    pain_claims = graph_data.get("pain_claims", 0)

    logger.info(
        f"Pipeline: {total_claims} total claims, {pain_claims} pain, "
        f"{len(existing_ids)} in cards, {len(seen)} previously qualified"
    )

    # Log qualification activity
    qualified = 0
    priority = 0

    # We don't have direct access to raw claims here — the qualifier
    # works by checking if a brew would produce new cards
    if pain_claims > len(existing_ids):
        new_potential = pain_claims - len(existing_ids)
        logger.info(f"{new_potential} potential new leads to qualify")

        log_action(
            agent="qualifier",
            action="scan",
            detail=f"Scanned pipeline: {new_potential} new pain signals detected, {pain_claims} total pain claims",
        )

        # If there are unprocessed claims, we could trigger a brew
        # But we'll leave that to the broker (manual BREW button)
        # Instead, just log the status
        if new_potential >= 5:
            log_action(
                agent="qualifier",
                action="recommend",
                detail=f"Recommend BREW: {new_potential} unprocessed pain claims waiting",
            )
    else:
        log_action(
            agent="qualifier",
            action="scan",
            detail=f"Pipeline current: {len(existing_ids)} cards cover {pain_claims} pain claims",
        )

    # Qualify individual cards that haven't been scored by agent
    for card in (cards if isinstance(cards, list) else []):
        card_id = card.get("id", "")
        if card_id in seen:
            continue

        # Use local LLM to assess the card
        pain = card.get("pain_summary", "")
        vertical = card.get("vertical", "unknown")
        score = card.get("tenant_score", 0)

        if not pain:
            seen.add(card_id)
            continue

        result = await chat_local(
            system=SYSTEM_PROMPT,
            user=f"Claim: {pain}\nVertical: {vertical}\nCurrent Score: {score}",
            max_tokens=256,
            temperature=0.2,
        )

        if result:
            try:
                # Try to parse JSON response
                qualification = json.loads(result.strip())
                is_closeable = qualification.get("is_closeable", "maybe")
                urgency = qualification.get("urgency", "medium")
                deal_signal = qualification.get("deal_signal", "")

                if is_closeable == "yes" and urgency in ("critical", "high"):
                    priority += 1
                    log_action(
                        agent="qualifier",
                        action="qualified",
                        detail=f"PRIORITY: {pain[:60]} — {deal_signal[:80]}",
                        card_id=card_id,
                    )
                elif is_closeable == "yes":
                    qualified += 1
                    log_action(
                        agent="qualifier",
                        action="qualified",
                        detail=f"Qualified: {pain[:60]}",
                        card_id=card_id,
                    )
                # Skip logging for non-closeable — too noisy
            except json.JSONDecodeError:
                logger.debug(f"Non-JSON response for card {card_id[:8]}")

        seen.add(card_id)

    save_seen(seen)

    if qualified or priority:
        log_action(
            agent="qualifier",
            action="batch_complete",
            detail=f"{priority} priority, {qualified} qualified leads this cycle",
        )


async def main():
    logger.info(f"Lead Qualifier starting — interval: {INTERVAL}s")
    log_action(
        agent="qualifier",
        action="startup",
        detail=f"Lead Qualifier online — scanning every {INTERVAL}s",
    )

    while True:
        try:
            await qualify_claims()
        except Exception as e:
            logger.error(f"Qualification cycle error: {e}")
        await asyncio.sleep(INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
