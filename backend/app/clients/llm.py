"""Provider-agnostic LLM client.

Talks raw HTTP (httpx) to Anthropic Messages API or OpenAI Chat Completions —
no heavyweight SDKs, which keeps the dependency surface tiny and avoids wheel
issues on bleeding-edge Python. Both providers are driven in JSON mode so the
Pulse synthesizer always gets a parseable object back. With no key configured
it returns `None`, and the agent falls back to a deterministic local templater.
"""
from __future__ import annotations

import json

import httpx

from ..config import settings


class LLMClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=30.0)

    async def close(self) -> None:
        await self._client.aclose()

    @property
    def provider(self) -> str:
        return settings.llm_provider

    async def complete_json(self, system: str, user: str) -> dict | None:
        """Return a parsed JSON object, or None if no provider / on failure."""
        provider = settings.llm_provider
        try:
            if provider == "anthropic":
                raw = await self._anthropic(system, user)
            elif provider == "openai":
                raw = await self._openai(system, user)
            else:
                return None
        except Exception:
            return None
        return self._extract_json(raw)

    async def _anthropic(self, system: str, user: str) -> str:
        r = await self._client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 600,
                "system": system + "\n\nRespond ONLY with a single valid JSON object.",
                "messages": [{"role": "user", "content": user}],
            },
        )
        r.raise_for_status()
        data = r.json()
        return "".join(
            block.get("text", "") for block in data.get("content", [])
        )

    async def _openai(self, system: str, user: str) -> str:
        r = await self._client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "authorization": f"Bearer {settings.openai_api_key}",
                "content-type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "temperature": 0.8,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]

    @staticmethod
    def _extract_json(raw: str | None) -> dict | None:
        if not raw:
            return None
        raw = raw.strip()
        # tolerate ```json fences or surrounding prose
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        start, end = raw.find("{"), raw.rfind("}")
        if start == -1 or end == -1:
            return None
        try:
            return json.loads(raw[start : end + 1])
        except json.JSONDecodeError:
            return None


llm_client = LLMClient()
