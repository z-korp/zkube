import type { QuestFamilyConfig, QuestFamilyId } from "./types/questFamily";

// Namespace from environment variable
export const NAMESPACE = import.meta.env.VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";

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
    name: 'Achieve Combos',
    icon: 'fa-bolt',
    questIds: ['DAILY_COMBO_ONE', 'DAILY_COMBO_TWO', 'DAILY_COMBO_THREE'],
  },
  finisher: {
    id: 'finisher',
    name: 'Daily Champion',
    icon: 'fa-trophy',
    questIds: ['DAILY_FINISHER'],
  },
};
