export interface QuestTier {
  tier: number;
  questId: string;
  name: string;
  description: string;
  target: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
  locked: boolean;
  intervalId: number;
}

export interface QuestFamily {
  id: string;
  name: string;
  icon: string;
  tiers: QuestTier[];
  currentTierIndex: number;
  totalTiers: number;
  progress: number;
  nextTarget: number;
  claimableTier: QuestTier | null;
  totalReward: number;
  claimedReward: number;
  earnedReward: number;
}
