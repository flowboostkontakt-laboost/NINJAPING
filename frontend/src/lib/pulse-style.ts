import type { PulseType } from "./types";

export interface PulseStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string; // rgba for the card flash-ring on arrival
}

export const PULSE_STYLES: Record<PulseType, PulseStyle> = {
  BUY: {
    label: "🚨 WHALE ACCUMULATION",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    border: "border-emerald-500/25",
    dot: "bg-emerald-400 text-emerald-400",
    glow: "rgba(16,185,129,0.45)",
  },
  HYPE: {
    label: "🔥 SOCIAL RUSH",
    bg: "bg-orange-500/10",
    text: "text-orange-300",
    border: "border-orange-500/25",
    dot: "bg-orange-400 text-orange-400",
    glow: "rgba(249,115,22,0.45)",
  },
  DUMP: {
    label: "⚠️ LIQUIDATION ALERT",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    border: "border-rose-500/25",
    dot: "bg-rose-400 text-rose-400",
    glow: "rgba(239,68,68,0.45)",
  },
  VOLUME: {
    label: "⚡ VOL BREAKOUT",
    bg: "bg-purple-500/10",
    text: "text-purple-300",
    border: "border-purple-500/25",
    dot: "bg-purple-400 text-purple-400",
    glow: "rgba(168,85,247,0.45)",
  },
};

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
