export function truncateAddress(address?: string, size = 4) {
  if (!address) return "";
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function truncateHash(hash?: string, size = 6) {
  if (!hash) return "";
  return `${hash.slice(0, size)}…${hash.slice(-size)}`;
}

export function formatScore(value?: bigint, fallback = "—") {
  if (value === undefined) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return value.toString();
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(num);
}

export function formatQuantity(value?: number) {
  if (!value && value !== 0) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

