import type {
  NftCheckResponse,
  Persona,
  Pulse,
  RaidResponse,
  StatsResponse,
  StatusResponse,
} from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || "http://localhost:8000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  pulses: (limit = 50) => getJSON<Pulse[]>(`/api/pulses?limit=${limit}`),
  stats: () => getJSON<StatsResponse>(`/api/stats`),
  status: () => getJSON<StatusResponse>(`/api/status`),
  scan: (persona: Persona, wallet?: string | null, token?: string | null) =>
    postJSON<Pulse>(`/api/scan`, { persona, wallet: wallet ?? null, token: token ?? null }),
  verifyNft: (wallet: string) =>
    postJSON<NftCheckResponse>(`/api/nft/verify`, { wallet }),
  raid: (pulseId: string) => postJSON<RaidResponse>(`/api/raid`, { pulse_id: pulseId }),
  streamUrl: () => `${API_URL}/api/pulses/stream`,
};

/**
 * Subscribe to the live pulse SSE feed. Returns an unsubscribe fn.
 * Auto-reconnects via the browser's native EventSource backoff.
 */
export function subscribePulses(
  onPulse: (pulse: Pulse) => void,
  onState?: (connected: boolean) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const es = new EventSource(api.streamUrl());
  es.onopen = () => onState?.(true);
  es.onerror = () => onState?.(false);
  es.onmessage = (ev) => {
    try {
      onPulse(JSON.parse(ev.data) as Pulse);
    } catch {
      /* keep-alive / malformed frame */
    }
  };
  return () => es.close();
}
