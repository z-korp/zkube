/**
 * Constraint types for the level system
 * Constraints are level-specific objectives that must be met to complete a level
 *
 * 7 constraint types (0-6):
 * - None: No constraint
 * - ClearLines: Clear X lines in a single move, Y times
 * - BreakBlocks: Destroy X blocks of a specific size, accumulating count
 * - AchieveCombo: Reach a combo of X (one-shot: progress=1 once triggered)
 * - Fill: Fill X rows Y times (grid height reaches row X after move resolves)
 * - NoBonusUsed: Complete level without using any bonus (boss-only)
 * - ClearGrid: Clear the entire grid (boss-only, one-shot)
 */

export enum ConstraintType {
  /** No constraint - just reach the point goal */
  None = 0,
  /** Must clear X lines in a single move, Y times */
  ClearLines = 1,
  /** Must destroy blocks of a specific size, accumulating count */
  BreakBlocks = 2,
  /** Must achieve a combo of at least X lines in a single level */
  AchieveCombo = 3,
  /** Must fill X rows Y times (grid height reaches row X after move resolves) */
  FillAndClear = 4,
  /** Must complete level without using any bonus (boss-only) */
  NoBonusUsed = 5,
  /** Must clear the entire grid to 0 blocks (boss-only, one-shot) */
  ClearGrid = 6,
}

export interface LevelConstraint {
  /** The type of constraint */
  constraintType: ConstraintType;
  /** Meaning varies by type:
   * - ClearLines: number of lines to clear in one move
   * - BreakBlocks: block size to target (1-4)
   * - AchieveCombo: combo target to reach
    * - FillAndClear: row height target (grid must reach this after resolve)
    * - NoBonusUsed/ClearGrid/None: 0 */
  value: number;
  /** Meaning varies by type:
    * - ClearLines: how many times to achieve it
    * - BreakBlocks: total blocks to destroy
    * - AchieveCombo: 1 (always one-shot)
    * - FillAndClear: how many times to reach target height
   * - NoBonusUsed/ClearGrid/None: 0 */
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

  /** Create a BreakBlocks constraint */
  static breakBlocks(blockSize: number, count: number): Constraint {
    return new Constraint(ConstraintType.BreakBlocks, blockSize, count);
  }

  /** Create an AchieveCombo constraint */
  static achieveCombo(comboTarget: number): Constraint {
    return new Constraint(ConstraintType.AchieveCombo, comboTarget, 1);
  }

  /** Create a Fill constraint (fill X rows Y times) */
  static fillAndClear(rowHeight: number, times: number): Constraint {
    return new Constraint(ConstraintType.FillAndClear, rowHeight, times);
  }

  /** Create a NoBonusUsed constraint */
  static noBonus(): Constraint {
    return new Constraint(ConstraintType.NoBonusUsed, 0, 0);
  }

  /** Create a ClearGrid constraint */
  static clearGrid(): Constraint {
    return new Constraint(ConstraintType.ClearGrid, 0, 1);
  }

  /** Check if constraint is satisfied */
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

  /** Get a human-readable description */
  getDescription(): string {
    switch (this.constraintType) {
      case ConstraintType.None:
        return "No constraint";
      case ConstraintType.ClearLines:
        return `Clear ${this.value}+ lines ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.BreakBlocks:
        return `Destroy ${this.requiredCount} size-${this.value} blocks`;
      case ConstraintType.AchieveCombo:
        return `Achieve ${this.value}+ combo`;
      case ConstraintType.FillAndClear:
        return `Reach row ${this.value} ${this.requiredCount} time${this.requiredCount > 1 ? "s" : ""}`;
      case ConstraintType.NoBonusUsed:
        return "No bonus allowed";
      case ConstraintType.ClearGrid:
        return "Clear the entire grid";
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
      case ConstraintType.BreakBlocks:
        return `Break ${this.requiredCount} size-${this.value}`;
      case ConstraintType.AchieveCombo:
        return `${this.value}+ combo`;
      case ConstraintType.FillAndClear:
        return `Row ${this.value} x${this.requiredCount}`;
      case ConstraintType.NoBonusUsed:
        return "No Bonus";
      case ConstraintType.ClearGrid:
        return "Clear Grid";
      default:
        return "";
    }
  }

  /** Check if this constraint is boss-only */
  isBossOnly(): boolean {
    return (
      this.constraintType === ConstraintType.NoBonusUsed ||
      this.constraintType === ConstraintType.ClearGrid
    );
  }
}
