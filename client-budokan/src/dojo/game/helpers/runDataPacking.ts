/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (88 bits used, 164 reserved):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                 │ Size │ Range    │ Description     │
 * ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
 * │ 0-6     │ current_level         │ 7    │ 1-127    │ Current level   │
 * │ 7-14    │ level_score           │ 8    │ 0-255    │ Score this level│
 * │ 15-21   │ level_moves           │ 7    │ 0-127    │ Moves this level│
 * │ 22-25   │ constraint_progress   │ 4    │ 0-15     │ Times achieved  │
 * │ 26      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
 * │ 27-35   │ total_cubes           │ 9    │ 0-511    │ Accumulated     │
 * │ 36-39   │ hammer_count          │ 4    │ 0-15     │ Inventory       │
 * │ 40-43   │ wave_count            │ 4    │ 0-15     │ Inventory       │
 * │ 44-47   │ totem_count           │ 4    │ 0-15     │ Inventory       │
 * │ 48-51   │ max_combo_run         │ 4    │ 0-15     │ Best combo      │
 * │ 52-67   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 68      │ combo_5_achieved      │ 1    │ 0-1      │ First 5x combo  │
 * │ 69      │ combo_10_achieved     │ 1    │ 0-1      │ First 10x combo │
 * │ 70-78   │ cubes_brought         │ 9    │ 0-511    │ Cubes for in-run│
 * │ 79-87   │ cubes_spent           │ 9    │ 0-511    │ Cubes spent     │
 * │ 88-251  │ reserved              │ 164  │ -        │ Future features │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface RunData {
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  bonusUsedThisLevel: boolean;
  totalCubes: number;
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  maxComboRun: number;
  totalScore: number; // Cumulative score across all levels
  // Combo achievement flags (one-time per run)
  combo5Achieved: boolean; // First time achieving 5+ lines combo
  combo10Achieved: boolean; // First time achieving 10+ lines combo
  // In-game shop: cubes brought into run (burned from wallet on start)
  cubesBrought: number; // Cubes transferred into run for spending
  cubesSpent: number; // Cubes spent during run
}

// Bit positions
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 7;
const LEVEL_MOVES_POS = 15;
const CONSTRAINT_PROGRESS_POS = 22;
const BONUS_USED_POS = 26;
const TOTAL_CUBES_POS = 27;
const HAMMER_COUNT_POS = 36;
const WAVE_COUNT_POS = 40;
const TOTEM_COUNT_POS = 44;
const MAX_COMBO_RUN_POS = 48;
const TOTAL_SCORE_POS = 52;
const COMBO_5_ACHIEVED_POS = 68;
const COMBO_10_ACHIEVED_POS = 69;
const CUBES_BROUGHT_POS = 70;
const CUBES_SPENT_POS = 79;

// Bit masks
const CURRENT_LEVEL_MASK = BigInt(0x7f); // 7 bits
const LEVEL_SCORE_MASK = BigInt(0xff); // 8 bits
const LEVEL_MOVES_MASK = BigInt(0x7f); // 7 bits
const CONSTRAINT_PROGRESS_MASK = BigInt(0xf); // 4 bits
const BONUS_USED_MASK = BigInt(0x1); // 1 bit
const TOTAL_CUBES_MASK = BigInt(0x1ff); // 9 bits
const HAMMER_COUNT_MASK = BigInt(0xf); // 4 bits
const WAVE_COUNT_MASK = BigInt(0xf); // 4 bits
const TOTEM_COUNT_MASK = BigInt(0xf); // 4 bits
const MAX_COMBO_RUN_MASK = BigInt(0xf); // 4 bits
const TOTAL_SCORE_MASK = BigInt(0xffff); // 16 bits
const COMBO_ACHIEVED_MASK = BigInt(0x1); // 1 bit
const CUBES_BROUGHT_MASK = BigInt(0x1ff); // 9 bits
const CUBES_SPENT_MASK = BigInt(0x1ff); // 9 bits

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
    totalCubes: Number((packed >> BigInt(TOTAL_CUBES_POS)) & TOTAL_CUBES_MASK),
    hammerCount: Number((packed >> BigInt(HAMMER_COUNT_POS)) & HAMMER_COUNT_MASK),
    waveCount: Number((packed >> BigInt(WAVE_COUNT_POS)) & WAVE_COUNT_MASK),
    totemCount: Number((packed >> BigInt(TOTEM_COUNT_POS)) & TOTEM_COUNT_MASK),
    maxComboRun: Number((packed >> BigInt(MAX_COMBO_RUN_POS)) & MAX_COMBO_RUN_MASK),
    totalScore: Number((packed >> BigInt(TOTAL_SCORE_POS)) & TOTAL_SCORE_MASK),
    combo5Achieved: ((packed >> BigInt(COMBO_5_ACHIEVED_POS)) & COMBO_ACHIEVED_MASK) === BigInt(1),
    combo10Achieved: ((packed >> BigInt(COMBO_10_ACHIEVED_POS)) & COMBO_ACHIEVED_MASK) === BigInt(1),
    cubesBrought: Number((packed >> BigInt(CUBES_BROUGHT_POS)) & CUBES_BROUGHT_MASK),
    cubesSpent: Number((packed >> BigInt(CUBES_SPENT_POS)) & CUBES_SPENT_MASK),
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
    totalCubes: 0,
    hammerCount: 0,
    waveCount: 0,
    totemCount: 0,
    maxComboRun: 0,
    totalScore: 0,
    combo5Achieved: false,
    combo10Achieved: false,
    cubesBrought: 0,
    cubesSpent: 0,
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
 * Check if in-game shop is available (every 5 levels after level 5)
 */
export function isInGameShopAvailable(level: number): boolean {
  return level > 0 && level % 5 === 0;
}
