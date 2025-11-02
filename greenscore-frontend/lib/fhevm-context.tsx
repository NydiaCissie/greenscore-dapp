"use client";

import { createContext, useContext } from "react";
import type { FhevmStatus } from "@/hooks/useFhevmManager";

type FhevmContextValue = {
  status: FhevmStatus;
  instance: any;
  error?: string;
  rebuild: () => Promise<void> | void;
};

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

export function FhevmProvider({ value, children }: { value: FhevmContextValue; children: React.ReactNode }) {
  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>;
}

export function useFhevmContext() {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error("useFhevmContext must be used within FhevmProvider");
  }
  return context;
}


