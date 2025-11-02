type CachedKey = {
  publicKey: string;
  publicParams: string;
};

const KEY_PREFIX = "greenscore.acl.";

export function loadCachedKey(aclAddress: string): CachedKey | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`${KEY_PREFIX}${aclAddress.toLowerCase()}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedKey;
    if (typeof parsed.publicKey === "string" && typeof parsed.publicParams === "string") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function persistCachedKey(aclAddress: string, payload: CachedKey) {
  if (typeof window === "undefined") return;
  
  const key = `${KEY_PREFIX}${aclAddress.toLowerCase()}`;
  const value = JSON.stringify(payload);
  
  try {
    window.localStorage.setItem(key, value);
    console.log(`[persistCachedKey] ✅ Cached keys for ${aclAddress.substring(0, 10)}...`);
  } catch (err) {
    // QuotaExceededError: localStorage is full
    console.warn(`[persistCachedKey] ⚠️ Failed to cache keys (quota exceeded), clearing old entries...`);
    
    // Try to clear old FHEVM keys to make space
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const storageKey = window.localStorage.key(i);
        if (storageKey && storageKey.startsWith(KEY_PREFIX) && storageKey !== key) {
          keysToRemove.push(storageKey);
        }
      }
      
      // Remove old keys
      keysToRemove.forEach((k) => {
        window.localStorage.removeItem(k);
        console.log(`[persistCachedKey] Removed old key: ${k}`);
      });
      
      // Try again
      window.localStorage.setItem(key, value);
      console.log(`[persistCachedKey] ✅ Cached keys after cleanup`);
    } catch (retryErr) {
      // Still failed, log warning but don't throw
      // The app can still work without caching (just slower on next load)
      console.warn(`[persistCachedKey] ⚠️ Could not cache keys even after cleanup. App will work but may be slower on reload.`);
      console.warn(`[persistCachedKey] Error:`, retryErr);
    }
  }
}


