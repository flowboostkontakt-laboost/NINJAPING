"use client";

import { useState } from "react";
import { Wallet, ShieldCheck, Ghost, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useNinja } from "./ninja-context";

interface KeplrWindow {
  keplr?: {
    enable: (chainId: string) => Promise<void>;
    getKey: (chainId: string) => Promise<{ bech32Address: string }>;
  };
}

const INJECTIVE_CHAIN_ID = "injective-1";

export function WalletConnect() {
  const { wallet, nft, ninjaMode, setWallet, setNft } = useNinja();
  const [open, setOpen] = useState(false);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function verify(address: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyNft(address);
      setWallet(address);
      setNft(res);
      setOpen(false);
    } catch {
      setError("Verification failed — is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  async function connectKeplr() {
    const k = (window as unknown as KeplrWindow).keplr;
    if (!k) {
      setOpen(true);
      return;
    }
    try {
      setBusy(true);
      await k.enable(INJECTIVE_CHAIN_ID);
      const key = await k.getKey(INJECTIVE_CHAIN_ID);
      await verify(key.bech32Address);
    } catch {
      setBusy(false);
      setOpen(true);
    }
  }

  // Demo affordance: preview Shadow Ninja Mode without a real N1NJ4 NFT.
  function previewShadow() {
    setWallet("inj1demo…holder");
    setNft({
      wallet: "inj1demo…holder",
      is_holder: true,
      balance: 1,
      contract: "demo",
      mode: "live",
    });
    setOpen(false);
  }

  function disconnect() {
    setWallet(null);
    setNft(null);
  }

  if (wallet) {
    return (
      <button
        onClick={disconnect}
        title="Disconnect"
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
          ninjaMode
            ? "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
            : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
        }`}
      >
        {ninjaMode ? <Ghost className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        {ninjaMode ? "Shadow Ninja" : "Connected"}
        <span className="text-slate-500">
          {wallet.slice(0, 7)}…{wallet.slice(-3)}
        </span>
        {nft?.is_holder && (
          <span className="rounded bg-rose-500/20 px-1.5 text-rose-300">
            ×{nft.balance} N1NJ4
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={connectKeplr}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
        Connect Wallet
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#0e131c] p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-white">
              <Wallet className="h-5 w-5 text-cyan-400" /> Connect Injective Wallet
            </h2>
            <p className="mb-4 text-sm text-slate-400">
              Verify a <span className="text-rose-300">N1NJ4</span> NFT to unlock{" "}
              <span className="text-rose-300">Shadow Ninja Mode</span> — uncensored degen alpha.
            </p>

            <label className="mb-1 block font-mono text-xs text-slate-500">
              Injective address
            </label>
            <input
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              placeholder="inj1..."
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-500"
            />
            {error && <p className="mb-2 text-xs text-rose-400">{error}</p>}

            <button
              onClick={() => addr.trim() && verify(addr.trim())}
              disabled={busy || !addr.trim()}
              className="mb-2 w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
            >
              {busy ? "Verifying on-chain…" : "Verify & Connect"}
            </button>
            <button
              onClick={previewShadow}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <Ghost className="h-4 w-4" /> Preview Shadow Ninja Mode (demo)
            </button>
          </div>
        </div>
      )}
    </>
  );
}
