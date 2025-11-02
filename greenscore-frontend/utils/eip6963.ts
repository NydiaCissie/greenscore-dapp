export type Eip6963ProviderInfo = {
  uuid: string;
  name: string;
  icon: string;
  rdns?: string;
};

export type Eip6963ProviderDetail = {
  info: Eip6963ProviderInfo;
  provider: unknown;
};

type AnnounceEvent = CustomEvent<Eip6963ProviderDetail>;

export async function findEip6963Providers(timeoutMs = 200): Promise<Eip6963ProviderDetail[]> {
  if (typeof window === "undefined") return [];

  const providers = new Map<string, Eip6963ProviderDetail>();

  const handler = (event: Event) => {
    const detail = (event as AnnounceEvent).detail;
    if (!detail || !detail.info?.uuid) return;
    providers.set(detail.info.uuid, detail);
  };

  window.addEventListener("eip6963:announceProvider", handler as EventListener);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  await new Promise((resolve) => setTimeout(resolve, timeoutMs));

  window.removeEventListener("eip6963:announceProvider", handler as EventListener);

  return Array.from(providers.values());
}


