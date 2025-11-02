"use client";

import { createContext, useContext } from "react";
import type { WalletManagerContext } from "@/hooks/useWalletManager";

const WalletContext = createContext<WalletManagerContext | undefined>(undefined);

export function WalletProvider({ value, children }: { value: WalletManagerContext; children: React.ReactNode }) {
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }
  return context;
}


