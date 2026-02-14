/**
 * Normalize a Starknet address to match Torii's storage format.
 * Strips leading zeros after 0x and lowercases.
 *
 * Example: "0x004533cf..." → "0x4533cf..."
 */
export function normalizeAddress(address: string): string {
  if (!address.startsWith("0x")) return address;
  const hex = address.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}`.toLowerCase();
}

/**
 * Pad a hex address to full 66-char felt (0x + 64 hex digits).
 * Required for WASM torii-client calls — crypto-bigint panics on short hex strings.
 */
export function padAddress(address: string): string {
  if (!address.startsWith("0x")) return address;
  return `0x${address.slice(2).padStart(64, "0")}`.toLowerCase();
}
