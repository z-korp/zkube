import { Condition } from "../../types/bonus";

export class Wave {
  public static getCount(_score: number, combo: number): number {
    if (combo >= 9) {
      return 3;
    } else if (combo >= 6) {
      return 2;
    } else if (combo >= 3) {
      return 1;
    } else {
      return 0;
    }
  }

  public static getConditions(): Condition[] {
    return [
      { score: 0, combo: 3 },
      { score: 0, combo: 6 },
      { score: 0, combo: 9 },
    ];
  }

  public static getDescription(): string {
    return "";
  }
}
