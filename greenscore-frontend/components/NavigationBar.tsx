"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { useThemeContext } from "@/lib/theme-context";
import { useWalletContext } from "@/lib/wallet-context";
import { truncateAddress } from "@/utils/format";

const NAV_LINKS = [
  { label: "Overview", href: "#overview" },
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Security", href: "#security" },
  { label: "Rewards", href: "#rewards" },
  { label: "Docs", href: "https://docs.zama.ai/fhevm" },
];

function DensityToggle() {
  const { density, setDensity } = useThemeContext();
  return (
    <div className="gs-density-toggle">
      <button
        type="button"
        className={clsx("gs-chip", density === "comfortable" && "gs-chip--active")}
        onClick={() => setDensity("comfortable")}
      >
        Comfort
      </button>
      <button
        type="button"
        className={clsx("gs-chip", density === "compact" && "gs-chip--active")}
        onClick={() => setDensity("compact")}
      >
        Compact
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useThemeContext();
  const next = useMemo(() => (theme === "dark" ? "light" : "dark"), [theme]);
  return (
    <button
      type="button"
      className="gs-pill"
      onClick={() => setTheme(theme === "system" ? "dark" : next)}
    >
      {theme === "dark" ? "Switch to light" : theme === "light" ? "Switch to dark" : "Follow system"}
    </button>
  );
}

function WalletButton() {
  const wallet = useWalletContext();

  if (wallet.status === "connected" && wallet.accounts.length > 0) {
    const firstAccount = wallet.accounts[0];
    return (
      <div className="gs-wallet-group">
        <div className="gs-wallet-info">
          <span className="gs-wallet-address">{truncateAddress(firstAccount)}</span>
          {wallet.chainId && <span className="gs-wallet-chain">Chain #{wallet.chainId}</span>}
        </div>
        <button type="button" className="gs-pill" onClick={() => wallet.disconnect()}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="gs-cta"
      onClick={() => wallet.connect()}
      disabled={wallet.status === "connecting"}
    >
      {wallet.status === "connecting" ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}

export function NavigationBar() {
  return (
    <header className="gs-nav">
      <div className="gs-nav__brand">
        <a href="#overview" className="gs-nav__logo" aria-label="GreenScore home">
          GreenScore
        </a>
        <span className="gs-nav__badge">FHE native</span>
      </div>
      <nav className="gs-nav__links" aria-label="Primary">
        <ul>
          {NAV_LINKS.map((link) => {
            const isExternal = link.href.startsWith("http");
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="gs-nav__link"
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="gs-nav__actions">
        <DensityToggle />
        <ThemeToggle />
        <WalletButton />
      </div>
    </header>
  );
}

