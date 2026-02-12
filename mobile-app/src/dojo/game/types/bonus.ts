import { Hammer } from "../elements/bonuses/hammer";
import { Totem } from "../elements/bonuses/totem";
import { Wave } from "../elements/bonuses/wave";
import { Shrink } from "../elements/bonuses/shrink";
import { Shuffle } from "../elements/bonuses/shuffle";

export enum BonusType {
  None = "None",
  Hammer = "Hammer",
  Totem = "Totem",
  Wave = "Wave",
  Shrink = "Shrink",
  Shuffle = "Shuffle",
}

/**
 * Contract uses these values for selected bonuses:
 * 0 = None, 1 = Hammer, 2 = Totem, 3 = Wave, 4 = Shrink, 5 = Shuffle
 */
export function bonusTypeFromContractValue(value: number): BonusType {
  switch (value) {
    case 0: return BonusType.None;
    case 1: return BonusType.Hammer;
    case 2: return BonusType.Totem;
    case 3: return BonusType.Wave;
    case 4: return BonusType.Shrink;
    case 5: return BonusType.Shuffle;
    default: return BonusType.None;
  }
}

/**
 * Convert BonusType to contract value
 */
export function bonusTypeToContractValue(type: BonusType): number {
  switch (type) {
    case BonusType.None: return 0;
    case BonusType.Hammer: return 1;
    case BonusType.Totem: return 2;
    case BonusType.Wave: return 3;
    case BonusType.Shrink: return 4;
    case BonusType.Shuffle: return 5;
    default: return 0;
  }
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

  /**
   * Create a Bonus from contract's selected bonus value (0-5)
   */
  public static fromContractValue(value: number): Bonus {
    return new Bonus(bonusTypeFromContractValue(value));
  }

  public static getBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Hammer),
      new Bonus(BonusType.Totem),
      new Bonus(BonusType.Wave),
    ];
  }

  /**
   * Get all available bonuses including Shrink and Shuffle
   */
  public static getAllBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Hammer),
      new Bonus(BonusType.Totem),
      new Bonus(BonusType.Wave),
      new Bonus(BonusType.Shrink),
      new Bonus(BonusType.Shuffle),
    ];
  }

  public isNone(): boolean {
    return this.value === BonusType.None;
  }

  public getCount(score: number, combo: number, max_combo: number): number {
    switch (this.value) {
      case BonusType.Hammer:
        return Hammer.getCount(score);
      case BonusType.Totem:
        return Totem.getCount(max_combo);
      case BonusType.Wave:
        return Wave.getCount(combo);
      case BonusType.Shrink:
        return Shrink.getCount(score);
      case BonusType.Shuffle:
        return Shuffle.getCount(score);
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
      case BonusType.Shrink:
        return Shrink.getConditions();
      case BonusType.Shuffle:
        return Shuffle.getConditions();
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
      case BonusType.Shrink:
        return Shrink.getDescription();
      case BonusType.Shuffle:
        return Shuffle.getDescription();
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
      case BonusType.Shrink:
        return "Shrink";
      case BonusType.Shuffle:
        return "Shuffle";
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
      case BonusType.Shrink:
        return "Shrink all blocks by 1 size";
      case BonusType.Shuffle:
        return "Randomly rearrange all blocks";
      default:
        return "";
    }
  }
}
