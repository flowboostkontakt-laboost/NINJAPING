"""Pydantic models — the shared contract between the engine, API and frontend."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

PulseType = Literal["BUY", "HYPE", "DUMP", "VOLUME"]
Persona = Literal["standard", "shadow"]


class PulseMetrics(BaseModel):
    """Raw data badges shown under each Pulse card."""

    vol: str = "—"                     # e.g. "$45.2K"
    social_velocity: str = "—"         # e.g. "+180%"
    platform: str = "Injective"        # e.g. "Helix DEX"
    price_change: str = "—"            # e.g. "+12.4%"
    whale_size: Optional[str] = None   # e.g. "$45K"
    social_source: str = "sim"         # "cryptopanic" | "coingecko" | "sim"
    social_live: bool = False          # true when the social signal is a real source


class PulseTrigger(BaseModel):
    """Glass-box: the deterministic reason the AI was armed for this pulse.

    Lets the UI show *why* the agent spoke (rule + observed vs baseline/threshold)
    instead of just the verdict, proving the engine is real, not an LLM wrapper.
    """

    rule: str                          # e.g. "Volume breakout"
    metric: str                        # human label, e.g. "24h volume vs 7-scan baseline"
    observed: float                    # measured value (e.g. 2.31 => 2.31x)
    baseline: float                    # comparison baseline (e.g. 1.0)
    threshold: float                   # the line that had to be crossed
    unit: str = "x"                    # "x" | "%" | "$"
    divergence: str                    # the fusion one-liner shown on the card


class Pulse(BaseModel):
    id: str
    created_at: str                    # ISO-8601 UTC
    type: PulseType
    token: str                         # ticker incl. $ e.g. "$INJ"
    ai_report: str
    metrics: PulseMetrics
    trigger: Optional[PulseTrigger] = None
    # ---- self-grading track record -------------------------------------
    entry_price: Optional[float] = None
    status: Literal["RUNNING", "HIT", "MISS"] = "RUNNING"
    move_pct: Optional[float] = None      # signed price move since emit (%)
    graded_at: Optional[str] = None
    # ---- verifiable proof-of-prediction --------------------------------
    proof_hash: Optional[str] = None      # sha256 commitment of the call at emit
    proof_algo: str = "sha256"
    proof_anchor: Optional[str] = None    # on-chain tx hash once anchored (optional)
    # 0 = pure smart money / quiet whale, 100 = pure degen / social hype.
    degen_score: int = Field(ge=0, le=100, default=50)
    persona: Persona = "standard"
    # Highlighted keyword phrases the UI bolds inside the report.
    keywords: list[str] = []
    # Opaque raw context the AI synthesized from (debug / "show your work").
    raw: dict = {}


class ScanRequest(BaseModel):
    """Manual 'Scan Ecosystem' trigger from the dashboard."""

    persona: Persona = "standard"
    wallet: Optional[str] = None       # if provided, NFT gate is evaluated
    token: Optional[str] = None        # force a specific ticker (e.g. "$INJ")


class NftCheckRequest(BaseModel):
    wallet: str


class NftCheckResponse(BaseModel):
    wallet: str
    is_holder: bool
    balance: int = 0
    contract: Optional[str] = None
    mode: str = "live"                 # "live" | "disabled"


class RaidRequest(BaseModel):
    pulse_id: str
