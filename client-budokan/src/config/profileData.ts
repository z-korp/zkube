export const XP_PER_STAR = 100;
export const LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000];

export const PLAYER_TITLES: Record<number, string> = {
  1: "Novice",
  2: "Apprentice",
  3: "Puzzle Adept",
  5: "Block Master",
  7: "Grid Sage",
  10: "Puzzle Legend",
  15: "Eternal",
};

export const ZONE_EMOJIS: Record<number, string> = {
  1: "🌊",
  2: "🏛️",
  3: "❄️",
  4: "🏺",
  5: "⛩️",
  6: "🐉",
  7: "🕌",
  8: "🌿",
  9: "🥁",
  10: "⛰️",
};

export const ZONE_NAMES: Record<number, string> = {
  1: "Polynesian",
  2: "Egypt",
  3: "Norse",
  4: "Greece",
  5: "Japan",
  6: "China",
  7: "Persia",
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
}
