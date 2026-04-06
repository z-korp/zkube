/**
 * Constraint types for the level system
 * Constraints are level-specific objectives that must be met to complete a level
 */

export enum ConstraintType {
  /** No constraint - just reach the point goal */
  None = 0,
  /** Must clear X lines in a single move, Y times */
  ComboLines = 1,
  /** Must destroy X blocks of a specific size (accumulating) */
  BreakBlocks = 2,
  /** Must reach a combo of X (one-shot) */
  ComboStreak = 3,
  /** Must keep grid below X filled rows (boss-only, fail-on-breach) */
  KeepGridBelow = 4,
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
    return new Constraint(ConstraintType.ComboLines, lines, times);
  }

  static breakBlocks(targetSize: number, count: number): Constraint {
    return new Constraint(ConstraintType.BreakBlocks, targetSize, count);
  }

  static achieveCombo(comboTarget: number): Constraint {
    return new Constraint(ConstraintType.ComboStreak, comboTarget, 1);
  }

  static keepGridBelow(maxRowsExclusive: number): Constraint {
    return new Constraint(ConstraintType.KeepGridBelow, maxRowsExclusive, 1);
  }

  static fromContractValues(type: number, value: number, count: number): Constraint {
    return new Constraint(type as ConstraintType, value, count);
  }

  isSatisfied(progress: number, _bonusUsed: boolean): boolean {
    switch (this.constraintType) {
      case ConstraintType.None:
        return true;
      case ConstraintType.ComboLines:
        return progress >= this.requiredCount;
      case ConstraintType.BreakBlocks:
        return progress >= this.requiredCount;
      case ConstraintType.ComboStreak:
        return progress >= 1;
      case ConstraintType.KeepGridBelow:
        return progress === 0;
      default:
        return true;
    }
  }

  getDescription(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "No constraint";
      case ConstraintType.ComboLines:
        return `Make ${this.value}+ combos ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.BreakBlocks:
        return `Break ${this.requiredCount} size-${this.value} blocks`;
      case ConstraintType.ComboStreak:
        return `Reach ${this.value}x combo`;
      case ConstraintType.KeepGridBelow:
        return `Keep below ${this.value} rows`;
      default:
        return "Unknown";
    }
  }

  getLabel(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "";
      case ConstraintType.ComboLines:
        return `${this.value}+ combos x${this.requiredCount}`;
      case ConstraintType.BreakBlocks:
        return `Break ${this.requiredCount}x size-${this.value}`;
      case ConstraintType.ComboStreak:
        return `${this.value}x combo`;
      case ConstraintType.KeepGridBelow:
        return `Below ${this.value}r`;
      default:
        return "";
    }
  }
}
