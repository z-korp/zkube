/**
 * Display-side reward tier definitions for daily and weekly settlements.
 *
 * These values match the contract defaults in:
 * - daily_challenge.cairo::read_daily_tiers()   → (10, 7, 5, 3, 1)
 * - weekly_endless.cairo::read_weekly_tiers()    → (30, 20, 15, 10, 3)
 *
 * Percentile bands are hardcoded on-chain; only magnitudes are admin-tunable
 * via config_system::set_reward_tiers(). If an admin changes them, update
 * these constants to match.
 */

export interface RewardTier {
  pct: number;
  label: string;
  reward: number;
}

export const DAILY_REWARD_TIERS: RewardTier[] = [
  { pct: 2, label: "Top 1%", reward: 10 },
  { pct: 5, label: "Top 5%", reward: 7 },
  { pct: 10, label: "Top 10%", reward: 5 },
  { pct: 25, label: "Top 25%", reward: 3 },
  { pct: 50, label: "Top 50%", reward: 1 },
];

export const WEEKLY_REWARD_TIERS: RewardTier[] = [
  { pct: 2, label: "Top 1%", reward: 30 },
  { pct: 5, label: "Top 5%", reward: 20 },
  { pct: 10, label: "Top 10%", reward: 15 },
  { pct: 25, label: "Top 25%", reward: 10 },
  { pct: 50, label: "Top 50%", reward: 3 },
];

export function computeDailyReward(rank: number, total: number): number {
  if (total === 0) return 0;
  const pct = ((rank - 1) * 100) / total;
  for (const tier of DAILY_REWARD_TIERS) {
    if (pct < tier.pct) return tier.reward;
  }
  return 0;
}

export function computeWeeklyReward(rank: number, total: number): number {
  if (total === 0) return 0;
  const pct = ((rank - 1) * 100) / total;
  for (const tier of WEEKLY_REWARD_TIERS) {
    if (pct < tier.pct) return tier.reward;
  }
  return 0;
}
