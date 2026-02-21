/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (195 bits used, 57 reserved):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                 │ Size │ Range    │ Description     │
 * ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
 * │ 0-7     │ current_level         │ 8    │ 0-255    │ Current level   │
 * │ 8-15    │ level_score           │ 8    │ 0-255    │ Score this level│
 * │ 16-23   │ level_moves           │ 8    │ 0-255    │ Moves this level│
 * │ 24-31   │ constraint_progress   │ 8    │ 0-255    │ Times achieved  │
 * │ 32-39   │ constraint_2_progress │ 8    │ 0-255    │ 2nd constraint  │
 * │ 40      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
 * │ 41-48   │ combo_count           │ 8    │ 0-255    │ Inventory       │
 * │ 49-56   │ score_count           │ 8    │ 0-255    │ Inventory       │
 * │ 57-64   │ harvest_count         │ 8    │ 0-255    │ Inventory       │
 * │ 65-72   │ wave_count            │ 8    │ 0-255    │ Wave inventory  │
 * │ 73-80   │ supply_count          │ 8    │ 0-255    │ Supply inventory│
 * │ 81-88   │ max_combo_run         │ 8    │ 0-255    │ Best combo      │
 * │ 89-104  │ cubes_brought         │ 16   │ 0-65535  │ Cubes for in-run│
 * │ 105-120 │ cubes_spent           │ 16   │ 0-65535  │ Cubes spent     │
 * │ 121-136 │ total_cubes           │ 16   │ 0-65535  │ Earned cubes    │
 * │ 137-152 │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 153     │ run_completed         │ 1    │ 0-1      │ Victory flag    │
 * │ 154-156 │ selected_bonus_1      │ 3    │ 0-5      │ 1st bonus type  │
 * │ 157-159 │ selected_bonus_2      │ 3    │ 0-5      │ 2nd bonus type  │
 * │ 160-162 │ selected_bonus_3      │ 3    │ 0-5      │ 3rd bonus type  │
 * │ 163-164 │ bonus_1_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 165-166 │ bonus_2_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 167-168 │ bonus_3_level         │ 2    │ 0-2      │ L1/L2/L3        │
 * │ 169-171 │ free_moves            │ 3    │ 0-7      │ Free moves left │
 * │ 172-174 │ last_shop_level       │ 3    │ 0-7      │ level / 10      │
 * │ 175     │ no_bonus_constraint   │ 1    │ 0-1      │ NoBonusUsed flag│
 * │ 176-183 │ constraint_3_progress │ 8    │ 0-255    │ 3rd constraint  │
 * │ 184-187 │ shop_purchases        │ 4    │ 0-15     │ Shop buys count │
 * │ 188-191 │ unallocated_charges   │ 4    │ 0-15     │ Unassigned buys │
 * │ 192     │ shop_level_up_bought  │ 1    │ 0-1      │ Level-up bought │
 * │ 193     │ shop_swap_bought      │ 1    │ 0-1      │ Swap bought     │
 * │ 194     │ boss_level_up_pending │ 1    │ 0-1      │ Boss level-up   │
 * │ 195-251 │ reserved              │ 57   │ -        │ Future features │
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
  
  // Bonus inventory (5 types)
  comboCount: number;
  scoreCount: number;
  harvestCount: number;
  waveCount: number;
  supplyCount: number;
  
  // Run stats
  maxComboRun: number;
  
  // Cube economy
  cubesBrought: number;
  cubesSpent: number;
  totalCubes: number;
  
  // Score
  totalScore: number;
  
  // Victory flag
  runCompleted: boolean;
  
  // Selected bonuses (values: 0=None, 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply)
  selectedBonus1: number;
  selectedBonus2: number;
  selectedBonus3: number;
  
  // Bonus levels (0=L1, 1=L2, 2=L3)
  bonus1Level: number;
  bonus2Level: number;
  bonus3Level: number;
  
  // Free moves from Wave L2/L3
  freeMoves: number;
  
  // In-game shop state
  lastShopLevel: number;

  // Constraint tracking
  noBonusConstraint: boolean;
  constraint3Progress: number;

  // Shop visit purchase state
  shopPurchases: number;
  unallocatedCharges: number;
  shopLevelUpBought: boolean;
  shopSwapBought: boolean;

  // Boss reward pending
  bossLevelUpPending: boolean;
}

// Bit positions (matching Cairo's RunDataBits exactly)
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 8;
const LEVEL_MOVES_POS = 16;
const CONSTRAINT_PROGRESS_POS = 24;
const CONSTRAINT_2_PROGRESS_POS = 32;
const BONUS_USED_POS = 40;
const COMBO_COUNT_POS = 41;
const SCORE_COUNT_POS = 49;
const HARVEST_COUNT_POS = 57;
const WAVE_COUNT_POS = 65;
const SUPPLY_COUNT_POS = 73;
const MAX_COMBO_RUN_POS = 81;
const CUBES_BROUGHT_POS = 89;
const CUBES_SPENT_POS = 105;
const TOTAL_CUBES_POS = 121;
const TOTAL_SCORE_POS = 137;
const RUN_COMPLETED_POS = 153;
const SELECTED_BONUS_1_POS = 154;
const SELECTED_BONUS_2_POS = 157;
const SELECTED_BONUS_3_POS = 160;
const BONUS_1_LEVEL_POS = 163;
const BONUS_2_LEVEL_POS = 165;
const BONUS_3_LEVEL_POS = 167;
const FREE_MOVES_POS = 169;
const LAST_SHOP_LEVEL_POS = 172;
const NO_BONUS_CONSTRAINT_POS = 175;
const CONSTRAINT_3_PROGRESS_POS = 176;
const SHOP_PURCHASES_POS = 184;
const UNALLOCATED_CHARGES_POS = 188;
const SHOP_LEVEL_UP_BOUGHT_POS = 192;
const SHOP_SWAP_BOUGHT_POS = 193;
const BOSS_LEVEL_UP_PENDING_POS = 194;

// Bit masks (after shifting to position 0)
const MASK_1BIT = BigInt(0x1);
const MASK_2BIT = BigInt(0x3);
const MASK_3BIT = BigInt(0x7);
const MASK_4BIT = BigInt(0xf);
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
    comboCount: Number((packed >> BigInt(COMBO_COUNT_POS)) & MASK_8BIT),
    scoreCount: Number((packed >> BigInt(SCORE_COUNT_POS)) & MASK_8BIT),
    harvestCount: Number((packed >> BigInt(HARVEST_COUNT_POS)) & MASK_8BIT),
    waveCount: Number((packed >> BigInt(WAVE_COUNT_POS)) & MASK_8BIT),
    supplyCount: Number((packed >> BigInt(SUPPLY_COUNT_POS)) & MASK_8BIT),
    maxComboRun: Number((packed >> BigInt(MAX_COMBO_RUN_POS)) & MASK_8BIT),
    cubesBrought: Number((packed >> BigInt(CUBES_BROUGHT_POS)) & MASK_16BIT),
    cubesSpent: Number((packed >> BigInt(CUBES_SPENT_POS)) & MASK_16BIT),
    totalCubes: Number((packed >> BigInt(TOTAL_CUBES_POS)) & MASK_16BIT),
    totalScore: Number((packed >> BigInt(TOTAL_SCORE_POS)) & MASK_16BIT),
    runCompleted: ((packed >> BigInt(RUN_COMPLETED_POS)) & MASK_1BIT) === BigInt(1),
    selectedBonus1: Number((packed >> BigInt(SELECTED_BONUS_1_POS)) & MASK_3BIT),
    selectedBonus2: Number((packed >> BigInt(SELECTED_BONUS_2_POS)) & MASK_3BIT),
    selectedBonus3: Number((packed >> BigInt(SELECTED_BONUS_3_POS)) & MASK_3BIT),
    bonus1Level: Number((packed >> BigInt(BONUS_1_LEVEL_POS)) & MASK_2BIT),
    bonus2Level: Number((packed >> BigInt(BONUS_2_LEVEL_POS)) & MASK_2BIT),
    bonus3Level: Number((packed >> BigInt(BONUS_3_LEVEL_POS)) & MASK_2BIT),
    freeMoves: Number((packed >> BigInt(FREE_MOVES_POS)) & MASK_3BIT),
    lastShopLevel: Number((packed >> BigInt(LAST_SHOP_LEVEL_POS)) & MASK_3BIT),
    noBonusConstraint: ((packed >> BigInt(NO_BONUS_CONSTRAINT_POS)) & MASK_1BIT) === BigInt(1),
    constraint3Progress: Number((packed >> BigInt(CONSTRAINT_3_PROGRESS_POS)) & MASK_8BIT),
    shopPurchases: Number((packed >> BigInt(SHOP_PURCHASES_POS)) & MASK_4BIT),
    unallocatedCharges: Number((packed >> BigInt(UNALLOCATED_CHARGES_POS)) & MASK_4BIT),
    shopLevelUpBought: ((packed >> BigInt(SHOP_LEVEL_UP_BOUGHT_POS)) & MASK_1BIT) === BigInt(1),
    shopSwapBought: ((packed >> BigInt(SHOP_SWAP_BOUGHT_POS)) & MASK_1BIT) === BigInt(1),
    bossLevelUpPending: ((packed >> BigInt(BOSS_LEVEL_UP_PENDING_POS)) & MASK_1BIT) === BigInt(1),
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
    comboCount: 0,
    scoreCount: 0,
    harvestCount: 0,
    waveCount: 0,
    supplyCount: 0,
    maxComboRun: 0,
    cubesBrought: 0,
    cubesSpent: 0,
    totalCubes: 0,
    totalScore: 0,
    runCompleted: false,
    // Default selected bonuses (Combo, Score, Harvest)
    selectedBonus1: 1,
    selectedBonus2: 2,
    selectedBonus3: 3,
    bonus1Level: 0,
    bonus2Level: 0,
    bonus3Level: 0,
    freeMoves: 0,
    lastShopLevel: 0,
    noBonusConstraint: false,
    constraint3Progress: 0,
    shopPurchases: 0,
    unallocatedCharges: 0,
    shopLevelUpBought: false,
    shopSwapBought: false,
    bossLevelUpPending: false,
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

export function isInGameShopAvailable(level: number): boolean {
  return level > 0 && level % 10 === 9;
}

export function isShopLevel(level: number): boolean {
  return level > 1 && (level - 1) % 10 === 9;
}

/**
 * Check if the current level is a boss level (10, 20, 30, 40, 50)
 * Boss levels grant a free level-up on completion
 */
export function isBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

/**
 * @deprecated V3 uses getBonusChargeCost() with scaling cost. Keeping for backward compat.
 */
export function getRefillCost(refillsBought: number): number {
  return 2 * (refillsBought + 1);
}

/**
 * Selected bonus value to name mapping
 * Contract uses: 0=None, 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
 */
export function getSelectedBonusName(value: number): string {
  switch (value) {
    case 0: return "None";
    case 1: return "Combo";
    case 2: return "Score";
    case 3: return "Harvest";
    case 4: return "Wave";
    case 5: return "Supply";
    default: return "Unknown";
  }
}

/**
 * Get the inventory count for a selected bonus
 */
export function getBonusInventoryCount(runData: RunData, selectedBonusValue: number): number {
  switch (selectedBonusValue) {
    case 1: return runData.comboCount;
    case 2: return runData.scoreCount;
    case 3: return runData.harvestCount;
    case 4: return runData.waveCount;
    case 5: return runData.supplyCount;
    default: return 0;
  }
}

export enum ConsumableType {
  BonusCharge = 0,
  LevelUp = 1,
  SwapBonus = 2,
}

export const BONUS_CHARGE_BASE_COST = 5;
export const LEVEL_UP_COST = 50;
export const SWAP_BONUS_COST = 50;
export const CONSUMABLE_COSTS = {
  BONUS: BONUS_CHARGE_BASE_COST,
  LEVEL_UP: LEVEL_UP_COST,
  SWAP_BONUS: SWAP_BONUS_COST,
} as const;

export function getBonusChargeCost(shopPurchases: number): number {
  let cost = BONUS_CHARGE_BASE_COST;
  for (let i = 0; i < shopPurchases; i++) {
    cost = Math.ceil((cost * 3) / 2);
  }
  return cost;
}
