/**
 * Level configuration types for the level system
 * Each level has a unique configuration based on the run seed
 *
 * Key properties:
 * - Same seed + same level = same config
 * - Different seed = different config sequence
 * - Level 100+ caps at max difficulty (survival mode)
 * - Points derived from moves × ratio (0.8 → 2.5)
 * - Correlated variance keeps difficulty ratio constant
 */

import { hash } from "starknet";
import { Difficulty, DifficultyType } from "./difficulty";
import { Constraint } from "./constraint";

export interface LevelConfig {
  /** Level number (1-255) */
  level: number;
  /** Points required to complete this level */
  pointsRequired: number;
  /** Maximum moves allowed */
  maxMoves: number;
  /** Block generation difficulty */
  difficulty: Difficulty;
  /** Level constraint (objective) */
  constraint: Constraint;
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
  public cube3Threshold: number;
  public cube2Threshold: number;

  constructor(config: LevelConfig) {
    this.level = config.level;
    this.pointsRequired = config.pointsRequired;
    this.maxMoves = config.maxMoves;
    this.difficulty = config.difficulty;
    this.constraint = config.constraint;
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

  /** Check if level is complete */
  isComplete(
    currentScore: number,
    constraintProgress: number,
    bonusUsed: boolean
  ): boolean {
    return (
      currentScore >= this.pointsRequired &&
      this.constraint.isSatisfied(constraintProgress, bonusUsed)
    );
  }

  /** Check if level failed */
  isFailed(
    currentScore: number,
    currentMoves: number,
    constraintProgress: number,
    bonusUsed: boolean
  ): boolean {
    return (
      currentMoves >= this.maxMoves &&
      !this.isComplete(currentScore, constraintProgress, bonusUsed)
    );
  }

  /** Get remaining moves */
  remainingMoves(currentMoves: number): number {
    return Math.max(0, this.maxMoves - currentMoves);
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

// Level generator constants (matching Cairo)
const LEVEL_CONSTANTS = {
  // Moves scaling (linear 20 → 60)
  BASE_MOVES: 20,
  MAX_MOVES: 60,

  // Ratio scaling ×100 for integer math (0.80 → 2.50)
  BASE_RATIO_X100: 80, // 0.80 points per move at level 1
  MAX_RATIO_X100: 250, // 2.50 points per move at level 100

  // Correlated variance by level tier (percentage)
  EARLY_VARIANCE_PERCENT: 5, // ±5% for levels 1-10
  MID_VARIANCE_PERCENT: 10, // ±10% for levels 11-50
  LATE_VARIANCE_PERCENT: 15, // ±15% for levels 51-100

  // Cube thresholds (percentage of max_moves)
  CUBE_3_PERCENT: 40,
  CUBE_2_PERCENT: 70,

  // Level cap for scaling
  LEVEL_CAP: 100,

  // Constraint none threshold (constraints start from level 5)
  CONSTRAINT_NONE_THRESHOLD: 4,
};

/**
 * Calculate base moves for a level (before variance)
 * Linear scaling: 20 at level 1, 60 at level 100
 */
function calculateBaseMoves(level: number): number {
  if (level <= 1) {
    return LEVEL_CONSTANTS.BASE_MOVES;
  }
  const range = LEVEL_CONSTANTS.MAX_MOVES - LEVEL_CONSTANTS.BASE_MOVES; // 50
  const progress = Math.floor(((level - 1) * range) / 99);
  return LEVEL_CONSTANTS.BASE_MOVES + progress;
}

/**
 * Calculate ratio for this level (scaled by 100)
 * Linear scaling: 80 (0.80) at level 1, 250 (2.50) at level 100
 */
function calculateRatio(level: number): number {
  if (level <= 1) {
    return LEVEL_CONSTANTS.BASE_RATIO_X100;
  }
  const range = LEVEL_CONSTANTS.MAX_RATIO_X100 - LEVEL_CONSTANTS.BASE_RATIO_X100; // 170
  const progress = Math.floor(((level - 1) * range) / 99);
  return LEVEL_CONSTANTS.BASE_RATIO_X100 + progress;
}

/**
 * Get variance percentage based on level tier
 */
function getVariancePercent(level: number): number {
  if (level <= 10) {
    return LEVEL_CONSTANTS.EARLY_VARIANCE_PERCENT;
  } else if (level <= 50) {
    return LEVEL_CONSTANTS.MID_VARIANCE_PERCENT;
  } else {
    return LEVEL_CONSTANTS.LATE_VARIANCE_PERCENT;
  }
}

/**
 * Calculate correlated variance factor
 * Returns a value like 95-105 for ±5%, or 85-115 for ±15%
 */
function calculateVarianceFactor(seed: bigint, variancePercent: number): number {
  const varianceRange = variancePercent * 2 + 1; // e.g., 11 for ±5% (95-105)
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
 * Generate a level configuration from seed and level number
 * This mirrors the Cairo LevelGenerator exactly
 */
export function generateLevelConfig(seed: bigint, level: number): Level {
  // Cap level for calculations
  const calcLevel = Math.min(level, LEVEL_CONSTANTS.LEVEL_CAP);

  // Derive level-specific seed using Poseidon (matching Cairo)
  const levelSeed = deriveLevelSeed(seed, level);

  // 1. Calculate base moves (35 → 85)
  const baseMoves = calculateBaseMoves(calcLevel);

  // 2. Calculate ratio for this level (0.80 → 2.50)
  const ratioX100 = calculateRatio(calcLevel);

  // 3. Calculate base points from moves × ratio
  const basePoints = Math.floor((baseMoves * ratioX100) / 100);

  // 4. Get variance percent based on level tier
  const variancePercent = getVariancePercent(calcLevel);

  // 5. Apply CORRELATED variance (same factor for both)
  const varianceFactor = calculateVarianceFactor(levelSeed, variancePercent);
  const pointsRequired = applyFactor(basePoints, varianceFactor);
  const maxMoves = applyFactor(baseMoves, varianceFactor);

  // Calculate cube thresholds
  const cube3Threshold = Math.floor(
    (maxMoves * LEVEL_CONSTANTS.CUBE_3_PERCENT) / 100
  );
  const cube2Threshold = Math.floor(
    (maxMoves * LEVEL_CONSTANTS.CUBE_2_PERCENT) / 100
  );

  // Get difficulty
  const difficulty = getDifficultyForLevel(calcLevel);

  // Generate constraint
  const constraint = generateConstraint(levelSeed, calcLevel);

  return new Level({
    level,
    pointsRequired,
    maxMoves,
    difficulty,
    constraint,
    cube3Threshold,
    cube2Threshold,
  });
}

/** Derive a deterministic seed for a specific level (matching Cairo's Poseidon) */
function deriveLevelSeed(seed: bigint, level: number): bigint {
  // Use starknet.js Poseidon to match Cairo's implementation
  // Cairo does: poseidon(seed, level, 'LEVEL_CONFIG')
  const levelConfigSelector = BigInt("0x4c4556454c5f434f4e464947"); // 'LEVEL_CONFIG' as felt252
  const hashResult = hash.computePoseidonHashOnElements([
    seed,
    BigInt(level),
    levelConfigSelector,
  ]);
  return BigInt(hashResult);
}

/** Get difficulty for a level */
function getDifficultyForLevel(level: number): Difficulty {
  if (level <= 10) return new Difficulty(DifficultyType.Easy);
  if (level <= 25) return new Difficulty(DifficultyType.Medium);
  if (level <= 45) return new Difficulty(DifficultyType.MediumHard);
  if (level <= 65) return new Difficulty(DifficultyType.Hard);
  if (level <= 85) return new Difficulty(DifficultyType.VeryHard);
  if (level <= 95) return new Difficulty(DifficultyType.Expert);
  return new Difficulty(DifficultyType.Master);
}

/** Generate constraint for a level (matching Cairo's generate_constraint) */
function generateConstraint(levelSeed: bigint, level: number): Constraint {
  // No constraint for first few levels (levels 1-4)
  if (level <= LEVEL_CONSTANTS.CONSTRAINT_NONE_THRESHOLD) {
    return Constraint.none();
  }

  const roll = Number(levelSeed % BigInt(100)); // 0-99 for precise percentages

  if (level <= 20) {
    // Levels 5-20
    if (roll < 5) {
      // 5% No Bonus Used
      return Constraint.noBonus();
    } else if (roll < 15) {
      // 10% No Constraint
      return Constraint.none();
    } else if (roll < 65) {
      // 50% Clear 2+ lines, 1-4 times
      const times = 1 + Number((levelSeed / BigInt(100)) % BigInt(4));
      return Constraint.clearLines(2, times);
    } else if (roll < 95) {
      // 30% Clear 3+ lines, 1-2 times
      const times = 1 + Number((levelSeed / BigInt(100)) % BigInt(2));
      return Constraint.clearLines(3, times);
    } else {
      // 5% Clear 4+ lines, 1 time
      return Constraint.clearLines(4, 1);
    }
  } else if (level <= 40) {
    // Levels 21-40
    if (roll < 3) {
      // 3% No Bonus Used
      return Constraint.noBonus();
    } else if (roll < 5) {
      // 2% No Constraint
      return Constraint.none();
    } else if (roll < 55) {
      // 50% Clear 2+ lines, 2-6 times
      const times = 2 + Number((levelSeed / BigInt(100)) % BigInt(5));
      return Constraint.clearLines(2, times);
    } else if (roll < 85) {
      // 30% Clear 3+ lines, 2-4 times
      const times = 2 + Number((levelSeed / BigInt(100)) % BigInt(3));
      return Constraint.clearLines(3, times);
    } else if (roll < 95) {
      // 10% Clear 4+ lines, 1-2 times
      const times = 1 + Number((levelSeed / BigInt(100)) % BigInt(2));
      return Constraint.clearLines(4, times);
    } else {
      // 5% Clear 5+ lines, 1 time
      return Constraint.clearLines(5, 1);
    }
  } else if (level <= 60) {
    // Levels 41-60
    if (roll < 3) {
      // 3% No Bonus Used
      return Constraint.noBonus();
    } else if (roll < 5) {
      // 2% No Constraint
      return Constraint.none();
    } else if (roll < 45) {
      // 40% Clear 2+ lines, 3-8 times
      const times = 3 + Number((levelSeed / BigInt(100)) % BigInt(6));
      return Constraint.clearLines(2, times);
    } else if (roll < 75) {
      // 30% Clear 3+ lines, 3-6 times
      const times = 3 + Number((levelSeed / BigInt(100)) % BigInt(4));
      return Constraint.clearLines(3, times);
    } else if (roll < 95) {
      // 20% Clear 4+ lines, 2-4 times
      const times = 2 + Number((levelSeed / BigInt(100)) % BigInt(3));
      return Constraint.clearLines(4, times);
    } else {
      // 5% Clear 5+ lines, 1-2 times
      const times = 1 + Number((levelSeed / BigInt(100)) % BigInt(2));
      return Constraint.clearLines(5, times);
    }
  } else if (level <= 80) {
    // Levels 61-80
    if (roll < 3) {
      // 3% No Bonus Used
      return Constraint.noBonus();
    } else if (roll < 5) {
      // 2% No Constraint
      return Constraint.none();
    } else if (roll < 35) {
      // 30% Clear 2+ lines, 4-10 times
      const times = 4 + Number((levelSeed / BigInt(100)) % BigInt(7));
      return Constraint.clearLines(2, times);
    } else if (roll < 70) {
      // 35% Clear 3+ lines, 4-8 times
      const times = 4 + Number((levelSeed / BigInt(100)) % BigInt(5));
      return Constraint.clearLines(3, times);
    } else if (roll < 90) {
      // 20% Clear 4+ lines, 3-6 times
      const times = 3 + Number((levelSeed / BigInt(100)) % BigInt(4));
      return Constraint.clearLines(4, times);
    } else if (roll < 95) {
      // 5% Clear 5+ lines, 2-4 times
      const times = 2 + Number((levelSeed / BigInt(100)) % BigInt(3));
      return Constraint.clearLines(5, times);
    } else {
      // 5% Clear 6+ lines, 1 time
      return Constraint.clearLines(6, 1);
    }
  } else {
    // Levels 81+
    if (roll < 3) {
      // 3% No Bonus Used
      return Constraint.noBonus();
    } else if (roll < 5) {
      // 2% No Constraint
      return Constraint.none();
    } else if (roll < 35) {
      // 30% Clear 2+ lines, 5-12 times
      const times = 5 + Number((levelSeed / BigInt(100)) % BigInt(8));
      return Constraint.clearLines(2, times);
    } else if (roll < 65) {
      // 30% Clear 3+ lines, 5-10 times
      const times = 5 + Number((levelSeed / BigInt(100)) % BigInt(6));
      return Constraint.clearLines(3, times);
    } else if (roll < 85) {
      // 20% Clear 4+ lines, 4-8 times
      const times = 4 + Number((levelSeed / BigInt(100)) % BigInt(5));
      return Constraint.clearLines(4, times);
    } else if (roll < 90) {
      // 5% Clear 5+ lines, 3-6 times
      const times = 3 + Number((levelSeed / BigInt(100)) % BigInt(4));
      return Constraint.clearLines(5, times);
    } else if (roll < 95) {
      // 5% Clear 6+ lines, 1-2 times
      const times = 1 + Number((levelSeed / BigInt(100)) % BigInt(2));
      return Constraint.clearLines(6, times);
    } else {
      // 5% Clear 7+ lines, 1 time
      return Constraint.clearLines(7, 1);
    }
  }
}
