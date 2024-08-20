import { Hammer } from "../elements/bonuses/hammer";
import { Totem } from "../elements/bonuses/totem";
import { Wave } from "../elements/bonuses/wave";

import ImageAssets from "@/ui/theme/ImageAssets";

const theme = "theme-1";
const imgAssets = ImageAssets(theme);

export enum BonusType {
  None = "None",
  Hammer = "Hammer",
  Totem = "Totem",
  Wave = "Wave",
}

export interface Condition {
  score: number;
  combo: number;
  max_combo: number;
}

export class Bonus {
  value: BonusType;

  constructor(value: BonusType) {
    this.value = value;
  }

  public into(): number {
    return Object.values(BonusType).indexOf(this.value);
  }

  public static from(index: number): Bonus {
    const item = Object.values(BonusType)[index];
    return new Bonus(item);
  }

  public static getBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Hammer),
      new Bonus(BonusType.Totem),
      new Bonus(BonusType.Wave),
    ];
  }

  public isNone(): boolean {
    return this.value === BonusType.None;
  }

  public getIcon(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return imgAssets.hammer;
      case BonusType.Totem:
        return imgAssets.tiki;
      case BonusType.Wave:
        return imgAssets.wave;
      default:
        return "";
    }
  }

  public getCount(score: number, combo: number, max_combo: number): number {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getCount(score, combo, max_combo);
      case BonusType.Totem:
        return Totem.getCount(score, combo, max_combo);
      case BonusType.Wave:
        return Wave.getCount(score, combo, max_combo);
      default:
        return 0;
    }
  }

  public getConditions(): Condition[] {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getConditions();
      case BonusType.Totem:
        return Totem.getConditions();
      case BonusType.Wave:
        return Wave.getConditions();
      default:
        return [];
    }
  }

  public getDescription(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getDescription();
      case BonusType.Totem:
        return Totem.getDescription();
      case BonusType.Wave:
        return Wave.getDescription();
      default:
        return "";
    }
  }

  public getName(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return "Hammer";
      case BonusType.Totem:
        return "Totem";
      case BonusType.Wave:
        return "Wave";
      default:
        return "";
    }
  }

  public getEffect(): string {
    switch (this.value) {
      case BonusType.Hammer:
        return "Remove a single block";
      case BonusType.Totem:
        return "Remove all blocks of a color";
      case BonusType.Wave:
        return "Remove a row of blocks";
      default:
        return "";
    }
  }
}
