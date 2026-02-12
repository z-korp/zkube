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
