const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;

// Game
export const DEFAULT_GRID_WIDTH = 8;
export const DEFAULT_GRID_HEIGHT = 10;

// Packing
export const COLOR_SIZE = 8;
export const COLOR_BIT_COUNT = 3;
export const BLOCK_SIZE = 8;
export const BLOCK_BIT_COUNT = 3;
export const ROW_SIZE = 16777216;
export const ROW_BIT_COUNT = 24;

// Tournament
export const DAILY_MODE_DURATION =
  VITE_PUBLIC_DEPLOY_TYPE === "slotdev" ? 3600 : 86400; // 1h or 1 day in seconds
export const DAILY_MODE_PRICE = 10000000000000000000; // 10 LORDS
export const NORMAL_MODE_DURATION =
  VITE_PUBLIC_DEPLOY_TYPE === "slotdev" ? 43200 : 604800; // 12 heures or 1 weeks in seconds
export const NORMAL_MODE_PRICE = 10000000000000000000; // 10 LORDS
export const FREE_MODE_DURATION = 1577880000; // 50 ans
export const FREE_MODE_PRICE = 0; // 0 LORDS

// Multiplier
// Define the multiplier constants
export const MULTIPLIER_SCALE = 1.0; // Base multiplier

// Daily Streak Multiplier
export const STREAK_1_7_MULTIPLIER_START = 1.0; // 1.00x
export const STREAK_1_7_MULTIPLIER_INCREMENT = 0.01; // +0.01x per day

export const STREAK_8_30_MULTIPLIER_START = 1.06; // 1.06x (Adjusted to match Day 7)
export const STREAK_8_30_MULTIPLIER_INCREMENT = 0.006363636; // Approximately +0.00636x per day

export const STREAK_31_PLUS_MULTIPLIER_START = 1.2; // 1.20x (Adjusted to match Day 30)
export const STREAK_31_PLUS_MULTIPLIER_INCREMENT = 0.006896552; // Approximately +0.0069x per day

export const STREAK_MULTIPLIER_CAP = 1.4; // Cap at 1.40x

// Level Multiplier
export const LEVEL_MULTIPLIER_START = 1.0; // 1.0x
export const LEVEL_MULTIPLIER_INCREMENT = 0.01; // +0.01x per level

// Account age
export const ACCOUNT_AGE_MULTIPLIER_START = 1.0; // 1.0x
export const ACCOUNT_AGE_MULTIPLIER_INCREMENT = 0.00167; // +0.00167x per day
export const ACCOUNT_AGE_MULTIPLIER_CAP = 1.2; // 1.20x cap for account age below 120 days

// Game mode
export const GAME_MODE_PAID_MULTIPLIER = 1.5; // 1.50x if paid game
export const GAME_MODE_FREE_MULTIPLIER = 1.0; // 1.10x if free game
