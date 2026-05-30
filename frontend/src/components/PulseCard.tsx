"use client";

import { useState } from "react";
import {
  Activity,
  ChevronDown,
  Cpu,
  Radio,
  Share2,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { Pulse, PulseTrigger } from "@/lib/types";
import { PULSE_STYLES, timeAgo } from "@/lib/pulse-style";
import { api, API_URL } from "@/lib/api";
import { Typewriter } from "./Typewriter";
import { DegenIndex } from "./DegenIndex";

function fmt(v: number, unit: string): string {
  if (unit === "x") return `${v.toFixed(2)}x`;
  if (unit === "%") return `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`;
  if (unit === "$") return `$${(v / 1000).toFixed(0)}K`;
  return `${v}`;
}

export function PulseCard({ pulse, isNew }: { pulse: Pulse; isNew: boolean }) {
  const s = PULSE_STYLES[pulse.type];
  const [raiding, setRaiding] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  async function raid() {
    setRaiding(true);
    try {
      const res = await api.raid(pulse.id);
      window.open(res.intent_url, "_blank", "noopener,noreferrer");
    } catch {
      // fallback: compose a basic tweet client-side
      const text = `NinjaPing AI flagged ${pulse.token} — ${pulse.metrics.platform}. ${pulse.ai_report}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      setRaiding(false);
    }
  }

  return (
    <article
      className={`relative rounded-xl border ${s.border} bg-[#0e131c]/90 p-5 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-slate-600 ${
        isNew ? "card-in flash-ring" : ""
      }`}
      style={isNew ? ({ ["--flash" as string]: s.glow } as React.CSSProperties) : undefined}
    >
      {pulse.persona === "shadow" && (
        <span className="absolute -top-2 right-4 rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-mono text-rose-300">
          SHADOW NINJA
        </span>
      )}

      {/* Header */}
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-mono font-medium ${s.bg} ${s.text} ${s.border}`}
          >
            <span className={`mr-2 h-2 w-2 rounded-full animate-pulse-dot ${s.dot}`} />
            {s.label}
          </span>
          <h3 className="text-lg font-bold tracking-wide text-white">{pulse.token}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pulse.status && pulse.status !== "RUNNING" && (
            <Outcome status={pulse.status} move={pulse.move_pct} />
          )}
          <time className="font-mono text-xs text-slate-500">
            {timeAgo(pulse.created_at)}
          </time>
        </div>
      </header>

      {/* AI Pulse */}
      <p className="mb-1 border-l-2 border-slate-700 pl-3 text-sm font-sans italic leading-relaxed text-slate-300">
        <Typewriter
          text={pulse.ai_report}
          keywords={pulse.keywords}
          animate={isNew}
        />
      </p>

      <DegenIndex score={pulse.degen_score} />

      {/* Glass-box: why the AI was armed */}
      {pulse.trigger && (
        <WhyDrawer
          trigger={pulse.trigger}
          open={showWhy}
          onToggle={() => setShowWhy((v) => !v)}
        />
      )}

      {/* Raw data badges */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-900 pt-3">
        <Badge icon={<Activity className="h-3 w-3" />} label="Vol">
          {pulse.metrics.vol}
        </Badge>
        <Badge icon={<Radio className="h-3 w-3" />} label="Social vel">
          {pulse.metrics.social_velocity}
        </Badge>
        {pulse.metrics.social_live ? (
          <span
            title={`Live social signal: ${pulse.metrics.social_source}`}
            className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 font-mono text-[10px] font-semibold text-cyan-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            LIVE · {pulse.metrics.social_source === "cryptopanic" ? "CryptoPanic" : "CoinGecko"}
          </span>
        ) : (
          <span
            title="Simulated social (unlisted micro-cap) — swap-in adapter ready"
            className="rounded border border-slate-800 bg-slate-900 px-2 py-1 font-mono text-[10px] text-slate-500"
          >
            sim
          </span>
        )}
        {pulse.metrics.whale_size && (
          <Badge icon={<Zap className="h-3 w-3" />} label="Whale">
            {pulse.metrics.whale_size}
          </Badge>
        )}
        <Badge label="Δ 1h">{pulse.metrics.price_change}</Badge>
        <span className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-400">
          Source: <span className="text-cyan-400">{pulse.metrics.platform}</span>
        </span>
        {pulse.proof_hash && (
          <a
            href={`${API_URL}/api/verify/${pulse.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Verifiable proof-of-prediction (tamper-evident sha256 committed at emit)"
            className="inline-flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300"
          >
            🔒 proof <span className="text-slate-500">{pulse.proof_hash.slice(0, 8)}</span>
          </a>
        )}

        <button
          onClick={raid}
          disabled={raiding}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
        >
          <Share2 className="h-3.5 w-3.5" />
          {raiding ? "Opening…" : "⚡ Raid on X"}
        </button>
      </div>
    </article>
  );
}

function Badge({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-slate-400">
      {icon}
      {label}: <span className="text-white">{children}</span>
    </span>
  );
}

/**
 * Glass-box reasoning trail: shows the deterministic rule that armed the AI,
 * the observed-vs-baseline-vs-threshold math, and the on-chain x social
 * divergence in one line. This is what separates "AI vibes" from "auditable
 * analyst" — the classifier shows its work on real numbers.
 */
function WhyDrawer({
  trigger,
  open,
  onToggle,
}: {
  trigger: PulseTrigger;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mt-3">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 font-mono text-[11px] text-slate-400 transition hover:border-slate-700 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500"
      >
        <Cpu className="h-3.5 w-3.5 text-cyan-400" />
        How the AI decided
        <span className="ml-auto truncate text-slate-500">{trigger.rule}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-[11px]">
          <div className="mb-2 text-slate-400">{trigger.metric}</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Observed" value={fmt(trigger.observed, trigger.unit)} highlight />
            <Stat label="Baseline" value={fmt(trigger.baseline, trigger.unit)} />
            <Stat label="Threshold" value={fmt(trigger.threshold, trigger.unit)} />
          </div>
          <p className="mt-3 flex items-start gap-2 rounded border border-cyan-500/15 bg-cyan-500/[0.04] px-2.5 py-2 text-cyan-200/90">
            <span className="text-cyan-400">⟶</span>
            <span>
              on-chain × social: <span className="text-white">{trigger.divergence}</span>
            </span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Live self-grade stamp: did the proactive call play out vs price? */
function Outcome({ status, move }: { status: "HIT" | "MISS"; move?: number | null }) {
  const hit = status === "HIT";
  const m = typeof move === "number" ? `${move >= 0 ? "+" : ""}${move.toFixed(2)}%` : "";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
        hit
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-rose-500/40 bg-rose-500/15 text-rose-300"
      }`}
    >
      {hit ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {status} {m}
    </span>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900/60 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={highlight ? "text-cyan-300" : "text-slate-300"}>{value}</div>
    </div>
  );
}
