import { Condition } from "../../types/bonus";

export class Wave {
  public static getCount(
    _score: number,
    combo: number,
    _max_combo: number,
  ): number {
    if (combo >= 16) {
      return 3;
    } else if (combo >= 32) {
      return 2;
    } else if (combo >= 64) {
      return 1;
    } else {
      return 0;
    }
  }

  public static getConditions(): Condition[] {
    return [
      { score: 0, combo: 8, max_combo: 0 },
      { score: 0, combo: 16, max_combo: 0 },
      { score: 0, combo: 24, max_combo: 0 },
    ];
  }

  public static getDescription(): string {
    return "";
  }
}
