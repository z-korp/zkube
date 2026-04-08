const feltFromShortString = (value: string): bigint => {
  let result = 0n;
  for (let i = 0; i < value.length; i++) {
    result = (result << 8n) | BigInt(value.charCodeAt(i));
  }
  return result;
};

export type AchievementCategory =
  | "Grinder"
  | "Sweeper"
  | "Combo Master"
  | "Boss Slayer"
  | "Explorer"
  | "Challenger";

export interface AchievementDef {
  id: bigint;
  shortId: string;
  name: string;
  description: string;
  target: number;
  xp: number;
  category: AchievementCategory;
  tier: 1 | 2 | 3 | 4;
  icon: string;
  taskId: bigint;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: feltFromShortString("GRINDER_I"), shortId: "GRINDER_I", name: "Grinder I", description: "Start 10 game runs", target: 10, xp: 500, category: "Grinder", tier: 1, icon: "🎮", taskId: feltFromShortString("GAME_START") },
  { id: feltFromShortString("GRINDER_II"), shortId: "GRINDER_II", name: "Grinder II", description: "Start 50 game runs", target: 50, xp: 1500, category: "Grinder", tier: 2, icon: "🎯", taskId: feltFromShortString("GAME_START") },
  { id: feltFromShortString("GRINDER_III"), shortId: "GRINDER_III", name: "Grinder III", description: "Start 200 game runs", target: 200, xp: 3000, category: "Grinder", tier: 3, icon: "⚙️", taskId: feltFromShortString("GAME_START") },
  { id: feltFromShortString("GRINDER_IV"), shortId: "GRINDER_IV", name: "Grinder IV", description: "Start 1000 game runs", target: 1000, xp: 5000, category: "Grinder", tier: 4, icon: "🧠", taskId: feltFromShortString("GAME_START") },

  { id: feltFromShortString("SWEEPER_I"), shortId: "SWEEPER_I", name: "Sweeper I", description: "Clear 100 lines", target: 100, xp: 500, category: "Sweeper", tier: 1, icon: "🧹", taskId: feltFromShortString("LINE_CLEAR") },
  { id: feltFromShortString("SWEEPER_II"), shortId: "SWEEPER_II", name: "Sweeper II", description: "Clear 500 lines", target: 500, xp: 1500, category: "Sweeper", tier: 2, icon: "📏", taskId: feltFromShortString("LINE_CLEAR") },
  { id: feltFromShortString("SWEEPER_III"), shortId: "SWEEPER_III", name: "Sweeper III", description: "Clear 2000 lines", target: 2000, xp: 3000, category: "Sweeper", tier: 3, icon: "🧱", taskId: feltFromShortString("LINE_CLEAR") },
  { id: feltFromShortString("SWEEPER_IV"), shortId: "SWEEPER_IV", name: "Sweeper IV", description: "Clear 10000 lines", target: 10000, xp: 5000, category: "Sweeper", tier: 4, icon: "🌪️", taskId: feltFromShortString("LINE_CLEAR") },

  { id: feltFromShortString("COMBO_MASTER_I"), shortId: "COMBO_MASTER_I", name: "Combo Master I", description: "Hit a 3+ combo", target: 1, xp: 500, category: "Combo Master", tier: 1, icon: "🔥", taskId: feltFromShortString("COMBO_3") },
  { id: feltFromShortString("COMBO_MASTER_II"), shortId: "COMBO_MASTER_II", name: "Combo Master II", description: "Hit a 4+ combo", target: 1, xp: 1500, category: "Combo Master", tier: 2, icon: "⚡", taskId: feltFromShortString("COMBO_4") },
  { id: feltFromShortString("COMBO_MASTER_III"), shortId: "COMBO_MASTER_III", name: "Combo Master III", description: "Hit a 10+ combo streak", target: 1, xp: 3000, category: "Combo Master", tier: 3, icon: "💥", taskId: feltFromShortString("HIGH_COMBO") },
  { id: feltFromShortString("COMBO_MASTER_IV"), shortId: "COMBO_MASTER_IV", name: "Combo Master IV", description: "Hit 10 combo streaks of 10+", target: 10, xp: 5000, category: "Combo Master", tier: 4, icon: "🌋", taskId: feltFromShortString("HIGH_COMBO") },

  { id: feltFromShortString("BOSS_SLAYER_I"), shortId: "BOSS_SLAYER_I", name: "Boss Slayer I", description: "Defeat 1 boss", target: 1, xp: 500, category: "Boss Slayer", tier: 1, icon: "⚔️", taskId: feltFromShortString("BOSS_DEFEAT") },
  { id: feltFromShortString("BOSS_SLAYER_II"), shortId: "BOSS_SLAYER_II", name: "Boss Slayer II", description: "Defeat 5 bosses", target: 5, xp: 1500, category: "Boss Slayer", tier: 2, icon: "🛡️", taskId: feltFromShortString("BOSS_DEFEAT") },
  { id: feltFromShortString("BOSS_SLAYER_III"), shortId: "BOSS_SLAYER_III", name: "Boss Slayer III", description: "Defeat 15 bosses", target: 15, xp: 3000, category: "Boss Slayer", tier: 3, icon: "👹", taskId: feltFromShortString("BOSS_DEFEAT") },
  { id: feltFromShortString("BOSS_SLAYER_IV"), shortId: "BOSS_SLAYER_IV", name: "Boss Slayer IV", description: "Defeat 50 bosses", target: 50, xp: 5000, category: "Boss Slayer", tier: 4, icon: "👑", taskId: feltFromShortString("BOSS_DEFEAT") },

  { id: feltFromShortString("EXPLORER_I"), shortId: "EXPLORER_I", name: "Explorer I", description: "Complete 1 zone", target: 1, xp: 1000, category: "Explorer", tier: 1, icon: "🗺️", taskId: feltFromShortString("ZONE_COMPLETE") },
  { id: feltFromShortString("EXPLORER_II"), shortId: "EXPLORER_II", name: "Explorer II", description: "Complete 3 zones", target: 3, xp: 2000, category: "Explorer", tier: 2, icon: "🌍", taskId: feltFromShortString("ZONE_COMPLETE") },
  { id: feltFromShortString("EXPLORER_III"), shortId: "EXPLORER_III", name: "Explorer III", description: "Get 30 perfect levels", target: 30, xp: 4000, category: "Explorer", tier: 3, icon: "✨", taskId: feltFromShortString("PERFECT_LEVEL") },
  { id: feltFromShortString("EXPLORER_IV"), shortId: "EXPLORER_IV", name: "Explorer IV", description: "Complete 10 zones", target: 10, xp: 10000, category: "Explorer", tier: 4, icon: "🌌", taskId: feltFromShortString("ZONE_COMPLETE") },

  { id: feltFromShortString("CHALLENGER_I"), shortId: "CHALLENGER_I", name: "Challenger I", description: "Play 1 daily challenge", target: 1, xp: 500, category: "Challenger", tier: 1, icon: "📅", taskId: feltFromShortString("DAILY_PLAY") },
  { id: feltFromShortString("CHALLENGER_II"), shortId: "CHALLENGER_II", name: "Challenger II", description: "Play 10 daily challenges", target: 10, xp: 1500, category: "Challenger", tier: 2, icon: "🗓️", taskId: feltFromShortString("DAILY_PLAY") },
  { id: feltFromShortString("CHALLENGER_III"), shortId: "CHALLENGER_III", name: "Challenger III", description: "Play 50 daily challenges", target: 50, xp: 3000, category: "Challenger", tier: 3, icon: "🏅", taskId: feltFromShortString("DAILY_PLAY") },
  { id: feltFromShortString("CHALLENGER_IV"), shortId: "CHALLENGER_IV", name: "Challenger IV", description: "Play 200 daily challenges", target: 200, xp: 5000, category: "Challenger", tier: 4, icon: "🏆", taskId: feltFromShortString("DAILY_PLAY") },
];
