"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Radar } from "lucide-react";
import type { Pulse, StatsResponse, StatusResponse } from "@/lib/types";
import { api, subscribePulses } from "@/lib/api";
import { NinjaProvider } from "@/components/ninja-context";
import { TerminalBoot } from "@/components/TerminalBoot";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { ScanButton } from "@/components/ScanButton";
import { PulseCard } from "@/components/PulseCard";

export default function DashboardPage() {
  return (
    <NinjaProvider>
      <Dashboard />
    </NinjaProvider>
  );
}

function Dashboard() {
  const [booted, setBooted] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("skipboot"),
  );
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const seen = useRef<Set<string>>(new Set());

  const addPulse = useCallback((pulse: Pulse, isNew: boolean) => {
    if (seen.current.has(pulse.id)) return;
    seen.current.add(pulse.id);
    setPulses((prev) => [pulse, ...prev].slice(0, 60));
    if (isNew) {
      setNewIds((prev) => new Set(prev).add(pulse.id));
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(pulse.id);
          return next;
        });
      }, 5000);
    }
  }, []);

  // initial load
  useEffect(() => {
    api
      .pulses(40)
      .then((list) => list.reverse().forEach((p) => addPulse(p, false)))
      .catch(() => {});
  }, [addPulse]);

  // demo mode (?demo=1): fire fresh scans on mount so the feed populates
  // immediately for recording, no waiting on the background loop.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).has("demo")) return;
    // force an $INJ pulse first so the LIVE social signal is on screen,
    // then a free scan for variety.
    const t1 = setTimeout(() => api.scan("standard", null, "$INJ").catch(() => {}), 600);
    const t2 = setTimeout(() => api.scan("standard").catch(() => {}), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // live SSE feed
  useEffect(() => {
    const unsub = subscribePulses(
      (pulse) => addPulse(pulse, true),
      (c) => setConnected(c),
    );
    return unsub;
  }, [addPulse]);

  // status: fetch every 8s, tick countdown locally each second
  useEffect(() => {
    let alive = true;
    const fetchStatus = () =>
      api.status().then((s) => alive && setStatus(s)).catch(() => {});
    fetchStatus();
    const poll = setInterval(fetchStatus, 8000);
    const tick = setInterval(() => {
      setStatus((s) =>
        s ? { ...s, next_scan_in: Math.max(0, s.next_scan_in - 1) } : s,
      );
    }, 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  // stats: every 12s
  useEffect(() => {
    let alive = true;
    const fetchStats = () =>
      api.stats().then((s) => alive && setStats(s)).catch(() => {});
    fetchStats();
    const id = setInterval(fetchStats, 12000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  // merge self-grading updates (HIT/MISS) onto already-rendered cards
  useEffect(() => {
    let alive = true;
    const sync = () =>
      api
        .pulses(60)
        .then((list) => {
          if (!alive) return;
          const byId = new Map(list.map((p) => [p.id, p]));
          setPulses((prev) =>
            prev.map((p) => {
              const fresh = byId.get(p.id);
              if (
                fresh &&
                (fresh.status !== p.status || fresh.move_pct !== p.move_pct)
              ) {
                return {
                  ...p,
                  status: fresh.status,
                  move_pct: fresh.move_pct,
                  graded_at: fresh.graded_at,
                  entry_price: fresh.entry_price,
                };
              }
              return p;
            }),
          );
        })
        .catch(() => {});
    const id = setInterval(sync, 10000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      {!booted && <TerminalBoot onDone={() => setBooted(true)} />}

      <TopBar status={status} connected={connected} />

      <main className="relative z-10 mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main feed */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radar className="h-4 w-4 text-cyan-400" />
                <h2 className="font-mono text-sm uppercase tracking-[0.2em] text-slate-400">
                  Live Pulse Feed
                </h2>
                <span className="rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                  {pulses.length} signals
                </span>
              </div>
              <ScanButton />
            </div>

            {pulses.length === 0 ? (
              <EmptyFeed connected={connected} />
            ) : (
              <div className="space-y-4">
                {pulses.map((p) => (
                  <PulseCard key={p.id} pulse={p} isNew={newIds.has(p.id)} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <Sidebar stats={stats} />
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-900 py-4 text-center font-mono text-[11px] text-slate-600">
        NinjaPing AI · built for the Injective ecosystem & the N1NJ4 community ·
        on-chain × social synthesis
      </footer>
    </>
  );
}

function EmptyFeed({ connected }: { connected: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0e131c]/50 py-20 text-center">
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-800">
        <Radar className="h-6 w-6 animate-pulse text-cyan-400" />
        <span className="scanline" />
      </div>
      <p className="text-sm text-slate-400">
        {connected ? "Hunting for anomalies…" : "Connecting to the AI agent…"}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Hit <span className="text-cyan-400">Scan Ecosystem</span> to force a pulse.
      </p>
    </div>
  );
}
