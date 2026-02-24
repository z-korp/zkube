export interface SkillDefinition {
  id: number;
  name: string;
  category: "bonus" | "world";
  archetype: ArchetypeId;
  description: string;
  branchA: string;
  branchB: string;
}

export type ArchetypeId = "combo" | "score" | "harvest" | "wave" | "supply";

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  color: string;
  description: string;
  /** The bonus skill ID that anchors this archetype */
  bonusSkillId: number;
  /** All 3 skill IDs in this archetype (bonus + 2 world) */
  skillIds: [number, number, number];
}

export const SKILLS: Record<number, SkillDefinition> = {
  // --- Combo Archetype ---
  1: {
    id: 1,
    name: "Combo",
    category: "bonus",
    archetype: "combo",
    description: "Add combo to next move",
    branchA: "Chain Master",
    branchB: "Cascade",
  },
  8: {
    id: 8,
    name: "Surge",
    category: "world",
    archetype: "combo",
    description: "Extra combo on line clears",
    branchA: "Chain Lightning",
    branchB: "Power Surge",
  },
  9: {
    id: 9,
    name: "Catalyst",
    category: "world",
    archetype: "combo",
    description: "Score multiplier from combos",
    branchA: "Amplifier",
    branchB: "Resonance",
  },
  // --- Score Archetype ---
  2: {
    id: 2,
    name: "Score",
    category: "bonus",
    archetype: "score",
    description: "Add instant score",
    branchA: "Multiplier",
    branchB: "Burst",
  },
  11: {
    id: 11,
    name: "Focus",
    category: "world",
    archetype: "score",
    description: "Score threshold reduction",
    branchA: "Clarity",
    branchB: "Insight",
  },
  15: {
    id: 15,
    name: "Legacy",
    category: "world",
    archetype: "score",
    description: "Cube multiplier for the run",
    branchA: "Dynasty",
    branchB: "Heritage",
  },
  // --- Harvest Archetype ---
  3: {
    id: 3,
    name: "Harvest",
    category: "bonus",
    archetype: "harvest",
    description: "Destroy blocks and earn cubes",
    branchA: "Reaper",
    branchB: "Prospector",
  },
  7: {
    id: 7,
    name: "Fortune",
    category: "world",
    archetype: "harvest",
    description: "Bonus cubes on level completion",
    branchA: "Midas Touch",
    branchB: "Lucky Strike",
  },
  13: {
    id: 13,
    name: "Momentum",
    category: "world",
    archetype: "harvest",
    description: "Bonus charges from combos",
    branchA: "Snowball",
    branchB: "Perpetual Motion",
  },
  // --- Wave Archetype ---
  4: {
    id: 4,
    name: "Wave",
    category: "bonus",
    archetype: "wave",
    description: "Clear horizontal rows",
    branchA: "Tsunami",
    branchB: "Precision Strike",
  },
  12: {
    id: 12,
    name: "Expansion",
    category: "world",
    archetype: "wave",
    description: "Start with pre-filled lines",
    branchA: "Foundation",
    branchB: "Scaffold",
  },
  14: {
    id: 14,
    name: "Adrenaline",
    category: "world",
    archetype: "wave",
    description: "Power boost in final moves",
    branchA: "Last Stand",
    branchB: "Second Wind",
  },
  // --- Supply Archetype ---
  5: {
    id: 5,
    name: "Supply",
    category: "bonus",
    archetype: "supply",
    description: "Add lines without spending moves",
    branchA: "Abundance",
    branchB: "Tactical Reserve",
  },
  6: {
    id: 6,
    name: "Tempo",
    category: "world",
    archetype: "supply",
    description: "Bonus moves per level",
    branchA: "Allegro",
    branchB: "Adagio",
  },
  10: {
    id: 10,
    name: "Resilience",
    category: "world",
    archetype: "supply",
    description: "Relaxed constraint requirements",
    branchA: "Fortress",
    branchB: "Flexibility",
  },
};

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  combo: {
    id: "combo",
    name: "Combo",
    color: "#9B59B6",
    description: "Chain reactions and cascade mastery",
    bonusSkillId: 1,
    skillIds: [1, 8, 9],
  },
  score: {
    id: "score",
    name: "Score",
    color: "#F1C40F",
    description: "Precision scoring and reward maximization",
    bonusSkillId: 2,
    skillIds: [2, 11, 15],
  },
  harvest: {
    id: "harvest",
    name: "Harvest",
    color: "#1ABC9C",
    description: "Resource gathering and cube economy",
    bonusSkillId: 3,
    skillIds: [3, 7, 13],
  },
  wave: {
    id: "wave",
    name: "Wave",
    color: "#3498DB",
    description: "Destructive force and board manipulation",
    bonusSkillId: 4,
    skillIds: [4, 12, 14],
  },
  supply: {
    id: "supply",
    name: "Supply",
    color: "#2ECC71",
    description: "Tactical endurance and resource management",
    bonusSkillId: 5,
    skillIds: [5, 6, 10],
  },
};

export const ARCHETYPE_ORDER: ArchetypeId[] = ["combo", "score", "harvest", "wave", "supply"];

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

export function getSkillsByArchetype(archetypeId: ArchetypeId): SkillDefinition[] {
  const archetype = ARCHETYPES[archetypeId];
  return archetype.skillIds.map((id) => SKILLS[id]);
}

export function getArchetypeForSkill(skillId: number): ArchetypeDefinition | undefined {
  const skill = SKILLS[skillId];
  if (!skill) return undefined;
  return ARCHETYPES[skill.archetype];
}

/**
 * Get the tier (1-3) for a given skill level (0-9).
 * T1: levels 0-3 (muted icon)
 * T2: levels 4-6 (vibrant icon)
 * T3: levels 7-9 (golden icon)
 */
export function getSkillTier(level: number): 1 | 2 | 3 {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  return 3;
}

/**
 * Get the icon filename for a skill at a given tier.
 * Example: getSkillIconFilename(1, 2) => "skill-combo-t2.png"
 */
export function getSkillIconFilename(skillId: number): string {
  const skill = SKILLS[skillId];
  if (!skill) return "";
  return `skill-${skill.name.toLowerCase()}.png`;
}

export function getSkillTierIconFilename(skillId: number, level: number): string {
  const skill = SKILLS[skillId];
  if (!skill) return "";
  const tier = getSkillTier(level);
  return `skill-${skill.name.toLowerCase()}-t${tier}.png`;
}
