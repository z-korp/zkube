import { BOSS_INTERVAL } from "@/dojo/game/constants";
/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * Zone-based run_data layout (101 bits used):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                    │ Size │ Range    │ Description  │
 * ├─────────┼──────────────────────────┼──────┼──────────┼──────────────┤
 * │ 0-7     │ current_level            │ 8    │ 0-255    │ Current level│
 * │ 8-15    │ level_score              │ 8    │ 0-255    │ Score this   │
 * │ 16-23   │ level_moves              │ 8    │ 0-255    │ Moves this   │
 * │ 24-31   │ constraint_progress      │ 8    │ 0-255    │ Primary      │
 * │ 32-39   │ constraint_2_progress    │ 8    │ 0-255    │ Secondary    │
 * │ 40-47   │ max_combo_run            │ 8    │ 0-255    │ Best combo   │
 * │ 48-79   │ total_score              │ 32   │ 0-4B     │ Cumul. score │
 * │ 80      │ zone_cleared             │ 1    │ 0-1      │ Zone clear   │
 * │ 81-88   │ endless_depth            │ 8    │ 0-255    │ Endless depth│
 * │ 89-92   │ zone_id                  │ 4    │ 0-15     │ Current zone │
 * │ 93-100  │ mutator_mask             │ 8    │ 0-255    │ Active muts  │
 * └─────────────────────────────────────────────────────────────────────┘
 */

export interface RunData {
  currentLevel: number;
  levelScore: number;
  levelMoves: number;
  constraintProgress: number;
  constraint2Progress: number;
  maxComboRun: number;
  totalScore: number;
  zoneCleared: boolean;
  currentDifficulty: number;
  zoneId: number;
  activeMutatorId: number;
  mode: number;
  bonusType: number;
  bonusCharges: number;
  levelLinesCleared: number;
  bonusSlot: number;
}

// Bit positions (matching Cairo's RunDataBits exactly)
const CURRENT_LEVEL_POS = 0;
const LEVEL_SCORE_POS = 8;
const LEVEL_MOVES_POS = 16;
const CONSTRAINT_PROGRESS_POS = 24;
const CONSTRAINT_2_PROGRESS_POS = 32;
const MAX_COMBO_RUN_POS = 40;
const TOTAL_SCORE_POS = 48;
const ZONE_CLEARED_POS = 80;
const ENDLESS_DEPTH_POS = 81;
const ZONE_ID_POS = 89;
const ACTIVE_MUTATOR_ID_POS = 93;
const MODE_POS = 101;
const BONUS_TYPE_POS = 102;
const BONUS_CHARGES_POS = 104;
const LEVEL_LINES_CLEARED_POS = 108;
const BONUS_SLOT_POS = 116;

const MASK_1BIT = 0x1n;
const MASK_2BIT = 0x3n;
const MASK_4BIT = 0xFn;
const MASK_8BIT = 0xFFn;
const MASK_32BIT = 0xFFFFFFFFn;

function extractBits(packed: bigint, pos: number, mask: bigint): number {
  return Number((packed >> BigInt(pos)) & mask);
}

function extractBool(packed: bigint, pos: number): boolean {
  return ((packed >> BigInt(pos)) & MASK_1BIT) === 1n;
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
    maxComboRun: extractBits(packed, MAX_COMBO_RUN_POS, MASK_8BIT),
    totalScore: extractBits(packed, TOTAL_SCORE_POS, MASK_32BIT),
    zoneCleared: extractBool(packed, ZONE_CLEARED_POS),
    currentDifficulty: extractBits(packed, ENDLESS_DEPTH_POS, MASK_8BIT),
    zoneId: extractBits(packed, ZONE_ID_POS, MASK_4BIT),
    activeMutatorId: extractBits(packed, ACTIVE_MUTATOR_ID_POS, MASK_8BIT),
    mode: extractBits(packed, MODE_POS, MASK_1BIT),
    bonusType: extractBits(packed, BONUS_TYPE_POS, MASK_2BIT),
    bonusCharges: extractBits(packed, BONUS_CHARGES_POS, MASK_4BIT),
    levelLinesCleared: extractBits(packed, LEVEL_LINES_CLEARED_POS, MASK_8BIT),
    bonusSlot: extractBits(packed, BONUS_SLOT_POS, MASK_2BIT),
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
    maxComboRun: 0,
    totalScore: 0,
    zoneCleared: false,
    currentDifficulty: 0,
    zoneId: 0,
    activeMutatorId: 0,
    mode: 0,
    bonusType: 0,
    bonusCharges: 0,
    levelLinesCleared: 0,
    bonusSlot: 0,
  };
}

/**
 * Check if the current level is a boss level (10, 20, 30, 40, 50)
 */
export function isBossLevel(level: number): boolean {
  return level > 0 && level % BOSS_INTERVAL === 0;
}
