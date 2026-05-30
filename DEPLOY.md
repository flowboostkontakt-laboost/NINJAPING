# Deploying NinjaPing AI

Two services: a FastAPI backend and a Next.js frontend. Deploy the backend
first, then point the frontend at its URL.

## 1. Backend → Render (free)

1. Push this repo to GitHub (already done).
2. On [render.com](https://render.com): **New → Blueprint**, pick this repo.
   Render reads `render.yaml` and provisions `ninjaping-backend`.
   (Or: New → Web Service, root dir `backend`, build `pip install -r requirements.txt`,
   start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.)
3. Set environment variables:
   - `ANTHROPIC_API_KEY` — your key (or `OPENAI_API_KEY`).
   - `CORS_ORIGINS` — your Vercel URL, e.g. `https://ninjaping.vercel.app`.
   - `FRONTEND_URL` — same Vercel URL (used for Raid-on-X share links).
   - `CRYPTOPANIC_KEY` — optional, free key for real per-token social posts.
4. Deploy. Note the URL, e.g. `https://ninjaping-backend.onrender.com`.

> Free Render instances sleep when idle; the first request after a pause takes
> a few seconds to wake. Fine for a demo.

## 2. Frontend → Vercel

1. On [vercel.com](https://vercel.com): **New Project**, import this repo.
2. Set **Root Directory** to `frontend`.
3. Environment variable:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL (no trailing slash).
4. Deploy. Vercel auto-detects Next.js. Done.

After both are up, open the Vercel URL: `/` is the landing, `/app` is the live terminal.

## 3. Optional: real on-chain proof anchoring

Live anchoring of the proof hash on the Injective testnet needs a
coincurve-capable runtime (the keccak/secp256k1 deps have no Python 3.14 wheel
and need a C toolchain). Use the provided `backend/Dockerfile` (Python 3.12 +
build tools) and set:

- `PROOF_ANCHOR_ENABLED=true`
- `INJECTIVE_PROOF_MNEMONIC` — a testnet mnemonic funded from
  https://testnet.faucet.injective.network

Each pulse then broadcasts `ninjaping:<sha256>` as a tx memo, and
`/api/verify/{id}` re-reads it from the testnet LCD. Without this, the proof is
still fully verifiable off-chain.
