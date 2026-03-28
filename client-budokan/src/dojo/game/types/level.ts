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
import { Constraint } from "./constraint";
import { BOSS_LEVELS } from "@/dojo/game/constants";

/**
 * GameSettings interface matching the Cairo contract
 * Used for configurable game modes
 * 
 * Constraint system uses budget-based generation:
 * - Primary constraint is always ClearLines (from level 3+)
 * - Secondary constraint based on dual_chance (NoBonusUsed or ClearLines)
 * - times_cap = budget / line_cost(lines)
 * - Line costs: 2->2, 3->4, 4->6, 5->10, 6->15, 7+->20
 */
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
  // Cube Thresholds
  cube3Percent: number;
  cube2Percent: number;
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
  veryeasyDualChance: number;
  masterDualChance: number;
  veryeasySecondaryNoBonusChance: number;
  masterSecondaryNoBonusChance: number;
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
  bossUpgradesEnabled: boolean;
  rerollBaseCost: number;
  startingCharges: number;
}

/**
 * Default settings matching Cairo's GameSettingsDefaults
 * Uses budget-based constraint system with line costs
 */
export const DEFAULT_SETTINGS: GameSettings = {
  settingsId: DEFAULT_SETTINGS_ID,
  mode: 1, // Increasing
  // Level Scaling
  baseMoves: 20,
  maxMoves: 60,
  baseRatioX100: 80, // 0.80
  maxRatioX100: 180, // 1.80
  // Cube Thresholds
  cube3Percent: 40,
  cube2Percent: 70,
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
  // Line costs: 2->1, 3->2, 4->4, 5->7, 6->11, 7->16
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
  veryeasyDualChance: 0,    // No dual early
  masterDualChance: 100,    // Always dual at Master
  veryeasySecondaryNoBonusChance: 0,   // Never early
  masterSecondaryNoBonusChance: 30,    // 30% at Master
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
  bossUpgradesEnabled: true,
  rerollBaseCost: 5,
  startingCharges: 1,
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
  cube3Threshold: number;
  /** Moves threshold for 2 cubes */
  cube2Threshold: number;
}

export class Level {
  public level: number;
  public pointsRequired: number;
  public maxMoves: number;
  public difficulty: Difficulty;
  public constraint: Constraint;
  public constraint2: Constraint;
  public cube3Threshold: number;
  public cube2Threshold: number;

  constructor(config: LevelConfig) {
    this.level = config.level;
    this.pointsRequired = config.pointsRequired;
    this.maxMoves = config.maxMoves;
    this.difficulty = config.difficulty;
    this.constraint = config.constraint;
    this.constraint2 = config.constraint2;
    this.cube3Threshold = config.cube3Threshold;
    this.cube2Threshold = config.cube2Threshold;
  }

  /** Calculate cubes earned based on moves used */
  calculateCubes(movesUsed: number): number {
    if (movesUsed <= this.cube3Threshold) {
      return 3;
    } else if (movesUsed <= this.cube2Threshold) {
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
  potentialCubes(currentMoves: number): number {
    if (currentMoves <= this.cube3Threshold) {
      return 3;
    } else if (currentMoves <= this.cube2Threshold) {
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
  settings: GameSettings = DEFAULT_SETTINGS
): Level {
  // Get level cap from settings
  const levelCap = settings.levelCap || 50;

  // Cap level for calculations (survival mode after cap)
  const calcLevel = Math.min(level, levelCap);

  // Derive level-specific seed using Poseidon (matching Cairo)
  const levelSeed = deriveLevelSeed(seed, level);

  // 1. Calculate base moves using settings
  const baseMoves = calculateBaseMoves(
    calcLevel,
    settings.baseMoves,
    settings.maxMoves
  );

  // 2. Calculate ratio for this level using settings
  const ratioX100 = calculateRatio(
    calcLevel,
    settings.baseRatioX100,
    settings.maxRatioX100
  );

  // 3. Calculate base points from moves x ratio
  const basePoints = Math.floor((baseMoves * ratioX100) / 100);

  // 4. Get variance percent based on level tier (using settings)
  const variancePercent = getVariancePercent(calcLevel, settings);

  // 5. Apply CORRELATED variance (same factor for both)
  const varianceFactor = calculateVarianceFactor(levelSeed, variancePercent);
  const pointsRequired = applyFactor(basePoints, varianceFactor);
  const maxMoves = applyFactor(baseMoves, varianceFactor);

  // Calculate cube thresholds using settings
  const cube3Threshold = Math.floor(
    (maxMoves * settings.cube3Percent) / 100
  );
  const cube2Threshold = Math.floor(
    (maxMoves * settings.cube2Percent) / 100
  );

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
    cube3Threshold,
    cube2Threshold,
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
 * Calculate base moves for a level (before variance)
 * Linear scaling from baseMoves at level 1 to maxMoves at level 50
 */
function calculateBaseMoves(
  level: number,
  baseMoves: number,
  maxMoves: number
): number {
  if (level <= 1) {
    return baseMoves;
  }
  const range = maxMoves - baseMoves;
  const progress = Math.floor(((level - 1) * range) / 49);
  return baseMoves + progress;
}

/**
 * Calculate ratio for this level (scaled by 100)
 * Linear scaling from baseRatio at level 1 to maxRatio at level 50
 */
function calculateRatio(
  level: number,
  baseRatioX100: number,
  maxRatioX100: number
): number {
  if (level <= 1) {
    return baseRatioX100;
  }
  const range = maxRatioX100 - baseRatioX100;
  const progress = Math.floor(((level - 1) * range) / 49);
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
  dualChance: number;
  secondaryNoBonusChance: number;
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
    dualChance: interpolate(
      settings.veryeasyDualChance,
      settings.masterDualChance,
      tier,
      maxTier
    ),
    secondaryNoBonusChance: interpolate(
      settings.veryeasySecondaryNoBonusChance,
      settings.masterSecondaryNoBonusChance,
      tier,
      maxTier
    ),
  };
}

/**
 * Returns the weighted difficulty cost for clearing N lines at once.
 * Higher line counts are exponentially harder to achieve in practice.
 * Line costs: 2->2, 3->4, 4->6, 5->10, 6->15, 7+->20
 */
function lineCost(lines: number): number {
  switch (lines) {
    case 0:
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 4;
    case 4:
      return 6;
    case 5:
      return 10;
    case 6:
      return 15;
    default:
      return 20; // 7+ (theoretical, grid max)
  }
}

/**
 * Generate a ClearLines constraint using the weighted budget system
 * Algorithm:
 * 1. Roll budget within [budget_min, budget_max]
 * 2. Roll lines within [min_lines, max_lines]
 * 3. Compute times_cap = budget / line_cost(lines)
 * 4. Feasibility repair: reduce lines if times_cap < min_times
 * 5. Roll times with skew-high distribution (max of two rolls)
 */
function generateClearLinesConstraint(
  seed: bigint,
  minLines: number,
  maxLines: number,
  budgetMin: number,
  budgetMax: number,
  minTimes: number
): Constraint {
  // Step 1: Roll budget within [budget_min, budget_max]
  const budgetRange = budgetMax > budgetMin ? budgetMax - budgetMin + 1 : 1;
  const budget = budgetMin + Number(seed % BigInt(budgetRange));

  // Step 2: Roll lines within [min_lines, max_lines]
  const linesRange = maxLines > minLines ? maxLines - minLines + 1 : 1;
  let lines = minLines + Number((seed / BigInt(100)) % BigInt(linesRange));

  // Step 3: Compute times_cap = budget / line_cost(lines)
  let cost = lineCost(lines);
  let timesCap = cost > 0 ? Math.floor(budget / cost) : 1;

  // Step 4: Feasibility repair - reduce lines until times_cap >= min_times
  let repairCount = 0;
  while (timesCap < minTimes && lines > 2 && repairCount < 5) {
    lines = lines - 1;
    cost = lineCost(lines);
    timesCap = cost > 0 ? Math.floor(budget / cost) : 1;
    repairCount++;
  }

  // If still infeasible, reduce min_times requirement to times_cap
  const effectiveMinTimes =
    timesCap < minTimes ? (timesCap >= 1 ? timesCap : 1) : minTimes;

  // Step 5: Roll times with skew-high distribution (max of two rolls)
  let times: number;
  if (timesCap <= 1) {
    times = 1;
  } else {
    const t1 = 1 + Number((seed / BigInt(1000)) % BigInt(timesCap));
    const t2 = 1 + Number((seed / BigInt(10000)) % BigInt(timesCap));
    const maxT = Math.max(t1, t2);
    // Enforce minimum times floor
    times = maxT < effectiveMinTimes ? effectiveMinTimes : maxT;
  }

  return Constraint.clearLines(lines, times);
}

/**
 * Maybe generate a secondary constraint
 * Secondary can be either NoBonusUsed or another ClearLines
 */
function maybeGenerateSecondaryConstraint(
  seed: bigint,
  minLines: number,
  maxLines: number,
  budgetMin: number,
  budgetMax: number,
  minTimes: number,
  dualChance: number,
  secondaryNoBonusChance: number
): Constraint {
  // Roll to see if we get a secondary constraint at all
  const dualRoll = Number((seed / BigInt(100000)) % BigInt(100));
  if (dualRoll >= dualChance) {
    return Constraint.none();
  }

  // Roll to see if secondary is NoBonusUsed or ClearLines
  const noBonusRoll = Number((seed / BigInt(1000000)) % BigInt(100));
  if (noBonusRoll < secondaryNoBonusChance) {
    return Constraint.noBonus();
  }

  // Generate another ClearLines constraint with shifted seed
  const secondarySeed = seed / BigInt(10000000);
  return generateClearLinesConstraint(
    secondarySeed,
    minLines,
    maxLines,
    budgetMin,
    budgetMax,
    minTimes
  );
}

/**
 * Check if a level is a boss level (10, 20, 30, 40, 50)
 */
function isBossLevel(level: number): boolean {
  return BOSS_LEVELS.includes(level as typeof BOSS_LEVELS[number]);
}

/**
 * Generate ClearLines constraint with MAX budget (for boss levels)
 * Uses budgetMax directly instead of rolling
 */
function generateClearLinesConstraintMaxBudget(
  seed: bigint,
  minLines: number,
  maxLines: number,
  budgetMax: number,
  minTimes: number
): Constraint {
  // Use max budget directly (no rolling)
  const budget = budgetMax;
  
  // Roll lines within [minLines, maxLines]
  const linesRange = maxLines > minLines ? maxLines - minLines + 1 : 1;
  let lines = minLines + Number((seed / BigInt(100)) % BigInt(linesRange));
  
  // Compute times_cap = budget / line_cost(lines)
  let cost = lineCost(lines);
  let timesCap = cost > 0 ? Math.floor(budget / cost) : 1;
  
  // Feasibility repair - reduce lines until timesCap >= minTimes
  let repairCount = 0;
  while (timesCap < minTimes && lines > 2 && repairCount < 5) {
    lines = lines - 1;
    cost = lineCost(lines);
    timesCap = cost > 0 ? Math.floor(budget / cost) : 1;
    repairCount++;
  }
  
  // If still infeasible, reduce minTimes requirement
  const effectiveMinTimes = timesCap < minTimes 
    ? (timesCap >= 1 ? timesCap : 1)
    : minTimes;
  
  // Roll times with skew-high distribution
  let times: number;
  if (timesCap <= 1) {
    times = 1;
  } else {
    const t1 = 1 + Number((seed / BigInt(1000)) % BigInt(timesCap));
    const t2 = 1 + Number((seed / BigInt(10000)) % BigInt(timesCap));
    const maxT = Math.max(t1, t2);
    times = maxT < effectiveMinTimes ? effectiveMinTimes : maxT;
  }
  
  return Constraint.clearLines(lines, times);
}

/**
 * Generate boss secondary constraint (always generated, may be NoBonusUsed)
 */
function generateBossSecondaryConstraint(
  seed: bigint,
  minLines: number,
  maxLines: number,
  budgetMax: number,
  minTimes: number,
  secondaryNoBonusChance: number
): Constraint {
  // Roll to see if secondary is NoBonusUsed or ClearLines
  const noBonusRoll = Number((seed / BigInt(1000000)) % BigInt(100));
  if (noBonusRoll < secondaryNoBonusChance) {
    return Constraint.noBonus();
  }
  
  // Generate another ClearLines constraint with shifted seed and max budget
  const secondarySeed = seed / BigInt(10000000);
  return generateClearLinesConstraintMaxBudget(
    secondarySeed, minLines, maxLines, budgetMax, minTimes
  );
}

/**
 * Generate seeded boss constraints with max budget
 * Boss levels always have dual constraints
 */
function generateBossConstraintsSeeded(
  levelSeed: bigint,
  difficulty: Difficulty,
  settings: GameSettings
): { constraint: Constraint; constraint2: Constraint } {
  const params = getConstraintParams(difficulty, settings);
  
  // Primary: Always ClearLines with MAX budget
  const constraint = generateClearLinesConstraintMaxBudget(
    levelSeed,
    params.minLines,
    params.maxLines,
    params.budgetMax,
    params.minTimes
  );
  
  // Secondary: Always generated (forced dual)
  const constraint2 = generateBossSecondaryConstraint(
    levelSeed,
    params.minLines,
    params.maxLines,
    params.budgetMax,
    params.minTimes,
    params.secondaryNoBonusChance
  );
  
  return { constraint, constraint2 };
}

/**
 * Generate constraints using settings (supports dual constraints)
 * Primary is always ClearLines (from level 3+), secondary depends on dual_chance
 * Boss levels (10, 20, 30, 40, 50) always have dual constraints with max budget
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

  // Boss levels always have dual constraints with max budget
  if (isBossLevel(level)) {
    return generateBossConstraintsSeeded(levelSeed, difficulty, settings);
  }

  // Get interpolated parameters for this difficulty
  const params = getConstraintParams(difficulty, settings);

  // Generate primary constraint (always ClearLines)
  const constraint = generateClearLinesConstraint(
    levelSeed,
    params.minLines,
    params.maxLines,
    params.budgetMin,
    params.budgetMax,
    params.minTimes
  );

  // Check if we should have a secondary constraint
  const constraint2 = maybeGenerateSecondaryConstraint(
    levelSeed,
    params.minLines,
    params.maxLines,
    params.budgetMin,
    params.budgetMax,
    params.minTimes,
    params.dualChance,
    params.secondaryNoBonusChance
  );

  return { constraint, constraint2 };
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

/**
 * Unpack constraint_chances field (u32 -> individual values)
 * Packing: dual_chance(2x8bits) + secondary_no_bonus(2x8bits) = 32 bits
 */
function unpackConstraintChances(packed: bigint | number): {
  veryeasyDualChance: number;
  masterDualChance: number;
  veryeasySecondaryNoBonusChance: number;
  masterSecondaryNoBonusChance: number;
} {
  const p = BigInt(packed);
  return {
    veryeasyDualChance: Number(p & BigInt(0xff)), // bits 0-7
    masterDualChance: Number((p >> BigInt(8)) & BigInt(0xff)), // bits 8-15
    veryeasySecondaryNoBonusChance: Number((p >> BigInt(16)) & BigInt(0xff)), // bits 16-23
    masterSecondaryNoBonusChance: Number((p >> BigInt(24)) & BigInt(0xff)), // bits 24-31
  };
}

/**
 * Convert raw RECS GameSettings to our interface
 * Handles packed constraint fields from the contract
 */
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

  const constraintChances =
    raw.constraint_chances !== undefined
      ? unpackConstraintChances(raw.constraint_chances)
      : {
          veryeasyDualChance: DEFAULT_SETTINGS.veryeasyDualChance,
          masterDualChance: DEFAULT_SETTINGS.masterDualChance,
          veryeasySecondaryNoBonusChance:
            DEFAULT_SETTINGS.veryeasySecondaryNoBonusChance,
          masterSecondaryNoBonusChance:
            DEFAULT_SETTINGS.masterSecondaryNoBonusChance,
        };

  return {
    settingsId: raw.settings_id ?? DEFAULT_SETTINGS.settingsId,
    mode: raw.mode ?? DEFAULT_SETTINGS.mode,
    baseMoves: raw.base_moves ?? DEFAULT_SETTINGS.baseMoves,
    maxMoves: raw.max_moves ?? DEFAULT_SETTINGS.maxMoves,
    baseRatioX100: raw.base_ratio_x100 ?? DEFAULT_SETTINGS.baseRatioX100,
    maxRatioX100: raw.max_ratio_x100 ?? DEFAULT_SETTINGS.maxRatioX100,
    cube3Percent: raw.cube_3_percent ?? DEFAULT_SETTINGS.cube3Percent,
    cube2Percent: raw.cube_2_percent ?? DEFAULT_SETTINGS.cube2Percent,
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
    ...constraintChances,
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
    bossUpgradesEnabled:
      raw.boss_upgrades_enabled !== undefined
        ? raw.boss_upgrades_enabled !== 0
        : DEFAULT_SETTINGS.bossUpgradesEnabled,
    rerollBaseCost: raw.reroll_base_cost ?? DEFAULT_SETTINGS.rerollBaseCost,
    startingCharges: raw.starting_charges ?? DEFAULT_SETTINGS.startingCharges,
  };
}
