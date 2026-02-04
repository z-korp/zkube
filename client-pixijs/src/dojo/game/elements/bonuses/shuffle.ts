import type { Condition } from "../../types/bonus";

/**
 * Shuffle Bonus - Randomly rearranges all blocks on the grid
 * 
 * Level scaling:
 * - L1: Shuffles all blocks randomly
 * - L2: Shuffles blocks, adds 1 free move
 * - L3: Shuffles blocks, adds 2 free moves
 */
export class Shuffle {
  public static getCount(_score: number): number {
    // Shuffle bonuses are earned through the shop, not thresholds
    return 0;
  }

  public static getConditions(): Condition[] {
    // No automatic earning conditions - purchased in shop
    return [];
  }

  public static getDescription(): string {
    return "Randomly rearranges all blocks on the grid.";
  }
}
