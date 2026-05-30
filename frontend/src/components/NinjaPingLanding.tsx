"use client";

/**
 * NinjaPing AI — marketing landing.
 *
 * A single, self-contained React component (Tailwind + Framer Motion).
 * Design intent: a calm, premium, high-craft surface (Apple / Stripe / Linear
 * register) that deliberately contrasts with the intense cyberpunk terminal it
 * opens into at /app. One committed accent (cyan), massive whitespace, organic
 * gradient mesh, a mouse-reactive 3D hero, scroll-triggered reveals, parallax,
 * and a varied bento feature grid. Glass is used only where it earns its place
 * (the sticky nav). Respects prefers-reduced-motion throughout.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Ghost,
  Radio,
  Share2,
  Sparkles,
  Waypoints,
  Zap,
} from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ───────────────────────────── primitives ───────────────────────────── */

function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Slow-drifting organic gradient mesh. Transform-only, reduced-motion aware. */
function GradientMesh({ scrollY }: { scrollY?: MotionValue<number> }) {
  const reduced = useReducedMotion();
  const fallback = useMotionValue(0);
  const y = useTransform(scrollY ?? fallback, (v) => v * 0.4);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ y }}
    >
      <motion.div
        className="absolute -top-[20%] left-[8%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/[0.16] blur-[90px] will-change-transform"
        animate={reduced ? undefined : { x: [0, 60, -20, 0], y: [0, 30, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[10%] right-[2%] h-[28rem] w-[28rem] rounded-full bg-violet-500/[0.12] blur-[90px] will-change-transform"
        animate={reduced ? undefined : { x: [0, -50, 20, 0], y: [0, 40, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[30%] h-[26rem] w-[26rem] rounded-full bg-emerald-500/[0.08] blur-[90px] will-change-transform"
        animate={reduced ? undefined : { x: [0, 30, -30, 0], y: [0, -20, 20, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

const Grain = () => (
  <div
    aria-hidden
    className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-overlay"
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    }}
  />
);

/* ───────────────────────────── nav ───────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#07090e]/70 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="NinjaPing home">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/10">
            <Zap className="h-4 w-4 text-cyan-300" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px] shadow-cyan-400/70" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">
            NinjaPing
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {[
            ["How it works", "#how"],
            ["Features", "#features"],
            ["The feed", "#feed"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm text-white/55 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              {label}
            </a>
          ))}
        </div>

        <Link
          href="/app"
          className="group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#07090e] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090e]"
        >
          Launch terminal
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </nav>
    </header>
  );
}

/* ───────────────────────────── hero ───────────────────────────── */

const WATCHING = ["$INJ", "$NINJA", "whale wallets", "Helix orderbooks", "social velocity"];

function Hero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 60]);
  const copyFade = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0]);

  // rotating "now watching" word
  const [wi, setWi] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setWi((v) => (v + 1) % WATCHING.length), 2200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden px-6 pb-24 pt-40 sm:pt-48"
    >
      <GradientMesh scrollY={scrollY} />

      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Copy */}
        <motion.div style={{ y: copyY, opacity: copyFade }}>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-300/90">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px] shadow-cyan-400/80" />
              Autonomous agent · Injective
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-6 text-[2.7rem] font-semibold leading-[1.04] tracking-[-0.03em] text-white sm:text-6xl">
              The signal,
              <br />
              before the candle.
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-white/60">
              NinjaPing is an AI agent that hunts Injective for whale moves,
              volume shocks and social surges, then explains each one in three
              sentences. On-chain and social, fused into one live feed.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="group inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-[#07090e] shadow-[0_8px_30px] shadow-cyan-500/25 transition-all duration-200 hover:scale-[1.03] hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090e]"
              >
                Launch the terminal
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/25 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                How it works
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.26}>
            <div className="mt-10 flex items-center gap-2 font-mono text-[13px] text-white/55">
              <span className="text-white/50">Now watching</span>
              <span className="relative inline-flex h-5 min-w-[9.5rem] items-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wi}
                    className="absolute text-cyan-300"
                    initial={{ y: "0.7em", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "-0.7em", opacity: 0 }}
                    transition={{ duration: 0.42, ease: EASE }}
                  >
                    {WATCHING[wi]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </Reveal>
        </motion.div>

        {/* 3D hero card */}
        <motion.div style={{ y: cardY }} className="relative">
          <TiltCard />
        </motion.div>
      </div>
    </section>
  );
}

/** Mouse-reactive perspective card showing a sample pulse. */
function TiltCard() {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]), {
    stiffness: 140,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-13, 13]), {
    stiffness: 140,
    damping: 18,
  });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div className="[perspective:1400px]" onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div
        style={{ rotateX: reduced ? 0 : rx, rotateY: reduced ? 0 : ry, transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.015] p-1.5 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
      >
        {/* glow underlay */}
        <div
          aria-hidden
          className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-transparent opacity-60 blur-2xl"
        />
        <div className="rounded-xl border border-white/[0.06] bg-[#0b0e14]/95 p-5">
          {/* terminal chrome */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
              live pulse
            </span>
          </div>

          {/* sample pulse */}
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                WHALE ACCUMULATION
              </span>
              <span className="text-sm font-bold text-white">$NINJA</span>
            </div>
            <p className="mt-3 border-l-2 border-white/10 pl-3 text-[13px] leading-relaxed text-white/70">
              A wallet flagged as a whale absorbed{" "}
              <span className="font-medium text-white">$45K</span> of $NINJA on{" "}
              <span className="font-medium text-white">Helix</span>. Social is
              dead quiet, so this is silent accumulation, not a crowd trade.
              Someone is building before the timeline wakes up.
            </p>
            {/* degen index */}
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-white/35">
                <span>Smart money</span>
                <span>Degeneracy</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full w-[18%] origin-left rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.5 }}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3 font-mono text-[10px] text-white/45">
              <span className="rounded border border-white/8 bg-white/[0.03] px-2 py-0.5">
                Vol <span className="text-white/80">$45K</span>
              </span>
              <span className="rounded border border-white/8 bg-white/[0.03] px-2 py-0.5">
                X velocity <span className="text-white/80">+4%</span>
              </span>
              <span className="rounded border border-white/8 bg-white/[0.03] px-2 py-0.5">
                Source <span className="text-cyan-300">Helix</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────── trust strip ───────────────────────────── */

function TrustStrip() {
  const items = ["Injective LCD", "Helix", "Mito", "CoinGecko", "CW721 gating", "SSE live feed"];
  return (
    <Reveal className="mx-auto max-w-6xl px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-y border-white/[0.06] py-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
          Wired into
        </span>
        {items.map((t) => (
          <span key={t} className="font-mono text-sm text-white/60">
            {t}
          </span>
        ))}
      </div>
    </Reveal>
  );
}

/* ───────────────────────────── how it works ───────────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Detect",
    icon: Activity,
    body: "The engine scans price velocity, volume against a rolling baseline, whale-sized flow and social spikes. Math arms the AI, never noise.",
  },
  {
    n: "02",
    title: "Synthesize",
    icon: Sparkles,
    body: "Each breach is packed with on-chain and social context and sent to the model in JSON mode. Out comes a pulse: catalyst, state, risk.",
  },
  {
    n: "03",
    title: "Stream",
    icon: Radio,
    body: "Pulses land on a live terminal over Server-Sent Events, tagged and typed, newest on top. No refresh, no scrolling between five tabs.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <Reveal>
        <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-cyan-300/80">
          The pipeline
        </p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          From raw block to readable pulse.
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.04] md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="group relative h-full bg-[#07090e] p-8 transition-colors duration-300 hover:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white/30">{s.n}</span>
                <s.icon className="h-5 w-5 text-white/35 transition-colors duration-300 group-hover:text-cyan-300" />
              </div>
              <h3 className="mt-8 text-xl font-medium text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-white/55">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────── features (bento) ───────────────────────────── */

function FeatureShell({
  children,
  className = "",
  accent = "cyan",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "cyan" | "rose";
}) {
  const ring = accent === "rose" ? "hover:border-rose-400/30" : "hover:border-cyan-400/30";
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-colors duration-300 ${ring} ${className}`}
    >
      {children}
    </motion.div>
  );
}

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <Reveal>
        <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-cyan-300/80">
          What it does
        </p>
        <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
          One terminal for the whole ecosystem.
        </h2>
      </Reveal>

      <div className="mt-16 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 md:grid-cols-3">
        {/* Large: anomaly engine */}
        <FeatureShell className="md:col-span-2 md:row-span-2 min-h-[20rem]">
          <div>
            <Waypoints className="h-6 w-6 text-cyan-300" />
            <h3 className="mt-5 text-2xl font-medium text-white">
              A proactive anomaly engine
            </h3>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55">
              It does not wait for prompts. Async workers watch every tracked
              asset and only wake the model when a real threshold breaks. Quiet
              when the market is quiet, loud when it matters.
            </p>
          </div>
          <HeatBars />
        </FeatureShell>

        {/* Shadow Ninja */}
        <FeatureShell accent="rose" className="min-h-[9.5rem]">
          <div className="flex items-start justify-between">
            <Ghost className="h-6 w-6 text-rose-300" />
            <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] text-rose-300">
              N1NJ4
            </span>
          </div>
          <div>
            <h3 className="mt-5 text-lg font-medium text-white">Shadow Ninja Mode</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Hold a N1NJ4 NFT to flip the theme and unlock an uncensored degen
              persona, gated by a real on-chain CW721 check.
            </p>
          </div>
        </FeatureShell>

        {/* Degen index */}
        <FeatureShell>
          <Activity className="h-6 w-6 text-cyan-300" />
          <div>
            <h3 className="mt-5 text-lg font-medium text-white">Degen vs Smart Money</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Every pulse scores who is really behind the move.
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full w-[64%] origin-left rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-rose-400"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: EASE }}
              />
            </div>
          </div>
        </FeatureShell>

        {/* Three sentence pulses */}
        <FeatureShell className="md:col-span-2">
          <Sparkles className="h-6 w-6 text-cyan-300" />
          <div>
            <h3 className="mt-5 text-lg font-medium text-white">
              Three sentences. Catalyst, state, risk.
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">
              No walls of text. Provider-agnostic across Anthropic and OpenAI,
              with a local fallback so the feed never goes dark, even offline.
            </p>
          </div>
        </FeatureShell>

        {/* Raid on X */}
        <FeatureShell>
          <Share2 className="h-6 w-6 text-cyan-300" />
          <div>
            <h3 className="mt-5 text-lg font-medium text-white">Raid on X</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              One click turns any pulse into a pre-composed, context-aware post.
            </p>
          </div>
        </FeatureShell>
      </div>
    </section>
  );
}

function HeatBars() {
  const reduced = useReducedMotion();
  const heights = [38, 64, 30, 82, 52, 95, 44, 70, 60, 88, 36, 76];
  return (
    <div className="mt-8 flex h-24 items-end gap-1.5" aria-hidden>
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 origin-bottom rounded-sm bg-gradient-to-t from-cyan-500/30 to-cyan-300/70"
          style={{ height: `${h}%` }}
          initial={{ scaleY: 0.12, opacity: 0.5 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: reduced ? 0 : 0.8,
            delay: reduced ? 0 : i * 0.04,
            ease: EASE,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────────────────────── feed band (parallax) ───────────────────────────── */

const SAMPLE_FEED = [
  { tag: "SOCIAL RUSH", token: "$INJ", color: "orange", text: "Volume jumped 140% in 45 minutes on a fresh partnership announcement." },
  { tag: "VOL BREAKOUT", token: "$HDRO", color: "purple", text: "Turnover broke its 7-day baseline while the timeline stayed silent." },
  { tag: "LIQUIDATION", token: "$TALK", color: "rose", text: "A 12% drop tripped a cascade of leveraged longs on Mito." },
];

function FeedBand() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [reduced ? 0 : 40, reduced ? 0 : -40]);

  const colorMap: Record<string, string> = {
    orange: "border-orange-500/25 bg-orange-500/[0.06] text-orange-300",
    purple: "border-purple-500/25 bg-purple-500/[0.06] text-purple-300",
    rose: "border-rose-500/25 bg-rose-500/[0.06] text-rose-300",
  };

  return (
    <section id="feed" ref={ref} className="relative scroll-mt-24 overflow-hidden px-6 py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-[12px] uppercase tracking-[0.24em] text-cyan-300/80">
            The feed
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
            Like an airport board for the markets.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/60">
            Clean signal, pulsing alerts, newest on top. Each card types itself
            in as the agent works, so you read why a token is moving instead of
            guessing at a chart.
          </p>
          <Link
            href="/app"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors hover:text-cyan-200 focus-visible:outline-none"
          >
            Open the live terminal
            <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </Reveal>

        <motion.div style={{ y: y1 }} className="space-y-3">
          {SAMPLE_FEED.map((f, i) => (
            <Reveal key={f.token} delay={i * 0.08}>
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0e14]/80 p-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-[10px] ${colorMap[f.color]}`}
                  >
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                    {f.tag}
                  </span>
                  <span className="text-sm font-bold text-white">{f.token}</span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────────── closing CTA ───────────────────────────── */

function ClosingCTA() {
  return (
    <section className="relative isolate overflow-hidden px-6 py-32">
      <GradientMesh />
      <Reveal className="relative mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-4xl font-semibold tracking-[-0.02em] text-white sm:text-6xl">
          Stop refreshing. Start reading the pulse.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60">
          The agent is already hunting. Open the terminal and watch Injective
          explain itself in real time.
        </p>
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="/app"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-[#07090e] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090e]"
          >
            Launch the terminal
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-white/45">
          <Zap className="h-4 w-4 text-cyan-300" />
          <span className="font-medium text-white/70">NinjaPing AI</span>
        </div>
        <p className="text-center font-mono text-[11px] text-white/50">
          Built for the Injective ecosystem & the N1NJ4 community · on-chain × social synthesis
        </p>
      </div>
    </footer>
  );
}

/* ───────────────────────────── page ───────────────────────────── */

export default function NinjaPingLanding() {
  return (
    <div className="relative min-h-dvh bg-[#07090e] text-white selection:bg-cyan-400/30">
      <Grain />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Features />
        <FeedBand />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
