"use client";

import { useEffect, useState } from "react";
import { BrowserProvider, type Eip1193Provider, type JsonRpcSigner } from "ethers";

export function useBrowserProvider(provider: Eip1193Provider | undefined) {
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | undefined>(undefined);

  useEffect(() => {
    if (!provider) {
      setBrowserProvider(undefined);
      return;
    }
    const next = new BrowserProvider(provider, undefined, { cacheTimeout: 5000 });
    setBrowserProvider(next);
  }, [provider]);

  return browserProvider;
}

export function useSigner(provider: BrowserProvider | undefined, account: string | undefined) {
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>(undefined);

  useEffect(() => {
    if (!provider || !account) {
      setSigner(undefined);
      return;
    }
    let mounted = true;
    provider
      .getSigner(account)
      .then((s) => {
        if (mounted) {
          setSigner(s);
        }
      })
      .catch(() => {
        if (mounted) {
          setSigner(undefined);
        }
      });
    return () => {
      mounted = false;
    };
  }, [provider, account]);

  return signer;
}


