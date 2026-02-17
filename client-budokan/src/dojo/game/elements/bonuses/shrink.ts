import type { Condition } from "../../types/bonus";

/**
 * Shrink Bonus - Reduces all blocks on the grid by 1 size
 * 
 * Level scaling:
 * - L1: Shrinks blocks by 1 size (size 1 blocks disappear)
 * - L2: Shrinks by 1, adds 1 free move
 * - L3: Shrinks by 1, adds 2 free moves
 */
export class Shrink {
  public static getCount(_score: number): number {
    // Shrink bonuses are earned through the shop, not thresholds
    return 0;
  }

  public static getConditions(): Condition[] {
    // No automatic earning conditions - purchased in shop
    return [];
  }

  public static getDescription(): string {
    return "Reduces all blocks on the grid by 1 size. Size 1 blocks disappear.";
  }
}
