export interface MetaData {
  totalRuns: number;
  dailyStars: number;
  lifetimeXp: number;
}

export function unpackMetaData(packed: bigint): MetaData {
  return {
    totalRuns: Number((packed >> 0n) & 0xFFFFn),
    dailyStars: Number((packed >> 16n) & 0xFFFFn),
    lifetimeXp: Number((packed >> 32n) & 0xFFFFFFFFn),
  };
}
