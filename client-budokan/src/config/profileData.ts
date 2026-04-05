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
  2: "Ancient Egypt",
  3: "Norse",
  4: "Ancient Greece",
  5: "Feudal Japan",
  6: "Ancient China",
  7: "Ancient Persia",
  8: "Mayan",
  9: "Tribal",
  10: "Inca",
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
