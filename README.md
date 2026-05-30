# ⚡ NinjaPing AI

**NinjaPing AI** is a proactive, autonomous on-chain anomaly detector and social
synthesizer purpose-built for the **Injective** ecosystem and the **N1NJ4**
community.

Instead of another passive chatbot that waits for your prompt, NinjaPing is an
event-driven AI agent that constantly **hunts** for liquidity shocks, whale
moves and social-velocity spikes — then translates raw on-chain + social data
into high-signal, human-readable market **"pulses"** that stream onto a live
terminal-style dashboard.

> Think of it as an **airport departures board for the Injective markets**:
> clean signal, pulsing alerts, zero scrolling.

> **Every other Injective AI waits for you to ask. NinjaPing pings _you_ when
> on-chain flow and social heat diverge.**

---

## 🚀 Key Features

- **Proactive Anomaly Engine** — continuous async scanning of price/volume
  velocity (vs a rolling baseline) and social velocity across Injective assets.
  The AI is only invoked when a mathematical threshold is breached.
- **Glass-box reasoning** — every card has a "How the AI decided" drawer showing
  the exact rule that tripped, observed vs baseline vs threshold, and the
  on-chain × social divergence (e.g. "whale bid + dead social = silent
  accumulation"). The classifier shows its work on real numbers.
- **Self-grading scorecard** — every proactive call is auto-graded HIT/MISS
  against live price after it ages. The sidebar shows a running hit-rate and
  average move. The agent holds itself accountable.
- **On-chain × Social Fusion** — every pulse correlates real market data with a
  live attention signal (CoinGecko search-trending + turnover, or CryptoPanic
  posts) so the report explains *why* a token is moving. Cards carry a `LIVE`
  badge when the social signal is from a real source.
- **Verifiable proof-of-prediction** — each call is sha256-committed at emit and
  re-verifiable at `/api/verify/{id}`. Tamper-evident: change the report and the
  hash no longer matches. (On-chain anchoring is wired and opt-in, see below.)
- **No-bullshit AI insights** — concise, sharp, exactly-3-sentence reports:
  catalyst, state, risk.
- **N1NJ4 Holder Mode (dynamic UI + prompting)** — connect a wallet holding a
  N1NJ4 CW721 NFT and the UI flips to **Shadow Ninja Mode** (red-smoke theme)
  while the LLM system prompt mutates into an uncensored "degen" persona.
- **Degen vs. Smart Money index** — a per-pulse heuristic visualizing whether a
  move is quiet whale accumulation or pure retail hype.
- **Shareable Raid Cards** — "⚡ Raid on X" turns any pulse into a branded
  1200×630 social image (dynamic OG) plus a pre-composed tweet, with a public
  `/pulse/[id]` permalink. Built for the N1NJ4 social-engagement bounty.
- **Live everything** — Server-Sent-Events feed, animated pulse cards, typewriter
  AI reports, and a terminal boot sequence.

---

## 🧠 How AI is used

NinjaPing runs an asynchronous, event-driven agent pipeline:

1. **Aggregate & filter** — a Python engine fetches live market data
   (CoinGecko + Injective LCD) and a social-velocity reading, then computes a
   per-token *heat* score. The AI is triggered **only** when a threshold is
   breached (sharp price move, volume-velocity spike, whale-sized flow, or a
   social surge) — or, to keep a demo feed alive, from the strongest genuine
   mover on a heartbeat.
2. **Contextual synthesis** — the breached anomaly (on-chain tick + social
   reading + classification) is packed into a prompt and sent to an LLM.
3. **Structured generation** — the LLM responds in **JSON mode**
   (`report`, `keywords`, `degen_score`). The report is auto-classified and
   tagged (`🚨 WHALE ACCUMULATION`, `🔥 SOCIAL RUSH`, `⚠️ LIQUIDATION ALERT`,
   `⚡ VOL BREAKOUT`).

**Persona mutation (the secret sauce):** the system prompt is selected by the
caller's N1NJ4 NFT ownership — a precise *institutional analyst* for everyone,
or an uncensored *Shadow Ninja degen* for verified holders.

**Provider-agnostic & resilient:** the LLM layer talks raw HTTP to
**Anthropic** or **OpenAI** (auto-selected by which key is present). With no key
at all it falls back to a deterministic local templater, so the pipeline **never
stalls** — great for offline demos.

---

## ⛓️ Injective integration

- **Live on-chain heartbeat** — reads the Injective LCD
  (`/cosmos/base/tendermint/.../blocks/latest`) for real chain height shown in
  the header.
- **CW721 NFT gate** — the N1NJ4 holder check is a real CosmWasm smart query
  (`tokens { owner }`) against the configured collection on the Injective LCD.
- **Ecosystem scope** — tracks `$INJ` (live via CoinGecko) plus ecosystem assets
  (`$NINJA`, `$TALK`, `$HDRO`, `$NEPT`, `$AGENT`). Assets not yet listed on a
  public price API are filled with clearly-flagged (`sim`) realistic ticks so the
  ecosystem narrative stays coherent.
- **dApp venues** — pulses are attributed to Injective venues (Helix DEX, Mito).

> **The social layer is real for listed tokens.** There is no free real-time X
> firehose, so instead of faking it we derive a genuine **attention velocity**
> from live sources behind one `SocialClient.read()` interface:
> CoinGecko **search-trending** membership + 24h **turnover** (volume / market
> cap), tracked over time. Add a free **CryptoPanic** key (`CRYPTOPANIC_KEY`) to
> upgrade to real per-token news/social posts with real headlines and sources.
> Only unlisted ecosystem micro-caps fall back to a clearly-labelled (`sim`)
> simulated signal.

---

## 🔬 What's real vs simulated (no smoke and mirrors)

Transparency matters more than a perfect facade. Here is exactly what is live:

| Signal | Status | Detail |
|---|---|---|
| Injective chain height | 🟢 **Live** | public Injective LCD (`/cosmos/base/tendermint/.../blocks/latest`) |
| `$INJ` price / volume | 🟢 **Live** | CoinGecko public API |
| AI synthesis | 🟢 **Live** | Anthropic `claude-haiku-4-5` (JSON mode); auto-falls back to OpenAI, then a deterministic local templater |
| N1NJ4 NFT gate | 🟢 **Real on-chain** | CosmWasm CW721 `tokens { owner }` smart query against the configured collection |
| Self-grading (HIT/MISS) | 🟢 **Live** | re-prices each call against live market data |
| Social / attention velocity | 🟢 **Live for listed tokens** | CoinGecko search-trending + 24h turnover; optional CryptoPanic key for real per-token posts; `sim` only for unlisted micro-caps |
| Proof-of-prediction | 🟢 **Live** | sha256 commitment of every call at emit, re-verifiable at `/api/verify/{id}` (tamper-evident) |
| Ecosystem micro-caps (`$NINJA`, `$TALK`, …) | 🟡 **Simulated, labelled** | not yet on a public price API; deterministic ticks, shown with a `sim` badge |
| On-chain anchoring of the proof hash | ⚪ **Wired, not broadcast** | the `proof_anchor` field + `/api/verify` are ready to carry an Injective-testnet tx hash; live broadcast is not enabled because `coincurve` (needed for Injective `ethsecp256k1` signing) has no Python 3.14 wheel. Run the backend on Python 3.11/3.12 with a faucet-funded key to activate. The proof is fully verifiable off-chain regardless. |

The deterministic pieces are isolated behind clean interfaces so they swap to
live sources without touching the engine, the API, or the UI.

---

## 🛠️ Stack

| Layer | Tech |
|------|------|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS v4, Framer Motion, lucide-react |
| Backend | Python 3.11+, FastAPI, httpx, async background worker |
| Realtime | Server-Sent Events (FastAPI) — optional Supabase Realtime mirror |
| AI | Anthropic / OpenAI via JSON-mode (auto-select) + local fallback |
| Data | CoinGecko (live prices/volume), Injective LCD (on-chain), KOL social model |
| Persistence | In-process store (always) + optional Supabase (PostgreSQL) |

### Architecture

```
[ Ingestion ]                         [ AI Core ]                 [ Presentation ]

  CoinGecko (prices/volume) ─┐
  Injective LCD (on-chain) ──┼─▶ FastAPI Anomaly Engine ─▶ LLM ─▶ SSE ─▶ Next.js
  Social / KOL stream ───────┘    (detect → classify)   (synthesize, JSON)   Dashboard
                                          │                              │
                                     NFT gate check ───────────▶ (optional) Supabase
                                  (standard vs Shadow Ninja prompt)
```

---

## 📂 Project structure

```
ninja-ping/
├── backend/                       # FastAPI Python service
│   ├── app/
│   │   ├── main.py                # API surface + live SSE feed
│   │   ├── config.py              # env config & capability flags
│   │   ├── models.py              # shared Pydantic contracts
│   │   ├── store.py               # in-process feed + pub/sub for SSE
│   │   ├── clients/
│   │   │   ├── market.py          # CoinGecko + Injective LCD + synthetic ticks
│   │   │   ├── social.py          # KOL social-velocity model (swappable)
│   │   │   ├── llm.py             # Anthropic/OpenAI JSON-mode + local fallback
│   │   │   └── supabase.py        # optional PostgREST mirror
│   │   ├── agents/
│   │   │   ├── pulse_agent.py     # persona prompts + synthesis + local templater
│   │   │   └── nft_verifier.py    # Injective CW721 holder check
│   │   └── workers/
│   │       └── anomaly_engine.py  # background hunter: detect → classify → emit
│   ├── requirements.txt
│   ├── supabase_schema.sql        # optional table DDL + Realtime
│   └── .env.example
│
├── frontend/                      # Next.js dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # "/"     → marketing landing
│   │   │   ├── app/page.tsx        # "/app"  → live terminal dashboard
│   │   │   ├── layout.tsx, globals.css
│   │   ├── components/
│   │   │   ├── NinjaPingLanding.tsx # single-file landing (Framer Motion)
│   │   │   ├── Dashboard.tsx        # terminal dashboard shell
│   │   │   ├── TerminalBoot.tsx    # 1.5s boot sequence
│   │   │   ├── TopBar.tsx          # logo, agent status, telemetry, wallet
│   │   │   ├── PulseCard.tsx       # alert card + Raid on X + degen index
│   │   │   ├── Typewriter.tsx      # typewriter + keyword bolding
│   │   │   ├── DegenIndex.tsx      # smart-money vs hype bar
│   │   │   ├── Sidebar.tsx         # trending + system health
│   │   │   ├── ScanButton.tsx      # "Scan Ecosystem" + laser sweep
│   │   │   ├── WalletConnect.tsx   # Keplr / address → NFT gate → Shadow mode
│   │   │   └── ninja-context.tsx   # wallet + Shadow Ninja state
│   │   └── lib/{api,types,pulse-style}.ts
│   └── .env.example
└── README.md
```

---

## 📦 Local setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- *(optional)* Anthropic or OpenAI API key, Supabase project, N1NJ4 contract addr

> **Zero-config demo:** with **no keys at all** the app runs fully live against
> CoinGecko + the public Injective LCD and uses the local report templater.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # optional: add keys
uvicorn app.main:app --port 8000  # add --reload for dev
```

`.env` (all optional):

```env
ANTHROPIC_API_KEY=...        # or OPENAI_API_KEY=...
SUPABASE_URL=...             # optional durable mirror
SUPABASE_SERVICE_KEY=...
INJECTIVE_LCD=https://sentry.lcd.injective.network
NINJA_NFT_CONTRACT=inj1...   # enables the N1NJ4 holder gate
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open **http://localhost:3000**:

- `/` — the marketing landing (calm, premium; built with Framer Motion: 3D hero, scroll reveals, parallax, animated gradient mesh).
- `/app` — the live terminal dashboard. Append `?skipboot=1` to skip the boot sequence.

---

## 🔌 API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | health + capability flags |
| GET | `/api/pulses?limit=` | recent pulses (newest first) |
| GET | `/api/pulses/stream` | **SSE** live feed |
| GET | `/api/pulses/{id}` | single pulse |
| POST | `/api/scan` | manual "Scan Ecosystem" (`{persona, wallet?}`) |
| GET | `/api/stats` | feed stats + trending (AI hype score) |
| GET | `/api/status` | agent status, next-scan countdown, chain height |
| POST | `/api/nft/verify` | N1NJ4 CW721 holder check → flips persona |
| POST | `/api/raid` | build a ready-to-post X/Twitter tweet for a pulse |

---

## 🎬 Demo tips

1. Hit **Scan Ecosystem** — watch the laser sweep, then a fresh card types itself
   in at the top of the feed.
2. Click **Connect Wallet → Preview Shadow Ninja Mode** to flip the theme red and
   switch the AI into uncensored degen prompting.
3. Click **⚡ Raid on X** on any card to open a pre-composed tweet.

---

## 🏆 Evaluation alignment

- **Usefulness** — collapses DexScreener + CMC + X + Discord into one unified,
  AI-explained signal feed.
- **Execution** — async background workers (Python) + light realtime UI (Next.js);
  resilient provider fallbacks; never blanks out.
- **Usability** — immersive dark terminal designed for instant scanning and
  one-click social sharing.

---

*Built for the Injective ecosystem & the N1NJ4 community — on-chain × social synthesis.*
