"""Thin Supabase (PostgREST) client over httpx — optional persistence layer.

When SUPABASE_URL + SUPABASE_SERVICE_KEY are present, pulses are mirrored into a
`pulses` table so the Next.js frontend can subscribe via Supabase Realtime.
When absent, this is a no-op and the in-process store is the source of truth.
The expected table DDL ships in backend/supabase_schema.sql.
"""
from __future__ import annotations

import httpx

from ..config import settings
from ..models import Pulse


class SupabaseClient:
    def __init__(self) -> None:
        self.enabled = settings.supabase_enabled
        self._client = httpx.AsyncClient(timeout=12.0)

    async def close(self) -> None:
        await self._client.aclose()

    def _headers(self) -> dict:
        return {
            "apikey": settings.supabase_service_key,
            "authorization": f"Bearer {settings.supabase_service_key}",
            "content-type": "application/json",
            "prefer": "return=minimal",
        }

    async def insert_pulse(self, pulse: Pulse) -> bool:
        if not self.enabled:
            return False
        url = f"{settings.supabase_url}/rest/v1/pulses"
        payload = pulse.model_dump()
        # PostgREST stores nested objects as jsonb columns directly
        try:
            r = await self._client.post(url, headers=self._headers(), json=payload)
            return r.status_code in (200, 201, 204)
        except Exception:
            return False


supabase_client = SupabaseClient()
