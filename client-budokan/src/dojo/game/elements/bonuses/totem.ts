import type { Condition } from "../../types/bonus";

export class Totem {
  public static getCount(max_combo: number): number {
    if (max_combo >= 6) {
      return 3;
    } else if (max_combo >= 4) {
      return 2;
    } else if (max_combo >= 2) {
      return 1;
    } else {
      return 0;
    }
  }

  public static getConditions(): Condition[] {
    return [
      { score: 0, combo: 0, max_combo: 2 },
      { score: 0, combo: 0, max_combo: 4 },
      { score: 0, combo: 0, max_combo: 6 },
    ];
  }

  public static getDescription(): string {
    return "";
  }
}
