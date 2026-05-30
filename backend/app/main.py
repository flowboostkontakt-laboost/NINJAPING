"""NinjaPing FastAPI application — API surface + live SSE feed.

Endpoints
  GET  /                      health + capabilities
  GET  /api/pulses            recent pulses (newest first)
  GET  /api/pulses/{id}       single pulse
  GET  /api/pulses/stream     Server-Sent Events live feed
  POST /api/scan              manual 'Scan Ecosystem' trigger
  GET  /api/stats             feed stats + trending tokens (sidebar)
  GET  /api/status            agent status + next-scan countdown
  POST /api/nft/verify        N1NJ4 CW721 holder check (flips persona)
  POST /api/raid              build a ready-to-post 'Raid on X' tweet
"""
from __future__ import annotations

import asyncio
import json
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .clients.llm import llm_client
from .clients.market import TRACKED, market_client
from .clients.onchain import onchain_anchor
from .clients.social import social_client
from .clients.supabase import supabase_client
from .config import settings
from .models import NftCheckRequest, NftCheckResponse, RaidRequest, ScanRequest
from .agents.nft_verifier import verify_holder
from .store import store
from .workers.anomaly_engine import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine.start()
    yield
    await engine.stop()
    await market_client.close()
    await llm_client.close()
    await supabase_client.close()


app = FastAPI(title="NinjaPing AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "NinjaPing AI",
        "status": "active & hunting",
        "capabilities": settings.capabilities(),
    }


@app.get("/api/pulses")
async def list_pulses(limit: int = 50):
    return [p.model_dump() for p in store.list(limit=limit)]


@app.get("/api/pulses/stream")
async def stream_pulses():
    async def event_gen():
        q = store.subscribe()
        # replay the latest pulse so a fresh client isn't staring at a blank board
        recent = store.list(limit=1)
        if recent:
            yield f"data: {json.dumps(recent[0].model_dump())}\n\n"
        try:
            while True:
                try:
                    pulse = await asyncio.wait_for(q.get(), timeout=15.0)
                    yield f"data: {json.dumps(pulse.model_dump())}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"  # comment frame keeps the socket open
        finally:
            store.unsubscribe(q)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/pulses/{pulse_id}")
async def get_pulse(pulse_id: str):
    p = store.get(pulse_id)
    if not p:
        raise HTTPException(404, "pulse not found")
    return p.model_dump()


@app.post("/api/scan")
async def manual_scan(req: ScanRequest):
    persona = req.persona
    if req.wallet:
        check = await verify_holder(req.wallet)
        persona = "shadow" if check.is_holder else "standard"
    pulse = await engine.scan_once(persona=persona, force=True, token=req.token)
    if not pulse:
        raise HTTPException(503, "scan produced no pulse")
    return pulse.model_dump()


@app.get("/api/verify/{pulse_id}")
async def verify_pulse(pulse_id: str):
    """Re-derive a pulse's proof hash from its public fields and compare.

    Tamper-evident proof-of-prediction: if the report, token, type or timestamp
    were altered after emission, the recomputed hash will not match the stored
    commitment. `proof_anchor` carries the on-chain tx hash when anchoring is
    enabled (see README — requires a coincurve-capable runtime + funded key).
    """
    import hashlib

    p = store.get(pulse_id)
    if not p:
        raise HTTPException(404, "pulse not found")
    recomputed = hashlib.sha256(
        f"{p.token}|{p.type}|{p.created_at}|{p.ai_report}".encode()
    ).hexdigest()
    result = {
        "id": p.id,
        "verified": recomputed == p.proof_hash,
        "algo": p.proof_algo,
        "proof_hash": p.proof_hash,
        "recomputed": recomputed,
        "committed_at": p.created_at,
        "anchor": p.proof_anchor,
        "committed_content": f"{p.token}|{p.type}|{p.created_at}|{p.ai_report}",
    }
    # If anchored on-chain, re-read the tx from the Injective testnet and confirm.
    if p.proof_anchor and p.proof_hash:
        result["onchain"] = await onchain_anchor.verify_anchor(p.proof_anchor, p.proof_hash)
    return result


@app.get("/api/stats")
async def stats():
    # Trending tokens by an "AI hype score" built from live heat + social.
    snapshot = await market_client.snapshot()
    trending = []
    for tick in snapshot.values():
        social = await social_client.read(tick, onchain_heat=min(1.0, abs(tick.price_change_1h) / 12))
        ai_score = int(
            min(100, abs(tick.price_change_1h) * 4 + social.velocity_pct / 3)
        )
        trending.append({
            "token": tick.ticker,
            "name": tick.name,
            "price": tick.price,
            "price_change_1h": round(tick.price_change_1h, 2),
            "ai_score": ai_score,
            "source": tick.source,
            "synthetic": tick.synthetic,
        })
    trending.sort(key=lambda t: t["ai_score"], reverse=True)

    # Agent scorecard: how the AI's own graded calls performed vs live price.
    graded = [p for p in store.list(limit=settings.max_feed_size) if p.status in ("HIT", "MISS")]
    hits = sum(1 for p in graded if p.status == "HIT")
    running = sum(1 for p in store.list(limit=settings.max_feed_size) if p.status == "RUNNING")
    moves = [
        (p.move_pct if p.type in ("BUY", "HYPE", "VOLUME") else -(p.move_pct or 0))
        for p in graded
        if p.move_pct is not None
    ]
    scorecard = {
        "graded": len(graded),
        "hits": hits,
        "misses": len(graded) - hits,
        "running": running,
        "hit_rate": round(hits / len(graded) * 100, 1) if graded else None,
        "avg_move": round(sum(moves) / len(moves), 2) if moves else None,
    }
    return {"feed": store.stats(), "trending": trending, "scorecard": scorecard}


@app.get("/api/status")
async def status():
    height = await market_client.chain_height()
    return {
        "agent": "active & hunting",
        "persona": engine.persona,
        "next_scan_in": max(0, int(engine.next_scan_at - time.time())),
        "scan_interval": settings.scan_interval_seconds,
        "chain_height": height,
        "llm_provider": llm_client.provider,
        "tracked_tokens": list(TRACKED.keys()),
    }


@app.post("/api/nft/verify", response_model=NftCheckResponse)
async def nft_verify(req: NftCheckRequest):
    check = await verify_holder(req.wallet)
    # flip the autonomous loop persona for verified holders
    engine.persona = "shadow" if check.is_holder else "standard"
    return check


@app.post("/api/raid")
async def raid(req: RaidRequest):
    pulse = store.get(req.pulse_id)
    if not pulse:
        raise HTTPException(404, "pulse not found")
    label = {
        "BUY": "massive whale accumulation",
        "HYPE": "a social rush",
        "DUMP": "a liquidation cascade",
        "VOLUME": "a volume breakout",
    }[pulse.type]
    share_url = f"{settings.frontend_url}/pulse/{pulse.id}"
    text = (
        f"NinjaPing AI just detected {label} on {pulse.token} "
        f"({pulse.metrics.platform})! 🚨\n\n"
        f"{pulse.ai_report}\n\n"
        f"Live pulse 👉 {share_url}\n"
        f"@injective @NinjaLabsHQ @NinjaLabsCN #NinjaPing #Injective"
    )
    intent = "https://twitter.com/intent/tweet?text=" + _urlencode(text)
    return {"text": text, "intent_url": intent, "pulse_id": pulse.id, "share_url": share_url}


def _urlencode(s: str) -> str:
    from urllib.parse import quote
    return quote(s)
