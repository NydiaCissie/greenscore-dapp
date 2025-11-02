"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Eip1193Provider } from "ethers";
import { findEip6963Providers, type Eip6963ProviderDetail } from "@/utils/eip6963";
import {
  hydrateWalletStore,
  resetWalletPersistence,
  useWalletStore,
  type WalletStatus,
} from "@/store/wallet-store";
import { dropDecryptionSignature } from "@/fhevm/signature";

type ConnectOptions = {
  connectorId?: string;
};

function normalizeChainId(value: unknown): number | undefined {
  if (typeof value === "string") {
    if (value.startsWith("0x")) {
      return Number.parseInt(value, 16);
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof value === "number") {
    return value;
  }
  return undefined;
}

function getWindowEthereum(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  const candidate = (window as unknown as { ethereum?: unknown }).ethereum;
  if (!candidate) return undefined;
  return candidate as Eip1193Provider;
}

function selectProvider(preferredId: string | undefined, discovered: Eip6963ProviderDetail[]): Eip1193Provider | undefined {
  if (!preferredId) return undefined;
  const match = discovered.find((entry) => entry.info.uuid === preferredId);
  return match?.provider as Eip1193Provider | undefined;
}

async function requestAccounts(provider: Eip1193Provider): Promise<{ accounts: string[]; chainId?: number }> {
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  const chainIdHex = await provider.request({ method: "eth_chainId" });
  return { accounts, chainId: normalizeChainId(chainIdHex) };
}

export function useWalletManager() {
  const [providers, setProviders] = useState<Eip6963ProviderDetail[]>([]);
  const status = useWalletStore((state) => state.status);
  const accounts = useWalletStore((state) => state.accounts);
  const chainId = useWalletStore((state) => state.chainId);
  const lastConnectorId = useWalletStore((state) => state.lastConnectorId);
  const error = useWalletStore((state) => state.error);
  const provider = useWalletStore((state) => state.provider);
  const setStatus = useWalletStore((state) => state.setStatus);
  const setProvider = useWalletStore((state) => state.setProvider);
  const updateSnapshot = useWalletStore((state) => state.updateSnapshot);
  const setError = useWalletStore((state) => state.setError);

  useEffect(() => {
    hydrateWalletStore();
  }, []);

  useEffect(() => {
    let mounted = true;
    findEip6963Providers().then((list) => {
      if (mounted) {
        setProviders(list);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const persistedStatus = useWalletStore.getState().status;
    if (persistedStatus !== "reconnecting") {
      return;
    }

    const fallback = getWindowEthereum();
    const candidate = selectProvider(lastConnectorId, providers) ?? fallback;
    if (!candidate) {
      setStatus("idle");
      return;
    }

    setStatus("reconnecting");
    setProvider(candidate);

    requestAccounts(candidate)
      .then(({ accounts: acc, chainId: cid }) => {
        if (!acc.length) {
          resetWalletPersistence();
          setStatus("idle");
          return;
        }
        updateSnapshot({ accounts: acc, chainId: cid, lastConnectorId }, { connected: true });
        setStatus("connected");
      })
      .catch(() => {
        setStatus("idle");
      });
  }, [lastConnectorId, providers, setProvider, setStatus, updateSnapshot]);

  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = (acc: unknown) => {
      if (!Array.isArray(acc)) {
        return;
      }
      const previous = useWalletStore.getState().accounts;
      previous.forEach((address) => {
        if (typeof address === "string" && address) {
          dropDecryptionSignature(address);
        }
      });
      const accountsList = acc.filter((item): item is string => typeof item === "string");
      updateSnapshot({ accounts: accountsList }, { connected: accountsList.length > 0 && status === "connected" });
      if (!accountsList.length) {
        setStatus("idle");
        resetWalletPersistence();
      }
    };

    const handleChainChanged = (nextChainId: unknown) => {
      const normalized = normalizeChainId(nextChainId);
      updateSnapshot({ chainId: normalized });
    };

    const handleConnect = (payload: unknown) => {
      const nextChainId = normalizeChainId((payload as { chainId?: unknown })?.chainId);
      updateSnapshot({ chainId: nextChainId }, { connected: true });
      setStatus("connected");
    };

    const handleDisconnect = () => {
      setStatus("idle");
      updateSnapshot({ accounts: [], chainId: undefined }, { connected: false });
      resetWalletPersistence();
    };

    const eventful = provider as unknown as {
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
    };

    eventful.on?.("accountsChanged", handleAccountsChanged);
    eventful.on?.("chainChanged", handleChainChanged);
    eventful.on?.("connect", handleConnect);
    eventful.on?.("disconnect", handleDisconnect);

    return () => {
      eventful.removeListener?.("accountsChanged", handleAccountsChanged);
      eventful.removeListener?.("chainChanged", handleChainChanged);
      eventful.removeListener?.("connect", handleConnect);
      eventful.removeListener?.("disconnect", handleDisconnect);
    };
  }, [provider, setStatus, updateSnapshot]);

  const connect = useCallback(
    async (options?: ConnectOptions) => {
      console.log("[useWalletManager] Connect requested:", options);
      setError(undefined);
      const fallback = getWindowEthereum();
      const preferredId = options?.connectorId ?? lastConnectorId;
      const fromRegistry = selectProvider(preferredId, providers);
      const candidate = fromRegistry ?? fallback;

      if (!candidate) {
        console.error("[useWalletManager] ❌ No wallet provider found");
        throw new Error("No wallet provider found. Please install an EIP-6963 wallet.");
      }

      console.log("[useWalletManager] Wallet provider found, connecting...");
      setStatus("connecting");
      setProvider(candidate);

      const requestMethod = "eth_requestAccounts";

      let connectorId = options?.connectorId;
      if (!connectorId) {
        const matched = providers.find((entry) => entry.provider === candidate);
        connectorId = matched?.info.uuid;
      }
      if (!connectorId && candidate === fallback) {
        connectorId = "injected";
      }

      try {
        const requestedAccounts = (await candidate.request({ method: requestMethod })) as string[];
        if (!requestedAccounts.length) {
          console.error("[useWalletManager] ❌ User rejected connection");
          throw new Error("User rejected the connection request");
        }
        const chain = await candidate.request({ method: "eth_chainId" });
        const normalizedChain = normalizeChainId(chain);
        console.log(`[useWalletManager] ✅ Connected: ${requestedAccounts[0]}, chainId: ${normalizedChain}`);
        updateSnapshot(
          {
            accounts: requestedAccounts,
            chainId: normalizedChain,
            lastConnectorId: connectorId ?? lastConnectorId,
          },
          { connected: true },
        );
        setStatus("connected");
      } catch (err) {
        console.error("[useWalletManager] ❌ Connection failed:", err);
        setStatus("idle");
        setError((err as Error).message);
        throw err;
      }
    },
    [lastConnectorId, providers, setError, setProvider, setStatus, updateSnapshot],
  );

  const disconnect = useCallback(() => {
    const previous = useWalletStore.getState().accounts;
    previous.forEach((address) => {
      if (typeof address === "string" && address) {
        dropDecryptionSignature(address);
      }
    });
    setProvider(undefined);
    setStatus("idle");
    updateSnapshot({ accounts: [], chainId: undefined }, { connected: false });
    resetWalletPersistence();
  }, [setProvider, setStatus, updateSnapshot]);

  const state = useMemo(
    () => ({ providers, status, accounts, chainId, lastConnectorId, error }),
    [providers, status, accounts, chainId, lastConnectorId, error],
  );

  return {
    ...state,
    connect,
    disconnect,
    provider,
  };
}

export type WalletManagerContext = ReturnType<typeof useWalletManager>;

