"""Injective CW721 (N1NJ4) NFT verification.

Performs a real smart-contract query against the Injective LCD: the CosmWasm
`tokens { owner }` query returns the token ids a wallet holds in the
collection. If no contract is configured the gate is reported as `disabled`
(every wallet treated as non-holder) so the app still runs.
"""
from __future__ import annotations

import base64
import json

import httpx

from ..config import settings
from ..models import NftCheckResponse


async def verify_holder(wallet: str) -> NftCheckResponse:
    if not settings.nft_gate_enabled:
        return NftCheckResponse(
            wallet=wallet, is_holder=False, balance=0, contract=None, mode="disabled"
        )

    query = {"tokens": {"owner": wallet, "limit": 30}}
    b64 = base64.b64encode(json.dumps(query).encode()).decode()
    url = (
        f"{settings.injective_lcd}/cosmwasm/wasm/v1/contract/"
        f"{settings.ninja_nft_contract}/smart/{b64}"
    )
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            tokens = r.json().get("data", {}).get("tokens", [])
            return NftCheckResponse(
                wallet=wallet,
                is_holder=len(tokens) > 0,
                balance=len(tokens),
                contract=settings.ninja_nft_contract,
                mode="live",
            )
    except Exception:
        return NftCheckResponse(
            wallet=wallet,
            is_holder=False,
            balance=0,
            contract=settings.ninja_nft_contract,
            mode="live",
        )
