import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Pulse } from "@/lib/types";
import { PulseCard } from "@/components/PulseCard";

const API =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function getPulse(id: string): Promise<Pulse | null> {
  try {
    const res = await fetch(`${API}/api/pulses/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Pulse;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pulse = await getPulse(id);
  if (!pulse) return { title: "NinjaPing AI — Pulse" };
  return {
    title: `${pulse.token} — ${pulse.type} pulse · NinjaPing AI`,
    description: pulse.ai_report,
    twitter: { card: "summary_large_image" },
  };
}

export default async function PulseSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pulse = await getPulse(id);
  if (!pulse) notFound();

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-4 py-16">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
          <span className="text-cyan-300">⚡</span> NinjaPing AI
        </Link>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
          shared pulse
        </span>
      </div>

      <PulseCard pulse={pulse} isNew={false} />

      <Link
        href="/app"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-[#07090e] transition hover:bg-cyan-300"
      >
        Open the live terminal →
      </Link>
      <p className="mt-4 text-center font-mono text-[11px] text-slate-600">
        Proactive on-chain × social anomaly detection for Injective.
      </p>
    </main>
  );
}
