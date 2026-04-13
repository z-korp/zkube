import { BOSS_INTERVAL } from "@/dojo/game/constants";
/**
 * Bit-packing helpers for efficient storage
 * Mirrors the Cairo packing.cairo implementation
 *
 * run_data layout (115 bits used):
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Bits    │ Field                    │ Size │ Range    │ Description  │
 * ├─────────┼──────────────────────────┼──────┼──────────┼──────────────┤
 * │ 0-7     │ current_level            │ 8    │ 0-255    │ Current level│
 * │ 8-23    │ level_score              │ 16   │ 0-65535  │ Score this   │
 * │ 24-31   │ level_moves              │ 8    │ 0-255    │ Moves this   │
 * │ 32-39   │ constraint_progress      │ 8    │ 0-255    │ Primary      │
 * │ 40-47   │ constraint_2_progress    │ 8    │ 0-255    │ Secondary    │
 * │ 48-55   │ max_combo_run            │ 8    │ 0-255    │ Best combo   │
 * │ 56-87   │ total_score              │ 32   │ 0-4B     │ Cumul. score │
 * │ 88      │ zone_cleared             │ 1    │ 0-1      │ Zone clear   │
 * │ 89-92   │ current_difficulty       │ 4    │ 0-15     │ Difficulty   │
 * │ 93-96   │ zone_id                  │ 4    │ 0-15     │ Current zone │
 * │ 97-101  │ active_mutator_id        │ 5    │ 0-31     │ Active mut.  │
 * │ 102     │ run_type                 │ 1    │ 0-1      │ Zone/Endless │
 * │ 103-104 │ bonus_type               │ 2    │ 0-3      │ Bonus type   │
 * │ 105-108 │ bonus_charges            │ 4    │ 0-15     │ Charges left │
 * │ 109-112 │ level_lines_cleared      │ 4    │ 0-15     │ Lines cleared│
 * │ 113-114 │ bonus_slot               │ 2    │ 0-2      │ Bonus slot   │
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
const LEVEL_MOVES_POS = 24;
const CONSTRAINT_PROGRESS_POS = 32;
const CONSTRAINT_2_PROGRESS_POS = 40;
const MAX_COMBO_RUN_POS = 48;
const TOTAL_SCORE_POS = 56;
const ZONE_CLEARED_POS = 88;
const CURRENT_DIFFICULTY_POS = 89;
const ZONE_ID_POS = 93;
const ACTIVE_MUTATOR_ID_POS = 97;
const RUN_TYPE_POS = 102;
const BONUS_TYPE_POS = 103;
const BONUS_CHARGES_POS = 105;
const LEVEL_LINES_CLEARED_POS = 109;
const BONUS_SLOT_POS = 113;

const MASK_1BIT = 0x1n;
const MASK_2BIT = 0x3n;
const MASK_4BIT = 0xFn;
const MASK_5BIT = 0x1Fn;
const MASK_8BIT = 0xFFn;
const MASK_16BIT = 0xFFFFn;
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
    levelScore: extractBits(packed, LEVEL_SCORE_POS, MASK_16BIT),
    levelMoves: extractBits(packed, LEVEL_MOVES_POS, MASK_8BIT),
    constraintProgress: extractBits(packed, CONSTRAINT_PROGRESS_POS, MASK_8BIT),
    constraint2Progress: extractBits(packed, CONSTRAINT_2_PROGRESS_POS, MASK_8BIT),
    maxComboRun: extractBits(packed, MAX_COMBO_RUN_POS, MASK_8BIT),
    totalScore: extractBits(packed, TOTAL_SCORE_POS, MASK_32BIT),
    zoneCleared: extractBool(packed, ZONE_CLEARED_POS),
    currentDifficulty: extractBits(packed, CURRENT_DIFFICULTY_POS, MASK_4BIT),
    zoneId: extractBits(packed, ZONE_ID_POS, MASK_4BIT),
    activeMutatorId: extractBits(packed, ACTIVE_MUTATOR_ID_POS, MASK_5BIT),
    mode: extractBits(packed, RUN_TYPE_POS, MASK_1BIT),
    bonusType: extractBits(packed, BONUS_TYPE_POS, MASK_2BIT),
    bonusCharges: extractBits(packed, BONUS_CHARGES_POS, MASK_4BIT),
    levelLinesCleared: extractBits(packed, LEVEL_LINES_CLEARED_POS, MASK_4BIT),
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
