"use client";

import { useEffect, useState } from "react";

const LINES = [
  "> CONNECTING TO INJECTIVE SENTRY NODE......... SUCCESS",
  "> SYNCING LCD @ block height............... OK",
  "> FETCHING HELIX ORDERBOOKS................ OK",
  "> CALIBRATING VOLUME-VELOCITY BASELINES.... OK",
  "> SCROLLING TWITTER / KOL TIMELINES........ DONE",
  "> LOADING N1NJ4 HOLDER GATE (CW721)........ READY",
  "> AWAKENING NINJA_AI_AGENT_v1.0............ SYSTEM READY",
];

export function TerminalBoot({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(0);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisible(i + 1), 180 + i * 190));
    });
    timers.push(setTimeout(() => setClosing(true), 180 + LINES.length * 190 + 350));
    timers.push(setTimeout(onDone, 180 + LINES.length * 190 + 750));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-500 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="scanline pointer-events-none opacity-40" />
      <div className="w-full max-w-2xl px-6 font-mono text-sm">
        <div className="mb-4 flex items-center gap-2 text-cyan-400">
          <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-cyan-400" />
          <span className="tracking-[0.3em] text-xs text-slate-500">
            NINJAPING // BOOT SEQUENCE
          </span>
        </div>
        {LINES.slice(0, visible).map((line, i) => {
          const isReady = line.includes("SYSTEM READY");
          return (
            <div
              key={i}
              className={`whitespace-pre ${isReady ? "text-cyan-300" : "text-emerald-400"}`}
              style={{ animation: "boot-line 0.25s ease-out both" }}
            >
              {line}
            </div>
          );
        })}
        {visible < LINES.length && (
          <span className="caret text-emerald-400">█</span>
        )}
      </div>
    </div>
  );
}
