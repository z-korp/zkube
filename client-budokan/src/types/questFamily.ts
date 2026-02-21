/**
 * Quest Family Types
 * 
 * Quests are grouped into families with multiple tiers.
 * Progress is cumulative within a family - completing 3 games
 * completes both tier 1 (1 game) and tier 2 (3 games).
 */

export type QuestFamilyId = 'player' | 'clearer' | 'combo' | 'combo_streak' | 'finisher';

/**
 * Individual tier within a quest family
 */
export interface QuestTier {
  tier: number;           // 1, 2, or 3
  questId: string;        // e.g., 'DAILY_PLAYER_ONE'
  name: string;           // e.g., 'Warm-Up'
  description: string;    // e.g., 'Start your day with a game'
  target: number;         // Target count (1, 3, 5 for player)
  reward: number;         // CUBE reward
  completed: boolean;     // Has met target
  claimed: boolean;       // Has claimed reward
  locked: boolean;        // Locked due to conditions
  intervalId: number;     // Daily interval ID
}

/**
 * Quest family with cumulative progress across tiers
 */
export interface QuestFamily {
  id: QuestFamilyId;
  name: string;           // 'Play Games'
  icon: string;           // Font Awesome icon name
  tiers: QuestTier[];     // All tiers in order
  
  // Computed state
  currentTierIndex: number;    // Index of next incomplete tier (0-2), or -1 if all done
  totalTiers: number;          // Total number of tiers (usually 3)
  progress: number;            // Current progress count
  nextTarget: number;          // Target for next incomplete tier
  
  // Claimable state
  claimableTier: QuestTier | null;  // First completed but unclaimed tier
  
  // Totals
  totalReward: number;         // Sum of all tier rewards
  claimedReward: number;       // Sum of claimed rewards
  earnedReward: number;        // Sum of completed (earned but not necessarily claimed) rewards
}

/**
 * Family configuration used to group quests
 */
export interface QuestFamilyConfig {
  id: QuestFamilyId;
  name: string;
  icon: string;
  questIds: string[];  // Quest IDs in tier order
}
