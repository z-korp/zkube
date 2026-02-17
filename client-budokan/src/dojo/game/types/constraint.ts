/**
 * Constraint types for the level system
 * Constraints are level-specific objectives that must be met to complete a level
 */

export enum ConstraintType {
  /** No constraint - just reach the point goal */
  None = 0,
  /** Must clear X lines in a single move, Y times */
  ClearLines = 1,
  /** Must destroy X blocks of a specific size (accumulating) */
  BreakBlocks = 2,
  /** Must reach a combo of X (one-shot) */
  AchieveCombo = 3,
  /** Must fill grid to X rows Y times (height after resolve) */
  FillAndClear = 4,
  /** Must complete level without using any bonus (boss-only) */
  NoBonusUsed = 5,
  /** Must clear entire grid to 0 blocks (boss-only, one-shot) */
  ClearGrid = 6,
}

export interface LevelConstraint {
  /** The type of constraint */
  constraintType: ConstraintType;
  /** For ClearLines: number of lines to clear in one move */
  value: number;
  /** For ClearLines: how many times to achieve it */
  requiredCount: number;
}

export class Constraint {
  public constraintType: ConstraintType;
  public value: number;
  public requiredCount: number;

  constructor(constraintType: ConstraintType, value: number, requiredCount: number) {
    this.constraintType = constraintType;
    this.value = value;
    this.requiredCount = requiredCount;
  }

  static none(): Constraint {
    return new Constraint(ConstraintType.None, 0, 0);
  }

  static clearLines(lines: number, times: number): Constraint {
    return new Constraint(ConstraintType.ClearLines, lines, times);
  }

  static breakBlocks(targetSize: number, count: number): Constraint {
    return new Constraint(ConstraintType.BreakBlocks, targetSize, count);
  }

  static achieveCombo(comboTarget: number): Constraint {
    return new Constraint(ConstraintType.AchieveCombo, comboTarget, 1);
  }

  static fillAndClear(targetRow: number, times: number): Constraint {
    return new Constraint(ConstraintType.FillAndClear, targetRow, times);
  }

  static noBonus(): Constraint {
    return new Constraint(ConstraintType.NoBonusUsed, 0, 0);
  }

  static clearGrid(): Constraint {
    return new Constraint(ConstraintType.ClearGrid, 0, 1);
  }

  static fromContractValues(type: number, value: number, count: number): Constraint {
    return new Constraint(type as ConstraintType, value, count);
  }

  isSatisfied(progress: number, bonusUsed: boolean): boolean {
    switch (this.constraintType) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ClearLines:
        return progress >= this.requiredCount;
      case ConstraintType.BreakBlocks:
        return progress >= this.requiredCount;
      case ConstraintType.AchieveCombo:
        return progress >= 1;
      case ConstraintType.FillAndClear:
        return progress >= this.requiredCount;
      case ConstraintType.NoBonusUsed:
        return !bonusUsed;
      case ConstraintType.ClearGrid:
        return progress >= 1;
      default:
        return true;
    }
  }

  getDescription(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "No constraint";
      case ConstraintType.ClearLines:
        return `Clear ${this.value}+ lines ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.BreakBlocks:
        return `Break ${this.requiredCount} size-${this.value} blocks`;
      case ConstraintType.AchieveCombo:
        return `Reach ${this.value}x combo`;
      case ConstraintType.FillAndClear:
        return `Fill to row ${this.value} ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.NoBonusUsed:
        return "No bonus allowed";
      case ConstraintType.ClearGrid:
        return "Clear entire grid";
      default:
        return "Unknown";
    }
  }

  getLabel(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "";
      case ConstraintType.ClearLines:
        return `${this.value}+ lines x${this.requiredCount}`;
      case ConstraintType.BreakBlocks:
        return `Break ${this.requiredCount}x size-${this.value}`;
      case ConstraintType.AchieveCombo:
        return `${this.value}x combo`;
      case ConstraintType.FillAndClear:
        return `Fill row ${this.value} x${this.requiredCount}`;
      case ConstraintType.NoBonusUsed:
        return "No Bonus";
      case ConstraintType.ClearGrid:
        return "Clear Grid";
      default:
        return "";
    }
  }
}
