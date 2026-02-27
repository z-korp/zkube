/**
 * vNext Skill Data — 12 skills across 4 archetypes.
 *
 * Mirrors the Cairo skill_effects.cairo definitions.
 * Authoritative spec: docs/SKILL_TREE_REFERENCE.md
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ArchetypeId = "tempo" | "scaling" | "risk" | "control";

export interface SkillDefinition {
  /** 1-indexed skill ID matching Cairo constants */
  id: number;
  /** Display name */
  name: string;
  /** Which archetype this skill belongs to */
  archetype: ArchetypeId;
  /** "bonus" = active (uses charges), "world" = passive (always-on) */
  category: "bonus" | "world";
  /** One-line description */
  description: string;
  /** Branch A display name */
  branchA: string;
  /** Branch B display name */
  branchB: string;
}

export interface ArchetypeDefinition {
  name: string;
  color: string;
  description: string;
  skills: number[];
}

/* ------------------------------------------------------------------ */
/*  Archetypes                                                         */
/* ------------------------------------------------------------------ */

export const ARCHETYPES: Record<ArchetypeId, ArchetypeDefinition> = {
  tempo: {
    name: "Tempo",
    color: "#a855f7", // purple
    description: "Combo depth, cascade amplification, rhythm mastery",
    skills: [1, 5, 6],
  },
  scaling: {
    name: "Scaling",
    color: "#eab308", // yellow
    description: "Score multipliers, per-level scaling, late-run ramping",
    skills: [2, 7, 8],
  },
  risk: {
    name: "Risk",
    color: "#ef4444", // red
    description: "Cube generation, conditional bursts, grid height rewards",
    skills: [3, 9, 10],
  },
  control: {
    name: "Control",
    color: "#3b82f6", // blue
    description: "Row clears, targeted destruction, grid shaping",
    skills: [4, 11, 12],
  },
};

export const ARCHETYPE_ORDER: ArchetypeId[] = [
  "tempo",
  "scaling",
  "risk",
  "control",
];

/* ------------------------------------------------------------------ */
/*  Skills (12 total: 4 active + 8 passive)                           */
/* ------------------------------------------------------------------ */

export const SKILLS: Record<number, SkillDefinition> = {
  // ── Tempo ──────────────────────────────────────────────────────────
  1: {
    id: 1,
    name: "Combo Surge",
    archetype: "tempo",
    category: "bonus",
    description: "Add combo depth to your next cascade",
    branchA: "Burst",
    branchB: "Flow",
  },
  5: {
    id: 5,
    name: "Rhythm",
    archetype: "tempo",
    category: "world",
    description: "Combo streak grants bonus combo depth",
    branchA: "Acceleration",
    branchB: "Stability",
  },
  6: {
    id: 6,
    name: "Cascade Mastery",
    archetype: "tempo",
    category: "world",
    description: "Deep cascades grant bonus combo depth",
    branchA: "Amplify",
    branchB: "Extend",
  },

  // ── Scaling ────────────────────────────────────────────────────────
  2: {
    id: 2,
    name: "Momentum Scaling",
    archetype: "scaling",
    category: "bonus",
    description: "Score burst that scales with zones cleared",
    branchA: "Late Bloom",
    branchB: "Stable Growth",
  },
  7: {
    id: 7,
    name: "Overdrive",
    archetype: "scaling",
    category: "world",
    description: "Reduce charge refill cadence for all active skills",
    branchA: "Amplify",
    branchB: "Overflow",
  },
  8: {
    id: 8,
    name: "Endgame Focus",
    archetype: "scaling",
    category: "world",
    description: "Bonus score at level start on later levels",
    branchA: "Deep End",
    branchB: "Smooth Ramp",
  },

  // ── Risk ───────────────────────────────────────────────────────────
  3: {
    id: 3,
    name: "Harvest",
    archetype: "risk",
    category: "bonus",
    description: "Destroy random blocks, earn cubes per block size",
    branchA: "Extraction",
    branchB: "Injection",
  },
  9: {
    id: 9,
    name: "High Stakes",
    archetype: "risk",
    category: "world",
    description: "Earn cubes per line clear when grid is high",
    branchA: "Edge",
    branchB: "Threshold",
  },
  10: {
    id: 10,
    name: "Gambit",
    archetype: "risk",
    category: "world",
    description: "Survive dangerous grid height to earn cubes",
    branchA: "Survivor",
    branchB: "Momentum",
  },

  // ── Control ────────────────────────────────────────────────────────
  4: {
    id: 4,
    name: "Tsunami",
    archetype: "control",
    category: "bonus",
    description: "Clear targeted blocks or entire rows",
    branchA: "Wide",
    branchB: "Target",
  },
  11: {
    id: 11,
    name: "Structural Integrity",
    archetype: "control",
    category: "world",
    description: "Extra row removal when grid is dangerously high",
    branchA: "Aggressive",
    branchB: "Safe",
  },
  12: {
    id: 12,
    name: "Grid Harmony",
    archetype: "control",
    category: "world",
    description: "Extra row removal on line clear at high grid",
    branchA: "Stabilize",
    branchB: "Precision",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Get a skill definition by ID. Returns undefined for invalid IDs.
 */
export function getSkillById(id: number): SkillDefinition | undefined {
  return SKILLS[id];
}

/**
 * Get the archetype definition for a skill ID.
 */
export function getArchetypeForSkill(
  skillId: number,
): ArchetypeDefinition | undefined {
  const skill = SKILLS[skillId];
  if (!skill) return undefined;
  return ARCHETYPES[skill.archetype];
}

/**
 * Get all skills belonging to an archetype, ordered by ID.
 */
export function getSkillsByArchetype(
  archetype: ArchetypeId,
): SkillDefinition[] {
  return ARCHETYPES[archetype].skills
    .map((id) => SKILLS[id])
    .filter((s): s is SkillDefinition => s !== undefined);
}

/**
 * Get a skill's display name. Returns "Unknown" for invalid IDs.
 */
export function getSkillName(skillId: number): string {
  return SKILLS[skillId]?.name ?? "Unknown";
}

/**
 * Map a skill level (1-5) to a visual tier for icon selection.
 * - Level 0-1: Tier 1 (basic)
 * - Level 2-3: Tier 2 (enhanced)
 * - Level 4-5: Tier 3 (capstone)
 */
export function getSkillTier(level: number): 1 | 2 | 3 {
  if (level <= 1) return 1;
  if (level <= 3) return 2;
  return 3;
}
