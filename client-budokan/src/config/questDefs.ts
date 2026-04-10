const DAY_SECONDS = 86_400;
const THREE_DAYS_SECONDS = 259_200;
const WEEK_SECONDS = 604_800;
const MONDAY_OFFSET = 345_600; // epoch day 0 = Thursday, +4 days = Monday

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
  // ── Group 1 daily (start=0, duration=DAY, interval=THREE_DAYS) ──
  {
    id: feltFromShortString("QUEST_LINE_SWEEPER"),
    shortId: "QUEST_LINE_SWEEPER",
    name: "Line Sweeper",
    description: "Clear 20 lines",
    target: 20,
    reward: 1,
    type: "daily",
    icon: "📏",
    taskId: feltFromShortString("LINE_CLEAR"),
    start: 0,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_BONUS_USER"),
    shortId: "QUEST_BONUS_USER",
    name: "Bonus User",
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
    id: feltFromShortString("QUEST_STREAK_HUNTER"),
    shortId: "QUEST_STREAK_HUNTER",
    name: "Streak Hunter",
    description: "Reach a 10+ combo streak",
    target: 1,
    reward: 1,
    type: "daily",
    icon: "💥",
    taskId: feltFromShortString("HIGH_COMBO"),
    start: 0,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  // ── Group 2 daily (start=DAY, duration=DAY, interval=THREE_DAYS) ──
  {
    id: feltFromShortString("QUEST_COMBO_STREAK"),
    shortId: "QUEST_COMBO_STREAK",
    name: "Combo Streak",
    description: "Hit 3+ combo twice",
    target: 2,
    reward: 1,
    type: "daily",
    icon: "🔥",
    taskId: feltFromShortString("COMBO_3"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_DAILY_PLAYER"),
    shortId: "QUEST_DAILY_PLAYER",
    name: "Daily Player",
    description: "Play a daily challenge",
    target: 1,
    reward: 1,
    type: "daily",
    icon: "🗓️",
    taskId: feltFromShortString("DAILY_PLAY"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_PERFECT_MOVE"),
    shortId: "QUEST_PERFECT_MOVE",
    name: "Perfect Move",
    description: "3-star a level",
    target: 1,
    reward: 1,
    type: "daily",
    icon: "⭐",
    taskId: feltFromShortString("PERFECT_LEVEL"),
    start: DAY_SECONDS,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  // ── Group 3 daily (start=DAY*2, duration=DAY, interval=THREE_DAYS) ──
  {
    id: feltFromShortString("QUEST_BIG_COMBO"),
    shortId: "QUEST_BIG_COMBO",
    name: "Big Combo",
    description: "Hit a 4+ combo",
    target: 1,
    reward: 1,
    type: "daily",
    icon: "⚡",
    taskId: feltFromShortString("COMBO_4"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_ZONE_RUNNER"),
    shortId: "QUEST_ZONE_RUNNER",
    name: "Zone Runner",
    description: "Start 2 games",
    target: 2,
    reward: 1,
    type: "daily",
    icon: "🏃",
    taskId: feltFromShortString("GAME_START"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_COMBO_CHAIN"),
    shortId: "QUEST_COMBO_CHAIN",
    name: "Combo Chain",
    description: "Hit 2+ combo 5 times",
    target: 5,
    reward: 1,
    type: "daily",
    icon: "🔗",
    taskId: feltFromShortString("COMBO_2"),
    start: DAY_SECONDS * 2,
    duration: DAY_SECONDS,
    interval: THREE_DAYS_SECONDS,
  },
  // ── Daily meta (start=0, duration=DAY, interval=DAY) ──
  {
    id: feltFromShortString("QUEST_DAILY_FINISHER"),
    shortId: "QUEST_DAILY_FINISHER",
    name: "Daily Finisher",
    description: "Complete 3 daily quests",
    target: 3,
    reward: 2,
    type: "finisher",
    icon: "✅",
    taskId: feltFromShortString("DAILY_QUEST_DONE"),
    start: 0,
    duration: DAY_SECONDS,
    interval: DAY_SECONDS,
  },
  // ── Weekly (start=MONDAY_OFFSET, duration=WEEK, interval=WEEK) ──
  {
    id: feltFromShortString("QUEST_WEEKLY_GRINDER"),
    shortId: "QUEST_WEEKLY_GRINDER",
    name: "Weekly Grinder",
    description: "Clear 150 lines this week",
    target: 150,
    reward: 5,
    type: "weekly",
    icon: "🏁",
    taskId: feltFromShortString("LINE_CLEAR"),
    start: MONDAY_OFFSET,
    duration: WEEK_SECONDS,
    interval: WEEK_SECONDS,
  },
  {
    id: feltFromShortString("QUEST_WEEKLY_EXPLORER"),
    shortId: "QUEST_WEEKLY_EXPLORER",
    name: "Weekly Explorer",
    description: "Play daily challenge 3 times",
    target: 3,
    reward: 5,
    type: "weekly",
    icon: "🏆",
    taskId: feltFromShortString("DAILY_PLAY"),
    start: MONDAY_OFFSET,
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
