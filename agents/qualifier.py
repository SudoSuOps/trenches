"""
Lead Qualifier Agent — SwarmTrenches

Runs continuously on swarmrails, checks coffee cards every 5 minutes,
scores them for broker relevance using local vLLM (Qwen 7B).
Marks weak leads as "expired" so brokers only see real deals.

Usage:
    python qualifier.py
"""

import asyncio
import json
import logging
import os
from pathlib import Path

from agent_base import chat_local, fetch_heph, log_action, post_heph

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("trenches.qualifier")

INTERVAL = int(os.getenv("QUALIFIER_INTERVAL", "300"))  # 5 min default
SYSTEM_PROMPT = (Path(__file__).parent / "prompts" / "qualify_claim.txt").read_text()

# Track which cards we've already processed
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
        SEEN_FILE.write_text(json.dumps(list(seen)[-5000:]))
    except Exception as e:
        logger.error(f"Save seen error: {e}")


async def qualify_cards():
    """Fetch fresh coffee cards and qualify them with local LLM."""
    seen = load_seen()

    # Get all fresh cards
    cards = await fetch_heph("/api/coffee/today?limit=50")
    if not cards or not isinstance(cards, list):
        logger.info("No cards from Heph — API may be down")
        return

    new_cards = [c for c in cards if c.get("id") not in seen]
    if not new_cards:
        logger.info(f"All {len(cards)} cards already qualified")
        return

    logger.info(f"{len(new_cards)} new cards to qualify out of {len(cards)} total")

    qualified = 0
    rejected = 0
    priority = 0

    for card in new_cards:
        card_id = card.get("id", "")
        pain = card.get("pain_summary", "")
        vertical = card.get("vertical", "unknown")
        score = card.get("tenant_score", 0)
        pitch = card.get("pitch_angle", "")

        if not pain:
            seen.add(card_id)
            continue

        # Ask local 7B to qualify
        result = await chat_local(
            system=SYSTEM_PROMPT,
            user=f"Pain claim: {pain}\nVertical: {vertical}\nTenant Score: {score}\nPitch: {pitch[:200]}",
            max_tokens=256,
            temperature=0.1,
        )

        if not result:
            logger.warning(f"LLM returned nothing for card {card_id[:8]}")
            continue

        try:
            # Parse JSON response
            # Handle potential markdown wrapping
            text = result.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text
                text = text.rsplit("```", 1)[0] if "```" in text else text
                text = text.strip()

            qualification = json.loads(text)
            is_closeable = qualification.get("is_closeable", "no")
            urgency = qualification.get("urgency", "low")
            deal_signal = qualification.get("deal_signal", "")

            if is_closeable == "yes" and urgency in ("critical", "high"):
                priority += 1
                qualified += 1
                log_action(
                    agent="qualifier",
                    action="priority",
                    detail=f"PRIORITY LEAD: {pain[:50]} — {deal_signal[:60]}",
                    card_id=card_id,
                )
                logger.info(f"  PRIORITY: {card_id[:8]} — {deal_signal[:60]}")

            elif is_closeable == "yes":
                qualified += 1
                log_action(
                    agent="qualifier",
                    action="qualified",
                    detail=f"Qualified: {pain[:50]} — {deal_signal[:60]}",
                    card_id=card_id,
                )
                logger.info(f"  QUALIFIED: {card_id[:8]} — {deal_signal[:60]}")

            elif is_closeable == "maybe":
                qualified += 1
                logger.info(f"  MAYBE: {card_id[:8]} — {deal_signal[:60]}")

            else:
                # Not closeable — expire the card so it doesn't clutter the board
                rejected += 1
                await post_heph(
                    f"/api/coffee/{card_id}/status",
                    {"status": "expired"},
                )
                log_action(
                    agent="qualifier",
                    action="rejected",
                    detail=f"Rejected: {pain[:50]} — {deal_signal[:60]}",
                    card_id=card_id,
                )
                logger.info(f"  REJECTED: {card_id[:8]} — {deal_signal[:60]}")

        except json.JSONDecodeError:
            logger.debug(f"Non-JSON response for card {card_id[:8]}: {result[:100]}")

        seen.add(card_id)
        # Small delay between cards to not hammer vLLM
        await asyncio.sleep(1)

    save_seen(seen)

    summary = f"{priority} priority, {qualified} qualified, {rejected} rejected out of {len(new_cards)} cards"
    logger.info(f"Cycle complete: {summary}")
    log_action(
        agent="qualifier",
        action="cycle_complete",
        detail=summary,
    )


async def main():
    logger.info(f"Lead Qualifier starting — interval: {INTERVAL}s, vLLM: localhost:8000")
    log_action(
        agent="qualifier",
        action="startup",
        detail=f"Lead Qualifier online — qualifying every {INTERVAL}s",
    )

    while True:
        try:
            await qualify_cards()
        except Exception as e:
            logger.error(f"Qualification cycle error: {e}")
        await asyncio.sleep(INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
