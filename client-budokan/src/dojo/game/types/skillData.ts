export interface SkillDefinition {
  id: number;
  name: string;
  category: "bonus" | "world";
  description: string;
  branchA: string;
  branchB: string;
}

export const SKILLS: Record<number, SkillDefinition> = {
  1: {
    id: 1,
    name: "Combo",
    category: "bonus",
    description: "Add combo to next move",
    branchA: "Chain Master",
    branchB: "Cascade",
  },
  2: {
    id: 2,
    name: "Score",
    category: "bonus",
    description: "Add instant score",
    branchA: "Multiplier",
    branchB: "Burst",
  },
  3: {
    id: 3,
    name: "Harvest",
    category: "bonus",
    description: "Destroy blocks and earn cubes",
    branchA: "Reaper",
    branchB: "Prospector",
  },
  4: {
    id: 4,
    name: "Wave",
    category: "bonus",
    description: "Clear horizontal rows",
    branchA: "Tsunami",
    branchB: "Precision Strike",
  },
  5: {
    id: 5,
    name: "Supply",
    category: "bonus",
    description: "Add lines without spending moves",
    branchA: "Abundance",
    branchB: "Tactical Reserve",
  },
  6: {
    id: 6,
    name: "Tempo",
    category: "world",
    description: "Bonus moves per level",
    branchA: "Allegro",
    branchB: "Adagio",
  },
  7: {
    id: 7,
    name: "Fortune",
    category: "world",
    description: "Bonus cubes on level completion",
    branchA: "Midas Touch",
    branchB: "Lucky Strike",
  },
  8: {
    id: 8,
    name: "Surge",
    category: "world",
    description: "Extra combo on line clears",
    branchA: "Chain Lightning",
    branchB: "Power Surge",
  },
  9: {
    id: 9,
    name: "Catalyst",
    category: "world",
    description: "Score multiplier from combos",
    branchA: "Amplifier",
    branchB: "Resonance",
  },
  10: {
    id: 10,
    name: "Resilience",
    category: "world",
    description: "Relaxed constraint requirements",
    branchA: "Fortress",
    branchB: "Flexibility",
  },
  11: {
    id: 11,
    name: "Focus",
    category: "world",
    description: "Score threshold reduction",
    branchA: "Clarity",
    branchB: "Insight",
  },
  12: {
    id: 12,
    name: "Expansion",
    category: "world",
    description: "Start with pre-filled lines",
    branchA: "Foundation",
    branchB: "Scaffold",
  },
  13: {
    id: 13,
    name: "Momentum",
    category: "world",
    description: "Bonus charges from combos",
    branchA: "Snowball",
    branchB: "Perpetual Motion",
  },
  14: {
    id: 14,
    name: "Adrenaline",
    category: "world",
    description: "Power boost in final moves",
    branchA: "Last Stand",
    branchB: "Second Wind",
  },
  15: {
    id: 15,
    name: "Legacy",
    category: "world",
    description: "Cube multiplier for the run",
    branchA: "Dynasty",
    branchB: "Heritage",
  },
};

export function getSkillName(skillId: number): string {
  return SKILLS[skillId]?.name ?? `Skill ${skillId}`;
}

export function getSkillById(skillId: number): SkillDefinition | undefined {
  return SKILLS[skillId];
}

export function getBonusSkills(): SkillDefinition[] {
  return Object.values(SKILLS).filter((skill) => skill.category === "bonus");
}

export function getWorldEventSkills(): SkillDefinition[] {
  return Object.values(SKILLS).filter((skill) => skill.category === "world");
}
