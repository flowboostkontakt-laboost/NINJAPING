"""Anomaly engine — the background hunter.

Every `scan_interval_seconds` it pulls a live market snapshot, derives a
per-token "heat" from real price velocity + volume vs a rolling baseline,
overlays social velocity, and classifies any breach into one of four pulse
types. Breaches arm the AI synthesizer. To keep the live feed alive during a
demo, if no real anomaly fires for `demo_heartbeat_scans` consecutive scans it
synthesizes a pulse from the strongest genuine mover.
"""
from __future__ import annotations

import asyncio
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from ..agents.pulse_agent import synthesize
from ..clients.market import TokenTick, market_client
from ..clients.onchain import onchain_anchor
from ..clients.social import social_client
from ..clients.supabase import supabase_client
from ..config import settings
from ..models import Persona, Pulse, PulseTrigger, PulseType
from ..store import store

# Per-token cooldown so we don't spam the same ticker repeatedly.
COOLDOWN_SECONDS = 90


class AnomalyEngine:
    def __init__(self) -> None:
        self._baselines: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=20))
        self._last_emit: dict[str, float] = {}
        self._last_forced: str | None = None
        self._idle_scans = 0
        self._task: asyncio.Task | None = None
        self._running = False
        self.next_scan_at: float = time.time()
        # Active persona for the autonomous loop (flips to shadow when a
        # verified N1NJ4 holder connects; see main.set_persona).
        self.persona: Persona = "standard"

    # ---- lifecycle -------------------------------------------------------
    def start(self) -> None:
        if self._task is None:
            self._running = True
            self._task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    # ---- detection helpers ----------------------------------------------
    def _heat(self, tick: TokenTick) -> tuple[float, float]:
        """Return (heat 0..1, volume_ratio vs rolling baseline)."""
        bl = self._baselines[tick.ticker]
        bl.append(tick.volume_24h)
        avg = sum(bl) / len(bl) if bl else tick.volume_24h
        vol_ratio = (tick.volume_24h / avg) if avg else 1.0
        price_heat = min(1.0, abs(tick.price_change_1h) / 12.0)
        vol_heat = min(1.0, max(0.0, (vol_ratio - 1.0)) / 0.6)
        return max(price_heat, vol_heat), vol_ratio

    def _classify(self, tick: TokenTick, social, heat: float) -> tuple[PulseType | None, float | None]:
        """Return (pulse_type, whale_usd) or (None, None) if no anomaly."""
        ch = tick.price_change_1h
        sv = social.velocity_pct

        # DUMP — sharp negative move trips liquidations.
        if ch <= -5.0:
            return "DUMP", None

        # HYPE — social on fire while price holds/rises.
        if sv >= settings.social_velocity_threshold and ch > -1.0:
            return "HYPE", None

        # BUY (whale accumulation) — elevated volume + rising price + quiet social.
        if heat >= 0.5 and ch > 1.5 and sv < 60:
            whale = max(settings.whale_usd_floor, tick.volume_24h * 0.04)
            return "BUY", round(whale, -2)

        # VOLUME breakout — heat over threshold from volume velocity.
        if heat >= (settings.vol_velocity_threshold - 1.0):
            return "VOLUME", None

        return None, None

    def _build_trigger(self, tick: TokenTick, social, vol_ratio: float,
                       ptype: PulseType, whale_usd: float | None) -> PulseTrigger:
        """The glass-box reason: which rule tripped, on what numbers."""
        ch = tick.price_change_1h
        sv = social.velocity_pct
        if ptype == "BUY":
            return PulseTrigger(
                rule="Whale accumulation",
                metric="Whale-sized inflow while social is quiet",
                observed=round(whale_usd or settings.whale_usd_floor, -2),
                baseline=0.0,
                threshold=settings.whale_usd_floor,
                unit="$",
                divergence="whale bid + quiet social = silent accumulation",
            )
        if ptype == "HYPE":
            return PulseTrigger(
                rule="Social rush",
                metric="X mention velocity vs 1h baseline",
                observed=round(sv, 1),
                baseline=round(social.baseline_1h, 1),
                threshold=settings.social_velocity_threshold,
                unit="%",
                divergence="social surge + price holding = retail rush",
            )
        if ptype == "DUMP":
            return PulseTrigger(
                rule="Liquidation flush",
                metric="1h price change",
                observed=round(ch, 2),
                baseline=0.0,
                threshold=-5.0,
                unit="%",
                divergence="price flush + mixed social = leverage unwind",
            )
        return PulseTrigger(
            rule="Volume breakout",
            metric="24h volume vs rolling baseline",
            observed=round(vol_ratio, 2),
            baseline=1.0,
            threshold=round(settings.vol_velocity_threshold, 2),
            unit="x",
            divergence="volume breakout running ahead of social",
        )

    def _grade_open_pulses(self, snapshot: dict) -> None:
        """Re-price aged RUNNING pulses against live price → HIT / MISS.

        BUY/HYPE/VOLUME are bullish calls (expect price up); DUMP is bearish.
        The agent grades its own proactive calls, automatically and publicly.
        """
        now = time.time()
        for p in store.list(limit=settings.max_feed_size):
            if p.status != "RUNNING" or not p.entry_price:
                continue
            try:
                created = datetime.fromisoformat(p.created_at).timestamp()
            except Exception:
                continue
            if now - created < settings.grade_after_seconds:
                continue
            tick = snapshot.get(p.token)
            if tick is None:
                continue
            move = (tick.price - p.entry_price) / p.entry_price * 100.0
            # Guard against price-source flips (e.g. CoinGecko<->synthetic for the
            # same ticker) producing absurd moves; leave RUNNING and retry later.
            if abs(move) > 40.0:
                continue
            directional = move if p.type in ("BUY", "HYPE", "VOLUME") else -move
            p.move_pct = round(move, 2)
            p.status = "HIT" if directional >= 0 else "MISS"
            p.graded_at = datetime.now(timezone.utc).isoformat()

    def _cooled_down(self, ticker: str) -> bool:
        last = self._last_emit.get(ticker, 0)
        return (time.time() - last) >= COOLDOWN_SECONDS

    async def _emit(self, tick: TokenTick, social, ptype: PulseType,
                    persona: Persona, whale_usd: float | None,
                    vol_ratio: float) -> Pulse:
        trigger = self._build_trigger(tick, social, vol_ratio, ptype, whale_usd)
        pulse = await synthesize(
            tick, social, ptype, persona=persona, whale_usd=whale_usd, trigger=trigger
        )
        # Best-effort on-chain anchoring of the proof hash (no-op unless enabled).
        if pulse.proof_hash and onchain_anchor.enabled:
            pulse.proof_anchor = await onchain_anchor.anchor(pulse.proof_hash)
        await store.publish(pulse)
        await supabase_client.insert_pulse(pulse)
        self._last_emit[tick.ticker] = time.time()
        return pulse

    # ---- scanning --------------------------------------------------------
    async def scan_once(self, persona: Persona | None = None,
                        force: bool = False, token: str | None = None) -> Pulse | None:
        """One scan pass. `force=True` always emits (manual 'Scan Ecosystem').

        `token` forces a specific ticker (handy for demos / showing the live
        social signal on $INJ on cue).
        """
        persona = persona or self.persona
        snapshot = await market_client.snapshot()

        # Grade older calls against the fresh prices before looking for new ones.
        self._grade_open_pulses(snapshot)

        # Forced single token (demo / targeted scan).
        if token:
            tick = snapshot.get(token) or snapshot.get(f"${token.lstrip('$')}")
            if tick is None:
                return None
            heat, vol_ratio = self._heat(tick)
            social = await social_client.read(tick, onchain_heat=heat)
            ptype, whale = self._classify(tick, social, heat)
            if ptype is None:
                ptype = "VOLUME" if tick.price_change_1h >= 0 else "DUMP"
            if ptype == "BUY" and whale is None:
                whale = round(max(settings.whale_usd_floor, tick.volume_24h * 0.04), -2)
            return await self._emit(tick, social, ptype, persona, whale, vol_ratio)

        # Rank every token once; remember its context so the forced/heartbeat
        # path can reuse it without re-reading.
        ranked: list[tuple] = []
        for tick in snapshot.values():
            heat, vol_ratio = self._heat(tick)
            social = await social_client.read(tick, onchain_heat=heat)
            ptype, whale = self._classify(tick, social, heat)
            score = heat + abs(tick.price_change_1h) / 20 + social.velocity_pct / 200
            # favour tokens carrying a REAL live signal so they surface, not
            # just the loudest simulated micro-cap.
            if getattr(social, "live", False):
                score += 0.5
            if getattr(tick, "trending", False):
                score += 0.4
            ranked.append((score, tick, social, ptype, whale, vol_ratio))
        ranked.sort(key=lambda c: c[0], reverse=True)

        # Genuine anomalies that are off cooldown.
        real = [c for c in ranked if c[3] and self._cooled_down(c[1].ticker)]
        if real:
            self._idle_scans = 0
            _, tick, social, ptype, whale, vol_ratio = real[0]
            return await self._emit(tick, social, ptype, persona, whale, vol_ratio)

        # No real anomaly this pass.
        self._idle_scans += 1
        if not (force or self._idle_scans >= settings.demo_heartbeat_scans):
            return None
        self._idle_scans = 0

        # Heartbeat: synthesize from the strongest mover, preferring a token
        # that isn't the one we just emitted so the feed stays varied.
        for score, tick, social, ptype, whale, vol_ratio in ranked:
            if tick.ticker == self._last_forced:
                continue
            chosen_type = ptype or ("VOLUME" if tick.price_change_1h >= 0 else "DUMP")
            chosen_whale = whale
            if chosen_type == "BUY" and chosen_whale is None:
                chosen_whale = round(max(settings.whale_usd_floor, tick.volume_24h * 0.04), -2)
            self._last_forced = tick.ticker
            return await self._emit(tick, social, chosen_type, persona, chosen_whale, vol_ratio)
        return None

    async def _loop(self) -> None:
        # warm a baseline before the first emit so velocity means something
        try:
            await market_client.snapshot()
        except Exception:
            pass
        while self._running:
            self.next_scan_at = time.time() + settings.scan_interval_seconds
            try:
                await self.scan_once()
            except Exception:
                pass
            await asyncio.sleep(settings.scan_interval_seconds)


engine = AnomalyEngine()
