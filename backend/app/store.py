"""In-process pulse store + async pub/sub used for the live SSE feed.

This is always the real-time source of truth for the dashboard. Supabase (when
configured) is a durable mirror, but the SSE stream here is what makes the
"airport departures board" update instantly without polling.
"""
from __future__ import annotations

import asyncio
from collections import deque

from .config import settings
from .models import Pulse


class PulseStore:
    def __init__(self, maxlen: int) -> None:
        self._feed: deque[Pulse] = deque(maxlen=maxlen)
        self._subscribers: set[asyncio.Queue] = set()
        self.total_detected = 0

    def list(self, limit: int = 50) -> list[Pulse]:
        items = list(self._feed)[::-1]  # newest first
        return items[:limit]

    def get(self, pulse_id: str) -> Pulse | None:
        for p in self._feed:
            if p.id == pulse_id:
                return p
        return None

    async def publish(self, pulse: Pulse) -> None:
        self._feed.append(pulse)
        self.total_detected += 1
        for q in list(self._subscribers):
            try:
                q.put_nowait(pulse)
            except asyncio.QueueFull:
                pass

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)

    def stats(self) -> dict:
        # type distribution for the sidebar
        dist: dict[str, int] = {}
        for p in self._feed:
            dist[p.type] = dist.get(p.type, 0) + 1
        return {
            "total_detected": self.total_detected,
            "in_feed": len(self._feed),
            "subscribers": len(self._subscribers),
            "distribution": dist,
        }


store = PulseStore(maxlen=settings.max_feed_size)
