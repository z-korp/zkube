export function getLevelStars(packed: bigint, level: number): number {
  if (level < 1 || level > 10) return 0;
  const shift = BigInt((level - 1) * 2);
  return Number((packed >> shift) & 0x3n);
}

export function unpackAllLevelStars(packed: bigint): number[] {
  return Array.from({ length: 10 }, (_, i) => getLevelStars(packed, i + 1));
}

export function sumStars(packed: bigint): number {
  return unpackAllLevelStars(packed).reduce((sum, s) => sum + s, 0);
}
