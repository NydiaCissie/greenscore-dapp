type SignaturePayload = {
  privateKey: string;
  publicKey: string;
  signature: string;
  contractAddresses: string[];
  userAddress: string;
  startTimestamp: number;
  durationDays: number;
};

export function loadDecryptionSignature(account: string): SignaturePayload | null {
  if (typeof window === "undefined") return null;
  const key = `fhevm.decryptionSignature.${account.toLowerCase()}`;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SignaturePayload;
  } catch {
    return null;
  }
}

export function persistDecryptionSignature(account: string, payload: SignaturePayload) {
  if (typeof window === "undefined") return;
  const key = `fhevm.decryptionSignature.${account.toLowerCase()}`;
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearDecryptionSignature(account: string) {
  if (typeof window === "undefined") return;
  const key = `fhevm.decryptionSignature.${account.toLowerCase()}`;
  window.localStorage.removeItem(key);
}


