/**
 * vNext Skill Data — 12 skills across 4 archetypes.
 *
 * Mirrors the Cairo skill_effects.cairo definitions.
 * Authoritative source: contracts/src/helpers/skill_effects.cairo (CONTRACT IS LAW)
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
/*  Asset key mapping (skill ID → icon file key)                       */
/* ------------------------------------------------------------------ */

/**
 * Maps each skill ID to the short asset key used in file names.
 * Files are at: /assets/common/skills/skill-{key}.png (base)
 *               /assets/common/skills/skill-{key}-t{1|2|3}.png (tiered)
 */
export const SKILL_ASSET_KEYS: Record<number, string> = {
  1: "combo",       // Combo Surge
  2: "score",       // Momentum Scaling
  3: "harvest",     // Harvest
  4: "wave",        // Tsunami
  5: "tempo",       // Rhythm
  6: "catalyst",    // Cascade Mastery
  7: "momentum",    // Overdrive
  8: "focus",       // Endgame Focus
  9: "fortune",     // High Stakes
  10: "adrenaline", // Gambit
  11: "resilience", // Structural Integrity
  12: "expansion",  // Grid Harmony
};

/**
 * Get the asset file key for a skill. Returns undefined for invalid IDs.
 */
export function getSkillAssetKey(skillId: number): string | undefined {
  return SKILL_ASSET_KEYS[skillId];
}

/**
 * Decode a draft v2 choice value (1-24) into skill ID and branch info.
 * Values 1-12: skill_id directly (add new / upgrade / branch A at L3)
 * Values 13-24: branch B upgrade (skill_id = value - 12)
 */
export function decodeDraftChoice(choice: number): { skillId: number; isBranchB: boolean } {
  if (choice > 12) {
    return { skillId: choice - 12, isBranchB: true };
  }
  return { skillId: choice, isBranchB: false };
}

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

type BranchSkillLevelMap = Record<number, string>;

interface BranchSkillDescription {
  base: BranchSkillLevelMap;
  branchA: BranchSkillLevelMap;
  branchB: BranchSkillLevelMap;
}

const SKILL_EFFECTS: Record<number, BranchSkillDescription> = {
  1: {
    base: {
      1: "+1 combo depth",
      2: "+2 combo depth",
    },
    branchA: {
      3: "+3 combo depth",
      4: "+5 combo depth",
      5: "+7 combo depth",
    },
    branchB: {
      3: "+1 combo depth for the full level",
      4: "+2 combo depth for the full level",
      5: "+4 combo depth for the full level",
    },
  },
  2: {
    base: {
      1: "+1 score per zone cleared",
      2: "+2 score per zone cleared",
    },
    branchA: {
      3: "+3 score per zone cleared",
      4: "+5 score per zone cleared",
      5: "+10 score per zone cleared",
    },
    branchB: {
      3: "+5 flat score",
      4: "+10 flat score",
      5: "+20 flat score",
    },
  },
  3: {
    base: {
      1: "Destroy 2 random blocks -> cubes per block size",
      2: "Destroy 3 random blocks -> cubes per block size",
    },
    branchA: {
      3: "Destroy 5 random blocks -> cubes per block size",
      4: "Destroy 7 random blocks -> cubes per block size",
      5: "Destroy 10 random blocks -> cubes per block size",
    },
    branchB: {
      3: "Add 1 line -> +10 cubes",
      4: "Add 2 lines -> +20 cubes",
      5: "Add 3 lines -> +40 cubes",
    },
  },
  4: {
    base: {
      1: "Clear 1 targeted block",
      2: "Clear 2 targeted blocks",
    },
    branchA: {
      3: "Clear 3 targeted blocks",
      4: "Clear 5 targeted blocks",
      5: "Clear all blocks of targeted size",
    },
    branchB: {
      3: "Destroy 1 targeted row",
      4: "Destroy 2 targeted rows",
      5: "Destroy 3 targeted rows",
    },
  },
  5: {
    base: {
      1: "Every 12 combo streak -> +1 combo depth",
      2: "Every 10 combo streak -> +1 combo depth",
    },
    branchA: {
      3: "Every 8 streak -> +1 combo depth",
      4: "Every 6 streak -> +1 combo depth",
      5: "Every 4 streak -> +1 combo depth",
    },
    branchB: {
      3: "Every 10 streak -> +2 combo depth",
      4: "Every 10 streak -> +3 combo depth",
      5: "Every 10 streak -> +4 combo depth",
    },
  },
  6: {
    base: {
      1: "Cascade depth >= 5 -> +1 combo depth",
      2: "Cascade depth >= 4 -> +1 combo depth",
    },
    branchA: {
      3: "Cascade depth >= 4 -> +2 combo depth",
      4: "Cascade depth >= 4 -> +3 combo depth",
      5: "Cascade depth >= 4 -> +4 combo depth",
    },
    branchB: {
      3: "Cascade depth >= 3 -> +1 combo depth",
      4: "Cascade depth >= 2 -> +1 combo depth",
      5: "Cascade depth >= 2 -> +2 combo depth",
    },
  },
  7: {
    base: {
      1: "Charge cadence: every 4 levels",
      2: "Charge cadence: every 3 levels",
    },
    branchA: {
      3: "Charge cadence: every 2 levels",
      4: "Charge cadence: every 2 levels + start with +1 charge",
      5: "Charge cadence: every 1 level",
    },
    branchB: {
      3: "Charge cadence: every 3 levels + start with +1 charge",
      4: "Charge cadence: every 3 levels + start with +2 charges",
      5: "Charge cadence: every 2 levels + start with +2 charges",
    },
  },
  8: {
    base: {
      1: "+1 score at level start (levels >= 10)",
      2: "+2 score at level start (levels >= 20)",
    },
    branchA: {
      3: "+0.2 score per level cleared at level start",
      4: "+0.3 score per level cleared at level start",
      5: "+0.5 score per level cleared at level start",
    },
    branchB: {
      3: "+5 score at level start (levels >= 25)",
      4: "+10 score at level start (levels >= 30)",
      5: "+20 score at level start (levels >= 40)",
    },
  },
  9: {
    base: {
      1: "Grid >= 9 rows -> +1 cube per clear",
      2: "Grid >= 8 rows -> +1 cube per clear",
    },
    branchA: {
      3: "Grid >= 8 rows -> +3 cubes per clear",
      4: "Grid >= 8 rows -> +5 cubes per clear",
      5: "Grid >= 8 rows -> +10 cubes per clear",
    },
    branchB: {
      3: "Grid >= 7 rows -> +1 cube per clear",
      4: "Grid >= 6 rows -> +1 cube per clear",
      5: "Grid >= 5 rows -> +1 cube per clear",
    },
  },
  10: {
    base: {
      1: "Grid reaches >= 9 rows & survive -> +3 cubes (once/level)",
      2: "Grid reaches >= 9 rows & survive -> +5 cubes (once/level)",
    },
    branchA: {
      3: "Grid >= 9 rows & survive -> +10 cubes (once/level)",
      4: "Grid >= 9 rows & survive -> +15 cubes (once/level)",
      5: "Grid >= 9 rows & survive -> +30 cubes (once/level)",
    },
    branchB: {
      3: "Grid >= 8 rows & survive -> +5 cubes (once/level)",
      4: "Grid >= 7 rows & survive -> +5 cubes (once/level)",
      5: "Grid >= 6 rows & survive -> +5 cubes (once/level)",
    },
  },
  11: {
    base: {
      1: "Grid >= 9 -> first clear destroys +1 extra row",
      2: "Grid >= 8 -> first clear destroys +1 extra row",
    },
    branchA: {
      3: "Grid >= 8 -> first clear destroys +2 extra rows",
      4: "Grid >= 8 -> first clear destroys +3 extra rows",
      5: "Grid >= 8 -> first clear destroys +4 extra rows",
    },
    branchB: {
      3: "Grid >= 7 -> first clear destroys +1 extra row",
      4: "Grid >= 6 -> first clear destroys +1 extra row",
      5: "Grid >= 5 -> first clear destroys +1 extra row",
    },
  },
  12: {
    base: {
      1: "Grid >= 9 -> next clear removes +1 extra row",
      2: "Grid >= 8 -> next clear removes +1 extra row",
    },
    branchA: {
      3: "Grid >= 8 -> every clear removes +1 extra row",
      4: "Grid >= 7 -> every clear removes +1 extra row",
      5: "Grid >= 6 -> every clear removes +1 extra row",
    },
    branchB: {
      3: "Grid >= 8 -> next clear removes +2 extra rows",
      4: "Grid >= 8 -> next clear removes +3 extra rows",
      5: "Grid >= 8 -> next clear removes +4 extra rows",
    },
  },
};

function resolveBranch(branchId?: number): "a" | "b" | "none" {
  if (branchId === 1) return "a";
  if (branchId === 2) return "b";
  return "none";
}

export function getSkillEffectDescription(
  skillId: number,
  level: number,
  branchId?: number,
): string {
  if (level <= 0) return "Not learned";

  const table = SKILL_EFFECTS[skillId];
  if (!table) return "Unknown skill";

  if (level < 3) {
    return table.base[level] ?? "";
  }

  const branch = resolveBranch(branchId);
  if (branch === "a") {
    return table.branchA[level] ?? "";
  }
  if (branch === "b") {
    return table.branchB[level] ?? "";
  }

  const branchA = table.branchA[level] ?? "";
  const branchB = table.branchB[level] ?? "";
  return `A: ${branchA} | B: ${branchB}`;
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
