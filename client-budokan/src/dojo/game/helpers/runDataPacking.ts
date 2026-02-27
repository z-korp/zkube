import { BOSS_INTERVAL } from "@/dojo/game/constants";
/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * vNext run_data layout (134 bits used):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                    │ Size │ Range    │ Description  │
 * ├─────────┼──────────────────────────┼──────┼──────────┼──────────────┤
 * │ 0-7     │ current_level            │ 8    │ 0-255    │ Current level│
 * │ 8-15    │ level_score              │ 8    │ 0-255    │ Score this   │
 * │ 16-23   │ level_moves              │ 8    │ 0-255    │ Moves this   │
 * │ 24-31   │ constraint_progress      │ 8    │ 0-255    │ Primary      │
 * │ 32-39   │ constraint_2_progress    │ 8    │ 0-255    │ Secondary    │
 * │ 40-47   │ constraint_3_progress    │ 8    │ 0-255    │ Tertiary     │
 * │ 48      │ bonus_used_this_level    │ 1    │ 0-1      │ NoBonusUsed  │
 * │ 49-56   │ max_combo_run            │ 8    │ 0-255    │ Best combo   │
 * │ 57-72   │ total_cubes              │ 16   │ 0-65535  │ Earned cubes │
 * │ 73-88   │ total_score              │ 16   │ 0-65535  │ Cumul. score │
 * │ 89      │ run_completed            │ 1    │ 0-1      │ Victory flag │
 * │ 90-93   │ free_moves               │ 4    │ 0-15     │ Free moves   │
 * │ 94      │ no_bonus_constraint      │ 1    │ 0-1      │ NoBonusUsed  │
 * │ 95-97   │ active_slot_count        │ 3    │ 0-3      │ Filled slots │
 * │ 98-101  │ slot_1_skill             │ 4    │ 0-15     │ Skill ID     │
 * │ 102-105 │ slot_1_level             │ 4    │ 0-15     │ Skill level  │
 * │ 106-109 │ slot_2_skill             │ 4    │ 0-15     │ Skill ID     │
 * │ 110-113 │ slot_2_level             │ 4    │ 0-15     │ Skill level  │
 * │ 114-117 │ slot_3_skill             │ 4    │ 0-15     │ Skill ID     │
 * │ 118-121 │ slot_3_level             │ 4    │ 0-15     │ Skill level  │
 * │ 122-123 │ slot_1_charges           │ 2    │ 0-3      │ Charges      │
 * │ 124-125 │ slot_2_charges           │ 2    │ 0-3      │ Charges      │
 * │ 126-127 │ slot_3_charges           │ 2    │ 0-3      │ Charges      │
 * │ 128     │ level_transition_pending │ 1    │ 0-1      │ Pending flag │
 * │ 129     │ slot_1_branch            │ 1    │ 0-1      │ 0=A, 1=B    │
 * │ 130     │ slot_2_branch            │ 1    │ 0-1      │ 0=A, 1=B    │
 * │ 131     │ slot_3_branch            │ 1    │ 0-1      │ 0=A, 1=B    │
 * │ 132     │ gambit_triggered         │ 1    │ 0-1      │ Per-level    │
 * │ 133     │ combo_surge_flow_active  │ 1    │ 0-1      │ Per-level    │
 * └─────────────────────────────────────────────────────────────────────┘
 */

/** A single skill slot in the run loadout */
export interface SkillSlot {
  /** Skill ID (1-12 in contract, 0=empty). 1-4 are actives, 5-12 are passives */
  skillId: number;
  /** Skill level in this run (1-5) */
  level: number;
  /** Charges remaining (only meaningful for active skills 1-4) */
  charges: number;
  /** Branch choice: 0=A, 1=B (only matters at level >= 3) */
  branch: number;
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

  // Level transition
  levelTransitionPending: boolean;

  // Per-level flags (vNext)
  gambitTriggeredThisLevel: boolean;
  comboSurgeFlowActive: boolean;

  activeSlotCount: number;
  slots: [SkillSlot, SkillSlot, SkillSlot];
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

// Slot positions: each slot has skill (4 bits) + level (4 bits)
const SLOT_1_SKILL_POS = 98;
const SLOT_1_LEVEL_POS = 102;
const SLOT_2_SKILL_POS = 106;
const SLOT_2_LEVEL_POS = 110;
const SLOT_3_SKILL_POS = 114;
const SLOT_3_LEVEL_POS = 118;

const SLOT_1_CHARGES_POS = 122;
const SLOT_2_CHARGES_POS = 124;
const SLOT_3_CHARGES_POS = 126;
const LEVEL_TRANSITION_PENDING_POS = 128;

// vNext: branch and per-level flags
const SLOT_1_BRANCH_POS = 129;
const SLOT_2_BRANCH_POS = 130;
const SLOT_3_BRANCH_POS = 131;
const GAMBIT_TRIGGERED_POS = 132;
const COMBO_SURGE_FLOW_POS = 133;

// Bit masks (after shifting to position 0)
const MASK_1BIT = 0x1n;
const MASK_2BIT = 0x3n;
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
  branchPos: number,
): SkillSlot {
  return {
    skillId: extractBits(packed, skillPos, MASK_4BIT),
    level: extractBits(packed, levelPos, MASK_4BIT),
    charges: extractBits(packed, chargesPos, MASK_2BIT),
    branch: extractBits(packed, branchPos, MASK_1BIT),
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
    levelTransitionPending: extractBool(packed, LEVEL_TRANSITION_PENDING_POS),
    gambitTriggeredThisLevel: extractBool(packed, GAMBIT_TRIGGERED_POS),
    comboSurgeFlowActive: extractBool(packed, COMBO_SURGE_FLOW_POS),
    activeSlotCount: extractBits(packed, ACTIVE_SLOT_COUNT_POS, MASK_3BIT),
    slots: [
      unpackSlot(packed, SLOT_1_SKILL_POS, SLOT_1_LEVEL_POS, SLOT_1_CHARGES_POS, SLOT_1_BRANCH_POS),
      unpackSlot(packed, SLOT_2_SKILL_POS, SLOT_2_LEVEL_POS, SLOT_2_CHARGES_POS, SLOT_2_BRANCH_POS),
      unpackSlot(packed, SLOT_3_SKILL_POS, SLOT_3_LEVEL_POS, SLOT_3_CHARGES_POS, SLOT_3_BRANCH_POS),
    ],
  };
}

/**
 * Create a new RunData with initial values for level 1
 */
export function createInitialRunData(): RunData {
  const emptySlot: SkillSlot = { skillId: 0, level: 0, charges: 0, branch: 0 };
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
    levelTransitionPending: false,
    gambitTriggeredThisLevel: false,
    comboSurgeFlowActive: false,
    activeSlotCount: 0,
    slots: [
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
  return level > 0 && level % BOSS_INTERVAL === 0;
}

/**
 * Get the active skill slots (non-empty) from RunData
 */
export function getActiveSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter((slot) => slot.skillId > 0);
}

/**
 * Get active-type skill slots only (skill IDs 1-4: ComboSurge, Momentum, Harvest, Tsunami)
 */
export function getActiveSkillSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter(
    (slot) => slot.skillId >= 1 && slot.skillId <= 4,
  );
}

/**
 * Get passive-type skill slots only (skill IDs 5-12)
 */
export function getPassiveSkillSlots(runData: RunData): SkillSlot[] {
  return runData.slots.filter((slot) => slot.skillId >= 5 && slot.skillId <= 12);
}

/** @deprecated Use getActiveSkillSlots() */
export function getBonusSlots(runData: RunData): SkillSlot[] {
  return getActiveSkillSlots(runData);
}

/** @deprecated Use getPassiveSkillSlots() */
export function getWorldEventSlots(runData: RunData): SkillSlot[] {
  return getPassiveSkillSlots(runData);
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
 * Reroll cost formula: 5 * 3^n where n = reroll_count
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
 * Skill tree upgrade costs per level (0→1, 1→2, 2→3, 3→4, 4→5)
 * vNext: 5 levels, costs 100/500/1K/5K/10K
 * Total to max one skill = 16,600 cubes
 */
export const SKILL_TREE_COSTS = [100, 500, 1000, 5000, 10000] as const;

/**
 * Get skill tree upgrade cost for a given current level
 */
export function getSkillUpgradeCost(currentLevel: number): number | null {
  if (currentLevel < 0 || currentLevel >= 5) return null; // 5 is max tree level
  return SKILL_TREE_COSTS[currentLevel];
}

/**
 * Get total cost to upgrade from level 0 to target level
 */
export function getTotalCostToLevel(targetLevel: number): number {
  if (targetLevel <= 0 || targetLevel > 5) return 0;
  let total = 0;
  for (let i = 0; i < targetLevel; i++) {
    total += SKILL_TREE_COSTS[i];
  }
  return total;
}

/**
 * Branch respec cost: 50% of total CUBE invested in that skill.
 * Only possible at level >= 3 (branch point).
 */
export function getBranchRespecCost(currentLevel: number): number {
  if (currentLevel < 3) return 0;
  return Math.ceil(getTotalCostToLevel(currentLevel) / 2);
}

/**
 * vNext Skill IDs (1-indexed, matching Cairo constants)
 * Active skills (1-4): consume charges on use
 * Passive skills (5-12): always-on effects
 */
export const SKILL_IDS = {
  // Active skills (consume charges)
  COMBO_SURGE: 1,
  MOMENTUM_SCALING: 2,
  HARVEST: 3,
  TSUNAMI: 4,
  // Passive skills (always-on)
  RHYTHM: 5,
  CASCADE_MASTERY: 6,
  OVERDRIVE: 7,
  ENDGAME_FOCUS: 8,
  HIGH_STAKES: 9,
  GAMBIT: 10,
  STRUCTURAL_INTEGRITY: 11,
  GRID_HARMONY: 12,
} as const;

/** Check if a skill ID corresponds to an active skill (1-4) */
export function isActiveSkill(skillId: number): boolean {
  return skillId >= 1 && skillId <= 4;
}

/** Check if a skill ID corresponds to a passive skill (5-12) */
export function isPassiveSkill(skillId: number): boolean {
  return skillId >= 5 && skillId <= 12;
}

/** @deprecated Use isActiveSkill() */
export function isBonusSkill(skillId: number): boolean {
  return isActiveSkill(skillId);
}

/** @deprecated Use isPassiveSkill() */
export function isWorldEventSkill(skillId: number): boolean {
  return isPassiveSkill(skillId);
}
