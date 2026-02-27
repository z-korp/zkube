/**
 * vNext Skill Effect Descriptions — mirrors Cairo helpers/skill_effects.cairo.
 *
 * Provides human-readable effect strings for all 12 skills × 5 levels × 2 branches.
 * Used by SkillTreePage and DraftPage for tooltips and detail modals.
 *
 * Authoritative spec: docs/SKILL_TREE_REFERENCE.md
 */

/**
 * Get a human-readable description of a skill's effect at a given level and branch.
 *
 * @param skillId  1-12 (matching Cairo SkillIds constants)
 * @param level    1-5 (1-indexed, displayed level)
 * @param branchId 0=A, 1=B, undefined=pre-branch (levels 1-2)
 */
export function getSkillEffectDescription(
  skillId: number,
  level: number,
  branchId?: number,
): string {
  if (level <= 0) return "Not learned";

  switch (skillId) {
    case 1:
      return comboSurgeDesc(level, branchId ?? 0);
    case 2:
      return momentumScalingDesc(level, branchId ?? 0);
    case 3:
      return harvestDesc(level, branchId ?? 0);
    case 4:
      return tsunamiDesc(level, branchId ?? 0);
    case 5:
      return rhythmDesc(level, branchId ?? 0);
    case 6:
      return cascadeMasteryDesc(level, branchId ?? 0);
    case 7:
      return overdriveDesc(level, branchId ?? 0);
    case 8:
      return endgameFocusDesc(level, branchId ?? 0);
    case 9:
      return highStakesDesc(level, branchId ?? 0);
    case 10:
      return gambitDesc(level, branchId ?? 0);
    case 11:
      return structuralIntegrityDesc(level, branchId ?? 0);
    case 12:
      return gridHarmonyDesc(level, branchId ?? 0);
    default:
      return "Unknown skill";
  }
}

/* ------------------------------------------------------------------ */
/*  Active Skills (IDs 1-4)                                            */
/* ------------------------------------------------------------------ */

// ID 1: Combo Surge (Tempo)
function comboSurgeDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "+1 combo depth";
    case 2:
      return "+2 combo depth";
    case 3:
      return branch === 0
        ? "+3 combo depth"
        : "+1 combo depth for the full level";
    case 4:
      return branch === 0
        ? "+5 combo depth"
        : "+2 combo depth for the full level";
    case 5:
      return branch === 0
        ? "+7 combo depth"
        : "+4 combo depth for the full level";
    default:
      return "";
  }
}

// ID 2: Momentum Scaling (Scaling)
function momentumScalingDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "+1 score per zone cleared";
    case 2:
      return "+2 score per zone cleared";
    case 3:
      return branch === 0
        ? "+3 score per zone cleared"
        : "+5 flat score";
    case 4:
      return branch === 0
        ? "+5 score per zone cleared"
        : "+10 flat score";
    case 5:
      return branch === 0
        ? "+10 score per zone cleared"
        : "+20 flat score";
    default:
      return "";
  }
}

// ID 3: Harvest (Risk)
function harvestDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Destroy 2 random blocks → cubes per block size";
    case 2:
      return "Destroy 3 random blocks → cubes per block size";
    case 3:
      return branch === 0
        ? "Destroy 5 random blocks → cubes per block size"
        : "Add 1 line → +10 cubes";
    case 4:
      return branch === 0
        ? "Destroy 7 random blocks → cubes per block size"
        : "Add 2 lines → +20 cubes";
    case 5:
      return branch === 0
        ? "Destroy 10 random blocks → cubes per block size"
        : "Add 3 lines → +40 cubes";
    default:
      return "";
  }
}

// ID 4: Tsunami (Control)
function tsunamiDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Clear 1 targeted block";
    case 2:
      return "Clear 2 targeted blocks";
    case 3:
      return branch === 0
        ? "Clear 3 targeted blocks"
        : "Destroy 1 targeted row";
    case 4:
      return branch === 0
        ? "Clear 5 targeted blocks"
        : "Destroy 2 targeted rows";
    case 5:
      return branch === 0
        ? "Clear all blocks of targeted size"
        : "Destroy 3 targeted rows";
    default:
      return "";
  }
}

/* ------------------------------------------------------------------ */
/*  Passive Skills (IDs 5-12)                                          */
/* ------------------------------------------------------------------ */

// ID 5: Rhythm (Tempo)
function rhythmDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Every 12 combo streak → +1 combo depth";
    case 2:
      return "Every 10 combo streak → +1 combo depth";
    case 3:
      return branch === 0
        ? "Every 8 streak → +1 combo depth"
        : "Every 10 streak → +2 combo depth";
    case 4:
      return branch === 0
        ? "Every 6 streak → +1 combo depth"
        : "Every 10 streak → +3 combo depth";
    case 5:
      return branch === 0
        ? "Every 4 streak → +1 combo depth"
        : "Every 10 streak → +4 combo depth";
    default:
      return "";
  }
}

// ID 6: Cascade Mastery (Tempo)
function cascadeMasteryDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Cascade depth ≥ 5 → +1 combo depth";
    case 2:
      return "Cascade depth ≥ 4 → +1 combo depth";
    case 3:
      return branch === 0
        ? "Cascade depth ≥ 4 → +2 combo depth"
        : "Cascade depth ≥ 3 → +1 combo depth";
    case 4:
      return branch === 0
        ? "Cascade depth ≥ 4 → +3 combo depth"
        : "Cascade depth ≥ 2 → +1 combo depth";
    case 5:
      return branch === 0
        ? "Cascade depth ≥ 4 → +4 combo depth"
        : "Cascade depth ≥ 2 → +2 combo depth";
    default:
      return "";
  }
}

// ID 7: Overdrive (Scaling)
function overdriveDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Charge cadence: every 4 levels";
    case 2:
      return "Charge cadence: every 3 levels";
    case 3:
      return branch === 0
        ? "Charge cadence: every 2 levels"
        : "Charge cadence: every 3 levels + start with +1 charge";
    case 4:
      return branch === 0
        ? "Charge cadence: every 2 levels + start with +1 charge"
        : "Charge cadence: every 3 levels + start with +2 charges";
    case 5:
      return branch === 0
        ? "Charge cadence: every 1 level"
        : "Charge cadence: every 2 levels + start with +2 charges";
    default:
      return "";
  }
}

// ID 8: Endgame Focus (Scaling)
function endgameFocusDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "+1 score at level start (levels ≥ 10)";
    case 2:
      return "+2 score at level start (levels ≥ 20)";
    case 3:
      return branch === 0
        ? "+0.2 score per level cleared at level start"
        : "+5 score at level start (levels ≥ 25)";
    case 4:
      return branch === 0
        ? "+0.3 score per level cleared at level start"
        : "+10 score at level start (levels ≥ 30)";
    case 5:
      return branch === 0
        ? "+0.5 score per level cleared at level start"
        : "+20 score at level start (levels ≥ 40)";
    default:
      return "";
  }
}

// ID 9: High Stakes (Risk)
function highStakesDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Grid ≥ 9 rows → +1 cube per clear";
    case 2:
      return "Grid ≥ 8 rows → +1 cube per clear";
    case 3:
      return branch === 0
        ? "Grid ≥ 8 rows → +3 cubes per clear"
        : "Grid ≥ 7 rows → +1 cube per clear";
    case 4:
      return branch === 0
        ? "Grid ≥ 8 rows → +5 cubes per clear"
        : "Grid ≥ 6 rows → +1 cube per clear";
    case 5:
      return branch === 0
        ? "Grid ≥ 8 rows → +10 cubes per clear"
        : "Grid ≥ 5 rows → +1 cube per clear";
    default:
      return "";
  }
}

// ID 10: Gambit (Risk)
function gambitDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Grid reaches ≥ 9 rows & survive → +3 cubes (once/level)";
    case 2:
      return "Grid reaches ≥ 9 rows & survive → +5 cubes (once/level)";
    case 3:
      return branch === 0
        ? "Grid ≥ 9 rows & survive → +10 cubes (once/level)"
        : "Grid ≥ 8 rows & survive → +5 cubes (once/level)";
    case 4:
      return branch === 0
        ? "Grid ≥ 9 rows & survive → +15 cubes (once/level)"
        : "Grid ≥ 7 rows & survive → +5 cubes (once/level)";
    case 5:
      return branch === 0
        ? "Grid ≥ 9 rows & survive → +30 cubes (once/level)"
        : "Grid ≥ 6 rows & survive → +5 cubes (once/level)";
    default:
      return "";
  }
}

// ID 11: Structural Integrity (Control)
function structuralIntegrityDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Grid ≥ 9 → first clear destroys +1 extra row";
    case 2:
      return "Grid ≥ 8 → first clear destroys +1 extra row";
    case 3:
      return branch === 0
        ? "Grid ≥ 8 → first clear destroys +2 extra rows"
        : "Grid ≥ 7 → first clear destroys +1 extra row";
    case 4:
      return branch === 0
        ? "Grid ≥ 8 → first clear destroys +3 extra rows"
        : "Grid ≥ 6 → first clear destroys +1 extra row";
    case 5:
      return branch === 0
        ? "Grid ≥ 8 → first clear destroys +4 extra rows"
        : "Grid ≥ 5 → first clear destroys +1 extra row";
    default:
      return "";
  }
}

// ID 12: Grid Harmony (Control)
function gridHarmonyDesc(level: number, branch: number): string {
  switch (level) {
    case 1:
      return "Grid ≥ 9 → next clear removes +1 extra row";
    case 2:
      return "Grid ≥ 8 → next clear removes +1 extra row";
    case 3:
      return branch === 0
        ? "Grid ≥ 8 → every clear removes +1 extra row"
        : "Grid ≥ 8 → next clear removes +2 extra rows";
    case 4:
      return branch === 0
        ? "Grid ≥ 7 → every clear removes +1 extra row"
        : "Grid ≥ 8 → next clear removes +3 extra rows";
    case 5:
      return branch === 0
        ? "Grid ≥ 6 → every clear removes +1 extra row"
        : "Grid ≥ 8 → next clear removes +4 extra rows";
    default:
      return "";
  }
}
