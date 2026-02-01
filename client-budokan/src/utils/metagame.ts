import { manifest } from "@/config/manifest";

const splitCsv = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export const normalizeAddress = (address?: string) => {
  if (!address) return undefined;
  try {
    const formatted = BigInt(address).toString(16);
    return `0x${formatted}`.toLowerCase();
  } catch {
    return address.trim().toLowerCase();
  }
};

export const getGameSystemAddress = () => {
  const contract = manifest.contracts?.find(
    (entry: { tag?: string }) => entry.tag?.includes("game_system"),
  );
  return normalizeAddress(contract?.address);
};

export const getLeaderboardExcludedAccounts = () =>
  splitCsv(import.meta.env.VITE_PUBLIC_LEADERBOARD_EXCLUDED_ACCOUNTS)
    .map((address) => normalizeAddress(address))
    .filter((address): address is string => Boolean(address));

export const getLeaderboardExcludedNames = () =>
  splitCsv(import.meta.env.VITE_PUBLIC_LEADERBOARD_EXCLUDED_NAMES).map((name) =>
    name.toLowerCase(),
  );
