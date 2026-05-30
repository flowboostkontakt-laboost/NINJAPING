"use client";

import { useState } from "react";
import { Satellite, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useNinja } from "./ninja-context";

export function ScanButton() {
  const { persona, wallet } = useNinja();
  const [scanning, setScanning] = useState(false);

  async function scan() {
    if (scanning) return;
    setScanning(true);
    try {
      // Pulse arrives over the SSE stream; we just trigger + show the loader.
      await api.scan(persona, wallet);
    } catch {
      /* surfaced via feed connection indicator */
    } finally {
      // keep the laser sweep visible a beat for effect
      setTimeout(() => setScanning(false), 1400);
    }
  }

  return (
    <button
      onClick={scan}
      disabled={scanning}
      className="relative overflow-hidden inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-wait"
    >
      {scanning && <span className="scanline" />}
      {scanning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Satellite className="h-4 w-4" />
      )}
      {scanning ? "Scanning ecosystem…" : "Scan Ecosystem"}
    </button>
  );
}
