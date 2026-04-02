/**
 * Tutorial Steps Configuration
 * 
 * This file contains all step definitions for the comprehensive tutorial.
 * The tutorial teaches players core game mechanics through 11 interactive and info steps.
 */

import { BonusType } from "@/dojo/game/types/bonusTypes";

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
    type: "ComboLines" | "NoBonusUsed";
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
  comboCount: number;
  harvestCount: number;
  scoreCount: number;
  score: number;
  combo: number;
  maxCombo: number;
  constraintSatisfied?: boolean;
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
  comboCount: 3,
  harvestCount: 2,
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 2: Clear Lines
 * Player slides the 2-wide block RIGHT, it falls into the gap below, completing the row.
 * IMPORTANT: Block must FALL into position to complete the row!
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
    [0, 0, 0, 0, 2, 2, 0, 0], // 2-wide at 4-5, slide RIGHT to 6-7, then falls
    [2, 2, 2, 2, 2, 2, 0, 0], // 6 filled, gap at 6-7 where block will fall
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 3,
  harvestCount: 2,
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 3: Combos (Cascade)
 * Player slides block, it falls to complete row 9, row 9 clears,
 * then another block falls to complete the new row 9 = 2 lines = combo!
 */
export const STEP_3_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2], // 2-wide that falls after row 7 clears (cascade)
    [2, 2, 2, 2, 2, 2, 0, 0], // Will become row 8, completed by falling block
    [0, 0, 0, 0, 2, 2, 0, 0], // 2-wide to slide RIGHT, falls to complete row 9
    [2, 2, 2, 2, 2, 2, 0, 0], // 6 filled, gap at 6-7
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 3,
  harvestCount: 2,
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 4: Combo Bonus
 * Combo targets a single block to apply the bonus. Target the 1-wide at position 6.
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
    [2, 2, 2, 2, 2, 2, 1, 0], // Row 9: NOT full (gap at 7), combo target at x:6
  ],
  nextLine: [2, 2, 0, 0, 0, 0, 2, 2],
  comboCount: 3,
  harvestCount: 2,
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 5: Harvest Bonus
 * Harvest removes all blocks of the chosen size.
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
  comboCount: 2, // Reduced after step 4
  harvestCount: 2,
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 6: Score Bonus
 * Score grants instant bonus score.
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
  comboCount: 2,
  harvestCount: 1, // Reduced after step 5
  scoreCount: 2,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

/**
 * Step 8: Constraints (Clear 2+ lines in one move)
 * Same cascade mechanic as Step 3 - demonstrates constraint satisfaction
 */
export const STEP_8_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2], // 2-wide that falls for cascade (2nd line)
    [2, 2, 2, 2, 2, 2, 0, 0], // Becomes complete after cascade
    [0, 0, 0, 0, 2, 2, 0, 0], // 2-wide to slide RIGHT (1st line trigger)
    [2, 2, 2, 2, 2, 2, 0, 0], // 6 filled, gap at 6-7
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 2,
  harvestCount: 1,
  scoreCount: 1, // Reduced after step 6
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
    description: "Slide the highlighted block right - it will fall and complete the row!",
    mobileDescription: "Slide block right",
    targetBlock: { x: 4, y: 8, type: "block" }, // 2-wide block at positions 4-5
    successCondition: "line_cleared",
  },
  // Step 3: Combos
  {
    id: 3,
    title: "Combos",
    type: "interactive",
    description: "Slide the block right - watch for the cascade effect!",
    mobileDescription: "Slide for combo",
    targetBlock: { x: 4, y: 8, type: "block" }, // 2-wide block at positions 4-5
    successCondition: "combo_achieved",
  },
  // Step 4: Combo Bonus
  {
    id: 4,
    title: "Combo",
    type: "bonus",
    bonusType: BonusType.Combo,
    description: "The Combo bonus targets a block to boost your next move.",
    mobileDescription: "Tap Combo, then a block",
    targetBlock: { x: 6, y: 9, type: "block" },
  },
  // Step 5: Harvest Bonus
  {
    id: 5,
    title: "Harvest",
    type: "bonus",
    bonusType: BonusType.Harvest,
    description: "The Harvest bonus removes all blocks of a chosen size.",
    mobileDescription: "Tap Harvest, then a block size",
    targetBlock: { x: 0, y: 8, type: "row" },
  },
  // Step 6: Score Bonus
  {
    id: 6,
    title: "Score",
    type: "bonus",
    bonusType: BonusType.Score,
    description: "The Score bonus grants instant extra score.",
    mobileDescription: "Tap Score to gain points",
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
      { icon: "wave", name: "Wave", desc: "Clear horizontal rows." },
      { icon: "supply", name: "Supply", desc: "Add new lines at no move cost." },
    ],
    footer: "Unlock these in the permanent shop with CUBE tokens!",
  },
  // Step 8: Constraints
  {
    id: 8,
    title: "Constraints",
    type: "interactive",
    description: "Slide the block right to trigger a cascade and clear 2+ lines!",
    mobileDescription: "Clear 2+ lines",
    targetBlock: { x: 4, y: 8, type: "block" }, // 2-wide block at positions 4-5
    successCondition: "constraint_satisfied",
        constraint: { type: "ComboLines", value: 2, count: 1 },
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
