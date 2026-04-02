const DAY_SECONDS = 86_400;
const THREE_DAYS_SECONDS = 259_200;
const WEEK_SECONDS = 604_800;

const feltFromShortString = (value: string): bigint => {
  let result = 0n;
  for (let i = 0; i < value.length; i++) {
    result = (result << 8n) | BigInt(value.charCodeAt(i));
  }
  return result;
};

export type QuestType = "daily" | "weekly" | "finisher";

export interface QuestDef {
  id: bigint;
  shortId: string;
  name: string;
  description: string;
  target: number;
  reward: number;
  type: QuestType;
  icon: string;
  taskId: bigint;
  start: number;
  duration: number;
  interval: number;
}

export const QUEST_DEFS: QuestDef[] = [
  {
    id: feltFromShortString("QUEST_LINE_CLEAR_I"),
    shortId: "QUEST_LINE_CLEAR_I",
    name: "Line Clear I",
    description: "Clear 30 lines",
    target: 30,
    reward: 1,
    type: "daily",
    icon: "📏",
    taskId: feltFromShortString("LINE_CLEAR"),
    start: 0,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_LINE_CLEAR_II"),
    shortId: "QUEST_LINE_CLEAR_II",
    name: "Line Clear II",
    description: "Clear 60 lines",
    target: 60,
    reward: 1,
    type: "daily",
    icon: "📐",
    taskId: feltFromShortString("LINE_CLEAR"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_LINE_CLEAR_III"),
    shortId: "QUEST_LINE_CLEAR_III",
    name: "Line Clear III",
    description: "Clear 100 lines",
    target: 100,
    reward: 2,
    type: "daily",
    icon: "🧱",
    taskId: feltFromShortString("LINE_CLEAR"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_COMBO_I"),
    shortId: "QUEST_COMBO_I",
    name: "Combo I",
    description: "Hit 3+ combo 5 times",
    target: 5,
    reward: 1,
    type: "daily",
    icon: "🔥",
    taskId: feltFromShortString("COMBO_3"),
    start: 0,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_COMBO_II"),
    shortId: "QUEST_COMBO_II",
    name: "Combo II",
    description: "Hit 4+ combo 3 times",
    target: 3,
    reward: 1,
    type: "daily",
    icon: "⚡",
    taskId: feltFromShortString("COMBO_4"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_COMBO_III"),
    shortId: "QUEST_COMBO_III",
    name: "Combo III",
    description: "Hit 5+ combo once",
    target: 1,
    reward: 2,
    type: "daily",
    icon: "💥",
    taskId: feltFromShortString("COMBO_5"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_BONUS_I"),
    shortId: "QUEST_BONUS_I",
    name: "Bonus I",
    description: "Use 3 bonuses",
    target: 3,
    reward: 1,
    type: "daily",
    icon: "🪄",
    taskId: feltFromShortString("BONUS_USED"),
    start: 0,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_BONUS_II"),
    shortId: "QUEST_BONUS_II",
    name: "Bonus II",
    description: "Use 8 bonuses",
    target: 8,
    reward: 2,
    type: "daily",
    icon: "🧿",
    taskId: feltFromShortString("BONUS_USED"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_DAILY_CHALLENGER"),
    shortId: "QUEST_DAILY_CHALLENGER",
    name: "Daily Challenger",
    description: "Play one daily challenge",
    target: 1,
    reward: 2,
    type: "daily",
    icon: "🗓️",
    taskId: feltFromShortString("DAILY_PLAY"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_DAILY_FINISHER"),
    shortId: "QUEST_DAILY_FINISHER",
    name: "Daily Finisher",
    description: "Finish 3 daily quests",
    target: 3,
    reward: 2,
    type: "finisher",
    icon: "✅",
    taskId: feltFromShortString("DAILY_QUEST_DONE"),
    start: 0,
    duration: DAY_SECONDS,
    interval: DAY_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_WEEKLY_GRINDER"),
    shortId: "QUEST_WEEKLY_GRINDER",
    name: "Weekly Grinder",
    description: "Complete 30 levels this week",
    target: 30,
    reward: 5,
    type: "weekly",
    icon: "🏁",
    taskId: feltFromShortString("LEVEL_COMPLETE"),
    start: 0,
    duration: WEEK_SECONDS,
    interval: WEEK_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_WEEKLY_CHALLENGER"),
    shortId: "QUEST_WEEKLY_CHALLENGER",
    name: "Weekly Challenger",
    description: "Play daily challenge 7 times",
    target: 3,
    reward: 5,
    type: "weekly",
    icon: "🏆",
    taskId: feltFromShortString("DAILY_PLAY"),
    start: 0,
    duration: WEEK_SECONDS,
    interval: WEEK_SECONDS,
  },
];

export const getQuestIntervalId = (quest: QuestDef, nowSeconds: number): number => {
  if (nowSeconds < quest.start || quest.interval <= 0) return 0;
  return Math.floor((nowSeconds - quest.start) / quest.interval);
};

export const isQuestActive = (quest: QuestDef, nowSeconds: number): boolean => {
  if (nowSeconds < quest.start || quest.interval <= 0) return false;
  const elapsed = nowSeconds - quest.start;
  const cycleOffset = elapsed % quest.interval;
  return cycleOffset < quest.duration;
};
