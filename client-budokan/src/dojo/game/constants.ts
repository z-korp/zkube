// Game
export const DEFAULT_GRID_WIDTH = 8;
export const DEFAULT_GRID_HEIGHT = 10;

// Packing
export const COLOR_SIZE = 8;
export const COLOR_BIT_COUNT = 3;
export const BLOCK_SIZE = 8;
export const BLOCK_BIT_COUNT = 3;
export const ROW_SIZE = 16777216;
export const ROW_BIT_COUNT = 24;

// Skill system (vNext: mirrors contracts/src/helpers/packing.cairo)
export const MAX_LOADOUT_SLOTS = 3;
export const TOTAL_SKILLS = 12;
export const MAX_SKILL_LEVEL = 5;
export const BRANCH_POINT_LEVEL = 3;
export const BRANCH_SPLIT_LEVEL = BRANCH_POINT_LEVEL;

// Level system (mirrors contracts/src/helpers/level.cairo)
export const LEVEL_CAP = 50;
export const BOSS_INTERVAL = 10;
export const BOSS_LEVELS = [10, 20, 30, 40, 50] as const;
export const PRE_BOSS_LEVELS = [9, 19, 29, 39, 49] as const;

// Charge system (vNext)
export const CHARGE_CADENCE_BASE = 5;
export const MAX_CHARGES_PER_SLOT = 3;
