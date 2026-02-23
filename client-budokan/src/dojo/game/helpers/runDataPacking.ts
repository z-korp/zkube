/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout V4 (178 bits, 5-slot skill loadout):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                 │ Size │ Range    │ Description     │
 * ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
 * │ 0-7     │ current_level         │ 8    │ 0-255    │ Current level   │
 * │ 8-15    │ level_score           │ 8    │ 0-255    │ Score this level│
 * │ 16-23   │ level_moves           │ 8    │ 0-255    │ Moves this level│
 * │ 24-31   │ constraint_progress   │ 8    │ 0-255    │ Times achieved  │
 * │ 32-39   │ constraint_2_progress │ 8    │ 0-255    │ 2nd constraint  │
 * │ 40-47   │ constraint_3_progress │ 8    │ 0-255    │ 3rd constraint  │
 * │ 48      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
 * │ 49-56   │ max_combo_run         │ 8    │ 0-255    │ Best combo      │
 * │ 57-72   │ total_cubes           │ 16   │ 0-65535  │ Earned cubes    │
 * │ 73-88   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
 * │ 89      │ run_completed         │ 1    │ 0-1      │ Victory flag    │
 * │ 90-93   │ free_moves            │ 4    │ 0-15     │ Free moves left │
 * │ 94      │ no_bonus_constraint   │ 1    │ 0-1      │ NoBonusUsed flag│
 * │ 95-97   │ active_slot_count     │ 3    │ 0-5      │ Filled slots    │
 * │ 98-101  │ slot_1_skill          │ 4    │ 0-15     │ Skill ID        │
 * │ 102-105 │ slot_1_level          │ 4    │ 0-10     │ Skill level     │
 * │ 106-109 │ slot_2_skill          │ 4    │ 0-15     │ Skill ID        │
 * │ 110-113 │ slot_2_level          │ 4    │ 0-10     │ Skill level     │
 * │ 114-117 │ slot_3_skill          │ 4    │ 0-15     │ Skill ID        │
 * │ 118-121 │ slot_3_level          │ 4    │ 0-10     │ Skill level     │
 * │ 122-125 │ slot_4_skill          │ 4    │ 0-15     │ Skill ID        │
 * │ 126-129 │ slot_4_level          │ 4    │ 0-10     │ Skill level     │
 * │ 130-133 │ slot_5_skill          │ 4    │ 0-15     │ Skill ID        │
 * │ 134-137 │ slot_5_level          │ 4    │ 0-10     │ Skill level     │
 * │ 138-145 │ slot_1_charges        │ 8    │ 0-255    │ Bonus charges   │
 * │ 146-153 │ slot_2_charges        │ 8    │ 0-255    │ Bonus charges   │
 * │ 154-161 │ slot_3_charges        │ 8    │ 0-255    │ Bonus charges   │
 * │ 162-169 │ slot_4_charges        │ 8    │ 0-255    │ Bonus charges   │
 * │ 170-177 │ slot_5_charges        │ 8    │ 0-255    │ Bonus charges   │
 * └─────────────────────────────────────────────────────────────────────┘
 */

/** A single skill slot in the run loadout */
export interface SkillSlot {
  /** Skill ID (1-15 in contract, 0=empty). 1-5 are bonuses, 6-15 are world events */
  skillId: number;
  /** Skill level in this run (0-10) */
  level: number;
  /** Charges remaining (only meaningful for bonus skills 1-5) */
  charges: number;
}

export interface RunData {
  // Core game progress
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  constraint2Progress: number;
  constraint3Progress: number;
  bonusUsedThisLevel: boolean;

  // Run stats
  maxComboRun: number;

  // Cube economy
  totalCubes: number;

  // Score
  totalScore: number;

  // Victory flag
  runCompleted: boolean;

  // Free moves
  freeMoves: number;

  // Constraint tracking
  noBonusConstraint: boolean;

  // 5-slot skill loadout
  activeSlotCount: number;
  slots: [SkillSlot, SkillSlot, SkillSlot, SkillSlot, SkillSlot];
}

// Bit positions (matching Cairo's RunDataBits exactly)
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 8;
const LEVEL_MOVES_POS = 16;
const CONSTRAINT_PROGRESS_POS = 24;
const CONSTRAINT_2_PROGRESS_POS = 32;
const CONSTRAINT_3_PROGRESS_POS = 40;
const BONUS_USED_POS = 48;
const MAX_COMBO_RUN_POS = 49;
const TOTAL_CUBES_POS = 57;
const TOTAL_SCORE_POS = 73;
const RUN_COMPLETED_POS = 89;
const FREE_MOVES_POS = 90;
const NO_BONUS_CONSTRAINT_POS = 94;
const ACTIVE_SLOT_COUNT_POS = 95;

// Slot positions: each slot has skill (4 bits) + level (4 bits) = 8 bits contiguous
const SLOT_1_SKILL_POS = 98;
const SLOT_1_LEVEL_POS = 102;
const SLOT_2_SKILL_POS = 106;
const SLOT_2_LEVEL_POS = 110;
const SLOT_3_SKILL_POS = 114;
const SLOT_3_LEVEL_POS = 118;
const SLOT_4_SKILL_POS = 122;
const SLOT_4_LEVEL_POS = 126;
const SLOT_5_SKILL_POS = 130;
const SLOT_5_LEVEL_POS = 134;

// Charges: 8 bits each
const SLOT_1_CHARGES_POS = 138;
const SLOT_2_CHARGES_POS = 146;
const SLOT_3_CHARGES_POS = 154;
const SLOT_4_CHARGES_POS = 162;
const SLOT_5_CHARGES_POS = 170;

// Bit masks (after shifting to position 0)
const MASK_1BIT = 0x1n;
const MASK_3BIT = 0x7n;
const MASK_4BIT = 0xFn;
const MASK_8BIT = 0xFFn;
const MASK_16BIT = 0xFFFFn;

function extractBits(packed: bigint, pos: number, mask: bigint): number {
  return Number((packed >> BigInt(pos)) & mask);
}

function extractBool(packed: bigint, pos: number): boolean {
  return ((packed >> BigInt(pos)) & MASK_1BIT) === 1n;
}

function unpackSlot(
  packed: bigint,
  skillPos: number,
  levelPos: number,
  chargesPos: number,
): SkillSlot {
  return {
    skillId: extractBits(packed, skillPos, MASK_4BIT),
    level: extractBits(packed, levelPos, MASK_4BIT),
    charges: extractBits(packed, chargesPos, MASK_8BIT),
  };
}

/**
 * Unpack a run_data felt252 into a RunData object
 */
export function unpackRunData(packed: bigint): RunData {
  return {
    currentLevel: extractBits(packed, CURRENT_LEVEL_POS, MASK_8BIT),
    levelScore: extractBits(packed, LEVEL_SCORE_POS, MASK_8BIT),
    levelMoves: extractBits(packed, LEVEL_MOVES_POS, MASK_8BIT),
    constraintProgress: extractBits(packed, CONSTRAINT_PROGRESS_POS, MASK_8BIT),
    constraint2Progress: extractBits(packed, CONSTRAINT_2_PROGRESS_POS, MASK_8BIT),
    constraint3Progress: extractBits(packed, CONSTRAINT_3_PROGRESS_POS, MASK_8BIT),
    bonusUsedThisLevel: extractBool(packed, BONUS_USED_POS),
    maxComboRun: extractBits(packed, MAX_COMBO_RUN_POS, MASK_8BIT),
    totalCubes: extractBits(packed, TOTAL_CUBES_POS, MASK_16BIT),
    totalScore: extractBits(packed, TOTAL_SCORE_POS, MASK_16BIT),
    runCompleted: extractBool(packed, RUN_COMPLETED_POS),
    freeMoves: extractBits(packed, FREE_MOVES_POS, MASK_4BIT),
    noBonusConstraint: extractBool(packed, NO_BONUS_CONSTRAINT_POS),
    activeSlotCount: extractBits(packed, ACTIVE_SLOT_COUNT_POS, MASK_3BIT),
    slots: [
      unpackSlot(packed, SLOT_1_SKILL_POS, SLOT_1_LEVEL_POS, SLOT_1_CHARGES_POS),
      unpackSlot(packed, SLOT_2_SKILL_POS, SLOT_2_LEVEL_POS, SLOT_2_CHARGES_POS),
      unpackSlot(packed, SLOT_3_SKILL_POS, SLOT_3_LEVEL_POS, SLOT_3_CHARGES_POS),
      unpackSlot(packed, SLOT_4_SKILL_POS, SLOT_4_LEVEL_POS, SLOT_4_CHARGES_POS),
      unpackSlot(packed, SLOT_5_SKILL_POS, SLOT_5_LEVEL_POS, SLOT_5_CHARGES_POS),
    ],
  };
}

/**
 * Create a new RunData with initial values for level 1
 */
export function createInitialRunData(): RunData {
  const emptySlot: SkillSlot = { skillId: 0, level: 0, charges: 0 };
  return {
    currentLevel: 1,
    levelScore: 0,
    levelMoves: 0,
    constraintProgress: 0,
    constraint2Progress: 0,
    constraint3Progress: 0,
    bonusUsedThisLevel: false,
    maxComboRun: 0,
    totalCubes: 0,
    totalScore: 0,
    runCompleted: false,
    freeMoves: 0,
    noBonusConstraint: false,
    activeSlotCount: 0,
    slots: [
      { ...emptySlot },
      { ...emptySlot },
      { ...emptySlot },
      { ...emptySlot },
      { ...emptySlot },
    ],
  };
}

/**
 * Check if the current level is a boss level (10, 20, 30, 40, 50)
 */
export function isBossLevel(level: number): boolean {
  return level > 0 && level % 10 === 0;
}

/**
 * Get the active skill slots (non-empty) from RunData
 */
export function getActiveSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter((slot) => slot.skillId > 0);
}

/**
 * Get bonus skill slots only (skill IDs 1-5: Combo, Score, Harvest, Wave, Supply)
 */
export function getBonusSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter(
    (slot) => slot.skillId >= 1 && slot.skillId <= 5,
  );
}

/**
 * Get world event skill slots only (skill IDs 6-15)
 */
export function getWorldEventSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter((slot) => slot.skillId >= 6);
}

/**
 * Check if a specific skill is in the run loadout
 */
export function hasSkill(runData: RunData, skillId: number): boolean {
  return runData.slots.some((slot) => slot.skillId === skillId);
}

/**
 * Get a specific skill slot by skill ID (returns undefined if not in loadout)
 */
export function getSlotBySkillId(
  runData: RunData,
  skillId: number,
): SkillSlot | undefined {
  return runData.slots.find((slot) => slot.skillId === skillId);
}

/**
 * Reroll cost formula: 5 * 3^(n-1) where n = reroll_count + 1
 * → 5, 15, 45, 135, 405, 1215
 */
export function getRerollCost(rerollCount: number): number {
  if (rerollCount === 0) return 5;
  let cost = 5;
  for (let i = 0; i < rerollCount; i++) {
    cost *= 3;
  }
  return cost;
}

/**
 * Skill tree upgrade costs per level (0→1, 1→2, ..., 8→9)
 * Total to max one skill (0→9) = 25,900 cubes
 */
export const SKILL_TREE_COSTS = [50, 100, 250, 500, 1000, 2000, 4000, 8000, 10000] as const;

/**
 * Get skill tree upgrade cost for a given current level
 */
export function getSkillUpgradeCost(currentLevel: number): number | null {
  if (currentLevel < 0 || currentLevel >= 9) return null; // 9 is max tree level
  return SKILL_TREE_COSTS[currentLevel];
}

/**
 * Get total cost to upgrade from level 0 to target level
 */
export function getTotalCostToLevel(targetLevel: number): number {
  if (targetLevel <= 0 || targetLevel > 9) return 0;
  let total = 0;
  for (let i = 0; i < targetLevel; i++) {
    total += SKILL_TREE_COSTS[i];
  }
  return total;
}

/**
 * Skill IDs mapping (1-indexed in contract, matching Cairo constants)
 * Bonuses (1-5): active abilities with charges
 * World Events (6-15): passive effects
 */
export const SKILL_IDS = {
  // Bonuses (active, have charges)
  COMBO: 1,
  SCORE: 2,
  HARVEST: 3,
  WAVE: 4,
  SUPPLY: 5,
  // World Events (passive)
  TEMPO: 6,
  FORTUNE: 7,
  SURGE: 8,
  CATALYST: 9,
  RESILIENCE: 10,
  FOCUS: 11,
  EXPANSION: 12,
  MOMENTUM: 13,
  ADRENALINE: 14,
  LEGACY: 15,
} as const;

/** Check if a skill ID corresponds to a bonus (active) skill */
export function isBonusSkill(skillId: number): boolean {
  return skillId >= 1 && skillId <= 5;
}

/** Check if a skill ID corresponds to a world event (passive) skill */
export function isWorldEventSkill(skillId: number): boolean {
  return skillId >= 6 && skillId <= 15;
}
