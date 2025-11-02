const DEFAULT_CDN = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";

declare global {
  interface Window {
    relayerSDK?: any;
  }
}

export async function ensureRelayerSDK(cdnUrl = DEFAULT_CDN): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Relayer SDK can only be loaded in the browser");
  }

  if (window.relayerSDK) {
    return window.relayerSDK;
  }

  const existing = document.querySelector(`script[data-greenscore-relayer="true"]`);
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load relayer SDK")), { once: true });
    });
    if (!window.relayerSDK) {
      throw new Error("Relayer SDK script loaded without exposing window.relayerSDK");
    }
    return window.relayerSDK;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = cdnUrl;
    script.async = true;
    script.dataset.greenscoreRelayer = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load relayer SDK from ${cdnUrl}`));
    document.head.append(script);
  });

  if (!window.relayerSDK) {
    throw new Error("Relayer SDK unavailable after script load");
  }

  return window.relayerSDK;
}


