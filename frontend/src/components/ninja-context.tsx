"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { NftCheckResponse, Persona } from "@/lib/types";

interface NinjaState {
  wallet: string | null;
  nft: NftCheckResponse | null;
  ninjaMode: boolean; // true => Shadow Ninja theme + degen prompting
  persona: Persona;
  setWallet: (w: string | null) => void;
  setNft: (n: NftCheckResponse | null) => void;
}

const Ctx = createContext<NinjaState | null>(null);

export function NinjaProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);
  const [nft, setNft] = useState<NftCheckResponse | null>(null);

  const ninjaMode = !!nft?.is_holder;
  const persona: Persona = ninjaMode ? "shadow" : "standard";

  useEffect(() => {
    document.documentElement.dataset.ninja = ninjaMode ? "true" : "false";
  }, [ninjaMode]);

  return (
    <Ctx.Provider value={{ wallet, nft, ninjaMode, persona, setWallet, setNft }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNinja(): NinjaState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNinja must be used within NinjaProvider");
  return ctx;
}
