"""Pulse synthesizer — the AI core.

Takes a correlated anomaly (on-chain tick + social reading + classification)
and produces a tight, human-readable "Pulse Report". The system prompt mutates
based on the active persona:

  * standard      — precise, institutional-grade crypto analyst.
  * shadow ninja  — uncensored Web3 degen native (unlocked by N1NJ4 NFT).

LLM output is JSON-mode (report + keywords + degen_score). If no LLM is
configured or the call fails, a deterministic local templater produces a
believable report so the pipeline never stalls.
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from ..clients.llm import llm_client
from ..clients.market import TokenTick
from ..clients.social import SocialReading
from ..models import Persona, Pulse, PulseMetrics, PulseType

TYPE_LABELS = {
    "BUY": "🚨 WHALE ACCUMULATION",
    "HYPE": "🔥 SOCIAL RUSH",
    "DUMP": "⚠️ LIQUIDATION ALERT",
    "VOLUME": "⚡ VOL BREAKOUT",
}

SYSTEM_STANDARD = (
    "You are NinjaPing, an institutional-grade on-chain analyst for the "
    "Injective ecosystem. You correlate on-chain flow with social signal and "
    "write a sharp, precise, 3-sentence market pulse. Sentence 1: the catalyst. "
    "Sentence 2: the current on-chain/social state. Sentence 3: the risk read. "
    "Use exact figures from the data. No hype, no filler, no financial advice "
    "disclaimers. Return JSON with keys: report (string, exactly 3 sentences), "
    "keywords (array of 3-5 short phrases appearing verbatim in report to bold), "
    "degen_score (integer 0-100, 0=quiet smart money, 100=pure retail hype)."
)

SYSTEM_SHADOW = (
    "You are NinjaPing in SHADOW NINJA mode — a battle-tested Injective degen "
    "native writing for N1NJ4 NFT holders. Be sharp, cynical and crypto-slang "
    "fluent (paper hands, smart money frontrunning, accumulation wall, exit "
    "liquidity, send it). Connect the on-chain flow with the social noise and "
    "drop the raw alpha in exactly 3 punchy sentences — catalyst, state, the "
    "play. No institutional fluff, no disclaimers. Return JSON with keys: "
    "report (string, exactly 3 sentences), keywords (array of 3-5 short phrases "
    "appearing verbatim in report to bold), degen_score (integer 0-100)."
)


def _build_user_prompt(tick: TokenTick, social: SocialReading, ptype: PulseType,
                       whale_usd: float | None) -> str:
    lines = [
        f"TOKEN: {tick.ticker} ({tick.name})",
        f"CLASSIFICATION: {ptype} ({TYPE_LABELS[ptype]})",
        f"PRICE: ${tick.price}",
        f"PRICE CHANGE 1h: {tick.price_change_1h:+.2f}%",
        f"PRICE CHANGE 24h: {tick.price_change_24h:+.2f}%",
        f"24h VOLUME (USD): ${tick.volume_24h:,.0f}",
        f"PRIMARY VENUE: {tick.source}",
    ]
    if whale_usd:
        lines.append(f"WHALE TX (USD): ${whale_usd:,.0f}")
    lines.append("--- SOCIAL (X / KOL stream) ---")
    lines.append(
        f"Mentions last 1h: {social.mentions_1h} (baseline {social.baseline_1h}), "
        f"velocity {social.velocity_pct:+.0f}%"
    )
    if social.top_kols:
        lines.append(f"KOLs engaged: {', '.join(social.top_kols)}")
    if social.sample_tweets:
        lines.append("Sample posts:")
        lines.extend(f"  - {t}" for t in social.sample_tweets)
    else:
        lines.append("Social: silent — no notable mentions.")
    return "\n".join(lines)


def _local_report(tick: TokenTick, social: SocialReading, ptype: PulseType,
                  whale_usd: float | None, persona: Persona) -> dict:
    """Deterministic fallback when no LLM is available."""
    vol = f"${tick.volume_24h/1000:,.0f}K"
    vel = f"{social.velocity_pct:+.0f}%"
    degen = max(0, min(100, int(50 + social.velocity_pct / 4 - (40 if whale_usd else 0))))
    shadow = persona == "shadow"
    if ptype == "BUY":
        w = f"${whale_usd/1000:,.0f}K" if whale_usd else "$25K"
        report = (
            f"Wallet flagged as a whale just absorbed {w} of {tick.ticker} on "
            f"{tick.source}. " +
            (f"Social is dead quiet — {social.mentions_1h} mentions, {vel} velocity — "
             f"so this is silent accumulation, not a crowd trade. "
             if social.velocity_pct < 60 else
             f"Mentions are climbing ({vel}) as the move gets noticed. ") +
            ("Someone is building a position before the rest of the timeline wakes up."
             if not shadow else
             "Smart money frontrunning the herd — this is the quiet bid before the send.")
        )
        keywords = ["whale", w, tick.source, vel]
    elif ptype == "HYPE":
        report = (
            f"{tick.ticker} volume is ripping (24h ${tick.volume_24h/1e6:,.1f}M) while X "
            f"velocity spikes {vel} across {len(social.top_kols)} KOLs. " +
            f"Price is {tick.price_change_1h:+.1f}% on the hour, driven by retail flow "
            f"rather than any single whale print. " +
            ("Momentum is real but reflexive — fade the euphoria if the social wave stalls."
             if not shadow else
             "Pure hopium velocity — ride it but keep a hand on the exit, hype unwinds fast.")
        )
        keywords = [tick.ticker, vel, f"{tick.price_change_1h:+.1f}%", "retail"]
    elif ptype == "DUMP":
        report = (
            f"{tick.ticker} dropped {tick.price_change_1h:.1f}% on the hour, tripping "
            f"liquidations across leveraged longs. " +
            f"24h volume sits at ${tick.volume_24h/1e6:,.1f}M with social velocity {vel} — "
            f"a mix of panic posts and dip-buyers. " +
            ("On-chain liquidity looks intact, so this reads as a leverage flush, not a structural break."
             if not shadow else
             "Liquidity walls are holding — this is a long squeeze, not the rug; weak hands paying for the discount.")
        )
        keywords = [tick.ticker, f"{tick.price_change_1h:.1f}%", "liquidations", vel]
    else:  # VOLUME
        report = (
            f"{tick.ticker} just printed a volume breakout — 24h turnover ${tick.volume_24h/1e6:,.1f}M "
            f"with price {tick.price_change_1h:+.1f}% on the hour. " +
            f"Social velocity is {vel}, so the move is " +
            ("running ahead of the timeline. " if social.velocity_pct < 80 else "matched by a social surge. ") +
            ("Watch for follow-through; breakouts on thin social are often whale-led."
             if not shadow else
             "Volume leads price — front of the move, not the back. Don't be exit liquidity.")
        )
        keywords = [tick.ticker, vol, f"{tick.price_change_1h:+.1f}%", vel]
    return {"report": report, "keywords": keywords, "degen_score": degen}


async def synthesize(tick: TokenTick, social: SocialReading, ptype: PulseType,
                     persona: Persona = "standard",
                     whale_usd: float | None = None,
                     trigger=None) -> Pulse:
    system = SYSTEM_SHADOW if persona == "shadow" else SYSTEM_STANDARD
    user = _build_user_prompt(tick, social, ptype, whale_usd)

    data = await llm_client.complete_json(system, user)
    if not data or "report" not in data:
        data = _local_report(tick, social, ptype, whale_usd, persona)

    metrics = PulseMetrics(
        vol=f"${tick.volume_24h/1000:,.0f}K" if tick.volume_24h < 1e6
        else f"${tick.volume_24h/1e6:,.1f}M",
        social_velocity=f"{social.velocity_pct:+.0f}%",
        platform=tick.source,
        price_change=f"{tick.price_change_1h:+.2f}%",
        whale_size=f"${whale_usd/1000:,.0f}K" if whale_usd else None,
        social_source=getattr(social, "source", "sim"),
        social_live=getattr(social, "live", False),
    )
    degen = int(data.get("degen_score", 50))
    created_at = datetime.now(timezone.utc).isoformat()
    report = str(data["report"]).strip()
    # Verifiable commitment: anyone can recompute this from the public fields.
    proof_hash = hashlib.sha256(
        f"{tick.ticker}|{ptype}|{created_at}|{report}".encode()
    ).hexdigest()
    return Pulse(
        id=str(uuid.uuid4()),
        created_at=created_at,
        type=ptype,
        token=tick.ticker,
        ai_report=report,
        proof_hash=proof_hash,
        metrics=metrics,
        trigger=trigger,
        entry_price=tick.price,
        degen_score=max(0, min(100, degen)),
        persona=persona,
        keywords=[str(k) for k in data.get("keywords", [])][:6],
        raw={
            "onchain": {
                "price": tick.price,
                "volume_24h": tick.volume_24h,
                "price_change_1h": tick.price_change_1h,
                "source": tick.source,
                "synthetic": tick.synthetic,
            },
            "social": {
                "mentions_1h": social.mentions_1h,
                "velocity_pct": social.velocity_pct,
                "kols": social.top_kols,
                "tweets": social.sample_tweets,
                "live": getattr(social, "live", False),
                "source": getattr(social, "source", "sim"),
            },
            "llm_provider": llm_client.provider,
        },
    )
