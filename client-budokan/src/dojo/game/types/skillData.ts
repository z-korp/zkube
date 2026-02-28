import { Bonus } from "./bonus";

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

const WORLD_SKILL_EFFECTS: Record<number, BranchSkillDescription> = {
  6: {
    base: {
      0: "+1 move",
      1: "+2 moves",
      2: "+3 moves",
      3: "+4 moves",
      4: "+5 moves",
    },
    branchA: {
      5: "+7 moves",
      6: "+9 moves",
      7: "+11 moves",
      8: "+14 moves",
      9: "+18 moves",
      10: "+25 moves",
    },
    branchB: {
      5: "+5 moves, refund 1 move every 3 line clears",
      6: "+5 moves, refund 1 move every 2 line clears",
      7: "+6 moves, refund 1 move every 2 line clears",
      8: "+7 moves, refund 1 move every 2 line clears, +1 score on refund",
      9: "+8 moves, refund 1 move every 2 line clears, +2 score on refund",
      10: "+10 moves, refund 1 move every line clear, +3 score on refund",
    },
  },
  7: {
    base: {
      0: "+1 cube on level complete",
      1: "+1 cube on level complete",
      2: "+2 cubes on level complete",
      3: "+2 cubes on level complete",
      4: "+3 cubes on level complete",
    },
    branchA: {
      5: "+4 cubes on level complete, +1 cube per 5 lines",
      6: "+5 cubes on level complete, +1 cube per 4 lines",
      7: "+6 cubes on level complete, +1 cube per 3 lines",
      8: "+8 cubes on level complete, +1 cube per 3 lines",
      9: "+10 cubes on level complete, +2 cubes per 3 lines",
      10: "+15 cubes on level complete, +3 cubes per 2 lines",
    },
    branchB: {
      5: "+3 cubes on level complete, 3-star reward x2",
      6: "+4 cubes on level complete, 3-star reward x2",
      7: "+5 cubes on level complete, 3-star reward x2, 2-star reward x2",
      8: "+6 cubes on level complete, 3-star reward x2, 2-star reward x2",
      9: "+8 cubes on level complete, 3-star reward x3, 2-star reward x2",
      10: "+12 cubes on level complete, 3-star reward x4, 2-star reward x3",
    },
  },
  8: {
    base: {
      0: "+5% score on all points earned",
      1: "+8% score on all points earned",
      2: "+12% score on all points earned",
      3: "+16% score on all points earned",
      4: "+20% score on all points earned",
    },
    branchA: {
      5: "+25% score on all points earned",
      6: "+30% score on all points earned",
      7: "+35% score on all points earned",
      8: "+40% score on all points earned",
      9: "+50% score on all points earned",
      10: "+75% score on all points earned",
    },
    branchB: {
      5: "+20% base score, +2% score per level",
      6: "+20% base score, +3% score per level",
      7: "+20% base score, +4% score per level",
      8: "+22% base score, +5% score per level",
      9: "+25% base score, +6% score per level",
      10: "+30% base score, +8% score per level",
    },
  },
  9: {
    base: {
      0: "-1 combo threshold",
      1: "-1 combo threshold",
      2: "-1 combo threshold, +1 cube per combo",
      3: "-1 combo threshold, +1 cube per combo",
      4: "-2 combo threshold",
    },
    branchA: {
      5: "-2 combo threshold, +2 cubes per combo",
      6: "-2 combo threshold, +3 cubes per combo",
      7: "-3 combo threshold, +3 cubes per combo",
      8: "-3 combo threshold, +4 cubes per combo",
      9: "-3 combo threshold, +5 cubes per combo, double cubes above 6 lines",
      10: "-4 combo threshold, +7 cubes per combo, triple cubes above 5 lines",
    },
    branchB: {
      5: "-2 combo threshold, +1 score per line",
      6: "-2 combo threshold, +2 score per line",
      7: "-2 combo threshold, +3 score per line",
      8: "-3 combo threshold, +4 score per line",
      9: "-3 combo threshold, +5 score per line, +1 free move per combo",
      10: "-4 combo threshold, +7 score per line, +2 free moves per combo",
    },
  },
  10: {
    base: {
      0: "Start each level with 1 free move",
      1: "Start each level with 1 free move",
      2: "Start each level with 2 free moves",
      3: "Start each level with 2 free moves",
      4: "Start each level with 3 free moves",
    },
    branchA: {
      5: "Start each level with 4 free moves",
      6: "Start each level with 5 free moves",
      7: "Start each level with 6 free moves",
      8: "Start each level with 7 free moves",
      9: "Start each level with 9 free moves",
      10: "Start each level with 12 free moves",
    },
    branchB: {
      5: "Start each level with 3 free moves, regen 1 every 3 line clears",
      6: "Start each level with 3 free moves, regen 1 every 2 line clears",
      7: "Start each level with 4 free moves, regen 1 every 2 line clears",
      8: "Start each level with 4 free moves, regen 1 every line clear",
      9: "Start each level with 5 free moves, regen 1 every line clear, +1 score per free move",
      10: "Start each level with 6 free moves, regen 2 every line clear, +2 score per free move",
    },
  },
  11: {
    base: {
      0: "+1 bonus progress",
      1: "+1 bonus progress",
      2: "+1 bonus progress, +1 score on progress",
      3: "+2 bonus progress",
      4: "+2 bonus progress, +2 score on progress",
    },
    branchA: {
      5: "+3 bonus progress, +3 score on progress",
      6: "+3 bonus progress, +4 score on progress",
      7: "+4 bonus progress, +5 score on progress",
      8: "+4 bonus progress, +6 score on progress",
      9: "+5 bonus progress, +8 score on progress, +1 cube per constraint",
      10: "+6 bonus progress, +10 score on progress, +2 cubes per constraint",
    },
    branchB: {
      5: "+2 bonus progress, 25% constraint prefill",
      6: "+2 bonus progress, 30% constraint prefill",
      7: "+3 bonus progress, 35% constraint prefill",
      8: "+3 bonus progress, 40% constraint prefill",
      9: "+4 bonus progress, 50% constraint prefill, +1 cube per constraint",
      10: "+5 bonus progress, 60% constraint prefill, +2 cubes per constraint",
    },
  },
  12: {
    base: {
      0: "-1 difficulty tier",
      1: "-1 difficulty tier",
      2: "-1 difficulty tier, +1 score per line",
      3: "-2 difficulty tiers",
      4: "-2 difficulty tiers, +1 score per line",
    },
    branchA: {
      5: "-3 difficulty tiers",
      6: "-3 difficulty tiers, +2 score per line",
      7: "-4 difficulty tiers",
      8: "-4 difficulty tiers, +3 score per line",
      9: "-5 difficulty tiers, +4 score per line, +1 cube per level",
      10: "-6 difficulty tiers, +5 score per line, +2 cubes per level",
    },
    branchB: {
      5: "-2 difficulty tiers, +1 guaranteed gap",
      6: "-2 difficulty tiers, +2 guaranteed gaps",
      7: "-3 difficulty tiers, +2 guaranteed gaps",
      8: "-3 difficulty tiers, +2 guaranteed gaps, +1 cube per 10 lines",
      9: "-3 difficulty tiers, +3 guaranteed gaps, +2 cubes per 10 lines",
      10: "-4 difficulty tiers, +4 guaranteed gaps, +3 cubes per 10 lines",
    },
  },
  13: {
    base: {
      0: "+1 score per consecutive clear",
      1: "+1 score per consecutive clear",
      2: "+2 score per consecutive clear",
      3: "+2 score per consecutive clear",
      4: "+3 score per consecutive clear",
    },
    branchA: {
      5: "+4 score per consecutive clear, +1 cube on 3+ line clears",
      6: "+5 score per consecutive clear, +1 cube per 3+ line clears",
      7: "+6 score per consecutive clear, +2 cubes per 3+ line clears",
      8: "+8 score per consecutive clear, +2 cubes per 3+ line clears",
      9: "+10 score per consecutive clear, +3 cubes per 3+ line clears, clear 1 row",
      10: "+12 score per consecutive clear, +4 cubes per 3+ line clears, clear 2 rows",
    },
    branchB: {
      5: "+3 score per consecutive clear, +1 move refund",
      6: "+4 score per consecutive clear, +1 move refund",
      7: "+5 score per consecutive clear, +1 move refund, +1 combo on streak",
      8: "+6 score per consecutive clear, +2 move refunds, +1 combo on streak",
      9: "+8 score per consecutive clear, +2 move refunds, +2 combo on streak",
      10: "+10 score per consecutive clear, +3 move refunds, +3 combo on streak",
    },
  },
  14: {
    base: {
      0: "When grid height >= 7: +2 score per clear",
      1: "When grid height >= 7: +3 score per clear",
      2: "When grid height >= 7: +4 score per clear",
      3: "When grid height >= 7: +5 score per clear",
      4: "When grid height >= 7: +6 score per clear, +1 cube per clear",
    },
    branchA: {
      5: "When grid height >= 7: +8 score per clear, +2 cubes per clear",
      6: "When grid height >= 7: +10 score per clear, +2 cubes per clear",
      7: "When grid height >= 7: +12 score per clear, +3 cubes per clear",
      8: "When grid height >= 7: +15 score per clear, +3 cubes per clear",
      9: "When grid height >= 7: +20 score per clear, +4 cubes per clear, +1 free move on 8+ lines",
      10: "When grid height >= 7: +25 score per clear, +6 cubes per clear, +2 free moves on 8+ lines",
    },
    branchB: {
      5: "When grid height >= 8: +6 score per clear, combo x2",
      6: "When grid height >= 8: +7 score per clear, combo x2",
      7: "When grid height >= 7: +8 score per clear, combo x2",
      8: "When grid height >= 7: +10 score per clear, combo x2, +1 free move on 7+ lines",
      9: "When grid height >= 7: +12 score per clear, combo x3, +2 free moves on 7+ lines",
      10: "When grid height >= 7: +15 score per clear, combo x4, +3 free moves on 7+ lines",
    },
  },
  15: {
    base: {
      0: "+1 score per 5 levels completed",
      1: "+1 score per 4 levels completed",
      2: "+1 score per 3 levels completed",
      3: "+2 score per 3 levels completed",
      4: "+2 score per 3 levels completed, +1 cube per 10 levels",
    },
    branchA: {
      5: "+3 score per 3 levels completed, +1 cube per 5 levels",
      6: "+3 score per 3 levels completed, +2 cubes per 5 levels",
      7: "+4 score per 3 levels completed, +2 cubes per 5 levels",
      8: "+5 score per 3 levels completed, +3 cubes per 5 levels",
      9: "+6 score per 2 levels completed, +4 cubes per 5 levels, +1 free move per 10 levels",
      10: "+8 score per 2 levels completed, +6 cubes per 5 levels, +2 free moves per 10 levels",
    },
    branchB: {
      5: "+2 score per 3 levels completed, +1 score per unique skill",
      6: "+2 score per 3 levels completed, +1 score per unique skill",
      7: "+3 score per 3 levels completed, +2 score per unique skill",
      8: "+3 score per 3 levels completed, +2 score per unique skill, +1 free move per 10 levels",
      9: "+4 score per 3 levels completed, +3 score per unique skill, +2 free moves per 10 levels",
      10: "+5 score per 3 levels completed, +4 score per unique skill, +3 free moves per 10 levels",
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
  if (skillId >= 1 && skillId <= 5) {
    return Bonus.fromContractValue(skillId).getEffect(level);
  }

  const table = WORLD_SKILL_EFFECTS[skillId];
  if (!table) return "Unknown skill";

  if (level < 5) {
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
  return `Branch A: ${branchA} | Branch B: ${branchB}`;
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
