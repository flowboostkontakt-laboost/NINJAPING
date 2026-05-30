"use client";

import { Zap, Cpu, Link2 } from "lucide-react";
import type { StatusResponse } from "@/lib/types";
import { WalletConnect } from "./WalletConnect";
import { useNinja } from "./ninja-context";

function fmtCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function TopBar({
  status,
  connected,
}: {
  status: StatusResponse | null;
  connected: boolean;
}) {
  const { ninjaMode } = useNinja();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#0b0e14]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse-dot rounded-full bg-cyan-400" />
          </span>
          <div className="leading-none">
            <span className="font-bold tracking-tight text-white">
              NINJA<span className="text-cyan-400">PING</span>
            </span>
            <span className="ml-2 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500 sm:inline">
              AI Pulse Terminal
            </span>
          </div>
        </div>

        {/* Agent status */}
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1">
          <span
            className={`h-2 w-2 animate-pulse-dot rounded-full ${
              connected ? "bg-emerald-400 text-emerald-400" : "bg-amber-400 text-amber-400"
            }`}
          />
          <span className="font-mono text-xs text-slate-300">
            AI Agent: {connected ? "Active & Hunting" : "Reconnecting…"}
          </span>
        </div>

        {/* Live telemetry */}
        <div className="hidden items-center gap-4 font-mono text-xs text-slate-500 lg:flex">
          <span className="flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-purple-400" />
            LLM: <span className="text-slate-300">{status?.llm_provider ?? "—"}</span>
          </span>
          {status?.chain_height != null && (
            <span className="flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-cyan-400" />
              Block: <span className="text-slate-300">#{status.chain_height.toLocaleString()}</span>
            </span>
          )}
          <span>
            Next scan in{" "}
            <span className="text-cyan-300">
              {status ? fmtCountdown(status.next_scan_in) : "—"}
            </span>
          </span>
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          <span
            title="N1NJ4 NFT social-reward badge"
            className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] sm:inline-flex ${
              ninjaMode
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300"
                : "border-slate-800 bg-slate-900/60 text-slate-500"
            }`}
          >
            🥷 N1NJ4
          </span>
          <WalletConnect />
        </div>
      </div>
    </header>
  );
}
