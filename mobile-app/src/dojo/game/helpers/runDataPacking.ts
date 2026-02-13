/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (196 bits used, 56 reserved):
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
 * │ 67-74   │ shrink_count          │ 8    │ 0-255    │ Shrink inventory│
 * │ 75-82   │ shuffle_count         │ 8    │ 0-255    │ Shuffle inv     │
 * │ 83-90   │ max_combo_run         │ 8    │ 0-255    │ Best combo      │
 * │ 91-98   │ extra_moves           │ 8    │ 0-255    │ Extra move cap  │
 * │ 99-114  │ cubes_brought         │ 16   │ 0-65535  │ Cubes for in-run│
 * │ 115-130 │ cubes_spent           │ 16   │ 0-65535  │ Cubes spent     │
 * │ 131-146 │ total_cubes           │ 16   │ 0-65535  │ Earned cubes    │
 * │ 147-162 │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 163     │ run_completed         │ 1    │ 0-1      │ Victory flag    │
 * │ 164-166 │ selected_bonus_1      │ 3    │ 0-5      │ 1st bonus type  │
 * │ 167-169 │ selected_bonus_2      │ 3    │ 0-5      │ 2nd bonus type  │
 * │ 170-172 │ selected_bonus_3      │ 3    │ 0-5      │ 3rd bonus type  │
 * │ 173-174 │ bonus_1_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 175-176 │ bonus_2_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 177-178 │ bonus_3_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 179-181 │ free_moves            │ 3    │ 0-7      │ Free moves left │
 * │ 182     │ pending_level_up      │ 1    │ 0-1      │ Level-up pending│
 * │ 183-188 │ last_shop_level       │ 6    │ 0-63     │ Last shop level │
 * │ 189     │ shop_bonus_1_bought   │ 1    │ 0-1      │ Bonus 1 bought  │
 * │ 190     │ shop_bonus_2_bought   │ 1    │ 0-1      │ Bonus 2 bought  │
 * │ 191     │ shop_bonus_3_bought   │ 1    │ 0-1      │ Bonus 3 bought  │
 * │ 192-195 │ shop_refills          │ 4    │ 0-15     │ Refills bought  │
 * │ 196-251 │ reserved              │ 56   │ -        │ Future features │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface RunData {
  // Core game progress
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  constraint2Progress: number;
  bonusUsedThisLevel: boolean;
  
  // Combo achievements
  combo5Achieved: boolean;
  combo10Achieved: boolean;
  
  // Bonus inventory (5 types)
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  shrinkCount: number;
  shuffleCount: number;
  
  // Run stats
  maxComboRun: number;
  extraMoves: number;
  
  // Cube economy
  cubesBrought: number;
  cubesSpent: number;
  totalCubes: number;
  
  // Score
  totalScore: number;
  
  // Victory flag
  runCompleted: boolean;
  
  // Bonus V2.0: Selected bonuses (values: 0=None, 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle)
  selectedBonus1: number;
  selectedBonus2: number;
  selectedBonus3: number;
  
  // Bonus V2.0: Bonus levels (0=L1, 1=L2, 2=L3)
  bonus1Level: number;
  bonus2Level: number;
  bonus3Level: number;
  
  // Bonus V2.0: Free moves from Wave L2/L3
  freeMoves: number;
  
  // Bonus V2.0: Pending level-up after boss
  pendingLevelUp: boolean;
  
  // In-game shop state
  lastShopLevel: number;
  shopBonus1Bought: boolean;
  shopBonus2Bought: boolean;
  shopBonus3Bought: boolean;
  shopRefills: number;
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
const SHRINK_COUNT_POS = 67;
const SHUFFLE_COUNT_POS = 75;
const MAX_COMBO_RUN_POS = 83;
const EXTRA_MOVES_POS = 91;
const CUBES_BROUGHT_POS = 99;
const CUBES_SPENT_POS = 115;
const TOTAL_CUBES_POS = 131;
const TOTAL_SCORE_POS = 147;
const RUN_COMPLETED_POS = 163;
const SELECTED_BONUS_1_POS = 164;
const SELECTED_BONUS_2_POS = 167;
const SELECTED_BONUS_3_POS = 170;
const BONUS_1_LEVEL_POS = 173;
const BONUS_2_LEVEL_POS = 175;
const BONUS_3_LEVEL_POS = 177;
const FREE_MOVES_POS = 179;
const PENDING_LEVEL_UP_POS = 182;
const LAST_SHOP_LEVEL_POS = 183;
const SHOP_BONUS_1_BOUGHT_POS = 189;
const SHOP_BONUS_2_BOUGHT_POS = 190;
const SHOP_BONUS_3_BOUGHT_POS = 191;
const SHOP_REFILLS_POS = 192;

// Bit masks (after shifting to position 0)
const MASK_1BIT = BigInt(0x1);
const MASK_2BIT = BigInt(0x3);
const MASK_3BIT = BigInt(0x7);
const MASK_4BIT = BigInt(0xf);
const MASK_6BIT = BigInt(0x3f);
const MASK_8BIT = BigInt(0xff);
const MASK_16BIT = BigInt(0xffff);

/**
 * Unpack a run_data felt252 into a RunData object
 */
export function unpackRunData(packed: bigint): RunData {
  return {
    currentLevel: Number((packed >> BigInt(CURRENT_LEVEL_POS)) & MASK_8BIT),
    levelScore: Number((packed >> BigInt(LEVEL_SCORE_POS)) & MASK_8BIT),
    levelMoves: Number((packed >> BigInt(LEVEL_MOVES_POS)) & MASK_8BIT),
    constraintProgress: Number((packed >> BigInt(CONSTRAINT_PROGRESS_POS)) & MASK_8BIT),
    constraint2Progress: Number((packed >> BigInt(CONSTRAINT_2_PROGRESS_POS)) & MASK_8BIT),
    bonusUsedThisLevel: ((packed >> BigInt(BONUS_USED_POS)) & MASK_1BIT) === BigInt(1),
    combo5Achieved: ((packed >> BigInt(COMBO_5_ACHIEVED_POS)) & MASK_1BIT) === BigInt(1),
    combo10Achieved: ((packed >> BigInt(COMBO_10_ACHIEVED_POS)) & MASK_1BIT) === BigInt(1),
    hammerCount: Number((packed >> BigInt(HAMMER_COUNT_POS)) & MASK_8BIT),
    waveCount: Number((packed >> BigInt(WAVE_COUNT_POS)) & MASK_8BIT),
    totemCount: Number((packed >> BigInt(TOTEM_COUNT_POS)) & MASK_8BIT),
    shrinkCount: Number((packed >> BigInt(SHRINK_COUNT_POS)) & MASK_8BIT),
    shuffleCount: Number((packed >> BigInt(SHUFFLE_COUNT_POS)) & MASK_8BIT),
    maxComboRun: Number((packed >> BigInt(MAX_COMBO_RUN_POS)) & MASK_8BIT),
    extraMoves: Number((packed >> BigInt(EXTRA_MOVES_POS)) & MASK_8BIT),
    cubesBrought: Number((packed >> BigInt(CUBES_BROUGHT_POS)) & MASK_16BIT),
    cubesSpent: Number((packed >> BigInt(CUBES_SPENT_POS)) & MASK_16BIT),
    totalCubes: Number((packed >> BigInt(TOTAL_CUBES_POS)) & MASK_16BIT),
    totalScore: Number((packed >> BigInt(TOTAL_SCORE_POS)) & MASK_16BIT),
    runCompleted: ((packed >> BigInt(RUN_COMPLETED_POS)) & MASK_1BIT) === BigInt(1),
    // Bonus V2.0 fields
    selectedBonus1: Number((packed >> BigInt(SELECTED_BONUS_1_POS)) & MASK_3BIT),
    selectedBonus2: Number((packed >> BigInt(SELECTED_BONUS_2_POS)) & MASK_3BIT),
    selectedBonus3: Number((packed >> BigInt(SELECTED_BONUS_3_POS)) & MASK_3BIT),
    bonus1Level: Number((packed >> BigInt(BONUS_1_LEVEL_POS)) & MASK_2BIT),
    bonus2Level: Number((packed >> BigInt(BONUS_2_LEVEL_POS)) & MASK_2BIT),
    bonus3Level: Number((packed >> BigInt(BONUS_3_LEVEL_POS)) & MASK_2BIT),
    freeMoves: Number((packed >> BigInt(FREE_MOVES_POS)) & MASK_3BIT),
    pendingLevelUp: ((packed >> BigInt(PENDING_LEVEL_UP_POS)) & MASK_1BIT) === BigInt(1),
    // Shop state fields
    lastShopLevel: Number((packed >> BigInt(LAST_SHOP_LEVEL_POS)) & MASK_6BIT),
    shopBonus1Bought: ((packed >> BigInt(SHOP_BONUS_1_BOUGHT_POS)) & MASK_1BIT) === BigInt(1),
    shopBonus2Bought: ((packed >> BigInt(SHOP_BONUS_2_BOUGHT_POS)) & MASK_1BIT) === BigInt(1),
    shopBonus3Bought: ((packed >> BigInt(SHOP_BONUS_3_BOUGHT_POS)) & MASK_1BIT) === BigInt(1),
    shopRefills: Number((packed >> BigInt(SHOP_REFILLS_POS)) & MASK_4BIT),
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
    shrinkCount: 0,
    shuffleCount: 0,
    maxComboRun: 0,
    extraMoves: 0,
    cubesBrought: 0,
    cubesSpent: 0,
    totalCubes: 0,
    totalScore: 0,
    runCompleted: false,
    // Default selected bonuses (the 3 base unlocked ones)
    selectedBonus1: 1, // Hammer
    selectedBonus2: 3, // Wave
    selectedBonus3: 2, // Totem
    bonus1Level: 0,
    bonus2Level: 0,
    bonus3Level: 0,
    freeMoves: 0,
    pendingLevelUp: false,
    lastShopLevel: 0,
    shopBonus1Bought: false,
    shopBonus2Bought: false,
    shopBonus3Bought: false,
    shopRefills: 0,
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
 * Check if the completed level triggers the shop (levels 9, 19, 29, 39, 49 — before each boss).
 */
export function isInGameShopAvailable(level: number): boolean {
  return level > 0 && level % 10 === 9;
}

/**
 * Check if the current level is a "shop level" — the boss level right after a shop stop.
 * E.g., levels 10, 20, 30, 40, 50 (player just came from shop after levels 9, 19, 29, 39, 49).
 */
export function isShopLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

/**
 * Check if the current level is a boss level (10, 20, 30, 40, 50)
 * Boss levels grant a free level-up on completion
 */
export function isBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
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

/**
 * Get the cost of a refill based on how many refills have been bought
 * Cost formula: 2 * (refills_bought + 1)
 */
export function getRefillCost(refillsBought: number): number {
  return 2 * (refillsBought + 1);
}

/**
 * Selected bonus value to name mapping
 * Contract uses: 0=None, 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
 */
export function getSelectedBonusName(value: number): string {
  switch (value) {
    case 0: return "None";
    case 1: return "Hammer";
    case 2: return "Totem";
    case 3: return "Wave";
    case 4: return "Shrink";
    case 5: return "Shuffle";
    default: return "Unknown";
  }
}

/**
 * Get the inventory count for a selected bonus
 */
export function getBonusInventoryCount(runData: RunData, selectedBonusValue: number): number {
  switch (selectedBonusValue) {
    case 1: return runData.hammerCount;
    case 2: return runData.totemCount;
    case 3: return runData.waveCount;
    case 4: return runData.shrinkCount;
    case 5: return runData.shuffleCount;
    default: return 0;
  }
}

/**
 * Consumable types for the in-game shop
 */
export enum ConsumableType {
  Bonus1 = 0,
  Bonus2 = 1,
  Bonus3 = 2,
  Refill = 3,
  LevelUp = 4,
}

/**
 * Consumable costs
 */
export const CONSUMABLE_COSTS = {
  BONUS: 5,       // Each bonus costs 5 CUBE
  LEVEL_UP: 50,   // Level up costs 50 CUBE
  // Refill cost is dynamic: 2 * (refills + 1)
};
