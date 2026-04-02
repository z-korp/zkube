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
}

export interface QuestDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  max: number;
  reward: number;
  progress: number;
  done?: boolean;
  color: "accent" | "accent2" | "accent3" | "accent4";
  category: "daily" | "weekly" | "milestone";
}

export const QUEST_DEFS: QuestDef[] = [
  { id: "daily-1", title: "Line Breaker", desc: "Clear 20 lines", icon: "📏", max: 20, progress: 14, reward: 3, color: "accent", category: "daily" },
  { id: "daily-2", title: "Combo Starter", desc: "Get a x3 combo", icon: "🔥", max: 1, progress: 1, reward: 2, done: true, color: "accent2", category: "daily" },
  { id: "daily-3", title: "Daily Player", desc: "Complete the daily challenge", icon: "⚡", max: 1, progress: 0, reward: 5, color: "accent3", category: "daily" },
  { id: "weekly-1", title: "Zone Explorer", desc: "Complete 3 different zone levels", icon: "🗺️", max: 3, progress: 2, reward: 10, color: "accent4", category: "weekly" },
  { id: "weekly-2", title: "Perfectionist", desc: "3-star any 5 levels", icon: "⭐", max: 5, progress: 3, reward: 15, color: "accent2", category: "weekly" },
  { id: "weekly-3", title: "Boss Hunter", desc: "Defeat 2 bosses", icon: "👹", max: 2, progress: 1, reward: 12, color: "accent3", category: "weekly" },
  { id: "milestone-1", title: "First Steps", desc: "Complete your first zone", icon: "🌟", max: 1, progress: 1, reward: 30, done: true, color: "accent", category: "milestone" },
  { id: "milestone-2", title: "Star Collector", desc: "Collect 100 total stars", icon: "✨", max: 100, progress: 51, reward: 40, color: "accent2", category: "milestone" },
  { id: "milestone-3", title: "Endless Legend", desc: "Reach level 20 in Endless", icon: "♾️", max: 20, progress: 14, reward: 50, color: "accent4", category: "milestone" },
];

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  category: "Combat" | "Mastery" | "Explorer";
  unlocked: boolean;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: "combat-1", name: "Boss Slayer", desc: "Defeat your first boss", icon: "⚔️", rarity: "Common", category: "Combat", unlocked: true },
  { id: "combat-2", name: "Tidecaller's Bane", desc: "Defeat Tidecaller under 10 moves", icon: "🌊", rarity: "Rare", category: "Combat", unlocked: true },
  { id: "combat-3", name: "Flawless Victory", desc: "3-star a boss level", icon: "💎", rarity: "Epic", category: "Combat", unlocked: false },
  { id: "combat-4", name: "Conqueror", desc: "Defeat all 10 bosses", icon: "👑", rarity: "Legendary", category: "Combat", unlocked: false },
  { id: "mastery-1", name: "Combo Initiate", desc: "Get a x3 combo", icon: "🔥", rarity: "Common", category: "Mastery", unlocked: true },
  { id: "mastery-2", name: "Chain Master", desc: "Get a x5 combo", icon: "⛓️", rarity: "Rare", category: "Mastery", unlocked: true },
  { id: "mastery-3", name: "Cascade King", desc: "Get a x10 combo", icon: "🌋", rarity: "Epic", category: "Mastery", unlocked: false },
  { id: "mastery-4", name: "The One", desc: "Clear entire grid in one move", icon: "✦", rarity: "Legendary", category: "Mastery", unlocked: false },
  { id: "explorer-1", name: "First Voyage", desc: "Complete Polynesian zone", icon: "🗺️", rarity: "Common", category: "Explorer", unlocked: true },
  { id: "explorer-2", name: "World Traveler", desc: "Unlock 5 zones", icon: "🌍", rarity: "Rare", category: "Explorer", unlocked: false },
  { id: "explorer-3", name: "Cartographer", desc: "3-star every level in a zone", icon: "📜", rarity: "Epic", category: "Explorer", unlocked: false },
  { id: "explorer-4", name: "Eternal Wanderer", desc: "Unlock all 10 zones", icon: "🌌", rarity: "Legendary", category: "Explorer", unlocked: false },
];

export const RARITY_COLORS = {
  Common: "rgba(255,255,255,0.5)",
  Rare: "#4DA6FF",
  Epic: "#A78BFA",
  Legendary: "#FFD93D",
} as const;

export const RECENT_ACTIVITY = [
  { icon: "⭐", text: "3-starred Level 6 in Polynesian", time: "2h ago" },
  { icon: "👹", text: "Defeated Tidecaller boss", time: "5h ago" },
  { icon: "🏆", text: "New best: x7 combo streak", time: "1d ago" },
];
