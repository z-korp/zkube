import { Condition } from "../../types/bonus";

export class Hammer {
  public static getCount(
    score: number,
    _combo: number,
    _max_combo: number,
  ): number {
    if (score >= 120) {
      return 3;
    } else if (score >= 80) {
      return 2;
    } else if (score >= 40) {
      return 1;
    } else {
      return 0;
    }
  }

  public static getConditions(): Condition[] {
    return [
      { score: 40, combo: 0, max_combo: 0 },
      { score: 80, combo: 0, max_combo: 0 },
      { score: 120, combo: 0, max_combo: 0 },
    ];
  }

  public static getDescription(): string {
    return "";
  }
}
