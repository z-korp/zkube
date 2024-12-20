// Game
const DEFAULT_GRID_WIDTH: u8 = 8;
const DEFAULT_GRID_HEIGHT: u8 = 10;

// Packing
const BLOCK_SIZE: u8 = 8;
const BLOCK_BIT_COUNT: u8 = 3;
const ROW_SIZE: u32 = 16777216;
const ROW_BIT_COUNT: u8 = 24;
const CARDS_IN_DECK: u32 = 14;
const TWO_POW_1: u128 = 0x2;
const MASK_1: u128 = 0x1;
const MASK_7: u32 = 0x7;

// Modes
const DAILY_MODE_DURATION: u32 = 86400; // = 1 day = 24x60x60
//const DAILY_MODE_DURATION: u32 = 3600; // 1h

const NORMAL_MODE_DURATION: u32 = 604800; // 1 weeks
//const NORMAL_MODE_DURATION: u32 = 43200; // 12h

const FREE_MODE_DURATION: u32 = 1577880000; // 50 ans
const FREE_MODE_PRICE: u128 = 0;

const SECONDS_PER_DAY: u32 = 86400;

// Paid game percentages
const TOURNAMENT_PERCENTAGE: u8 = 30;
const CHEST_PERCENTAGE: u8 = 35; // -> 25
const ZKORP_PERCENTAGE: u8 = 30;
const REFERRER_PERCENTAGE: u8 = 5; // REFERER -> VeLORDs -> 15

// Computation
const PRECISION_FACTOR: u128 = 1_000_000_000;

// Multipliers
// Daily streak
const MULTIPLIER_SCALE: u32 = 1_000_000; // 1.0x represented as 1,000,000

// Daily Streak Multiplier
const STREAK_1_7_MULTIPLIER_START: u32 = 1_000_000; // 1.00x
const STREAK_1_7_MULTIPLIER_INCREMENT: u32 = 10_000; // 0.01x per day

const STREAK_8_30_MULTIPLIER_START: u32 = 1_060_000; // 1.06x
const STREAK_8_30_MULTIPLIER_INCREMENT: u32 = 6_363; // ~0.00636x per day

const STREAK_31_PLUS_MULTIPLIER: u32 = 1_200_000; // 1.20x
const STREAK_31_PLUS_MULTIPLIER_INCREMENT: u32 = 6_897; // ~0.0069x per day 

const STREAK_MULTIPLIER_CAP: u32 = 1_400_000; // 1.40x cap

// Level
const LEVEL_MULTIPLIER_START: u32 = 1_000_000; // 1.00x at Level 1
const LEVEL_MULTIPLIER_INCREMENT: u32 = 10_000; // +0.01x per level

// Account age
const ACCOUNT_AGE_MULTIPLIER_START: u32 = 1_000_000; // 1.00x at Level 1
const ACCOUNT_AGE_MULTIPLIER_INCREMENT: u32 = 1_667; // 0.00167x per day -> 1 -> 1.2 in 4 months
const ACCOUNT_AGE_MULTIPLIER_CAP: u32 = 1_200_000; // 1.20x cap for accounts older than 120 days 

// Game mode
const GAME_MODE_PAID_MULTIPLIER: u32 = 1_500_000; // 1.50x if paid game
const GAME_MODE_FREE_MULTIPLIER: u32 = 1_000_000; // 1.00x if free game
