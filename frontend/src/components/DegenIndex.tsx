"use client";

import { Briefcase, Flame } from "lucide-react";

/**
 * Visualizes who is behind the move: quiet smart money (low score) vs pure
 * retail degeneracy / social hype (high score).
 */
export function DegenIndex({ score }: { score: number }) {
  const s = Math.max(0, Math.min(100, score));
  const smart = s < 45;
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" /> Smart Money
        </span>
        <span className="flex items-center gap-1">
          Degeneracy <Flame className="h-3 w-3" />
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${s}%`,
            background: smart
              ? "linear-gradient(90deg,#10b981,#22d3ee)"
              : "linear-gradient(90deg,#f97316,#ef4444)",
          }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-slate-950 bg-white shadow transition-all duration-700"
          style={{ left: `${s}%` }}
        />
      </div>
      <div className="mt-1 text-right text-[10px] font-mono text-slate-500">
        {smart ? "Whale-led" : "Hype-led"} · {s}/100
      </div>
    </div>
  );
}
