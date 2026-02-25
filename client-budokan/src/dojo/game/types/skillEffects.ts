/**
 * Skill effect descriptions derived from contracts/src/helpers/skill_effects.cairo.
 * Each skill has levels 0-10. Levels 0-4 have no branch. Levels 5-10 have branch A (1) and B (2).
 */

// ─── Bonus Skills (1-5) ───────────────────────────────────────────────────────

function comboDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 combo on next move",
    "1": "+2 combo on next move",
    "2": "+3 combo on next move",
    "3": "+4 combo on next move",
    "4": "+5 combo on next move",
    "5_1": "+6 combo, +1 score per line cleared",
    "5_2": "+5 combo, 33% chance to keep charge",
    "6_1": "+7 combo, +2 score per line cleared",
    "6_2": "+6 combo, 33% chance to keep charge",
    "7_1": "+8 combo, +3 score per line cleared",
    "7_2": "+7 combo, 50% chance to keep charge",
    "8_1": "+9 combo, +4 score per line cleared",
    "8_2": "+8 combo, 50% chance to keep charge",
    "9_1": "+10 combo, +5 score per line, +1 cube per use",
    "9_2": "+9 combo, 67% chance to keep charge, +1 free move on proc",
    "10_1": "+12 combo, +6 score per line, charges all bonuses",
    "10_2": "+10 combo, 100% keep charge, +2 free moves on proc",
  };
  return resolve(data, level, branch);
}

function scoreDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+5 instant score",
    "1": "+8 instant score",
    "2": "+12 instant score",
    "3": "+18 instant score",
    "4": "+25 instant score",
    "5_1": "+30 score, +1 combo added",
    "5_2": "+30 score, doubles if ≤5 moves left",
    "6_1": "+35 score, +1 combo added",
    "6_2": "+35 score, doubles if ≤5 moves left",
    "7_1": "+40 score, +2 combo added",
    "7_2": "+42 score, doubles if ≤7 moves left",
    "8_1": "+50 score, +2 combo added",
    "8_2": "+50 score, doubles if ≤7 moves left",
    "9_1": "+60 score, +3 combo added, +1 cube per use",
    "9_2": "+60 score, doubles if ≤10 moves left, +1 cube per use",
    "10_1": "+80 score, +4 combo added, score/10 = cubes",
    "10_2": "+80 score, doubles if ≤10 moves left, triples, +2 cubes per use",
  };
  return resolve(data, level, branch);
}

function harvestDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "Destroy blocks of chosen size, +1 cube per block",
    "1": "+1 cube/block, also destroys ±2 adjacent sizes",
    "2": "+2 cubes per block destroyed",
    "3": "+2 cubes/block, also destroys ±3 adjacent sizes",
    "4": "+3 cubes per block destroyed",
    "5_1": "+3 cubes/block, destroys ±1 adjacent sizes",
    "5_2": "+4 cubes/block, only targets small blocks",
    "6_1": "+4 cubes/block, destroys ±1 adjacent sizes",
    "6_2": "+5 cubes/block, only targets small blocks",
    "7_1": "+5 cubes/block, destroys ±1 adjacent sizes",
    "7_2": "+6 cubes/block, only small blocks, +1 score/block",
    "8_1": "+6 cubes/block, destroys ±1 adjacent, +1 score/block",
    "8_2": "+8 cubes/block, only small blocks, +2 score/block",
    "9_1": "+8 cubes/block, ±1 adjacent, +2 score/block, triggers gravity",
    "9_2": "+10 cubes/block, only small, +3 score/block, +1 free move",
    "10_1": "+10 cubes/block, ±2 adjacent, +3 score/block, triggers gravity",
    "10_2": "+15 cubes/block, only small, +5 score/block, +2 free moves",
  };
  return resolve(data, level, branch);
}

function waveDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "Clear 1 row",
    "1": "Clear 1 row, +1 score per block",
    "2": "Clear 2 rows",
    "3": "Clear 2 rows, +2 score per block",
    "4": "Clear 3 rows",
    "5_1": "Clear 3 rows, +3 score per block",
    "5_2": "Clear 2 rows, +1 free move",
    "6_1": "Clear 4 rows, +3 score per block",
    "6_2": "Clear 2 rows, +2 free moves",
    "7_1": "Clear 4 rows, +4 score per block",
    "7_2": "Clear 3 rows, +2 free moves",
    "8_1": "Clear 5 rows, +5 score per block",
    "8_2": "Clear 3 rows, +3 free moves",
    "9_1": "Clear 5 rows, +6 score/block, +1 cube per row",
    "9_2": "Clear 4 rows, +3 free moves, +1 combo",
    "10_1": "Clear 6 rows, +8 score/block, +2 cubes/row, auto-adds line",
    "10_2": "Clear 5 rows, +4 free moves, +2 combo, 100% keep charge",
  };
  return resolve(data, level, branch);
}

function supplyDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "Add 1 line (no move cost)",
    "1": "Add 1 line, easier difficulty",
    "2": "Add 2 lines",
    "3": "Add 2 lines, easier difficulty",
    "4": "Add 3 lines",
    "5_1": "Add 3 lines, -2 difficulty levels",
    "5_2": "Add 3 lines, +2 score per line",
    "6_1": "Add 4 lines, -2 difficulty levels",
    "6_2": "Add 3 lines, +3 score per line",
    "7_1": "Add 4 lines, -3 difficulty levels",
    "7_2": "Add 4 lines, +4 score per line",
    "8_1": "Add 5 lines, -3 difficulty levels",
    "8_2": "Add 4 lines, +5 score/line, +1 cube",
    "9_1": "Add 5 lines, very easy lines, +1 free move",
    "9_2": "Add 5 lines, +6 score/line, +2 cubes",
    "10_1": "Add 6 lines, very easy lines, +2 free moves",
    "10_2": "Add 6 lines, +8 score/line, +3 cubes",
  };
  return resolve(data, level, branch);
}

// ─── World / Passive Skills (6-15) ───────────────────────────────────────────

function tempoDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 extra move per level",
    "1": "+2 extra moves per level",
    "2": "+3 extra moves per level",
    "3": "+4 extra moves per level",
    "4": "+5 extra moves per level",
    "5_1": "+7 extra moves per level",
    "5_2": "+5 extra moves, refund 1 move every 3 clears",
    "6_1": "+9 extra moves per level",
    "6_2": "+5 extra moves, refund 1 move every 2 clears",
    "7_1": "+11 extra moves per level",
    "7_2": "+6 extra moves, refund 1 move every 2 clears",
    "8_1": "+14 extra moves per level",
    "8_2": "+7 extra moves, refund every 2 clears, +1 score on refund",
    "9_1": "+18 extra moves per level",
    "9_2": "+8 extra moves, refund every 2 clears, +2 score on refund",
    "10_1": "+25 extra moves per level",
    "10_2": "+10 extra moves, refund every clear, +3 score on refund",
  };
  return resolve(data, level, branch);
}

function fortuneDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 flat cube on level complete",
    "1": "+1 flat cube on level complete",
    "2": "+2 flat cubes on level complete",
    "3": "+2 flat cubes on level complete",
    "4": "+3 flat cubes on level complete",
    "5_1": "+4 flat cubes, +1 cube per 5 lines cleared",
    "5_2": "+3 flat cubes, ×2 cubes on 3-star",
    "6_1": "+5 flat cubes, +1 cube per 4 lines cleared",
    "6_2": "+4 flat cubes, ×2 cubes on 3-star",
    "7_1": "+6 flat cubes, +1 cube per 3 lines cleared",
    "7_2": "+5 flat cubes, ×2 cubes on 3-star, ×2 on 2-star",
    "8_1": "+8 flat cubes, +1 cube per 3 lines cleared",
    "8_2": "+6 flat cubes, ×2 cubes on 3-star, ×2 on 2-star",
    "9_1": "+10 flat cubes, +2 cubes per 3 lines cleared",
    "9_2": "+8 flat cubes, ×3 cubes on 3-star, ×2 on 2-star",
    "10_1": "+15 flat cubes, +3 cubes per 2 lines cleared",
    "10_2": "+12 flat cubes, ×4 cubes on 3-star, ×3 on 2-star",
  };
  return resolve(data, level, branch);
}

function surgeDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+5% score bonus",
    "1": "+8% score bonus",
    "2": "+12% score bonus",
    "3": "+16% score bonus",
    "4": "+20% score bonus",
    "5_1": "+25% score bonus (flat)",
    "5_2": "+20% base, +2% per level cleared",
    "6_1": "+30% score bonus (flat)",
    "6_2": "+20% base, +3% per level cleared",
    "7_1": "+35% score bonus (flat)",
    "7_2": "+20% base, +4% per level cleared",
    "8_1": "+40% score bonus (flat)",
    "8_2": "+22% base, +5% per level cleared",
    "9_1": "+50% score bonus (flat)",
    "9_2": "+25% base, +6% per level cleared",
    "10_1": "+75% score bonus (flat)",
    "10_2": "+30% base, +8% per level cleared",
  };
  return resolve(data, level, branch);
}

function catalystDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "Combo threshold -1 line",
    "1": "Combo threshold -1 line",
    "2": "Combo threshold -1, +1 cube on combo trigger",
    "3": "Combo threshold -1, +1 cube on combo trigger",
    "4": "Combo threshold -2 lines",
    "5_1": "Threshold -2, +2 cubes on combo",
    "5_2": "Threshold -2, +1 score on combo",
    "6_1": "Threshold -2, +3 cubes on combo",
    "6_2": "Threshold -2, +2 score on combo",
    "7_1": "Threshold -3, +3 cubes on combo",
    "7_2": "Threshold -2, +3 score on combo",
    "8_1": "Threshold -3, +4 cubes on combo",
    "8_2": "Threshold -3, +4 score on combo",
    "9_1": "Threshold -3, +5 cubes, double cubes above 6-combo",
    "9_2": "Threshold -3, +5 score, +1 free move on combo",
    "10_1": "Threshold -4, +7 cubes, triple cubes above 5-combo",
    "10_2": "Threshold -4, +7 score, +2 free moves on combo",
  };
  return resolve(data, level, branch);
}

function resilienceDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 free move (no penalty)",
    "1": "+1 free move",
    "2": "+2 free moves",
    "3": "+2 free moves",
    "4": "+3 free moves",
    "5_1": "+4 free moves (flat budget)",
    "5_2": "+3 free moves, regen 1 move every 3 clears",
    "6_1": "+5 free moves",
    "6_2": "+3 free moves, regen 1 move every 2 clears",
    "7_1": "+6 free moves",
    "7_2": "+4 free moves, regen 1 move every 2 clears",
    "8_1": "+7 free moves",
    "8_2": "+4 free moves, regen 1 move every clear",
    "9_1": "+9 free moves",
    "9_2": "+5 free moves, regen every clear, +1 score per free move",
    "10_1": "+12 free moves",
    "10_2": "+6 free moves, regen 2 per clear, +2 score per free move",
  };
  return resolve(data, level, branch);
}

function focusDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 bonus constraint progress",
    "1": "+1 bonus constraint progress",
    "2": "+1 bonus progress, +1 score on progress",
    "3": "+2 bonus constraint progress",
    "4": "+2 bonus progress, +2 score on progress",
    "5_1": "+3 bonus progress, +3 score on progress",
    "5_2": "+2 bonus progress, constraint 25% pre-filled",
    "6_1": "+3 bonus progress, +4 score on progress",
    "6_2": "+2 bonus progress, constraint 30% pre-filled",
    "7_1": "+4 bonus progress, +5 score on progress",
    "7_2": "+3 bonus progress, constraint 35% pre-filled",
    "8_1": "+4 bonus progress, +6 score on progress",
    "8_2": "+3 bonus progress, constraint 40% pre-filled",
    "9_1": "+5 bonus progress, +8 score, +1 cube per constraint",
    "9_2": "+4 bonus progress, 50% pre-filled, +1 cube per constraint",
    "10_1": "+6 bonus progress, +10 score, +2 cubes per constraint",
    "10_2": "+5 bonus progress, 60% pre-filled, +2 cubes per constraint",
  };
  return resolve(data, level, branch);
}

function expansionDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "-1 difficulty level on generated lines",
    "1": "-1 difficulty level",
    "2": "-1 difficulty, +1 score per generated line",
    "3": "-2 difficulty levels",
    "4": "-2 difficulty, +1 score per generated line",
    "5_1": "-3 difficulty levels",
    "5_2": "-2 difficulty, +1 guaranteed gap in lines",
    "6_1": "-3 difficulty, +2 score per generated line",
    "6_2": "-2 difficulty, +2 guaranteed gaps",
    "7_1": "-4 difficulty levels",
    "7_2": "-3 difficulty, +2 guaranteed gaps",
    "8_1": "-4 difficulty, +3 score per generated line",
    "8_2": "-3 difficulty, +2 gaps, +1 cube per 10 lines",
    "9_1": "-5 difficulty, +4 score/line, +1 cube per level",
    "9_2": "-3 difficulty, +3 gaps, +2 cubes per 10 lines",
    "10_1": "-6 difficulty, +5 score/line, +2 cubes per level",
    "10_2": "-4 difficulty, +4 gaps, +3 cubes per 10 lines",
  };
  return resolve(data, level, branch);
}

function momentumDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 score per consecutive clear",
    "1": "+1 score per consecutive clear",
    "2": "+2 score per consecutive clear",
    "3": "+2 score per consecutive clear",
    "4": "+3 score per consecutive clear",
    "5_1": "+4 score/consec, +1 cube every 3 streak",
    "5_2": "+3 score/consec, refund 1 move on streak",
    "6_1": "+5 score/consec, +1 cube every 3 streak",
    "6_2": "+4 score/consec, refund 1 move on streak",
    "7_1": "+6 score/consec, +2 cubes every 3 streak",
    "7_2": "+5 score/consec, refund 1 move, +1 combo on streak",
    "8_1": "+8 score/consec, +2 cubes every 3 streak",
    "8_2": "+6 score/consec, refund 2 moves, +1 combo on streak",
    "9_1": "+10 score/consec, +3 cubes/3 streak, clear 1 row on streak",
    "9_2": "+8 score/consec, refund 2 moves, +2 combo on streak",
    "10_1": "+12 score/consec, +4 cubes/3 streak, clear 2 rows on streak",
    "10_2": "+10 score/consec, refund 3 moves, +3 combo on streak",
  };
  return resolve(data, level, branch);
}

function adrenalineDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "When grid ≥7 rows: +2 score per clear",
    "1": "When grid ≥7 rows: +3 score per clear",
    "2": "When grid ≥7 rows: +4 score per clear",
    "3": "When grid ≥7 rows: +5 score per clear",
    "4": "When grid ≥7 rows: +6 score per clear, +1 cube/clear",
    "5_1": "Grid ≥7: +8 score, +2 cubes per clear",
    "5_2": "Grid ≥8: +6 score, ×2 combo multiplier",
    "6_1": "Grid ≥7: +10 score, +2 cubes per clear",
    "6_2": "Grid ≥8: +7 score, ×2 combo multiplier",
    "7_1": "Grid ≥7: +12 score, +3 cubes per clear",
    "7_2": "Grid ≥7: +8 score, ×2 combo multiplier",
    "8_1": "Grid ≥7: +15 score, +3 cubes per clear",
    "8_2": "Grid ≥7: +10 score, ×2 combo, +1 free move at ≥7 rows",
    "9_1": "Grid ≥7: +20 score, +4 cubes, +1 free move at ≥8 rows",
    "9_2": "Grid ≥7: +12 score, ×3 combo, +2 free moves at ≥7 rows",
    "10_1": "Grid ≥7: +25 score, +6 cubes, +2 free moves at ≥8 rows",
    "10_2": "Grid ≥7: +15 score, ×4 combo, +3 free moves at ≥7 rows",
  };
  return resolve(data, level, branch);
}

function legacyDesc(level: number, branch?: number): string {
  const data: Record<string, string> = {
    "0": "+1 score per 5 levels cleared",
    "1": "+1 score per 4 levels cleared",
    "2": "+1 score per 3 levels cleared",
    "3": "+2 score per 3 levels cleared",
    "4": "+2 score/3 levels, +1 cube per 10 levels",
    "5_1": "+3 score/3 levels, +1 cube per 5 levels",
    "5_2": "+2 score/3 levels, +1 score per unique skill",
    "6_1": "+3 score/3 levels, +2 cubes per 5 levels",
    "6_2": "+2 score/3 levels, +1 score per unique skill",
    "7_1": "+4 score/3 levels, +2 cubes per 5 levels",
    "7_2": "+3 score/3 levels, +2 score per unique skill",
    "8_1": "+5 score/3 levels, +3 cubes per 5 levels",
    "8_2": "+3 score/3 levels, +2 score/skill, +1 move per 10 levels",
    "9_1": "+6 score/2 levels, +4 cubes per 5 levels, +1 move/10 levels",
    "9_2": "+4 score/3 levels, +3 score/skill, +2 moves per 10 levels",
    "10_1": "+8 score/2 levels, +6 cubes per 5 levels, +2 moves/10 levels",
    "10_2": "+5 score/3 levels, +4 score/skill, +3 moves per 10 levels",
  };
  return resolve(data, level, branch);
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

function resolve(
  data: Record<string, string>,
  level: number,
  branch?: number,
): string {
  if (level >= 5 && branch && branch > 0) {
    return data[`${level}_${branch}`] ?? data[`${level}`] ?? "Unknown effect";
  }
  if (level >= 5 && !branch) {
    const a = data[`${level}_1`];
    const b = data[`${level}_2`];
    if (a && b) return `A: ${a} | B: ${b}`;
    return a ?? b ?? data[`${level}`] ?? "Unknown effect";
  }
  return data[`${level}`] ?? "Unknown effect";
}

// ─── Public API ───────────────────────────────────────────────────────────────

const SKILL_DESC_MAP: Record<number, (level: number, branch?: number) => string> = {
  1: comboDesc,
  2: scoreDesc,
  3: harvestDesc,
  4: waveDesc,
  5: supplyDesc,
  6: tempoDesc,
  7: fortuneDesc,
  8: surgeDesc,
  9: catalystDesc,
  10: resilienceDesc,
  11: focusDesc,
  12: expansionDesc,
  13: momentumDesc,
  14: adrenalineDesc,
  15: legacyDesc,
};

/**
 * Get a human-readable description of a skill's effect at a given level and branch.
 * Values are exact matches to the Cairo contract (skill_effects.cairo).
 *
 * @param skillId - Skill ID (1-15)
 * @param level - Skill level (0-10)
 * @param branchId - Optional branch (1=A, 2=B). Required for levels 5+.
 */
export function getSkillEffectDescription(
  skillId: number,
  level: number,
  branchId?: number,
): string {
  const fn = SKILL_DESC_MAP[skillId];
  if (!fn) return "Unknown skill";
  return fn(level, branchId);
}

/**
 * Preview what the next level would provide.
 */
export function getSkillNextLevelPreview(
  skillId: number,
  currentLevel: number,
  branchId?: number,
): string {
  if (currentLevel >= 10) return "Max level reached";
  return getSkillEffectDescription(skillId, currentLevel + 1, branchId);
}
