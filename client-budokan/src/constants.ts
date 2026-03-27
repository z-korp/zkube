import type { QuestFamilyConfig, QuestFamilyId } from "./types/questFamily";

// Namespace from environment variable
export const NAMESPACE = import.meta.env.VITE_PUBLIC_NAMESPACE || "zkube_jc_sepolia_v1";

/**
 * Quest Reward Overrides
 * 
 * The actual CUBE rewards for each quest (matches contract REWARD_* constants).
 * These override the display text from contract metadata until contracts are redeployed.
 */
export const QUEST_REWARDS: Record<string, number> = {
  'DAILY_PLAYER_ONE': 3,
  'DAILY_PLAYER_TWO': 5,
  'DAILY_PLAYER_THREE': 10,
  'DAILY_CLEARER_ONE': 3,
  'DAILY_CLEARER_TWO': 5,
  'DAILY_CLEARER_THREE': 10,
  'DAILY_COMBO_ONE': 3,
  'DAILY_COMBO_TWO': 5,
  'DAILY_COMBO_THREE': 10,
  'DAILY_COMBO_STREAK_ONE': 3,
  'DAILY_COMBO_STREAK_TWO': 5,
  'DAILY_COMBO_STREAK_THREE': 10,
  'DAILY_FINISHER': 20,
};

/**
 * Quest Family Configuration
 * 
 * Maps quest families to their tier quest IDs.
 * Quest IDs must be in tier order (tier 1, tier 2, tier 3).
 */
export const QUEST_FAMILIES: Record<QuestFamilyId, QuestFamilyConfig> = {
  player: {
    id: 'player',
    name: 'Play Games',
    icon: 'fa-gamepad',
    questIds: ['DAILY_PLAYER_ONE', 'DAILY_PLAYER_TWO', 'DAILY_PLAYER_THREE'],
  },
  clearer: {
    id: 'clearer',
    name: 'Clear Lines',
    icon: 'fa-bars-staggered',
    questIds: ['DAILY_CLEARER_ONE', 'DAILY_CLEARER_TWO', 'DAILY_CLEARER_THREE'],
  },
  combo: {
    id: 'combo',
    name: 'Big Combo Clears',
    icon: 'fa-bolt',
    questIds: ['DAILY_COMBO_ONE', 'DAILY_COMBO_TWO', 'DAILY_COMBO_THREE'],
  },
  combo_streak: {
    id: 'combo_streak',
    name: 'Combo Streaks',
    icon: 'fa-arrow-trend-up',
    questIds: ['DAILY_COMBO_STREAK_ONE', 'DAILY_COMBO_STREAK_TWO', 'DAILY_COMBO_STREAK_THREE'],
  },
  finisher: {
    id: 'finisher',
    name: 'Daily Champion',
    icon: 'fa-trophy',
    questIds: ['DAILY_FINISHER'],
  },
};
