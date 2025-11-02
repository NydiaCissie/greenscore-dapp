"use client";

import { createContext, useContext } from "react";
import type { DensityMode, ThemeMode } from "@/store/theme-store";

type ThemeContextValue = {
  theme: ThemeMode;
  density: DensityMode;
  setTheme: (theme: ThemeMode) => void;
  setDensity: (density: DensityMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ value, children }: { value: ThemeContextValue; children: React.ReactNode }) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return context;
}


