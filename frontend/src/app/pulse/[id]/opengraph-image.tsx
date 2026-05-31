import { ImageResponse } from "next/og";
import type { Pulse } from "@/lib/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "NinjaPing AI pulse";

const API =
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") || "http://localhost:8000";

const TYPE: Record<string, { label: string; color: string }> = {
  BUY: { label: "WHALE ACCUMULATION", color: "#10b981" },
  HYPE: { label: "SOCIAL RUSH", color: "#f97316" },
  DUMP: { label: "LIQUIDATION ALERT", color: "#ef4444" },
  VOLUME: { label: "VOL BREAKOUT", color: "#a855f7" },
};

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let pulse: Pulse | null = null;
  try {
    const res = await fetch(`${API}/api/pulses/${id}`, { cache: "no-store" });
    if (res.ok) pulse = (await res.json()) as Pulse;
  } catch {
    pulse = null;
  }

  const t = pulse ? TYPE[pulse.type] : { label: "LIVE PULSE", color: "#22d3ee" };
  const shadow = pulse?.persona === "shadow";
  const accent = shadow ? "#ef4444" : t.color;
  const report = (pulse?.ai_report || "Proactive on-chain × social anomaly detection for the Injective ecosystem.").slice(0, 260);
  const degen = pulse?.degen_score ?? 50;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: shadow
            ? "radial-gradient(900px 500px at 80% -10%, rgba(239,68,68,0.22), #07090e)"
            : "radial-gradient(900px 500px at 12% -8%, rgba(34,211,238,0.16), #07090e)",
          padding: "56px 64px",
          fontFamily: "sans-serif",
          color: "#e7ecf3",
          justifyContent: "space-between",
        }}
      >
        {/* top */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 26,
              }}
            >
              ⚡
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
              Ninja<span style={{ color: "#22d3ee" }}>Ping</span>
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 18, color: "#6b7689", letterSpacing: 4 }}>
            {shadow ? "SHADOW NINJA" : "LIVE PULSE"}
          </div>
        </div>

        {/* middle */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                borderRadius: 999,
                background: `${accent}22`,
                border: `1px solid ${accent}55`,
                color: accent,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", width: 12, height: 12, borderRadius: 999, background: accent }} />
              {t.label}
            </div>
            <div style={{ display: "flex", fontSize: 46, fontWeight: 800 }}>{pulse?.token || "$INJ"}</div>
          </div>

          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#cfd6e2", maxWidth: 1000 }}>
            {report}
          </div>

          {/* degen bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#6b7689", letterSpacing: 1 }}>
              <div style={{ display: "flex" }}>SMART MONEY</div>
              <div style={{ display: "flex" }}>DEGENERACY</div>
            </div>
            <div style={{ display: "flex", width: "100%", height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
              <div
                style={{
                  display: "flex",
                  width: `${degen}%`,
                  height: 12,
                  borderRadius: 999,
                  background: degen < 45 ? "#10b981" : "#f97316",
                }}
              />
            </div>
          </div>
        </div>

        {/* bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 20, color: "#6b7689" }}>
          <div style={{ display: "flex" }}>
            Source: <span style={{ color: "#22d3ee", marginLeft: 8 }}>{pulse?.metrics?.platform || "Injective"}</span>
          </div>
          <div style={{ display: "flex", color: "#8b94a6" }}>It pings you. @injective #NinjaPing</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
