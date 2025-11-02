import type { Eip1193Provider } from "ethers";
import { create } from "zustand";

export type WalletStatus = "idle" | "reconnecting" | "connecting" | "connected" | "error";

export type WalletSnapshot = {
  accounts: string[];
  chainId?: number;
  lastConnectorId?: string;
};

type WalletState = WalletSnapshot & {
  status: WalletStatus;
  provider?: Eip1193Provider;
  error?: string;
  setStatus: (status: WalletStatus) => void;
  setProvider: (provider: Eip1193Provider | undefined) => void;
  updateSnapshot: (snapshot: Partial<WalletSnapshot>, options?: { connected?: boolean }) => void;
  setError: (message?: string) => void;
};

const STORAGE_KEYS = {
  connector: "wallet.lastConnectorId",
  accounts: "wallet.lastAccounts",
  chain: "wallet.lastChainId",
  connected: "wallet.connected",
};

function writePersistence(snapshot: WalletSnapshot, connected: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(snapshot.accounts ?? []));
  window.localStorage.setItem(STORAGE_KEYS.chain, snapshot.chainId?.toString() ?? "");
  window.localStorage.setItem(STORAGE_KEYS.connector, snapshot.lastConnectorId ?? "");
  window.localStorage.setItem(STORAGE_KEYS.connected, connected ? "true" : "false");
}

function readPersistence(): WalletSnapshot & { connected: boolean } {
  if (typeof window === "undefined") {
    return { accounts: [], chainId: undefined, lastConnectorId: undefined, connected: false };
  }
  const accountsRaw = window.localStorage.getItem(STORAGE_KEYS.accounts);
  const chainRaw = window.localStorage.getItem(STORAGE_KEYS.chain);
  const connector = window.localStorage.getItem(STORAGE_KEYS.connector) || undefined;
  const connected = window.localStorage.getItem(STORAGE_KEYS.connected) === "true";
  let accounts: string[] = [];
  if (accountsRaw) {
    try {
      const parsed = JSON.parse(accountsRaw);
      if (Array.isArray(parsed)) {
        accounts = parsed.filter((a): a is string => typeof a === "string");
      }
    } catch {
      accounts = [];
    }
  }
  const chainId = chainRaw ? Number.parseInt(chainRaw, 10) : undefined;
  return { accounts, chainId: Number.isFinite(chainId) ? chainId : undefined, lastConnectorId: connector, connected };
}

export const useWalletStore = create<WalletState>((set, get) => ({
  status: "idle",
  accounts: [],
  chainId: undefined,
  lastConnectorId: undefined,
  provider: undefined,
  setStatus: (status) => set({ status }),
  setProvider: (provider) => set({ provider }),
  updateSnapshot: (snapshot, options) => {
    const next = { ...get(), ...snapshot } as WalletState;
    set(snapshot);
    writePersistence(
      {
        accounts: next.accounts ?? [],
        chainId: next.chainId,
        lastConnectorId: next.lastConnectorId,
      },
      options?.connected ?? next.status === "connected",
    );
  },
  setError: (message) => set({ error: message, status: message ? "error" : get().status }),
}));

export function hydrateWalletStore() {
  if (typeof window === "undefined") return;
  const persisted = readPersistence();
  useWalletStore.setState({
    accounts: persisted.accounts,
    chainId: persisted.chainId,
    lastConnectorId: persisted.lastConnectorId,
    status: persisted.connected ? "reconnecting" : "idle",
  });
}

export function resetWalletPersistence() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.connected, "false");
  window.localStorage.setItem(STORAGE_KEYS.accounts, "[]");
}

