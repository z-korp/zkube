export interface SkillDefinition {
  id: number;
  name: string;
  category: "bonus" | "world";
  archetype: ArchetypeId;
  description: string;
  branchA: string;
  branchB: string;
}

export type ArchetypeId = "tempo" | "economy" | "control" | "risk" | "scaling";

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
  // --- Tempo Archetype (Combo, Tempo, Momentum) ---
  1: {
    id: 1,
    name: "Combo",
    category: "bonus",
    archetype: "tempo",
    description: "Turn amplifier for combo depth",
    branchA: "Burst",
    branchB: "Sustain",
  },
  6: {
    id: 6,
    name: "Tempo",
    category: "world",
    archetype: "tempo",
    description: "Move flow and refunds",
    branchA: "Allegro",
    branchB: "Adagio",
  },
  13: {
    id: 13,
    name: "Momentum",
    category: "world",
    archetype: "tempo",
    description: "Consecutive clear value",
    branchA: "Snowball",
    branchB: "Perpetual Motion",
  },
  // --- Scaling Archetype (Score, Surge, Legacy) ---
  2: {
    id: 2,
    name: "Score",
    category: "bonus",
    archetype: "scaling",
    description: "Direct score injection",
    branchA: "Chain",
    branchB: "Finisher",
  },
  8: {
    id: 8,
    name: "Surge",
    category: "world",
    archetype: "scaling",
    description: "Score multiplier (hard capped)",
    branchA: "Chain Lightning",
    branchB: "Power Surge",
  },
  15: {
    id: 15,
    name: "Legacy",
    category: "world",
    archetype: "scaling",
    description: "Linear long-run scaling",
    branchA: "Dynasty",
    branchB: "Heritage",
  },
  // --- Economy Archetype (Harvest, Fortune, Catalyst) ---
  3: {
    id: 3,
    name: "Harvest",
    category: "bonus",
    archetype: "economy",
    description: "Targeted block destruction and cube gain",
    branchA: "Control",
    branchB: "Economy",
  },
  7: {
    id: 7,
    name: "Fortune",
    category: "world",
    archetype: "economy",
    description: "Level and clear cube amplification",
    branchA: "Midas Touch",
    branchB: "Lucky Strike",
  },
  9: {
    id: 9,
    name: "Catalyst",
    category: "world",
    archetype: "economy",
    description: "Combo threshold and reward tuning",
    branchA: "Amplifier",
    branchB: "Resonance",
  },
  // --- Control Archetype (Wave, Focus, Expansion) ---
  4: {
    id: 4,
    name: "Wave",
    category: "bonus",
    archetype: "control",
    description: "Row clear reset tool",
    branchA: "Tsunami",
    branchB: "Ripple",
  },
  11: {
    id: 11,
    name: "Focus",
    category: "world",
    archetype: "control",
    description: "Constraint acceleration",
    branchA: "Clarity",
    branchB: "Insight",
  },
  12: {
    id: 12,
    name: "Expansion",
    category: "world",
    archetype: "control",
    description: "Easier generated lines",
    branchA: "Foundation",
    branchB: "Scaffold",
  },
  // --- Risk Archetype (Supply, Adrenaline, Resilience) ---
  5: {
    id: 5,
    name: "Supply",
    category: "bonus",
    archetype: "risk",
    description: "Line injection and board shaping",
    branchA: "Builder",
    branchB: "Pressure",
  },
  14: {
    id: 14,
    name: "Adrenaline",
    category: "world",
    archetype: "risk",
    description: "High-grid risk reward",
    branchA: "Last Stand",
    branchB: "Second Wind",
  },
  10: {
    id: 10,
    name: "Resilience",
    category: "world",
    archetype: "risk",
    description: "Free-move safety budget",
    branchA: "Fortress",
    branchB: "Flexibility",
  },
};

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  tempo: {
    id: "tempo",
    name: "Tempo",
    color: "#9B59B6",
    description: "Move flow and chain pacing",
    bonusSkillId: 1,
    skillIds: [1, 6, 13],
  },
  scaling: {
    id: "scaling",
    name: "Scaling",
    color: "#F1C40F",
    description: "Late-run growth",
    bonusSkillId: 2,
    skillIds: [2, 8, 15],
  },
  economy: {
    id: "economy",
    name: "Economy",
    color: "#1ABC9C",
    description: "Cube amplification",
    bonusSkillId: 3,
    skillIds: [3, 7, 9],
  },
  control: {
    id: "control",
    name: "Control",
    color: "#3498DB",
    description: "Board and constraint control",
    bonusSkillId: 4,
    skillIds: [4, 11, 12],
  },
  risk: {
    id: "risk",
    name: "Risk",
    color: "#E74C3C",
    description: "High-pressure burst",
    bonusSkillId: 5,
    skillIds: [5, 14, 10],
  },
};

export const ARCHETYPE_ORDER: ArchetypeId[] = ["tempo", "scaling", "economy", "control", "risk"];

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
