"use client";

import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useWalletManager } from "@/hooks/useWalletManager";
import { WalletProvider } from "@/lib/wallet-context";
import { useFhevmManager } from "@/hooks/useFhevmManager";
import { FhevmProvider } from "@/lib/fhevm-context";
import {
  hydrateThemeStore,
  useThemeStore,
  type DensityMode,
  type ThemeMode,
} from "@/store/theme-store";
import { ThemeProvider } from "@/lib/theme-context";

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return theme;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const theme = useThemeStore((state) => state.theme);
  const density = useThemeStore((state) => state.density);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setDensity = useThemeStore((state) => state.setDensity);

  const wallet = useWalletManager();
  const fhevm = useFhevmManager({ provider: wallet.provider, chainId: wallet.chainId });

  useEffect(() => {
    hydrateThemeStore();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const resolvedTheme = resolveTheme(theme);
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-density", density);

    if (theme === "system") {
      const listener = (event: MediaQueryListEvent) => {
        root.setAttribute("data-theme", event.matches ? "dark" : "light");
      };
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme, density]);

  const themeContextValue = useMemo(
    () => ({ theme, density, setTheme, setDensity }),
    [theme, density, setTheme, setDensity],
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider value={themeContextValue}>
        <WalletProvider value={wallet}>
          <FhevmProvider value={fhevm}>{children}</FhevmProvider>
        </WalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}


