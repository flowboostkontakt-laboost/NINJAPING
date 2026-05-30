"use client";

import { TrendingUp, TrendingDown, Activity, Gauge, Target } from "lucide-react";
import type { StatsResponse } from "@/lib/types";

export function Sidebar({ stats }: { stats: StatsResponse | null }) {
  const trending = stats?.trending ?? [];
  const sc = stats?.scorecard;
  const dist = stats?.feed.distribution ?? {};
  const total = stats?.feed.total_detected ?? 0;
  const maxDist = Math.max(1, ...Object.values(dist));

  const distRows: { key: string; label: string; color: string }[] = [
    { key: "BUY", label: "Whale Buys", color: "bg-emerald-400" },
    { key: "HYPE", label: "Social Rush", color: "bg-orange-400" },
    { key: "VOLUME", label: "Vol Breakout", color: "bg-purple-400" },
    { key: "DUMP", label: "Liquidations", color: "bg-rose-400" },
  ];

  return (
    <aside className="space-y-4">
      {/* Trending */}
      <section className="rounded-xl border border-slate-800 bg-[#0e131c]/80 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Gauge className="h-4 w-4 text-cyan-400" /> Trending · AI Hype Score
        </h3>
        <ul className="space-y-1.5">
          {trending.slice(0, 6).map((t, i) => {
            const up = t.price_change_1h >= 0;
            return (
              <li
                key={t.token}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-900/60"
              >
                <span className="w-4 text-right font-mono text-xs text-slate-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold text-white">
                      {t.token}
                    </span>
                    {t.synthetic && (
                      <span
                        title="Ecosystem micro-cap (simulated market data)"
                        className="rounded bg-slate-800 px-1 text-[9px] text-slate-500"
                      >
                        sim
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{t.source}</span>
                </div>
                <span
                  className={`flex items-center gap-0.5 font-mono text-xs ${
                    up ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {up ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {t.price_change_1h > 0 ? "+" : ""}
                  {t.price_change_1h.toFixed(1)}%
                </span>
                <div className="w-12">
                  <div className="h-1.5 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500"
                      style={{ width: `${t.ai_score}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
          {trending.length === 0 && (
            <li className="px-2 py-6 text-center text-xs text-slate-600">
              Awaiting market snapshot…
            </li>
          )}
        </ul>
      </section>

      {/* Agent scorecard — the AI grades its own calls vs live price */}
      <section className="rounded-xl border border-slate-800 bg-[#0e131c]/80 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Target className="h-4 w-4 text-cyan-400" /> Agent Scorecard
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div className="font-mono text-3xl font-bold text-white">
              {sc?.hit_rate != null ? `${sc.hit_rate}%` : "—"}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              hit rate
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
            <div
              className={`font-mono text-3xl font-bold ${
                sc?.avg_move != null && sc.avg_move >= 0
                  ? "text-emerald-400"
                  : sc?.avg_move != null
                    ? "text-rose-400"
                    : "text-white"
              }`}
            >
              {sc?.avg_move != null
                ? `${sc.avg_move >= 0 ? "+" : ""}${sc.avg_move}%`
                : "—"}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              avg move
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span className="text-emerald-400">{sc?.hits ?? 0} hit</span>
          <span className="text-rose-400">{sc?.misses ?? 0} miss</span>
          <span>{sc?.running ?? 0} running</span>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
          Every proactive call is auto-graded against live price after it ages.
        </p>
      </section>

      {/* System health */}
      <section className="rounded-xl border border-slate-800 bg-[#0e131c]/80 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="h-4 w-4 text-emerald-400" /> System Health
        </h3>
        <div className="mb-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-center">
          <div className="font-mono text-3xl font-bold text-white">{total}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">
            anomalies detected
          </div>
        </div>
        <ul className="space-y-2">
          {distRows.map((row) => {
            const v = dist[row.key] ?? 0;
            return (
              <li key={row.key} className="text-xs">
                <div className="mb-1 flex justify-between text-slate-400">
                  <span>{row.label}</span>
                  <span className="font-mono text-slate-300">{v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${row.color} transition-all duration-500`}
                    style={{ width: `${(v / maxDist) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
