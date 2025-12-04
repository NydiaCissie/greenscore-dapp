"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Eip1193Provider } from "ethers";
import { createFhevmInstance } from "@/fhevm/instance";

export type FhevmStatus = "idle" | "creating" | "ready" | "error";

export function useFhevmManager({
  provider,
  chainId,
}: {
  provider: Eip1193Provider | undefined;
  chainId: number | undefined;
}) {
  const [status, setStatus] = useState<FhevmStatus>("idle");
  const [instance, setInstance] = useState<any>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | null>(null);

  // Build FHEVM instance with proper error handling and abort support
  const build = useCallback(async () => {
    if (!provider || chainId === undefined) {
      console.log("[useFhevmManager] No provider or chainId, status: idle");
      setInstance(undefined);
      setStatus("idle");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    console.log(`[useFhevmManager] Creating FHEVM instance for chainId: ${chainId}`);
    setStatus("creating");
    setError(undefined);

    try {
      const result = await createFhevmInstance({ provider, chainId, signal: controller.signal });
      if (!controller.signal.aborted) {
        console.log("[useFhevmManager] ✅ FHEVM instance created successfully");
        setInstance(result);
        setStatus("ready");
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        const errorMessage = (err as Error).message ?? String(err);
        console.error("[useFhevmManager] ❌ FHEVM instance creation failed:", errorMessage);
        console.error("[useFhevmManager] Full error:", err);
        setStatus("error");
        setInstance(undefined);
        setError(errorMessage);
      }
    }
  }, [provider, chainId]);

  useEffect(() => {
    build();
    return () => {
      controllerRef.current?.abort();
    };
  }, [build]);

  return { status, instance, error, rebuild: build };
}


