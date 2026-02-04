/**
 * Constraint types for the level system
 * Constraints are level-specific objectives that must be met to complete a level
 */

export enum ConstraintType {
  /** No constraint - just reach the point goal */
  None = 0,
  /** Must clear X lines in a single move, Y times */
  ClearLines = 1,
  /** Must complete level without using any bonus */
  NoBonusUsed = 2,
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

  /** Create a default (no constraint) constraint */
  static none(): Constraint {
    return new Constraint(ConstraintType.None, 0, 0);
  }

  /** Create a ClearLines constraint */
  static clearLines(lines: number, times: number): Constraint {
    return new Constraint(ConstraintType.ClearLines, lines, times);
  }

  /** Create a NoBonusUsed constraint */
  static noBonus(): Constraint {
    return new Constraint(ConstraintType.NoBonusUsed, 0, 0);
  }

  /** Check if constraint is satisfied */
  isSatisfied(progress: number, bonusUsed: boolean): boolean {
    switch (this.constraintType) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ClearLines:
        return progress >= this.requiredCount;
      case ConstraintType.NoBonusUsed:
        return !bonusUsed;
      default:
        return true;
    }
  }

  /** Get a human-readable description */
  getDescription(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "No constraint";
      case ConstraintType.ClearLines:
        return `Clear ${this.value}+ lines ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.NoBonusUsed:
        return "No bonus allowed";
      default:
        return "Unknown";
    }
  }

  /** Get short label for UI */
  getLabel(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "";
      case ConstraintType.ClearLines:
        return `${this.value}+ lines x${this.requiredCount}`;
      case ConstraintType.NoBonusUsed:
        return "No Bonus";
      default:
        return "";
    }
  }
}
