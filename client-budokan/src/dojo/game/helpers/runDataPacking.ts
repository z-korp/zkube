/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (148 bits used, 104 reserved):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                 │ Size │ Range    │ Description     │
 * ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
 * │ 0-7     │ current_level         │ 8    │ 0-255    │ Current level   │
 * │ 8-15    │ level_score           │ 8    │ 0-255    │ Score this level│
 * │ 16-23   │ level_moves           │ 8    │ 0-255    │ Moves this level│
 * │ 24-31   │ constraint_progress   │ 8    │ 0-255    │ Times achieved  │
 * │ 32-39   │ constraint_2_progress │ 8    │ 0-255    │ 2nd constraint  │
 * │ 40      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
 * │ 41      │ combo_5_achieved      │ 1    │ 0-1      │ First 5x combo  │
 * │ 42      │ combo_10_achieved     │ 1    │ 0-1      │ First 10x combo │
 * │ 43-50   │ hammer_count          │ 8    │ 0-255    │ Inventory       │
 * │ 51-58   │ wave_count            │ 8    │ 0-255    │ Inventory       │
 * │ 59-66   │ totem_count           │ 8    │ 0-255    │ Inventory       │
 * │ 67-74   │ max_combo_run         │ 8    │ 0-255    │ Best combo      │
 * │ 75-82   │ extra_moves           │ 8    │ 0-255    │ Extra move cap  │
 * │ 83-98   │ cubes_brought         │ 16   │ 0-65535  │ Cubes for in-run│
 * │ 99-114  │ cubes_spent           │ 16   │ 0-65535  │ Cubes spent     │
 * │ 115-130 │ total_cubes           │ 16   │ 0-65535  │ Earned cubes    │
 * │ 131-146 │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 147     │ run_completed         │ 1    │ 0-1      │ Victory flag    │
 * │ 148-251 │ reserved              │ 104  │ -        │ Future features │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface RunData {
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  combo5Achieved: boolean;
  combo10Achieved: boolean;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  maxComboRun: number;
  extraMoves: number;
  cubesBrought: number;
  cubesSpent: number;
  totalCubes: number;
  totalScore: number;
  runCompleted: boolean; // Victory flag - true when level 50 is completed
}

// Bit positions (matching Cairo's RunDataBits)
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 8;
const LEVEL_MOVES_POS = 16;
const CONSTRAINT_PROGRESS_POS = 24;
const CONSTRAINT_2_PROGRESS_POS = 32;
const BONUS_USED_POS = 40;
const COMBO_5_ACHIEVED_POS = 41;
const COMBO_10_ACHIEVED_POS = 42;
const HAMMER_COUNT_POS = 43;
const WAVE_COUNT_POS = 51;
const TOTEM_COUNT_POS = 59;
const MAX_COMBO_RUN_POS = 67;
const EXTRA_MOVES_POS = 75;
const CUBES_BROUGHT_POS = 83;
const CUBES_SPENT_POS = 99;
const TOTAL_CUBES_POS = 115;
const TOTAL_SCORE_POS = 131;
const RUN_COMPLETED_POS = 147;

// Bit masks (after shifting to position 0)
const MASK_8BIT = BigInt(0xff);
const MASK_16BIT = BigInt(0xffff);
const MASK_1BIT = BigInt(0x1);

/**
 * Unpack a run_data felt252 into a RunData object
 */
export function unpackRunData(packed: bigint): RunData {
  return {
    currentLevel: Number((packed >> BigInt(CURRENT_LEVEL_POS)) & MASK_8BIT),
    levelScore: Number((packed >> BigInt(LEVEL_SCORE_POS)) & MASK_8BIT),
    levelMoves: Number((packed >> BigInt(LEVEL_MOVES_POS)) & MASK_8BIT),
    constraintProgress: Number(
      (packed >> BigInt(CONSTRAINT_PROGRESS_POS)) & MASK_8BIT
    ),
    constraint2Progress: Number(
      (packed >> BigInt(CONSTRAINT_2_PROGRESS_POS)) & MASK_8BIT
    ),
    bonusUsedThisLevel:
      ((packed >> BigInt(BONUS_USED_POS)) & MASK_1BIT) === BigInt(1),
    combo5Achieved:
      ((packed >> BigInt(COMBO_5_ACHIEVED_POS)) & MASK_1BIT) === BigInt(1),
    combo10Achieved:
      ((packed >> BigInt(COMBO_10_ACHIEVED_POS)) & MASK_1BIT) === BigInt(1),
    hammerCount: Number((packed >> BigInt(HAMMER_COUNT_POS)) & MASK_8BIT),
    waveCount: Number((packed >> BigInt(WAVE_COUNT_POS)) & MASK_8BIT),
    totemCount: Number((packed >> BigInt(TOTEM_COUNT_POS)) & MASK_8BIT),
    maxComboRun: Number((packed >> BigInt(MAX_COMBO_RUN_POS)) & MASK_8BIT),
    extraMoves: Number((packed >> BigInt(EXTRA_MOVES_POS)) & MASK_8BIT),
    cubesBrought: Number((packed >> BigInt(CUBES_BROUGHT_POS)) & MASK_16BIT),
    cubesSpent: Number((packed >> BigInt(CUBES_SPENT_POS)) & MASK_16BIT),
    totalCubes: Number((packed >> BigInt(TOTAL_CUBES_POS)) & MASK_16BIT),
    totalScore: Number((packed >> BigInt(TOTAL_SCORE_POS)) & MASK_16BIT),
    runCompleted:
      ((packed >> BigInt(RUN_COMPLETED_POS)) & MASK_1BIT) === BigInt(1),
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
    constraint2Progress: 0,
    bonusUsedThisLevel: false,
    combo5Achieved: false,
    combo10Achieved: false,
    hammerCount: 0,
    waveCount: 0,
    totemCount: 0,
    maxComboRun: 0,
    extraMoves: 0,
    cubesBrought: 0,
    cubesSpent: 0,
    totalCubes: 0,
    totalScore: 0,
    runCompleted: false,
  };
}

/**
 * Get the number of cubes available to spend in the in-game shop
 * Available = brought + earned - spent
 */
export function getCubesAvailable(runData: RunData): number {
  const totalBudget = runData.cubesBrought + runData.totalCubes;
  return Math.max(0, totalBudget - runData.cubesSpent);
}

/**
 * Check if the completed level triggers the shop (levels 5, 10, 15...)
 */
export function isInGameShopAvailable(level: number): boolean {
  return level > 0 && level % 5 === 0;
}

/**
 * Check if the current level is a "shop level" - the level right after a shop milestone.
 * E.g., levels 6, 11, 16, 21... (player just came from level 5, 10, 15, 20...)
 * The shop button should be visible during these levels.
 */
export function isShopLevel(level: number): boolean {
  return level > 1 && (level - 1) % 5 === 0;
}

/**
 * Get the effective max moves for a level (base max + extra moves from consumables)
 */
export function getEffectiveMaxMoves(
  baseMaxMoves: number,
  extraMoves: number
): number {
  return baseMaxMoves + extraMoves;
}
