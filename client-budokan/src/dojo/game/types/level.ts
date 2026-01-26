/**
 * Level configuration types for the level system
 * Each level has a unique configuration based on the run seed
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
  /** Moves threshold for 3 stars */
  star3Threshold: number;
  /** Moves threshold for 2 stars */
  star2Threshold: number;
}

export class Level {
  public level: number;
  public pointsRequired: number;
  public maxMoves: number;
  public difficulty: Difficulty;
  public constraint: Constraint;
  public star3Threshold: number;
  public star2Threshold: number;

  constructor(config: LevelConfig) {
    this.level = config.level;
    this.pointsRequired = config.pointsRequired;
    this.maxMoves = config.maxMoves;
    this.difficulty = config.difficulty;
    this.constraint = config.constraint;
    this.star3Threshold = config.star3Threshold;
    this.star2Threshold = config.star2Threshold;
  }

  /** Calculate stars earned based on moves used */
  calculateStars(movesUsed: number): number {
    if (movesUsed <= this.star3Threshold) {
      return 3;
    } else if (movesUsed <= this.star2Threshold) {
      return 2;
    } else {
      return 1;
    }
  }

  /** Get bonus count earned based on stars */
  static getBonusReward(stars: number): number {
    switch (stars) {
      case 3:
        return 2;
      case 2:
        return 1;
      default:
        return 0;
    }
  }

  /** Check if level is complete */
  isComplete(currentScore: number, constraintProgress: number, bonusUsed: boolean): boolean {
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

  /** Get current potential stars (based on current move count) */
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

// Level generator constants (matching Cairo)
const LEVEL_CONSTANTS = {
  BASE_POINTS: 20,
  BASE_MOVES: 30,
  MAX_POINTS: 200,
  MAX_MOVES: 100,
  POINTS_VARIANCE: 30,
  MOVES_VARIANCE: 20,
  STAR_3_PERCENT: 40,
  STAR_2_PERCENT: 70,
  LEVEL_CAP: 100,
  CONSTRAINT_NONE_THRESHOLD: 5,
};

/**
 * Apply variance to a base value (matching Cairo's apply_variance function)
 */
function applyVariance(
  base: number,
  seed: bigint,
  varianceRange: number,
  minVal: number,
  maxVal: number
): number {
  const variance = Number(seed % BigInt(varianceRange));
  const halfRange = Math.floor(varianceRange / 2);

  let result: number;
  if (variance >= halfRange) {
    const add = variance - halfRange;
    result = Math.min(maxVal, base + add);
  } else {
    const sub = halfRange - variance;
    result = Math.max(minVal, base - sub);
  }

  return result;
}

/**
 * Generate a level configuration from seed and level number
 * This mirrors the Cairo LevelGenerator exactly
 */
export function generateLevelConfig(seed: bigint, level: number): Level {
  // Cap level for calculations
  const calcLevel = Math.min(level, LEVEL_CONSTANTS.LEVEL_CAP);

  // Calculate base values with linear scaling (matching Cairo)
  let basePoints: number;
  let baseMoves: number;

  if (calcLevel <= 1) {
    basePoints = LEVEL_CONSTANTS.BASE_POINTS;
    baseMoves = LEVEL_CONSTANTS.BASE_MOVES;
  } else {
    const pointsRange = LEVEL_CONSTANTS.MAX_POINTS - LEVEL_CONSTANTS.BASE_POINTS; // 180
    const movesRange = LEVEL_CONSTANTS.MAX_MOVES - LEVEL_CONSTANTS.BASE_MOVES; // 70
    basePoints = LEVEL_CONSTANTS.BASE_POINTS + Math.floor(((calcLevel - 1) * pointsRange) / 99);
    baseMoves = LEVEL_CONSTANTS.BASE_MOVES + Math.floor(((calcLevel - 1) * movesRange) / 99);
  }

  // Derive level-specific seed using Poseidon (matching Cairo)
  const levelSeed = deriveLevelSeed(seed, level);

  // Calculate seeds for points and moves (matching Cairo)
  const pointsSeed = levelSeed;
  const movesSeed = levelSeed / BigInt(1000);

  // Apply variance (matching Cairo's apply_variance function)
  const pointsRequired = applyVariance(
    basePoints,
    pointsSeed,
    LEVEL_CONSTANTS.POINTS_VARIANCE,
    15,
    255
  );
  const maxMoves = applyVariance(
    baseMoves,
    movesSeed,
    LEVEL_CONSTANTS.MOVES_VARIANCE,
    20,
    127
  );

  // Calculate star thresholds
  const star3Threshold = Math.floor((maxMoves * LEVEL_CONSTANTS.STAR_3_PERCENT) / 100);
  const star2Threshold = Math.floor((maxMoves * LEVEL_CONSTANTS.STAR_2_PERCENT) / 100);

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
    star3Threshold,
    star2Threshold,
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
  // No constraint for first few levels (matching Cairo)
  if (level <= LEVEL_CONSTANTS.CONSTRAINT_NONE_THRESHOLD) {
    return Constraint.none();
  }

  // Determine constraint based on level range (matching Cairo)
  if (level <= 20) {
    // Levels 6-20: Clear 2 lines, 1 time
    return Constraint.clearLines(2, 1);
  } else if (level <= 40) {
    // Levels 21-40: Clear 2-3 lines, 1-2 times
    const linesVar = Number(levelSeed % BigInt(2));
    const timesVar = Number((levelSeed / BigInt(100)) % BigInt(2));
    return Constraint.clearLines(2 + linesVar, 1 + timesVar);
  } else if (level <= 60) {
    // Levels 41-60: ClearLines(3-4, 2-3) or NoBonusUsed (20% chance)
    const isNoBonus = (levelSeed % BigInt(5)) === BigInt(0);
    if (isNoBonus) {
      return Constraint.noBonus();
    } else {
      const linesVar = Number(levelSeed % BigInt(2));
      const timesVar = Number((levelSeed / BigInt(100)) % BigInt(2));
      return Constraint.clearLines(3 + linesVar, 2 + timesVar);
    }
  } else if (level <= 80) {
    // Levels 61-80: Clear 4 lines, 3-4 times
    const timesVar = Number(levelSeed % BigInt(2));
    return Constraint.clearLines(4, 3 + timesVar);
  } else {
    // Levels 81+: Clear 4-5 lines, 4-6 times
    const linesVar = Number(levelSeed % BigInt(2));
    const timesVar = Number((levelSeed / BigInt(100)) % BigInt(3));
    const lines = Math.min(5, 4 + linesVar);
    const times = Math.min(6, 4 + timesVar);
    return Constraint.clearLines(lines, times);
  }
}
