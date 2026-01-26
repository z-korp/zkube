/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (68 bits used, 184 reserved):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                 │ Size │ Range    │ Description     │
 * ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
 * │ 0-6     │ current_level         │ 7    │ 1-127    │ Current level   │
 * │ 7-14    │ level_score           │ 8    │ 0-255    │ Score this level│
 * │ 15-21   │ level_moves           │ 7    │ 0-127    │ Moves this level│
 * │ 22-25   │ constraint_progress   │ 4    │ 0-15     │ Times achieved  │
 * │ 26      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
 * │ 27-35   │ total_stars           │ 9    │ 0-511    │ Accumulated     │
 * │ 36-39   │ hammer_count          │ 4    │ 0-15     │ Inventory       │
 * │ 40-43   │ wave_count            │ 4    │ 0-15     │ Inventory       │
 * │ 44-47   │ totem_count           │ 4    │ 0-15     │ Inventory       │
 * │ 48-51   │ max_combo_run         │ 4    │ 0-15     │ Best combo      │
 * │ 52-67   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 68-251  │ reserved              │ 184  │ -        │ Future features │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface RunData {
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  totalStars: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  maxComboRun: number;
  totalScore: number; // Cumulative score across all levels
}

// Bit positions
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 7;
const LEVEL_MOVES_POS = 15;
const CONSTRAINT_PROGRESS_POS = 22;
const BONUS_USED_POS = 26;
const TOTAL_STARS_POS = 27;
const HAMMER_COUNT_POS = 36;
const WAVE_COUNT_POS = 40;
const TOTEM_COUNT_POS = 44;
const MAX_COMBO_RUN_POS = 48;
const TOTAL_SCORE_POS = 52;

// Bit masks
const CURRENT_LEVEL_MASK = BigInt(0x7f); // 7 bits
const LEVEL_SCORE_MASK = BigInt(0xff); // 8 bits
const LEVEL_MOVES_MASK = BigInt(0x7f); // 7 bits
const CONSTRAINT_PROGRESS_MASK = BigInt(0xf); // 4 bits
const BONUS_USED_MASK = BigInt(0x1); // 1 bit
const TOTAL_STARS_MASK = BigInt(0x1ff); // 9 bits
const HAMMER_COUNT_MASK = BigInt(0xf); // 4 bits
const WAVE_COUNT_MASK = BigInt(0xf); // 4 bits
const TOTEM_COUNT_MASK = BigInt(0xf); // 4 bits
const MAX_COMBO_RUN_MASK = BigInt(0xf); // 4 bits
const TOTAL_SCORE_MASK = BigInt(0xffff); // 16 bits

/**
 * Unpack a run_data felt252 into a RunData object
 */
export function unpackRunData(packed: bigint): RunData {
  return {
    currentLevel: Number((packed >> BigInt(CURRENT_LEVEL_POS)) & CURRENT_LEVEL_MASK),
    levelScore: Number((packed >> BigInt(LEVEL_SCORE_POS)) & LEVEL_SCORE_MASK),
    levelMoves: Number((packed >> BigInt(LEVEL_MOVES_POS)) & LEVEL_MOVES_MASK),
    constraintProgress: Number((packed >> BigInt(CONSTRAINT_PROGRESS_POS)) & CONSTRAINT_PROGRESS_MASK),
    bonusUsedThisLevel: ((packed >> BigInt(BONUS_USED_POS)) & BONUS_USED_MASK) === BigInt(1),
    totalStars: Number((packed >> BigInt(TOTAL_STARS_POS)) & TOTAL_STARS_MASK),
    hammerCount: Number((packed >> BigInt(HAMMER_COUNT_POS)) & HAMMER_COUNT_MASK),
    waveCount: Number((packed >> BigInt(WAVE_COUNT_POS)) & WAVE_COUNT_MASK),
    totemCount: Number((packed >> BigInt(TOTEM_COUNT_POS)) & TOTEM_COUNT_MASK),
    maxComboRun: Number((packed >> BigInt(MAX_COMBO_RUN_POS)) & MAX_COMBO_RUN_MASK),
    totalScore: Number((packed >> BigInt(TOTAL_SCORE_POS)) & TOTAL_SCORE_MASK),
  };
}

/**
 * Create a new RunData with initial values for level 1
 */
export function createInitialRunData(): RunData {
  return {
    currentLevel: 1,
    levelScore: 0,
    levelMoves: 0,
    constraintProgress: 0,
    bonusUsedThisLevel: false,
    totalStars: 0,
    hammerCount: 0,
    waveCount: 0,
    totemCount: 0,
    maxComboRun: 0,
    totalScore: 0,
  };
}
