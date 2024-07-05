import { Condition } from "../../types/bonus";

export class Totem {
  public static getCount(_score: number, _combo: number): number {
    return 0;
  }

  public static getConditions(): Condition[] {
    return [{ score: 0, combo: 0 }];
  }

  public static getDescription(): string {
    return "Coming soon";
  }
}
