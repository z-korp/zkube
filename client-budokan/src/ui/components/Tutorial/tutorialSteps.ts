/**
 * Tutorial Steps Configuration
 * 
 * This file contains all step definitions for the comprehensive tutorial.
 * The tutorial teaches players core game mechanics through 11 interactive and info steps.
 */

import { BonusType } from "@/dojo/game/types/bonus";

// Step types
export type TutorialStepType = "interactive" | "bonus" | "info";
export type InfoStepType = "bonuses" | "cubes" | "shop" | "boss";
export type TargetBlockType = "block" | "row";

export interface TutorialTarget {
  x: number;
  y: number;
  type: TargetBlockType;
}

export interface InfoItem {
  icon?: string;
  name?: string;
  desc?: string;
  cubes?: number;
  condition?: string;
  level?: string;
  reward?: string;
}

export interface TutorialStepBase {
  id: number;
  title: string;
  type: TutorialStepType;
  description: string;
  mobileDescription?: string;
}

export interface InteractiveStep extends TutorialStepBase {
  type: "interactive";
  targetBlock: TutorialTarget | null;
  successCondition: string;
  constraint?: {
    type: "ClearLines" | "NoBonusUsed";
    value: number;
    count: number;
  };
}

export interface BonusStep extends TutorialStepBase {
  type: "bonus";
  bonusType: BonusType;
  targetBlock: TutorialTarget;
}

export interface InfoStep extends TutorialStepBase {
  type: "info";
  infoType: InfoStepType;
  items: InfoItem[];
  footer: string;
  isComplete?: boolean;
}

export type TutorialStep = InteractiveStep | BonusStep | InfoStep;

// Total number of steps
export const TOTAL_TUTORIAL_STEPS = 11;

// Mock grid configurations for each step
export interface MockGridState {
  initialGrid: number[][];
  nextLine: number[];
  hammerCount: number;
  waveCount: number;
  totemCount: number;
  score: number;
  combo: number;
  maxCombo: number;
}

/**
 * Step 1: Move Blocks
 * Grid with a block that can be moved to complete a line
 */
export const STEP_1_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 2, 2, 0, 0, 0],
    [0, 1, 0, 2, 2, 0, 0, 0],
    [2, 2, 0, 0, 4, 4, 4, 4],
    [1, 0, 2, 2, 0, 0, 2, 2], // Target: move block at x:2 right
    [3, 3, 3, 1, 0, 0, 2, 2],
  ],
  nextLine: [4, 4, 4, 4, 0, 0, 0, 0],
  hammerCount: 3,
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 2: Clear Lines
 * Grid where player needs to move a block to complete a full row
 * Player slides the 2-wide block at position 0 to the right to fill the gap
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_2_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 0, 0, 2, 2, 2, 2], // Move the 2-wide block right to fill gap at positions 2-3
    [3, 3, 3, 0, 2, 2, 2, 2], // Stable bottom row - NOT full (gap at position 3)
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  hammerCount: 3,
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 3: Combos
 * Grid set up for a cascade/combo clear
 * Player moves the block to complete a row, then falling blocks complete another row
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_3_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0], // This 2-wide will fall after row 8 clears
    [2, 2, 2, 2, 0, 0, 2, 2], // Row 7: will be complete after block from row 6 falls
    [2, 2, 0, 0, 2, 2, 2, 2], // Row 8: move block to complete this first
    [3, 3, 3, 0, 2, 2, 2, 2], // Stable bottom row - NOT full (gap at position 3)
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  hammerCount: 3,
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 4: Hammer Bonus
 * Hammer destroys a single block. Target the 1-wide at position 6.
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_4_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [2, 2, 2, 2, 2, 2, 0, 0], // Row 8: gaps at end
    [2, 2, 2, 2, 2, 2, 1, 0], // Row 9: NOT full (gap at 7), hammer target at x:6
  ],
  nextLine: [2, 2, 0, 0, 0, 0, 2, 2],
  hammerCount: 3,
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 5: Wave Bonus
 * Wave clears an entire row. Target row 8.
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_5_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 2, 2, 0, 2, 2], // Wave target row - NOT full (gap at 5)
    [2, 2, 2, 2, 2, 2, 0, 0], // Row 9: NOT full (gaps at 6-7)
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  hammerCount: 2, // Reduced after step 4
  waveCount: 2,
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 6: Totem Bonus
 * Grid with multiple 3-wide blocks - Totem removes ALL blocks of same size
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_6_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 3, 3], // One 3-wide at right
    [3, 3, 3, 0, 0, 3, 3, 3], // Two 3-wide blocks with gap
    [3, 3, 3, 0, 0, 3, 3, 3], // Two 3-wide blocks with gap
    [3, 3, 3, 0, 0, 3, 3, 3], // Two 3-wide blocks with gap
    [3, 3, 3, 0, 2, 2, 0, 0], // One 3-wide, one 2-wide, gaps - NOT full
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  hammerCount: 2,
  waveCount: 1, // Reduced after step 5
  totemCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 8: Constraints
 * Grid set up to demonstrate clearing 2+ lines at once via cascade
 * Moving the block completes row 8, then the falling block completes row 7
 * IMPORTANT: No row can be initially full or it will auto-clear!
 */
export const STEP_8_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 2, 2, 0, 0, 0, 0], // Row 6: This 2-wide falls after row 7 clears
    [2, 2, 0, 0, 2, 2, 2, 2], // Row 7: Will be complete when block from row 6 falls
    [2, 2, 0, 0, 2, 2, 2, 2], // Row 8: Move the 2-wide right to complete this first
    [3, 3, 3, 0, 2, 2, 2, 2], // Stable bottom row - NOT full (gap at position 3)
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  hammerCount: 2,
  waveCount: 1,
  totemCount: 1, // Reduced after step 6
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Get the grid state for a specific step
 */
export function getGridForStep(step: number): MockGridState {
  switch (step) {
    case 1:
      return STEP_1_GRID;
    case 2:
      return STEP_2_GRID;
    case 3:
      return STEP_3_GRID;
    case 4:
      return STEP_4_GRID;
    case 5:
      return STEP_5_GRID;
    case 6:
      return STEP_6_GRID;
    case 8:
      return STEP_8_GRID;
    default:
      return STEP_1_GRID;
  }
}

/**
 * All tutorial steps configuration
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  // Step 1: Move Blocks
  {
    id: 1,
    title: "Move Blocks",
    type: "interactive",
    description: "Drag blocks left or right to position them on the grid.",
    mobileDescription: "Swipe to move blocks",
    targetBlock: { x: 2, y: 8, type: "block" },
    successCondition: "moved_block",
  },
  // Step 2: Clear Lines
  {
    id: 2,
    title: "Clear Lines",
    type: "interactive",
    description: "Slide the highlighted block right to complete the row.",
    mobileDescription: "Slide block right to fill row",
    targetBlock: { x: 0, y: 8, type: "block" }, // 2-wide block at left of row 8
    successCondition: "line_cleared",
  },
  // Step 3: Combos
  {
    id: 3,
    title: "Combos",
    type: "interactive",
    description: "Slide the block to clear a row - watch for the cascade!",
    mobileDescription: "Slide block for combo",
    targetBlock: { x: 0, y: 8, type: "block" }, // 2-wide block at left of row 8
    successCondition: "combo_achieved",
  },
  // Step 4: Hammer Bonus
  {
    id: 4,
    title: "Hammer",
    type: "bonus",
    bonusType: BonusType.Hammer,
    description: "The Hammer destroys a single block. Select it, then click a block.",
    mobileDescription: "Tap Hammer, then a block",
    targetBlock: { x: 6, y: 9, type: "block" },
  },
  // Step 5: Wave Bonus
  {
    id: 5,
    title: "Wave",
    type: "bonus",
    bonusType: BonusType.Wave,
    description: "The Wave clears an entire row instantly. Select it, then click any block in the target row.",
    mobileDescription: "Tap Wave, then a row",
    targetBlock: { x: 0, y: 8, type: "row" },
  },
  // Step 6: Totem Bonus
  {
    id: 6,
    title: "Totem",
    type: "bonus",
    bonusType: BonusType.Totem,
    description: "The Totem removes all blocks of the same size. Select it, then click any block of that size.",
    mobileDescription: "Tap Totem, then a block",
    targetBlock: { x: 0, y: 9, type: "block" },
  },
  // Step 7: Advanced Bonuses (Info)
  {
    id: 7,
    title: "Advanced Bonuses",
    type: "info",
    infoType: "bonuses",
    description: "Unlock powerful new bonuses in the permanent shop!",
    mobileDescription: "Unlock new bonuses",
    items: [
      { icon: "shrink", name: "Shrink", desc: "Reduces all blocks by 1 size. Size 1 blocks disappear!" },
      { icon: "shuffle", name: "Shuffle", desc: "Randomly rearranges all blocks on the grid." },
    ],
    footer: "Unlock these in the permanent shop with CUBE tokens!",
  },
  // Step 8: Constraints
  {
    id: 8,
    title: "Constraints",
    type: "interactive",
    description: "Slide the block to clear 2+ lines at once - that's a constraint challenge!",
    mobileDescription: "Clear 2+ lines at once",
    targetBlock: { x: 0, y: 8, type: "block" }, // 2-wide block at left of row 8
    successCondition: "constraint_satisfied",
    constraint: { type: "ClearLines", value: 2, count: 1 },
  },
  // Step 9: Earn Cubes (Info)
  {
    id: 9,
    title: "Earn Cubes",
    type: "info",
    infoType: "cubes",
    description: "Complete levels efficiently to earn more CUBE tokens!",
    mobileDescription: "Efficiency = more cubes",
    items: [
      { cubes: 3, condition: "Complete with 60%+ moves remaining" },
      { cubes: 2, condition: "Complete with 30%+ moves remaining" },
      { cubes: 1, condition: "Just complete the level" },
    ],
    footer: "Cubes can be spent in the shop for bonuses!",
  },
  // Step 10: The Shop (Info)
  {
    id: 10,
    title: "The Shop",
    type: "info",
    infoType: "shop",
    description: "Every 5 levels, a shop appears where you can spend earned cubes.",
    mobileDescription: "Shop every 5 levels",
    items: [
      { icon: "bonus", name: "Buy Bonuses", desc: "5 cubes each" },
      { icon: "levelup", name: "Level Up", desc: "50 cubes - Makes your bonus L2 or L3!" },
      { icon: "refill", name: "Refill", desc: "Buy another bonus this shop visit" },
    ],
    footer: "Higher level bonuses have stronger effects!",
  },
  // Step 11: Boss Levels & Complete (Info)
  {
    id: 11,
    title: "Boss Levels",
    type: "info",
    infoType: "boss",
    description: "Every 10 levels is a boss level with extra challenges and rewards!",
    mobileDescription: "Boss = big rewards",
    items: [
      { level: "10, 20, 30, 40, 50", desc: "Boss levels with dual constraints" },
      { reward: "Free Level-Up!", desc: "Upgrade any bonus after defeating a boss" },
    ],
    footer: "Reach level 50 to achieve victory! Good luck!",
    isComplete: true,
  },
];

/**
 * Get step by ID
 */
export function getStepById(id: number): TutorialStep | undefined {
  return TUTORIAL_STEPS.find((step) => step.id === id);
}

/**
 * Check if a step is an info-only step
 */
export function isInfoStep(step: TutorialStep): step is InfoStep {
  return step.type === "info";
}

/**
 * Check if a step is a bonus step
 */
export function isBonusStep(step: TutorialStep): step is BonusStep {
  return step.type === "bonus";
}

/**
 * Check if a step is an interactive step
 */
export function isInteractiveStep(step: TutorialStep): step is InteractiveStep {
  return step.type === "interactive";
}
