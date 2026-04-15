export interface BossDisplayData {
  id: number;
  name: string;
  emoji: string;
  title: string;
  description: string;
}

export const BOSS_IDENTITIES: Record<number, BossDisplayData> = {
  1: {
    id: 1,
    name: "COMBO MASTER",
    emoji: "🔥",
    title: "Lord of Chains",
    description: "Chains endless combos into devastating streaks",
  },
  2: {
    id: 2,
    name: "DEMOLISHER",
    emoji: "💥",
    title: "Breaker of Blocks",
    description: "Shatters blocks with relentless precision",
  },
  3: {
    id: 3,
    name: "DAREDEVIL",
    emoji: "⚡",
    title: "Edge Walker",
    description: "Thrives on the razor's edge of destruction",
  },
  4: {
    id: 4,
    name: "PURIST",
    emoji: "🧊",
    title: "Keeper of Order",
    description: "Demands absolute control of the grid",
  },
  5: {
    id: 5,
    name: "HARVESTER",
    emoji: "🌀",
    title: "Reaper of Lines",
    description: "Harvests blocks with surgical efficiency",
  },
  6: {
    id: 6,
    name: "TIDECALLER",
    emoji: "🌊",
    title: "Master of Currents",
    description: "Commands the deep currents of the grid",
  },
  7: {
    id: 7,
    name: "STACKER",
    emoji: "🗼",
    title: "Tower Builder",
    description: "Builds towering combos from nothing",
  },
  8: {
    id: 8,
    name: "SURGEON",
    emoji: "🎯",
    title: "Precision Cutter",
    description: "Cuts with perfect accuracy under pressure",
  },
  9: {
    id: 9,
    name: "ASCETIC",
    emoji: "🧘",
    title: "Master of Restraint",
    description: "Achieves victory through disciplined control",
  },
  10: {
    id: 10,
    name: "PERFECTIONIST",
    emoji: "👹",
    title: "Flawless Executor",
    description: "Demands nothing less than perfection",
  },
};

export function getBossDisplay(bossId: number): BossDisplayData {
  return BOSS_IDENTITIES[bossId] ?? BOSS_IDENTITIES[1];
}
