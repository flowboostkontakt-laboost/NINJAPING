"""Application configuration & key validation.

All settings are read from environment variables (or a local .env file).
NinjaPing is designed to run "live" against real market data (CoinGecko +
Injective LCD) with zero secrets, and to progressively light up richer
features (LLM synthesis, Supabase persistence, on-chain NFT gating) as keys
are supplied. Nothing here hard-crashes when a key is missing — the system
degrades to the next-best provider instead.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env explicitly (relative to this file), overriding any stale
# environment so a freshly-edited .env always wins.
load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)


def _get(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


class Settings:
    # ---- LLM (Pulse synthesis) -------------------------------------------
    # Provider auto-selects: anthropic > openai > local heuristic fallback.
    openai_api_key: str = _get("OPENAI_API_KEY")
    openai_model: str = _get("OPENAI_MODEL", "gpt-4o-mini")
    anthropic_api_key: str = _get("ANTHROPIC_API_KEY")
    anthropic_model: str = _get("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")

    # ---- Supabase (optional persistence) ---------------------------------
    supabase_url: str = _get("SUPABASE_URL")
    supabase_service_key: str = _get("SUPABASE_SERVICE_KEY")

    # ---- Injective on-chain ----------------------------------------------
    injective_lcd: str = _get("INJECTIVE_LCD", "https://sentry.lcd.injective.network")
    injective_indexer: str = _get(
        "INJECTIVE_INDEXER", "https://sentry.exchange.grpc-web.injective.network"
    )
    # CW721 collection used for the N1NJ4 holder gate (smart-contract address).
    ninja_nft_contract: str = _get("NINJA_NFT_CONTRACT")

    # ---- On-chain proof anchoring (Injective testnet) --------------------
    injective_testnet_lcd: str = _get(
        "INJECTIVE_TESTNET_LCD", "https://testnet.sentry.lcd.injective.network"
    )
    # Faucet-funded testnet mnemonic enables broadcasting the proof hash on-chain.
    injective_proof_mnemonic: str = _get("INJECTIVE_PROOF_MNEMONIC")
    proof_anchor_enabled: bool = _get("PROOF_ANCHOR_ENABLED", "false").lower() == "true"

    # ---- Market data ------------------------------------------------------
    coingecko_base: str = _get("COINGECKO_BASE", "https://api.coingecko.com/api/v3")
    coingecko_api_key: str = _get("COINGECKO_API_KEY")  # optional Pro key

    # ---- Frontend (for shareable links in Raid-on-X tweets) --------------
    frontend_url: str = _get("FRONTEND_URL", "http://localhost:3000")

    # ---- Social: CryptoPanic (optional free key → real per-token posts) ---
    cryptopanic_key: str = _get("CRYPTOPANIC_KEY")
    cryptopanic_base: str = _get("CRYPTOPANIC_BASE", "https://cryptopanic.com/api/v1")

    # ---- Anomaly engine ---------------------------------------------------
    scan_interval_seconds: int = int(_get("SCAN_INTERVAL_SECONDS", "25"))
    # Volume velocity threshold (multiples of rolling baseline) that arms the AI.
    vol_velocity_threshold: float = float(_get("VOL_VELOCITY_THRESHOLD", "1.5"))
    # Whale transaction floor in USD.
    whale_usd_floor: float = float(_get("WHALE_USD_FLOOR", "20000"))
    # Social velocity (% jump in mentions) that arms the AI.
    social_velocity_threshold: float = float(_get("SOCIAL_VELOCITY_THRESHOLD", "100"))
    # Keep the live feed alive on demo: if no real anomaly fires for this many
    # consecutive scans, synthesize a pulse from the strongest real mover.
    demo_heartbeat_scans: int = int(_get("DEMO_HEARTBEAT_SCANS", "2"))
    # A pulse is graded HIT/MISS against live price once it is this old.
    grade_after_seconds: int = int(_get("GRADE_AFTER_SECONDS", "60"))

    # ---- Misc -------------------------------------------------------------
    cors_origins: list[str] = [
        o.strip()
        for o in _get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]
    max_feed_size: int = int(_get("MAX_FEED_SIZE", "200"))

    # ---- Derived capability flags ----------------------------------------
    @property
    def llm_provider(self) -> str:
        if self.anthropic_api_key:
            return "anthropic"
        if self.openai_api_key:
            return "openai"
        return "local"

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_key)

    @property
    def nft_gate_enabled(self) -> bool:
        return bool(self.ninja_nft_contract)

    def capabilities(self) -> dict:
        return {
            "llm_provider": self.llm_provider,
            "supabase": self.supabase_enabled,
            "nft_gate": self.nft_gate_enabled,
            "injective_lcd": self.injective_lcd,
            "scan_interval_seconds": self.scan_interval_seconds,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
