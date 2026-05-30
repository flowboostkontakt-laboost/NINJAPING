"""Social / attention signal — real sources first, simulated only as labelled fallback.

Resolution order per token:
  1. CryptoPanic (if CRYPTOPANIC_KEY set): real per-token news/social posts with
     real headlines and sources → genuine mention velocity. source="cryptopanic".
  2. CoinGecko (no key): real search-trending membership + 24h turnover
     (volume / market-cap) tracked over time → a genuine attention velocity.
     source="coingecko".
  3. Simulated: only for ecosystem micro-caps with no live data, clearly
     flagged live=False / source="sim".

Everything lives behind one async `read(tick, onchain_heat)` call, so the engine
and UI never change as sources are swapped or added.
"""
from __future__ import annotations

import hashlib
import math
import time
from collections import defaultdict, deque
from dataclasses import dataclass, field

import httpx

from ..config import settings

KOLS = [
    "@InjectiveOG", "@HelixWhaleWatch", "@NinjaAlphaCall", "@CosmosDegen",
    "@OnChainSensei", "@MitoMaxi", "@INJ_Insider", "@ShogunTrades",
]

HYPE_LINES = [
    "{tkn} looks ready to break out ahead of the ecosystem sprint event!",
    "Quietly loading {tkn} here. Chart is coiled like a spring. NFA.",
    "{tkn} volume is waking up. Something is brewing on Injective.",
    "Smart money rotating into {tkn}. Watch the orderbook on Helix.",
    "Funding flipped negative on {tkn} — squeeze fuel loading.",
]


@dataclass
class SocialReading:
    ticker: str
    mentions_1h: int
    baseline_1h: float
    velocity_pct: float
    top_kols: list[str]
    sample_tweets: list[str]
    live: bool = False
    source: str = "sim"          # "cryptopanic" | "coingecko" | "sim"


def _bucketed_wave(seed: str, period: float, t: float) -> float:
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    phase = (h % 997) / 997.0 * 2 * math.pi
    return math.sin(t / period + phase)


class SocialClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=12.0, headers={"accept": "application/json"})
        # rolling turnover history per ticker → real attention velocity
        self._turnover: dict[str, deque[float]] = defaultdict(lambda: deque(maxlen=20))
        self._cp_cache: dict[str, tuple[float, SocialReading]] = {}

    async def close(self) -> None:
        await self._client.aclose()

    # ---- simulated fallback (unlisted micro-caps only) -------------------
    def _simulated(self, ticker: str, onchain_heat: float) -> SocialReading:
        t = time.time()
        baseline = 6 + (int(hashlib.sha256(ticker.encode()).hexdigest(), 16) % 18)
        swing = (
            0.6 * _bucketed_wave(ticker + "slow", 900, t)
            + 0.4 * _bucketed_wave(ticker + "fast", 130, t)
        )
        burst = max(0.0, swing) ** 2
        mentions = int(baseline * (1 + burst * 2.0 * (1 + onchain_heat * 1.5)))
        # keep simulated velocity modest so it never out-ranks a real live signal
        velocity = round(min(160.0, (mentions - baseline) / baseline * 100), 1)
        n_kols = max(0, min(len(KOLS), int(velocity / 35)))
        idx = int(hashlib.sha256((ticker + str(int(t // 120))).encode()).hexdigest(), 16)
        kols = [KOLS[(idx + i) % len(KOLS)] for i in range(n_kols)]
        tweets = [
            f"{kols[i]}: " + HYPE_LINES[(idx + i) % len(HYPE_LINES)].format(tkn=ticker)
            for i in range(min(3, n_kols))
        ]
        return SocialReading(ticker, mentions, round(baseline, 1), velocity, kols, tweets,
                             live=False, source="sim")

    # ---- CryptoPanic (real per-token social/news) ------------------------
    async def _cryptopanic(self, ticker: str) -> SocialReading | None:
        if not settings.cryptopanic_key:
            return None
        cached = self._cp_cache.get(ticker)
        if cached and time.time() - cached[0] < 120:
            return cached[1]
        symbol = ticker.lstrip("$")
        url = f"{settings.cryptopanic_base}/posts/"
        params = {"auth_token": settings.cryptopanic_key, "currencies": symbol, "public": "true"}
        try:
            r = await self._client.get(url, params=params)
            r.raise_for_status()
            posts = r.json().get("results", [])
        except Exception:
            return None
        now = time.time()
        recent = 0
        titles, sources = [], []
        for p in posts:
            ts = p.get("published_at", "")
            titles.append(p.get("title", "")[:90])
            src = (p.get("source") or {}).get("title")
            if src:
                sources.append("@" + src.replace(" ", ""))
            try:
                from datetime import datetime
                age_h = (now - datetime.fromisoformat(ts.replace("Z", "+00:00")).timestamp()) / 3600
                if age_h <= 1:
                    recent += 1
            except Exception:
                pass
        total = len(posts)
        baseline = max(1.0, total / 24)            # avg posts/hour over the feed window
        velocity = round((recent - baseline) / baseline * 100, 1) if baseline else 0.0
        reading = SocialReading(
            ticker=ticker,
            mentions_1h=recent or total,
            baseline_1h=round(baseline, 1),
            velocity_pct=max(0.0, velocity),
            top_kols=list(dict.fromkeys(sources))[:6],
            sample_tweets=titles[:3],
            live=True,
            source="cryptopanic",
        )
        self._cp_cache[ticker] = (time.time(), reading)
        return reading

    # ---- CoinGecko attention (no key, real) ------------------------------
    def _coingecko_attention(self, tick, onchain_heat: float) -> SocialReading:
        # 24h turnover = volume / market cap: how much of the cap changed hands.
        turnover = (tick.volume_24h / tick.market_cap) if tick.market_cap else 0.0
        hist = self._turnover[tick.ticker]
        hist.append(turnover)
        avg = sum(hist) / len(hist) if hist else turnover
        ratio = (turnover / avg) if avg else 1.0
        velocity = (ratio - 1.0) * 100.0
        drivers: list[str] = []
        if tick.trending:
            velocity += 120.0
            drivers.append("CoinGecko search-trending (live)")
        drivers.append(f"24h turnover {turnover*100:.1f}% of market cap")
        if onchain_heat > 0.5:
            drivers.append("on-chain volume velocity elevated")
        mentions = int(max(1.0, turnover * 5000) * (1.5 if tick.trending else 1.0))
        return SocialReading(
            ticker=tick.ticker,
            mentions_1h=mentions,
            baseline_1h=round(mentions / (1 + max(0.0, velocity) / 100), 1),
            velocity_pct=round(max(0.0, velocity), 1),
            top_kols=["CoinGecko Trending"] if tick.trending else [],
            sample_tweets=drivers,
            live=True,
            source="coingecko",
        )

    # ---- public ----------------------------------------------------------
    async def read(self, tick, onchain_heat: float = 0.0) -> SocialReading:
        # Real per-token social (best) if a CryptoPanic key is configured.
        cp = await self._cryptopanic(tick.ticker)
        if cp is not None:
            return cp
        # Real attention from CoinGecko market dynamics for listed tokens.
        if not getattr(tick, "synthetic", True) and tick.market_cap:
            return self._coingecko_attention(tick, onchain_heat)
        # Honest simulated fallback for unlisted micro-caps.
        return self._simulated(tick.ticker, onchain_heat)


social_client = SocialClient()
