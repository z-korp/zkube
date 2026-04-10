/**
 * Level configuration types for the level system
 * Each level has a unique configuration based on the run seed and GameSettings
 *
 * Key properties:
 * - Same seed + same level + same settings = same config
 * - Different seed = different config sequence
 * - Level 50+ caps at max difficulty (survival mode)
 * - Points derived from moves x ratio (configurable, default 0.8 -> 1.8)
 * - Correlated variance keeps difficulty ratio constant
 * - Supports dual constraints from settings
 */

import { hash } from "starknet";
import { Difficulty, DifficultyType } from "./difficulty";
import { Constraint, ConstraintType } from "./constraint";
import { BOSS_LEVELS } from "@/dojo/game/constants";

/**
 * GameSettings interface matching the Cairo contract
 * Used for configurable game modes
 *
 * Constraint system uses budget-based generation:
 * - Regular levels generate ComboLines, BreakBlocks, or ComboStreak
 * - Type selection uses weighted distribution based on budget
 * - Boss levels use identity-based constraint types from boss.cairo
 * - Line costs: 2->3, 3->10, 4->20, 5->30, 6->40, 7->60, 8->80
 */
/**
 * Apply star_threshold_modifier (bias-128) to base 40%/70% star thresholds.
 * 128 = neutral, <128 = easier (lower %), >128 = harder (higher %).
 */
export function applyStarThresholdModifier(modifier: number): { star3Pct: number; star2Pct: number } {
  const offset = modifier - 128;
  const star3Pct = Math.max(10, Math.min(90, 40 + offset));
  const star2Pct = Math.max(star3Pct + 1, Math.min(99, 70 + offset));
  return { star3Pct, star2Pct };
}

/** Default settings ID (only games with this ID earn cubes/quests) */
export const DEFAULT_SETTINGS_ID = 0;

/** Check if a settings ID is the official default settings */
export function isDefaultSettings(settingsId: number): boolean {
  return settingsId === DEFAULT_SETTINGS_ID;
}

export interface GameSettings {
  // Settings identifier
  settingsId: number;
  // Mode
  mode: number;
  // Level Scaling
  baseMoves: number;
  maxMoves: number;
  baseRatioX100: number;
  maxRatioX100: number;
  // Difficulty Progression (tier thresholds)
  tier1Threshold: number;  // Easy starts
  tier2Threshold: number;  // Medium starts
  tier3Threshold: number;  // MediumHard starts
  tier4Threshold: number;  // Hard starts
  tier5Threshold: number;  // VeryHard starts
  tier6Threshold: number;  // Expert starts
  tier7Threshold: number;  // Master starts
  // Constraint Settings
  constraintsEnabled: boolean;
  constraintStartLevel: number;
  // Constraint Distribution (VeryEasy to Master, budget-based)
  veryeasyMinLines: number;
  masterMinLines: number;
  veryeasyMaxLines: number;
  masterMaxLines: number;
  veryeasyBudgetMin: number;
  veryeasyBudgetMax: number;
  masterBudgetMin: number;
  masterBudgetMax: number;
  veryeasyMinTimes: number;
  masterMinTimes: number;
  // Block Distribution (VeryEasy to Master)
  veryeasySize1Weight: number;
  veryeasySize2Weight: number;
  veryeasySize3Weight: number;
  veryeasySize4Weight: number;
  veryeasySize5Weight: number;
  masterSize1Weight: number;
  masterSize2Weight: number;
  masterSize3Weight: number;
  masterSize4Weight: number;
  masterSize5Weight: number;
  // Variance Settings
  earlyVariancePercent: number;
  midVariancePercent: number;
  lateVariancePercent: number;
  // Level Tier Thresholds
  earlyLevelThreshold: number;
  midLevelThreshold: number;
  // Level Cap
  levelCap: number;
  // Zone assignment
  zoneId: number;
  // Fixed mutators
  activeMutatorId: number;
  passiveMutatorId: number;
  // Boss
  bossId: number;
  // Endless mode
  endlessDifficultyThresholds: number[];
  endlessScoreMultipliers: number[];
  // Legacy compat (kept for client-side star threshold calc)
  star3Percent: number;
  star2Percent: number;
}

/**
 * Default settings matching Cairo's GameSettingsDefaults
 * Uses budget-based constraint system with weighted type selection
 */
export const DEFAULT_SETTINGS: GameSettings = {
  settingsId: DEFAULT_SETTINGS_ID,
  mode: 1, // Increasing
  // Level Scaling
  baseMoves: 20,
  maxMoves: 60,
  baseRatioX100: 80, // 0.80
  maxRatioX100: 180, // 1.80
  // Difficulty Progression (non-linear tier thresholds)
  tier1Threshold: 4,   // Easy starts at level 4
  tier2Threshold: 8,   // Medium starts at level 8
  tier3Threshold: 12,  // MediumHard starts at level 12
  tier4Threshold: 18,  // Hard starts at level 18
  tier5Threshold: 25,  // VeryHard starts at level 25
  tier6Threshold: 35,  // Expert starts at level 35
  tier7Threshold: 45,  // Master starts at level 45
  // Constraint Settings
  constraintsEnabled: true,
  constraintStartLevel: 3,  // Constraints start at level 3
  // Constraint Distribution (VeryEasy to Master, budget-based)
  // Line costs: 2->3, 3->10, 4->20, 5->30, 6->40, 7->60, 8->80
  veryeasyMinLines: 2,
  masterMinLines: 4,
  veryeasyMaxLines: 2,   // Only 2 lines early (trivial)
  masterMaxLines: 6,     // Up to 6 lines at Master
  veryeasyBudgetMin: 1,  // Min budget early (1 = "2 lines x 1 time")
  veryeasyBudgetMax: 3,  // Max ~"2 lines x 2-3 times" at VeryEasy
  masterBudgetMin: 25,   // Hard floor at Master
  masterBudgetMax: 40,   // Allows 6x3, 5x5, 4x10 at Master
  veryeasyMinTimes: 1,   // At least 1 time
  masterMinTimes: 2,     // At least 2 times at Master
  // Block Distribution (VeryEasy to Master)
  veryeasySize1Weight: 20,
  veryeasySize2Weight: 33,
  veryeasySize3Weight: 27,
  veryeasySize4Weight: 13,
  veryeasySize5Weight: 7,
  masterSize1Weight: 7,
  masterSize2Weight: 13,
  masterSize3Weight: 20,
  masterSize4Weight: 27,
  masterSize5Weight: 33,
  // Variance Settings (consistent ±5% across all levels)
  earlyVariancePercent: 5,
  midVariancePercent: 5,
  lateVariancePercent: 5,
  // Level Tier Thresholds
  earlyLevelThreshold: 5,
  midLevelThreshold: 25,
  // Level Cap
  levelCap: 50,
  zoneId: 0,
  activeMutatorId: 0,
  passiveMutatorId: 0,
  bossId: 1,
  endlessDifficultyThresholds: [0, 15, 40, 80, 150, 280, 500, 900],
  endlessScoreMultipliers: [10, 12, 14, 17, 20, 25, 33, 40],
  star3Percent: 40,
  star2Percent: 70,
};

export interface LevelConfig {
  /** Level number (1-255) */
  level: number;
  /** Points required to complete this level */
  pointsRequired: number;
  /** Maximum moves allowed (base, before extra moves) */
  maxMoves: number;
  /** Block generation difficulty */
  difficulty: Difficulty;
  /** Primary constraint (objective) */
  constraint: Constraint;
  /** Secondary constraint (can be None for single constraint levels) */
  constraint2: Constraint;
  /** Moves threshold for 3 cubes */
  star3Threshold: number;
  /** Moves threshold for 2 cubes */
  star2Threshold: number;
}

export class Level {
  public level: number;
  public pointsRequired: number;
  public maxMoves: number;
  public difficulty: Difficulty;
  public constraint: Constraint;
  public constraint2: Constraint;
  public star3Threshold: number;
  public star2Threshold: number;

  constructor(config: LevelConfig) {
    this.level = config.level;
    this.pointsRequired = config.pointsRequired;
    this.maxMoves = config.maxMoves;
    this.difficulty = config.difficulty;
    this.constraint = config.constraint;
    this.constraint2 = config.constraint2;
    this.star3Threshold = config.star3Threshold;
    this.star2Threshold = config.star2Threshold;
  }

  /** Calculate cubes earned based on moves used */
  calculateStars(movesUsed: number): number {
    if (movesUsed <= this.star3Threshold) {
      return 3;
    } else if (movesUsed <= this.star2Threshold) {
      return 2;
    } else {
      return 1;
    }
  }

  /** Get bonus count earned based on cubes */
  static getBonusReward(cubes: number): number {
    switch (cubes) {
      case 3:
        return 2;
      case 2:
        return 1;
      default:
        return 0;
    }
  }

  /** Check if level is complete (score + both constraints) */
  isComplete(
    currentScore: number,
    constraintProgress: number,
    constraint2Progress: number,
    bonusUsed: boolean
  ): boolean {
    return (
      currentScore >= this.pointsRequired &&
      this.constraint.isSatisfied(constraintProgress, bonusUsed) &&
      this.constraint2.isSatisfied(constraint2Progress, bonusUsed)
    );
  }

  /** Check if level failed */
  isFailed(
    currentScore: number,
    currentMoves: number,
    constraintProgress: number,
    constraint2Progress: number,
    bonusUsed: boolean,
    extraMoves: number = 0
  ): boolean {
    const effectiveMaxMoves = this.maxMoves + extraMoves;
    return (
      currentMoves >= effectiveMaxMoves &&
      !this.isComplete(
        currentScore,
        constraintProgress,
        constraint2Progress,
        bonusUsed
      )
    );
  }

  /** Get remaining moves */
  remainingMoves(currentMoves: number, extraMoves: number = 0): number {
    const effectiveMaxMoves = this.maxMoves + extraMoves;
    return Math.max(0, effectiveMaxMoves - currentMoves);
  }

  /** Get progress percentage (0-100) */
  scoreProgressPercent(currentScore: number): number {
    if (currentScore >= this.pointsRequired) {
      return 100;
    }
    return Math.floor((currentScore * 100) / this.pointsRequired);
  }

  /** Get current potential cubes (based on current move count) */
  potentialStars(currentMoves: number): number {
    if (currentMoves <= this.star3Threshold) {
      return 3;
    } else if (currentMoves <= this.star2Threshold) {
      return 2;
    } else {
      return 1;
    }
  }
}

// ============================================================================
// Level Generation with Settings
// ============================================================================

/**
 * Generate a level configuration from seed, level, and settings
 * This mirrors the Cairo LevelGenerator.generate_with_settings()
 */
export function generateLevelConfig(
  seed: bigint,
  level: number,
  settings: GameSettings = DEFAULT_SETTINGS,
  starThresholdModifier: number = 128,
): Level {
  // Zone mode uses a 10-level cap (matching contract's zone_level_cap = 10)
  const zoneLevelCap = 10;
  const isEndless = level > zoneLevelCap;
  const calcLevel = Math.min(level, zoneLevelCap);

  // Derive level-specific seed using Poseidon (matching Cairo)
  const levelSeed = deriveLevelSeed(seed, level);

  if (isEndless) {
    // Endless mode: fixed moves at maxMoves, ratio escalates by +10 per depth
    const endlessDepth = level - zoneLevelCap;
    const endlessRatioX100 = settings.maxRatioX100 + endlessDepth * 10;
    const endlessPoints = Math.floor((settings.maxMoves * endlessRatioX100) / 100);
    const difficulty = getDifficultyForLevel(calcLevel, settings);
    return new Level({
      level,
      pointsRequired: endlessPoints,
      maxMoves: settings.maxMoves,
      difficulty,
      constraint: new Constraint({ constraintType: ConstraintType.None, value: 0, requiredCount: 0 }),
      constraint2: new Constraint({ constraintType: ConstraintType.None, value: 0, requiredCount: 0 }),
      star3Threshold: Math.floor((settings.maxMoves * applyStarThresholdModifier(starThresholdModifier).star3Pct) / 100),
      star2Threshold: Math.floor((settings.maxMoves * applyStarThresholdModifier(starThresholdModifier).star2Pct) / 100),
    });
  }

  // Zone mode (levels 1-10): scale over zoneLevelCap
  const baseMoves = calculateBaseMovesWithCap(
    calcLevel,
    settings.baseMoves,
    settings.maxMoves,
    zoneLevelCap
  );

  const ratioX100 = calculateRatioWithCap(
    calcLevel,
    settings.baseRatioX100,
    settings.maxRatioX100,
    zoneLevelCap
  );

  // 3. Calculate base points from moves x ratio
  const basePoints = Math.floor((baseMoves * ratioX100) / 100);

  // 4. Get variance percent based on level tier (using settings)
  const variancePercent = getVariancePercent(calcLevel, settings);

  // 5. Apply CORRELATED variance (same factor for both)
  const varianceFactor = calculateVarianceFactor(levelSeed, variancePercent);
  const pointsRequired = applyFactor(basePoints, varianceFactor);
  const maxMoves = applyFactor(baseMoves, varianceFactor);

  // Calculate cube thresholds using star threshold modifier
  const { star3Pct, star2Pct } = applyStarThresholdModifier(starThresholdModifier);
  const star3Threshold = Math.floor((maxMoves * star3Pct) / 100);
  const star2Threshold = Math.floor((maxMoves * star2Pct) / 100);

  // Get difficulty from settings
  const difficulty = getDifficultyForLevel(calcLevel, settings);

  // Generate constraints using settings (supports dual constraints)
  const { constraint, constraint2 } = generateConstraintsWithSettings(
    levelSeed,
    level,
    difficulty,
    settings
  );

  return new Level({
    level,
    pointsRequired,
    maxMoves,
    difficulty,
    constraint,
    constraint2,
    star3Threshold,
    star2Threshold,
  });
}

/** Derive a deterministic seed for a specific level (matching Cairo's Poseidon) */
function deriveLevelSeed(seed: bigint, level: number): bigint {
  // Cairo does: poseidon(seed, level, 'LEVEL_CONFIG')
  const levelConfigSelector = BigInt("0x4c4556454c5f434f4e464947"); // 'LEVEL_CONFIG' as felt252
  const hashResult = hash.computePoseidonHashOnElements([
    seed,
    BigInt(level),
    levelConfigSelector,
  ]);
  return BigInt(hashResult);
}

/**
 * Calculate base moves with a configurable level cap (matching contract)
 * Linear scaling from baseMoves at level 1 to maxMoves at levelCap
 */
function calculateBaseMovesWithCap(
  level: number,
  baseMoves: number,
  maxMoves: number,
  levelCap: number
): number {
  if (level <= 1 || levelCap <= 1) {
    return baseMoves;
  }
  const range = maxMoves - baseMoves;
  const progress = Math.floor(((level - 1) * range) / (levelCap - 1));
  return baseMoves + progress;
}

/**
 * Calculate ratio with a configurable level cap (matching contract)
 * Linear scaling from baseRatio at level 1 to maxRatio at levelCap
 */
function calculateRatioWithCap(
  level: number,
  baseRatioX100: number,
  maxRatioX100: number,
  levelCap: number
): number {
  if (level <= 1 || levelCap <= 1) {
    return baseRatioX100;
  }
  const range = maxRatioX100 - baseRatioX100;
  const progress = Math.floor(((level - 1) * range) / (levelCap - 1));
  return baseRatioX100 + progress;
}

/**
 * Get variance percentage based on level tier (using settings)
 */
function getVariancePercent(level: number, settings: GameSettings): number {
  if (level <= settings.earlyLevelThreshold) {
    return settings.earlyVariancePercent;
  } else if (level <= settings.midLevelThreshold) {
    return settings.midVariancePercent;
  } else {
    return settings.lateVariancePercent;
  }
}

/**
 * Calculate correlated variance factor
 * Returns a value like 95-105 for +/-5%, or 85-115 for +/-15%
 */
function calculateVarianceFactor(
  seed: bigint,
  variancePercent: number
): number {
  const varianceRange = variancePercent * 2 + 1; // e.g., 11 for +/-5% (95-105)
  const roll = Number(seed % BigInt(varianceRange));
  // Center around 100: (100 - variance) + roll
  return 100 - variancePercent + roll;
}

/**
 * Apply factor to base value
 */
function applyFactor(base: number, factor: number): number {
  return Math.floor((base * factor) / 100);
}

/**
 * Get difficulty for a level using non-linear tier thresholds
 * VeryEasy: 1-4, Easy: 5-9, Medium: 10-19, MediumHard: 20-34
 * Hard: 35-49, VeryHard: 50-69, Expert: 70-89, Master: 90+
 */
function getDifficultyForLevel(
  level: number,
  settings: GameSettings
): Difficulty {
  // Use non-linear tier thresholds
  if (level >= settings.tier7Threshold) {
    return new Difficulty(DifficultyType.Master);
  } else if (level >= settings.tier6Threshold) {
    return new Difficulty(DifficultyType.Expert);
  } else if (level >= settings.tier5Threshold) {
    return new Difficulty(DifficultyType.VeryHard);
  } else if (level >= settings.tier4Threshold) {
    return new Difficulty(DifficultyType.Hard);
  } else if (level >= settings.tier3Threshold) {
    return new Difficulty(DifficultyType.MediumHard);
  } else if (level >= settings.tier2Threshold) {
    return new Difficulty(DifficultyType.Medium);
  } else if (level >= settings.tier1Threshold) {
    return new Difficulty(DifficultyType.Easy);
  } else {
    return new Difficulty(DifficultyType.VeryEasy);
  }
}

/**
 * Linear interpolation helper
 */
function interpolate(
  startVal: number,
  endVal: number,
  position: number,
  maxPosition: number
): number {
  if (maxPosition === 0) return startVal;
  const range = endVal - startVal;
  return Math.floor(startVal + (range * position) / maxPosition);
}

/**
 * Get interpolated constraint parameters for a difficulty tier
 * Uses budget-based system for times calculation
 */
function getConstraintParams(
  difficulty: Difficulty,
  settings: GameSettings
): {
  minLines: number;
  maxLines: number;
  budgetMin: number;
  budgetMax: number;
  minTimes: number;
} {
  // Get difficulty tier (0-7) using the into() method
  const tier = difficulty.into();
  const maxTier = 7;

  return {
    minLines: interpolate(
      settings.veryeasyMinLines,
      settings.masterMinLines,
      tier,
      maxTier
    ),
    maxLines: interpolate(
      settings.veryeasyMaxLines,
      settings.masterMaxLines,
      tier,
      maxTier
    ),
    budgetMin: interpolate(
      settings.veryeasyBudgetMin,
      settings.masterBudgetMin,
      tier,
      maxTier
    ),
    budgetMax: interpolate(
      settings.veryeasyBudgetMax,
      settings.masterBudgetMax,
      tier,
      maxTier
    ),
    minTimes: interpolate(
      settings.veryeasyMinTimes,
      settings.masterMinTimes,
      tier,
      maxTier
    ),
  };
}

/**
 * Returns the weighted difficulty cost for clearing N lines at once.
 * Higher line counts are exponentially harder to achieve in practice.
 * Line costs: 2->3, 3->10, 4->20, 5->30, 6->40, 7->60, 8->80
 * Matches Cairo LevelGeneratorTrait::line_cost()
 */
function lineCost(lines: number): number {
  switch (lines) {
    case 0:
    case 1:
      return 1;
    case 2:
      return 3;
    case 3:
      return 10;
    case 4:
      return 20;
    case 5:
      return 30;
    case 6:
      return 40;
    case 7:
      return 60;
    default:
      return 80; // 8+
  }
}

/**
 * Cost for breaking blocks of a given size.
 * Smaller blocks are easier to find, so cheaper.
 * Matches Cairo LevelGeneratorTrait::break_cost()
 */
function breakCost(size: number): number {
  switch (size) {
    case 1:
      return 4;
    case 2:
      return 5;
    case 3:
      return 6;
    default:
      return 7; // size 4+
  }
}

/**
 * Scale factor for BreakBlocks target counts by size.
 * Matches Cairo LevelGeneratorTrait::break_scale()
 */
function breakScale(size: number): number {
  switch (size) {
    case 1:
      return 3;
    case 2:
      return 3;
    case 3:
      return 2;
    default:
      return 2;
  }
}

/**
 * Maximum allowed ComboLines repetitions.
 * Matches Cairo LevelGeneratorTrait::get_max_combo_lines_times()
 */
const MAX_COMBO_LINES_TIMES = 5;

/**
 * Budget utilization floor (x100).
 * Matches Cairo LevelGeneratorTrait::budget_utilization_floor_x100()
 */
const BUDGET_UTILIZATION_FLOOR_X100 = 70;

/**
 * ceil(numerator / denominator) for positive integers.
 * Matches Cairo LevelGeneratorTrait::ceil_div_u16_by_u8()
 */
function ceilDiv(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.floor((numerator + denominator - 1) / denominator);
}

/**
 * Compute minimum spend for a sampled budget using utilization floor.
 * Matches Cairo LevelGeneratorTrait::min_budget_spend()
 */
function minBudgetSpend(budget: number): number {
  const raw = budget * BUDGET_UTILIZATION_FLOOR_X100;
  let minSpend = Math.floor((raw + 99) / 100);
  if (minSpend < 1) minSpend = 1;
  if (minSpend > budget) minSpend = budget;
  return minSpend;
}

/**
 * Get type selection weights from budget.
 * Returns [comboLinesWeight, breakBlocksWeight]. ComboStreak = 100 - sum.
 * Matches Cairo LevelGeneratorTrait::get_type_weights_from_budget()
 */
function getTypeWeightsFromBudget(budget: number): [number, number] {
  if (budget <= 5) return [38, 38];
  if (budget <= 9) return [34, 34];
  if (budget <= 14) return [31, 31];
  if (budget <= 20) return [29, 29];
  if (budget <= 26) return [28, 28];
  if (budget <= 32) return [27, 27];
  if (budget <= 38) return [26, 26];
  return [25, 25];
}

/**
 * Select a constraint type using budget-weighted probabilities.
 * Returns one of ComboLines / BreakBlocks / ComboStreak.
 * Matches Cairo LevelGeneratorTrait::select_constraint_type()
 */
function selectConstraintType(seed: bigint, budget: number): ConstraintType {
  const seedU256 = seed < 0n ? -seed : seed;
  const roll = Number((seedU256 / 10000n) % 100n);
  const [clearLinesW, breakBlocksW] = getTypeWeightsFromBudget(budget);
  if (roll < clearLinesW) return ConstraintType.ComboLines;
  if (roll < clearLinesW + breakBlocksW) return ConstraintType.BreakBlocks;
  return ConstraintType.ComboStreak;
}

/**
 * Cycle to next regular constraint type.
 * ComboLines -> BreakBlocks -> ComboStreak -> ComboLines
 * Matches Cairo LevelGeneratorTrait::next_regular_type()
 */
function nextRegularType(t: ConstraintType): ConstraintType {
  switch (t) {
    case ConstraintType.ComboLines:
      return ConstraintType.BreakBlocks;
    case ConstraintType.BreakBlocks:
      return ConstraintType.ComboStreak;
    case ConstraintType.ComboStreak:
      return ConstraintType.ComboLines;
    default:
      return ConstraintType.ComboLines;
  }
}

/**
 * Get deterministic constraint count range from budget range.
 * Matches Cairo LevelGeneratorTrait::get_constraint_count_range_from_budget()
 */
function getConstraintCountRangeFromBudget(
  budgetMin: number,
  budgetMax: number
): [number, number] {
  const avgBudget = Math.floor((budgetMin + budgetMax) / 2);
  if (avgBudget <= 3) return [0, 0];
  if (avgBudget <= 8) return [1, 1];
  if (avgBudget <= 16) return [1, 2];
  if (avgBudget <= 24) return [2, 2];
  if (avgBudget <= 32) return [2, 3];
  return [3, 3];
}

/**
 * Generate a ComboLines constraint from budget.
 * Candidate pairs (lines, times) must satisfy utilization band.
 * Matches Cairo LevelGeneratorTrait::generate_combo_lines_from_budget()
 */
function generateComboLinesFromBudget(seed: bigint, budget: number): Constraint {
  const seedU256 = seed < 0n ? -seed : seed;
  const minSpend = minBudgetSpend(budget);

  // Count valid candidates
  let candidatesCount = 0;
  for (let linesScan = 2; linesScan <= 8; linesScan++) {
    const cost = lineCost(linesScan);
    if (cost <= budget) {
      let timesCapRaw = Math.floor(budget / cost);
      let timesCap = timesCapRaw > MAX_COMBO_LINES_TIMES
        ? MAX_COMBO_LINES_TIMES
        : timesCapRaw < 1 ? 1 : timesCapRaw;
      const timesMin = ceilDiv(minSpend, cost);
      if (timesMin <= timesCap) {
        candidatesCount += timesCap - timesMin + 1;
      }
    }
  }

  if (candidatesCount === 0) {
    return Constraint.clearLines(2, 1);
  }

  const pick = Number(seedU256 % BigInt(candidatesCount));
  let idx = 0;
  let chosenLines = 2;
  let chosenTimes = 1;

  for (let linesScan2 = 2; linesScan2 <= 8; linesScan2++) {
    const cost = lineCost(linesScan2);
    if (cost <= budget) {
      let timesCapRaw = Math.floor(budget / cost);
      let timesCap = timesCapRaw > MAX_COMBO_LINES_TIMES
        ? MAX_COMBO_LINES_TIMES
        : timesCapRaw < 1 ? 1 : timesCapRaw;
      const timesMin = ceilDiv(minSpend, cost);
      if (timesMin <= timesCap) {
        for (let t = timesMin; t <= timesCap; t++) {
          if (idx === pick) {
            chosenLines = linesScan2;
            chosenTimes = t;
            break;
          }
          idx++;
        }
        if (idx > pick) break;
      }
    }
  }

  return Constraint.clearLines(chosenLines, chosenTimes);
}

/**
 * Generate a BreakBlocks constraint from budget.
 * Candidate pairs (size, count) must satisfy utilization band.
 * Matches Cairo LevelGeneratorTrait::generate_break_blocks_from_budget()
 */
function generateBreakBlocksFromBudget(seed: bigint, budget: number): Constraint {
  const seedU256 = seed < 0n ? -seed : seed;
  const minSpend = minBudgetSpend(budget);

  // Max block size by budget
  const maxSize = budget < 10 ? 2 : budget < 20 ? 3 : 4;

  // Count valid candidates
  let candidatesCount = 0;
  for (let sizeScan = 1; sizeScan <= maxSize; sizeScan++) {
    const scale = breakScale(sizeScan);
    const cost = breakCost(sizeScan);
    const maxUnits = budget * scale;
    const minUnits = minSpend * scale;

    let countMinBudget = ceilDiv(minUnits, cost);
    let countMaxBudget = Math.floor(maxUnits / cost);
    const countMin = countMinBudget < 1 ? 1 : countMinBudget;
    const countMax = countMaxBudget > 120 ? 120 : countMaxBudget;

    if (countMin <= countMax) {
      candidatesCount += countMax - countMin + 1;
    }
  }

  if (candidatesCount === 0) {
    return Constraint.breakBlocks(1, 1);
  }

  const pick = Number(seedU256 % BigInt(candidatesCount));
  let idx = 0;
  let chosenSize = 1;
  let chosenCount = 1;

  for (let sizeScan2 = 1; sizeScan2 <= maxSize; sizeScan2++) {
    const scale = breakScale(sizeScan2);
    const cost = breakCost(sizeScan2);
    const maxUnits = budget * scale;
    const minUnits = minSpend * scale;

    let countMinBudget = ceilDiv(minUnits, cost);
    let countMaxBudget = Math.floor(maxUnits / cost);
    const countMin = countMinBudget < 1 ? 1 : countMinBudget;
    const countMax = countMaxBudget > 120 ? 120 : countMaxBudget;

    if (countMin <= countMax) {
      for (let c = countMin; c <= countMax; c++) {
        if (idx === pick) {
          chosenSize = sizeScan2;
          chosenCount = c;
          break;
        }
        idx++;
      }
      if (idx > pick) break;
    }
  }

  return Constraint.breakBlocks(chosenSize, chosenCount);
}

/**
 * Generate a ComboStreak constraint from budget.
 * Target is half of budget (floor division).
 * Matches Cairo LevelGeneratorTrait::generate_combo_streak_from_budget()
 */
function generateComboStreakFromBudget(_seed: bigint, budget: number): Constraint {
  const target = Math.floor(budget / 2);
  return Constraint.achieveCombo(target);
}

/**
 * Generate a constraint of a specific type using the budget system.
 * Matches Cairo LevelGeneratorTrait::generate_constraint_from_budget()
 */
function generateConstraintFromBudget(
  seed: bigint,
  budget: number,
  constraintType: ConstraintType
): Constraint {
  switch (constraintType) {
    case ConstraintType.ComboLines:
      return generateComboLinesFromBudget(seed, budget);
    case ConstraintType.BreakBlocks:
      return generateBreakBlocksFromBudget(seed, budget);
    case ConstraintType.ComboStreak:
      return generateComboStreakFromBudget(seed, budget);
    case ConstraintType.None:
    default:
      return Constraint.none();
  }
}

// ============================================================================
// Boss Identity System (matching boss.cairo)
// ============================================================================

interface BossIdentity {
  id: number;
  primaryType: ConstraintType;
  secondaryType: ConstraintType;
}

/**
 * Get boss identity by ID (1-10).
 * Returns the boss's fixed constraint type combination.
 * Matches Cairo get_boss_identity() from boss.cairo
 */
function getBossIdentity(bossId: number): BossIdentity {
  switch (bossId) {
    case 1:
      return { id: 1, primaryType: ConstraintType.ComboLines, secondaryType: ConstraintType.ComboStreak };
    case 2:
      return { id: 2, primaryType: ConstraintType.BreakBlocks, secondaryType: ConstraintType.ComboLines };
    case 3:
      return { id: 3, primaryType: ConstraintType.ComboStreak, secondaryType: ConstraintType.ComboLines };
    case 4:
      return { id: 4, primaryType: ConstraintType.ComboLines, secondaryType: ConstraintType.ComboStreak };
    case 5:
      return { id: 5, primaryType: ConstraintType.BreakBlocks, secondaryType: ConstraintType.ComboStreak };
    case 6:
      return { id: 6, primaryType: ConstraintType.ComboLines, secondaryType: ConstraintType.BreakBlocks };
    case 7:
      return { id: 7, primaryType: ConstraintType.ComboStreak, secondaryType: ConstraintType.BreakBlocks };
    case 8:
      return { id: 8, primaryType: ConstraintType.BreakBlocks, secondaryType: ConstraintType.ComboStreak };
    case 9:
      return { id: 9, primaryType: ConstraintType.ComboStreak, secondaryType: ConstraintType.BreakBlocks };
    case 10:
      return { id: 10, primaryType: ConstraintType.ComboLines, secondaryType: ConstraintType.BreakBlocks };
    default:
      // Fallback: same as boss 1
      return { id: 1, primaryType: ConstraintType.ComboLines, secondaryType: ConstraintType.ComboStreak };
  }
}

/**
 * Generate a boss constraint using the budget system.
 * Matches Cairo generate_boss_constraint() from boss.cairo
 */
function generateBossConstraint(
  constraintType: ConstraintType,
  budgetMax: number,
  seed: bigint,
  _level: number
): Constraint {
  if (constraintType === ConstraintType.None) {
    return Constraint.none();
  }
  return generateConstraintFromBudget(seed, budgetMax, constraintType);
}

/**
 * Generate boss constraints using the boss identity system.
 * Zone boss is dual-only (primary + secondary); tertiary is None.
 * Matches Cairo generate_boss_constraints() from boss.cairo
 */
function generateBossConstraints(
  bossId: number,
  level: number,
  seed: bigint,
  budgetMax: number
): { constraint: Constraint; constraint2: Constraint } {
  const identity = getBossIdentity(bossId);

  const seedAbs = seed < 0n ? -seed : seed;

  // Primary constraint at budget_max
  const primarySeed = seed;
  const c1 = generateBossConstraint(identity.primaryType, budgetMax, primarySeed, level);

  // Secondary constraint with shifted seed (seed / 10000000)
  const secondarySeed = seedAbs / 10000000n;
  const c2 = generateBossConstraint(identity.secondaryType, budgetMax, secondarySeed, level);

  // Tertiary is disabled in zone-mode boss flow (dual-only)
  return { constraint: c1, constraint2: c2 };
}

/**
 * Check if a level is a boss level (10, 20, 30, 40, 50)
 */
function isBossLevel(level: number): boolean {
  return BOSS_LEVELS.includes(level as typeof BOSS_LEVELS[number]);
}

/**
 * Derive a unique seed for a specific constraint index using Poseidon.
 * Matches Cairo: poseidon(level_seed, i, 'CONSTRAINT')
 */
function deriveConstraintSeed(levelSeed: bigint, index: number): bigint {
  const constraintSelector = BigInt("0x434f4e53545241494e54"); // 'CONSTRAINT' as felt252
  const hashResult = hash.computePoseidonHashOnElements([
    levelSeed,
    BigInt(index),
    constraintSelector,
  ]);
  return BigInt(hashResult);
}

/**
 * Generate constraints using settings with budget-based type selection.
 * Regular levels generate ComboLines, BreakBlocks, or ComboStreak.
 * Boss levels use the boss identity system.
 * Matches Cairo LevelGeneratorTrait::generate_constraints_with_settings()
 */
function generateConstraintsWithSettings(
  levelSeed: bigint,
  level: number,
  difficulty: Difficulty,
  settings: GameSettings
): { constraint: Constraint; constraint2: Constraint } {
  // Check if constraints are enabled
  if (!settings.constraintsEnabled) {
    return { constraint: Constraint.none(), constraint2: Constraint.none() };
  }

  // No constraint before the start level (levels 1-2 have no constraints)
  if (level < settings.constraintStartLevel) {
    return { constraint: Constraint.none(), constraint2: Constraint.none() };
  }

  // Boss levels use the boss identity system
  if (isBossLevel(level)) {
    const bossId = settings.bossId || 0;
    const params = getConstraintParams(difficulty, settings);
    return generateBossConstraints(bossId, level, levelSeed, params.budgetMax);
  }

  // Get interpolated parameters for this difficulty
  const params = getConstraintParams(difficulty, settings);

  // Determine how many constraints this level has from budget range
  const [countMin, countMax] = getConstraintCountRangeFromBudget(
    params.budgetMin,
    params.budgetMax
  );

  // If tier has 0 constraints, return none
  if (countMax === 0) {
    return { constraint: Constraint.none(), constraint2: Constraint.none() };
  }

  // Roll constraint count in [countMin, countMax]
  const seedU256 = levelSeed < 0n ? -levelSeed : levelSeed;
  let count: number;
  if (countMin === countMax) {
    count = countMin;
  } else {
    const countRange = countMax - countMin + 1;
    count = countMin + Number(seedU256 % BigInt(countRange));
  }

  // Generate each constraint with independent budget rolls and type selection
  const constraints: Constraint[] = [];
  const usedTypes: ConstraintType[] = [];

  for (let i = 0; i < count; i++) {
    // Derive a unique seed for this constraint index
    const constraintSeed = deriveConstraintSeed(levelSeed, i);
    const constraintSeedU256 = constraintSeed < 0n ? -constraintSeed : constraintSeed;

    // Roll budget within [budgetMin, budgetMax]
    const budgetRange = params.budgetMax > params.budgetMin
      ? params.budgetMax - params.budgetMin + 1
      : 1;
    const budget = params.budgetMin + Number(constraintSeedU256 % BigInt(budgetRange));

    // Roll constraint type, avoiding duplicates
    let constraintType = selectConstraintType(constraintSeed, budget);

    // If this type was already used, cycle to next unused type
    let attempts = 0;
    while (attempts < 4) {
      if (!usedTypes.includes(constraintType)) {
        break;
      }
      constraintType = nextRegularType(constraintType);
      attempts++;
    }

    // Generate constraint from budget
    const constraint = generateConstraintFromBudget(constraintSeed, budget, constraintType);
    constraints.push(constraint);
    usedTypes.push(constraintType);
  }

  // Pad to 2 constraints (client uses constraint + constraint2)
  const c1 = constraints.length > 0 ? constraints[0] : Constraint.none();
  const c2 = constraints.length > 1 ? constraints[1] : Constraint.none();

  return { constraint: c1, constraint2: c2 };
}

/**
 * Unpack constraint_lines_budgets field (u64 -> individual values)
 * Packing: lines(4x4bits) + budgets(4x8bits) + times(2x4bits) = 56 bits
 */
function unpackConstraintLinesBudgets(packed: bigint | number): {
  veryeasyMinLines: number;
  masterMinLines: number;
  veryeasyMaxLines: number;
  masterMaxLines: number;
  veryeasyBudgetMin: number;
  veryeasyBudgetMax: number;
  masterBudgetMin: number;
  masterBudgetMax: number;
  veryeasyMinTimes: number;
  masterMinTimes: number;
} {
  const p = BigInt(packed);
  return {
    veryeasyMinLines: Number(p & BigInt(0xf)), // bits 0-3
    masterMinLines: Number((p >> BigInt(4)) & BigInt(0xf)), // bits 4-7
    veryeasyMaxLines: Number((p >> BigInt(8)) & BigInt(0xf)), // bits 8-11
    masterMaxLines: Number((p >> BigInt(12)) & BigInt(0xf)), // bits 12-15
    veryeasyBudgetMin: Number((p >> BigInt(16)) & BigInt(0xff)), // bits 16-23
    veryeasyBudgetMax: Number((p >> BigInt(24)) & BigInt(0xff)), // bits 24-31
    masterBudgetMin: Number((p >> BigInt(32)) & BigInt(0xff)), // bits 32-39
    masterBudgetMax: Number((p >> BigInt(40)) & BigInt(0xff)), // bits 40-47
    veryeasyMinTimes: Number((p >> BigInt(48)) & BigInt(0xf)), // bits 48-51
    masterMinTimes: Number((p >> BigInt(52)) & BigInt(0xf)), // bits 52-55
  };
}

function unpackEndlessThresholds(packed: bigint | number | string): number[] {
  const p = BigInt(packed);
  if (p === 0n) return DEFAULT_SETTINGS.endlessDifficultyThresholds;
  const thresholds: number[] = [];
  for (let i = 0; i < 8; i++) {
    thresholds.push(Number((p >> BigInt(i * 16)) & 0xFFFFn));
  }
  return thresholds;
}

function unpackEndlessMultipliers(packed: bigint | number | string): number[] {
  const p = BigInt(packed);
  if (p === 0n) return DEFAULT_SETTINGS.endlessScoreMultipliers;
  const multipliers: number[] = [];
  for (let i = 0; i < 8; i++) {
    multipliers.push(Number((p >> BigInt(i * 8)) & 0xFFn));
  }
  return multipliers;
}

export function parseGameSettings(raw: any): GameSettings {
  if (!raw) return DEFAULT_SETTINGS;

  // Unpack constraint fields if they exist
  const constraintLinesBudgets =
    raw.constraint_lines_budgets !== undefined
      ? unpackConstraintLinesBudgets(raw.constraint_lines_budgets)
      : {
          veryeasyMinLines: DEFAULT_SETTINGS.veryeasyMinLines,
          masterMinLines: DEFAULT_SETTINGS.masterMinLines,
          veryeasyMaxLines: DEFAULT_SETTINGS.veryeasyMaxLines,
          masterMaxLines: DEFAULT_SETTINGS.masterMaxLines,
          veryeasyBudgetMin: DEFAULT_SETTINGS.veryeasyBudgetMin,
          veryeasyBudgetMax: DEFAULT_SETTINGS.veryeasyBudgetMax,
          masterBudgetMin: DEFAULT_SETTINGS.masterBudgetMin,
          masterBudgetMax: DEFAULT_SETTINGS.masterBudgetMax,
          veryeasyMinTimes: DEFAULT_SETTINGS.veryeasyMinTimes,
          masterMinTimes: DEFAULT_SETTINGS.masterMinTimes,
        };

  return {
    settingsId: raw.settings_id ?? DEFAULT_SETTINGS.settingsId,
    mode: raw.mode ?? DEFAULT_SETTINGS.mode,
    baseMoves: raw.base_moves ?? DEFAULT_SETTINGS.baseMoves,
    maxMoves: raw.max_moves ?? DEFAULT_SETTINGS.maxMoves,
    baseRatioX100: raw.base_ratio_x100 ?? DEFAULT_SETTINGS.baseRatioX100,
    maxRatioX100: raw.max_ratio_x100 ?? DEFAULT_SETTINGS.maxRatioX100,
    // Difficulty tier thresholds
    tier1Threshold: raw.tier_1_threshold ?? DEFAULT_SETTINGS.tier1Threshold,
    tier2Threshold: raw.tier_2_threshold ?? DEFAULT_SETTINGS.tier2Threshold,
    tier3Threshold: raw.tier_3_threshold ?? DEFAULT_SETTINGS.tier3Threshold,
    tier4Threshold: raw.tier_4_threshold ?? DEFAULT_SETTINGS.tier4Threshold,
    tier5Threshold: raw.tier_5_threshold ?? DEFAULT_SETTINGS.tier5Threshold,
    tier6Threshold: raw.tier_6_threshold ?? DEFAULT_SETTINGS.tier6Threshold,
    tier7Threshold: raw.tier_7_threshold ?? DEFAULT_SETTINGS.tier7Threshold,
    constraintsEnabled:
      raw.constraints_enabled !== undefined
        ? raw.constraints_enabled !== 0
        : DEFAULT_SETTINGS.constraintsEnabled,
    constraintStartLevel:
      raw.constraint_start_level ?? DEFAULT_SETTINGS.constraintStartLevel,
    // Unpacked constraint fields
    ...constraintLinesBudgets,
    // Block weights
    veryeasySize1Weight:
      raw.veryeasy_size1_weight ?? DEFAULT_SETTINGS.veryeasySize1Weight,
    veryeasySize2Weight:
      raw.veryeasy_size2_weight ?? DEFAULT_SETTINGS.veryeasySize2Weight,
    veryeasySize3Weight:
      raw.veryeasy_size3_weight ?? DEFAULT_SETTINGS.veryeasySize3Weight,
    veryeasySize4Weight:
      raw.veryeasy_size4_weight ?? DEFAULT_SETTINGS.veryeasySize4Weight,
    veryeasySize5Weight:
      raw.veryeasy_size5_weight ?? DEFAULT_SETTINGS.veryeasySize5Weight,
    masterSize1Weight:
      raw.master_size1_weight ?? DEFAULT_SETTINGS.masterSize1Weight,
    masterSize2Weight:
      raw.master_size2_weight ?? DEFAULT_SETTINGS.masterSize2Weight,
    masterSize3Weight:
      raw.master_size3_weight ?? DEFAULT_SETTINGS.masterSize3Weight,
    masterSize4Weight:
      raw.master_size4_weight ?? DEFAULT_SETTINGS.masterSize4Weight,
    masterSize5Weight:
      raw.master_size5_weight ?? DEFAULT_SETTINGS.masterSize5Weight,
    // Variance
    earlyVariancePercent:
      raw.early_variance_percent ?? DEFAULT_SETTINGS.earlyVariancePercent,
    midVariancePercent:
      raw.mid_variance_percent ?? DEFAULT_SETTINGS.midVariancePercent,
    lateVariancePercent:
      raw.late_variance_percent ?? DEFAULT_SETTINGS.lateVariancePercent,
    // Level thresholds
    earlyLevelThreshold:
      raw.early_level_threshold ?? DEFAULT_SETTINGS.earlyLevelThreshold,
    midLevelThreshold:
      raw.mid_level_threshold ?? DEFAULT_SETTINGS.midLevelThreshold,
    levelCap: raw.level_cap ?? DEFAULT_SETTINGS.levelCap,
    zoneId: raw.zone_id ?? DEFAULT_SETTINGS.zoneId,
    activeMutatorId: raw.active_mutator_id ?? DEFAULT_SETTINGS.activeMutatorId,
    passiveMutatorId: raw.passive_mutator_id ?? DEFAULT_SETTINGS.passiveMutatorId,
    bossId: raw.boss_id ?? DEFAULT_SETTINGS.bossId,
    endlessDifficultyThresholds: raw.endless_difficulty_thresholds
      ? unpackEndlessThresholds(raw.endless_difficulty_thresholds)
      : DEFAULT_SETTINGS.endlessDifficultyThresholds,
    endlessScoreMultipliers: raw.endless_score_multipliers
      ? unpackEndlessMultipliers(raw.endless_score_multipliers)
      : DEFAULT_SETTINGS.endlessScoreMultipliers,
    star3Percent: DEFAULT_SETTINGS.star3Percent,
    star2Percent: DEFAULT_SETTINGS.star2Percent,
  };
}

/* ------------------------------------------------------------------ */
/*  Level ranges — predictable without seed                            */
/* ------------------------------------------------------------------ */

export interface LevelRanges {
  difficulty: string;
  movesMin: number;
  movesMax: number;
  pointsMin: number;
  pointsMax: number;
  star3MovesMin: number;
  star3MovesMax: number;
  star2MovesMin: number;
  star2MovesMax: number;
  star1MovesMin: number;
  star1MovesMax: number;
  constraintCountMin: number;
  constraintCountMax: number;
  isBoss: boolean;
  bossConstraintTypes: string[];
}

/**
 * Compute predictable level ranges without needing a seed.
 * Uses settings-only calculations (difficulty, base scaling, budget count).
 */
export function getLevelRanges(level: number, settings: GameSettings = DEFAULT_SETTINGS, starThresholdModifier: number = 128): LevelRanges {
  const zoneLevelCap = 10;
  const calcLevel = Math.min(level, zoneLevelCap);
  const isBoss = level === 10;

  const baseMoves = calculateBaseMovesWithCap(calcLevel, settings.baseMoves, settings.maxMoves, zoneLevelCap);
  const ratioX100 = calculateRatioWithCap(calcLevel, settings.baseRatioX100, settings.maxRatioX100, zoneLevelCap);
  const basePoints = Math.floor((baseMoves * ratioX100) / 100);

  const variancePercent = getVariancePercent(calcLevel, settings);
  const low = (100 - variancePercent) / 100;
  const high = (100 + variancePercent) / 100;

  const movesMin = Math.floor(baseMoves * low);
  const movesMax = Math.ceil(baseMoves * high);
  const pointsMin = Math.floor(basePoints * low);
  const pointsMax = Math.ceil(basePoints * high);

  const { star3Pct, star2Pct } = applyStarThresholdModifier(starThresholdModifier);
  const star3MovesMin = Math.floor(movesMin * star3Pct / 100);
  const star3MovesMax = Math.floor(movesMax * star3Pct / 100);
  const star2MovesMin = Math.floor(movesMin * star2Pct / 100);
  const star2MovesMax = Math.floor(movesMax * star2Pct / 100);

  const difficulty = getDifficultyForLevel(calcLevel, settings);

  // Constraint count from budget
  let constraintCountMin = 0;
  let constraintCountMax = 0;
  if (settings.constraintsEnabled && level >= settings.constraintStartLevel) {
    const tier = difficultyToTier(difficulty.value);
    const budgetMax = interpolate(settings.veryeasyBudgetMax, settings.masterBudgetMax, tier, 7);
    const budgetMin = Math.ceil(budgetMax * 0.70);
    [constraintCountMin, constraintCountMax] = getConstraintCountRangeFromBudget(budgetMin, budgetMax);
  }
  if (isBoss) {
    constraintCountMin = 2;
    constraintCountMax = 2;
  }

  // Boss constraint types
  const bossConstraintTypes: string[] = [];
  if (isBoss && settings.bossId > 0) {
    const identity = getBossIdentity(settings.bossId);
    const typeNames: Record<number, string> = {
      1: "Combo Lines",
      2: "Break Blocks",
      3: "Combo Streak",
    };
    if (identity.primaryType > 0) bossConstraintTypes.push(typeNames[identity.primaryType] ?? "Unknown");
    if (identity.secondaryType > 0) bossConstraintTypes.push(typeNames[identity.secondaryType] ?? "Unknown");
  }

  return {
    difficulty: difficulty.value,
    movesMin,
    movesMax,
    pointsMin,
    pointsMax,
    star3MovesMin,
    star3MovesMax,
    star2MovesMin,
    star2MovesMax,
    star1MovesMin: movesMin,
    star1MovesMax: movesMax,
    constraintCountMin,
    constraintCountMax,
    isBoss,
    bossConstraintTypes,
  };
}

function difficultyToTier(difficultyValue: string): number {
  const map: Record<string, number> = {
    VeryEasy: 0, Easy: 1, Medium: 2, MediumHard: 3,
    Hard: 4, VeryHard: 5, Expert: 6, Master: 7,
  };
  return map[difficultyValue] ?? 4;
}

