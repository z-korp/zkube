/**
 * Level configuration types for the level system
 * Each level has a unique configuration based on the run seed and GameSettings
 *
 * Key properties:
 * - Same seed + same level + same settings = same config
 * - Different seed = different config sequence
 * - Level 100+ caps at max difficulty (survival mode)
 * - Points derived from moves x ratio (configurable, default 0.8 -> 2.5)
 * - Correlated variance keeps difficulty ratio constant
 * - Supports dual constraints from settings
 */

import { hash } from "starknet";
import { Difficulty, DifficultyType } from "./difficulty";
import { Constraint } from "./constraint";

/**
 * GameSettings interface matching the Cairo contract
 * Used for configurable game modes
 */
export interface GameSettings {
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
  // Consumable Costs
  hammerCost: number;
  waveCost: number;
  totemCost: number;
  extraMovesCost: number;
  // Reward Multiplier
  cubeMultiplierX100: number;
  // Difficulty Progression
  startingDifficulty: number;
  difficultyStepLevels: number;
  // Constraint Settings
  constraintsEnabled: boolean;
  constraintStartLevel: number;
  // Constraint Distribution (Easy to Master interpolation)
  easyNoneChance: number;
  masterNoneChance: number;
  easyNoBonusChance: number;
  masterNoBonusChance: number;
  easyMinLines: number;
  masterMinLines: number;
  easyMaxLines: number;
  masterMaxLines: number;
  easyMinTimes: number;
  masterMinTimes: number;
  easyMaxTimes: number;
  masterMaxTimes: number;
  easyDualChance: number;
  masterDualChance: number;
  // Block Distribution (not used in level gen but included for completeness)
  easySize1Weight: number;
  easySize2Weight: number;
  easySize3Weight: number;
  easySize4Weight: number;
  easySize5Weight: number;
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
}

/**
 * Default settings matching Cairo's GameSettingsDefaults
 */
export const DEFAULT_SETTINGS: GameSettings = {
  mode: 1, // Increasing
  // Level Scaling
  baseMoves: 20,
  maxMoves: 60,
  baseRatioX100: 80, // 0.80
  maxRatioX100: 250, // 2.50
  // Cube Thresholds
  cube3Percent: 40,
  cube2Percent: 70,
  // Consumable Costs
  hammerCost: 5,
  waveCost: 5,
  totemCost: 5,
  extraMovesCost: 10,
  // Reward Multiplier
  cubeMultiplierX100: 100, // 1.0x
  // Difficulty Progression
  startingDifficulty: 0, // Easy
  difficultyStepLevels: 15, // Every 15 levels
  // Constraint Settings
  constraintsEnabled: true,
  constraintStartLevel: 5,
  // Constraint Distribution (Easy to Master)
  easyNoneChance: 30,
  masterNoneChance: 0,
  easyNoBonusChance: 0,
  masterNoBonusChance: 25,
  easyMinLines: 2,
  masterMinLines: 5,
  easyMaxLines: 3,
  masterMaxLines: 7,
  easyMinTimes: 1,
  masterMinTimes: 4,
  easyMaxTimes: 2,
  masterMaxTimes: 10,
  easyDualChance: 0,
  masterDualChance: 50,
  // Block Distribution
  easySize1Weight: 20,
  easySize2Weight: 33,
  easySize3Weight: 27,
  easySize4Weight: 13,
  easySize5Weight: 7,
  masterSize1Weight: 7,
  masterSize2Weight: 13,
  masterSize3Weight: 20,
  masterSize4Weight: 27,
  masterSize5Weight: 33,
  // Variance Settings
  earlyVariancePercent: 5,
  midVariancePercent: 10,
  lateVariancePercent: 15,
  // Level Tier Thresholds
  earlyLevelThreshold: 10,
  midLevelThreshold: 50,
  // Level Cap
  levelCap: 100,
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
  const levelCap = settings.levelCap || 100;

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
 * Linear scaling from baseMoves at level 1 to maxMoves at level 100
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
  const progress = Math.floor(((level - 1) * range) / 99);
  return baseMoves + progress;
}

/**
 * Calculate ratio for this level (scaled by 100)
 * Linear scaling from baseRatio at level 1 to maxRatio at level 100
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
  const progress = Math.floor(((level - 1) * range) / 99);
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
 * Get difficulty for a level using settings
 * Uses startingDifficulty and difficultyStepLevels for progression
 */
function getDifficultyForLevel(
  level: number,
  settings: GameSettings
): Difficulty {
  // Calculate difficulty tier based on level and step size
  const difficultyTier = Math.min(
    7, // Max tier is Master (7)
    settings.startingDifficulty +
      Math.floor((level - 1) / settings.difficultyStepLevels)
  );

  // Map tier to DifficultyType
  const difficultyMap: DifficultyType[] = [
    DifficultyType.VeryEasy, // 0
    DifficultyType.Easy, // 1
    DifficultyType.Medium, // 2
    DifficultyType.MediumHard, // 3
    DifficultyType.Hard, // 4
    DifficultyType.VeryHard, // 5
    DifficultyType.Expert, // 6
    DifficultyType.Master, // 7
  ];

  return new Difficulty(difficultyMap[difficultyTier] ?? DifficultyType.Master);
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
 */
function getConstraintParams(
  difficulty: Difficulty,
  settings: GameSettings
): {
  noneChance: number;
  noBonusChance: number;
  minLines: number;
  maxLines: number;
  minTimes: number;
  maxTimes: number;
  dualChance: number;
} {
  // Get difficulty tier (0-7) using the into() method
  const tier = difficulty.into();
  const maxTier = 7;

  return {
    noneChance: interpolate(
      settings.easyNoneChance,
      settings.masterNoneChance,
      tier,
      maxTier
    ),
    noBonusChance: interpolate(
      settings.easyNoBonusChance,
      settings.masterNoBonusChance,
      tier,
      maxTier
    ),
    minLines: interpolate(
      settings.easyMinLines,
      settings.masterMinLines,
      tier,
      maxTier
    ),
    maxLines: interpolate(
      settings.easyMaxLines,
      settings.masterMaxLines,
      tier,
      maxTier
    ),
    minTimes: interpolate(
      settings.easyMinTimes,
      settings.masterMinTimes,
      tier,
      maxTier
    ),
    maxTimes: interpolate(
      settings.easyMaxTimes,
      settings.masterMaxTimes,
      tier,
      maxTier
    ),
    dualChance: interpolate(
      settings.easyDualChance,
      settings.masterDualChance,
      tier,
      maxTier
    ),
  };
}

/**
 * Generate a single constraint from parameters
 */
function generateConstraintFromParams(
  seed: bigint,
  noneChance: number,
  noBonusChance: number,
  minLines: number,
  maxLines: number,
  minTimes: number,
  maxTimes: number
): Constraint {
  const roll = Number(seed % BigInt(100));

  // Determine constraint type based on probabilities
  if (roll < noneChance) {
    return Constraint.none();
  } else if (roll < noneChance + noBonusChance) {
    return Constraint.noBonus();
  } else {
    // ClearLines constraint - calculate lines and times from ranges
    const linesRange = Math.max(1, maxLines - minLines + 1);
    const timesRange = Math.max(1, maxTimes - minTimes + 1);

    const lines =
      minLines + Number((seed / BigInt(100)) % BigInt(linesRange));
    const times =
      minTimes + Number((seed / BigInt(1000)) % BigInt(timesRange));

    return Constraint.clearLines(lines, times);
  }
}

/**
 * Generate constraints using settings (supports dual constraints)
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

  // No constraint before the start level
  if (level < settings.constraintStartLevel) {
    return { constraint: Constraint.none(), constraint2: Constraint.none() };
  }

  // Get interpolated parameters for this difficulty
  const params = getConstraintParams(difficulty, settings);

  // Generate primary constraint
  const constraint = generateConstraintFromParams(
    levelSeed,
    params.noneChance,
    params.noBonusChance,
    params.minLines,
    params.maxLines,
    params.minTimes,
    params.maxTimes
  );

  // Check if we should have a secondary constraint
  const dualRoll = Number((levelSeed / BigInt(10000)) % BigInt(100));
  let constraint2 = Constraint.none();

  if (dualRoll < params.dualChance) {
    // Generate secondary constraint with shifted seed
    const secondarySeed = levelSeed / BigInt(100000);
    constraint2 = generateConstraintFromParams(
      secondarySeed,
      params.noneChance,
      params.noBonusChance,
      params.minLines,
      params.maxLines,
      params.minTimes,
      params.maxTimes
    );

    // If secondary is same type as primary, try alternate
    if (constraint2.constraintType === constraint.constraintType) {
      if (constraint.constraintType === 2) {
        // Primary is NoBonusUsed, make secondary ClearLines
        const linesRange = Math.max(1, params.maxLines - params.minLines + 1);
        const timesRange = Math.max(1, params.maxTimes - params.minTimes + 1);
        const lines =
          params.minLines +
          Number((levelSeed / BigInt(1000000)) % BigInt(linesRange));
        const times =
          params.minTimes +
          Number((levelSeed / BigInt(10000000)) % BigInt(timesRange));
        constraint2 = Constraint.clearLines(lines, times);
      } else if (params.noBonusChance > 0) {
        // Add NoBonusUsed as secondary
        constraint2 = Constraint.noBonus();
      } else {
        // Generate different ClearLines parameters
        const linesRange = Math.max(1, params.maxLines - params.minLines + 1);
        const timesRange = Math.max(1, params.maxTimes - params.minTimes + 1);
        const lines =
          params.minLines +
          Number((levelSeed / BigInt(1000000)) % BigInt(linesRange));
        const times =
          params.minTimes +
          Number((levelSeed / BigInt(10000000)) % BigInt(timesRange));
        constraint2 = Constraint.clearLines(lines, times);
      }
    }
  }

  return { constraint, constraint2 };
}

/**
 * Convert raw RECS GameSettings to our interface
 */
export function parseGameSettings(raw: any): GameSettings {
  if (!raw) return DEFAULT_SETTINGS;

  return {
    mode: raw.mode ?? DEFAULT_SETTINGS.mode,
    baseMoves: raw.base_moves ?? DEFAULT_SETTINGS.baseMoves,
    maxMoves: raw.max_moves ?? DEFAULT_SETTINGS.maxMoves,
    baseRatioX100: raw.base_ratio_x100 ?? DEFAULT_SETTINGS.baseRatioX100,
    maxRatioX100: raw.max_ratio_x100 ?? DEFAULT_SETTINGS.maxRatioX100,
    cube3Percent: raw.cube_3_percent ?? DEFAULT_SETTINGS.cube3Percent,
    cube2Percent: raw.cube_2_percent ?? DEFAULT_SETTINGS.cube2Percent,
    hammerCost: raw.hammer_cost ?? DEFAULT_SETTINGS.hammerCost,
    waveCost: raw.wave_cost ?? DEFAULT_SETTINGS.waveCost,
    totemCost: raw.totem_cost ?? DEFAULT_SETTINGS.totemCost,
    extraMovesCost: raw.extra_moves_cost ?? DEFAULT_SETTINGS.extraMovesCost,
    cubeMultiplierX100:
      raw.cube_multiplier_x100 ?? DEFAULT_SETTINGS.cubeMultiplierX100,
    startingDifficulty:
      raw.starting_difficulty ?? DEFAULT_SETTINGS.startingDifficulty,
    difficultyStepLevels:
      raw.difficulty_step_levels ?? DEFAULT_SETTINGS.difficultyStepLevels,
    constraintsEnabled:
      raw.constraints_enabled !== undefined
        ? raw.constraints_enabled !== 0
        : DEFAULT_SETTINGS.constraintsEnabled,
    constraintStartLevel:
      raw.constraint_start_level ?? DEFAULT_SETTINGS.constraintStartLevel,
    easyNoneChance: raw.easy_none_chance ?? DEFAULT_SETTINGS.easyNoneChance,
    masterNoneChance:
      raw.master_none_chance ?? DEFAULT_SETTINGS.masterNoneChance,
    easyNoBonusChance:
      raw.easy_no_bonus_chance ?? DEFAULT_SETTINGS.easyNoBonusChance,
    masterNoBonusChance:
      raw.master_no_bonus_chance ?? DEFAULT_SETTINGS.masterNoBonusChance,
    easyMinLines: raw.easy_min_lines ?? DEFAULT_SETTINGS.easyMinLines,
    masterMinLines: raw.master_min_lines ?? DEFAULT_SETTINGS.masterMinLines,
    easyMaxLines: raw.easy_max_lines ?? DEFAULT_SETTINGS.easyMaxLines,
    masterMaxLines: raw.master_max_lines ?? DEFAULT_SETTINGS.masterMaxLines,
    easyMinTimes: raw.easy_min_times ?? DEFAULT_SETTINGS.easyMinTimes,
    masterMinTimes: raw.master_min_times ?? DEFAULT_SETTINGS.masterMinTimes,
    easyMaxTimes: raw.easy_max_times ?? DEFAULT_SETTINGS.easyMaxTimes,
    masterMaxTimes: raw.master_max_times ?? DEFAULT_SETTINGS.masterMaxTimes,
    easyDualChance: raw.easy_dual_chance ?? DEFAULT_SETTINGS.easyDualChance,
    masterDualChance:
      raw.master_dual_chance ?? DEFAULT_SETTINGS.masterDualChance,
    easySize1Weight: raw.easy_size1_weight ?? DEFAULT_SETTINGS.easySize1Weight,
    easySize2Weight: raw.easy_size2_weight ?? DEFAULT_SETTINGS.easySize2Weight,
    easySize3Weight: raw.easy_size3_weight ?? DEFAULT_SETTINGS.easySize3Weight,
    easySize4Weight: raw.easy_size4_weight ?? DEFAULT_SETTINGS.easySize4Weight,
    easySize5Weight: raw.easy_size5_weight ?? DEFAULT_SETTINGS.easySize5Weight,
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
    earlyVariancePercent:
      raw.early_variance_percent ?? DEFAULT_SETTINGS.earlyVariancePercent,
    midVariancePercent:
      raw.mid_variance_percent ?? DEFAULT_SETTINGS.midVariancePercent,
    lateVariancePercent:
      raw.late_variance_percent ?? DEFAULT_SETTINGS.lateVariancePercent,
    earlyLevelThreshold:
      raw.early_level_threshold ?? DEFAULT_SETTINGS.earlyLevelThreshold,
    midLevelThreshold:
      raw.mid_level_threshold ?? DEFAULT_SETTINGS.midLevelThreshold,
    levelCap: raw.level_cap ?? DEFAULT_SETTINGS.levelCap,
  };
}
