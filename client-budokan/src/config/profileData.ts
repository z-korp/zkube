export const XP_PER_STAR = 100;

// Quadratic curve: threshold(L) = 16 * L²
// L1 = 0, L2 = 64, L10 = 1600, L50 = 40 000, L100 = 160 000.
// Formula picked so the early game (L1–L10) keeps roughly the previous
// pace post-XP-nerf, while the long tail gives endgame players a real
// goal to chase.
export const LEVEL_THRESHOLDS: number[] = Array.from(
  { length: 100 },
  (_, i) => (i === 0 ? 0 : 16 * (i + 1) * (i + 1)),
);

// Titles spread across the 100-level ladder. Levels not listed inherit
// the most recent earlier title.
export const PLAYER_TITLES: Record<number, string> = {
  1: "Novice",
  5: "Apprentice",
  10: "Initiate",
  15: "Block Tinker",
  20: "Block Master",
  25: "Cascade Adept",
  30: "Grid Sage",
  40: "Combo Weaver",
  50: "Spirit Caller",
  60: "Mutator Bender",
  70: "Guardian Ally",
  80: "Zone Legend",
  90: "Eternal",
  100: "Ascended",
};

export const ZONE_EMOJIS: Record<number, string> = {
  1: "🌊",
  2: "🏛️",
  3: "❄️",
  4: "🏺",
  5: "🐉",
  6: "🕌",
  7: "⛩️",
  8: "🌿",
  9: "🥁",
  10: "⛰️",
};

export const ZONE_NAMES: Record<number, string> = {
  1: "Tiki",
  2: "Egypt",
  3: "Norse",
  4: "Greece",
  5: "China",
  6: "Persia",
  7: "Japan",
  8: "Mayan",
  9: "Tribal",
  10: "Inca",
};

export const getLevelFromXp = (xp: number): number => {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
};

export const getTitleForLevel = (level: number): string => {
  const unlockLevels = Object.keys(PLAYER_TITLES)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((l) => l <= level);
  const key = unlockLevels[unlockLevels.length - 1] ?? 1;
  return PLAYER_TITLES[key] ?? "Novice";
};

export interface ZoneProgressData {
  zoneId: number;
  settingsId: number;
  name: string;
  emoji: string;
  stars: number;
  maxStars: number;
  unlocked: boolean;
  cleared: boolean;
  isFree: boolean;
  starCost?: number;
  price?: bigint;
  currentStars?: number;
  levelStars?: number[];
  highestCleared?: number;
  bossCleared?: boolean;
  perfectionClaimed?: boolean;
}
