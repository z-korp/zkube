export type TutorialStepType = "interactive" | "info";
export type InfoStepType = "cubes" | "shop" | "boss";
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

export interface InfoStep extends TutorialStepBase {
  type: "info";
  infoType: InfoStepType;
  items: InfoItem[];
  footer: string;
  isComplete?: boolean;
}

export type TutorialStep = InteractiveStep | InfoStep;

export const TOTAL_TUTORIAL_STEPS = 8;

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
    [1, 0, 2, 2, 0, 0, 2, 2],
    [3, 3, 3, 1, 0, 0, 2, 2],
  ],
  nextLine: [4, 4, 4, 4, 0, 0, 0, 0],
  comboCount: 0,
  harvestCount: 0,
  scoreCount: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

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
    [0, 0, 0, 0, 2, 2, 0, 0],
    [2, 2, 2, 2, 2, 2, 0, 0],
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 0,
  harvestCount: 0,
  scoreCount: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

export const STEP_3_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2],
    [2, 2, 2, 2, 2, 2, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0],
    [2, 2, 2, 2, 2, 2, 0, 0],
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 0,
  harvestCount: 0,
  scoreCount: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

export const STEP_5_GRID: MockGridState = {
  initialGrid: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 2, 2],
    [2, 2, 2, 2, 2, 2, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0],
    [2, 2, 2, 2, 2, 2, 0, 0],
  ],
  nextLine: [1, 0, 0, 0, 0, 0, 0, 1],
  comboCount: 0,
  harvestCount: 0,
  scoreCount: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
};

export function getGridForStep(step: number): MockGridState {
  switch (step) {
    case 1:
      return STEP_1_GRID;
    case 2:
      return STEP_2_GRID;
    case 3:
      return STEP_3_GRID;
    case 5:
      return STEP_5_GRID;
    default:
      return STEP_1_GRID;
  }
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Move Blocks",
    type: "interactive",
    description: "Drag blocks left or right to position them on the grid.",
    mobileDescription: "Swipe to move blocks",
    targetBlock: { x: 2, y: 8, type: "block" },
    successCondition: "moved_block",
  },
  {
    id: 2,
    title: "Clear Lines",
    type: "interactive",
    description: "Slide the highlighted block right — it will fall and complete the row.",
    mobileDescription: "Slide block right",
    targetBlock: { x: 4, y: 8, type: "block" },
    successCondition: "line_cleared",
  },
  {
    id: 3,
    title: "Combos",
    type: "interactive",
    description: "Slide the block right and watch the cascade chain.",
    mobileDescription: "Slide for combo",
    targetBlock: { x: 4, y: 8, type: "block" },
    successCondition: "combo_achieved",
  },
  {
    id: 4,
    title: "Scoring",
    type: "info",
    infoType: "cubes",
    description: "Stars are now your progression signal. Finish levels efficiently.",
    mobileDescription: "Efficiency = better stars",
    items: [
      { cubes: 3, condition: "High remaining moves" },
      { cubes: 2, condition: "Medium remaining moves" },
      { cubes: 1, condition: "Finish the level" },
    ],
    footer: "Play clean runs to maximize rating.",
  },
  {
    id: 5,
    title: "Constraints",
    type: "interactive",
    description: "Clear 2+ lines in one move to satisfy the constraint.",
    mobileDescription: "Clear 2+ lines",
    targetBlock: { x: 4, y: 8, type: "block" },
    successCondition: "constraint_satisfied",
    constraint: { type: "ComboLines", value: 2, count: 1 },
  },
  {
    id: 6,
    title: "The Shop",
    type: "info",
    infoType: "shop",
    description: "The shop appears periodically with strategic run upgrades.",
    mobileDescription: "Shop appears in runs",
    items: [
      { icon: "bonus", name: "Consumables", desc: "Situational power-ups" },
      { icon: "levelup", name: "Upgrades", desc: "Progression improvements" },
      { icon: "refill", name: "Refill", desc: "Additional stock" },
    ],
    footer: "Choose purchases based on your board state.",
  },
  {
    id: 7,
    title: "Boss Levels",
    type: "info",
    infoType: "boss",
    description: "Every 10 levels is a boss stage with stricter constraints.",
    mobileDescription: "Boss = harder constraints",
    items: [
      { level: "10, 20, 30, 40, 50", desc: "Boss checkpoints" },
      { reward: "Progress boost", desc: "Clear bosses to advance faster" },
    ],
    footer: "Plan your moves ahead on boss stages.",
  },
  {
    id: 8,
    title: "You’re Ready",
    type: "info",
    infoType: "boss",
    description: "You’re ready for full runs. Good luck.",
    mobileDescription: "Good luck",
    items: [{ reward: "Start Run", desc: "Apply what you learned" }],
    footer: "Reach level 50 to complete the run.",
    isComplete: true,
  },
];

export function getStepById(id: number): TutorialStep | undefined {
  return TUTORIAL_STEPS.find((step) => step.id === id);
}

export function isInfoStep(step: TutorialStep): step is InfoStep {
  return step.type === "info";
}

export function isInteractiveStep(step: TutorialStep): step is InteractiveStep {
  return step.type === "interactive";
}
