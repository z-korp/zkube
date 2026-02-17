import ImageAssets from "@/ui/theme/ImageAssets";

const theme = "theme-1";
const imgAssets = ImageAssets(theme);

export enum BonusType {
  None = "None",
  Combo = "Combo",
  Score = "Score",
  Harvest = "Harvest",
  Wave = "Wave",
  Supply = "Supply",
}

/**
 * Contract uses these values for selected bonuses:
 * 0 = None, 1 = Combo, 2 = Score, 3 = Harvest, 4 = Wave, 5 = Supply
 */
export function bonusTypeFromContractValue(value: number): BonusType {
  switch (value) {
    case 0: return BonusType.None;
    case 1: return BonusType.Combo;
    case 2: return BonusType.Score;
    case 3: return BonusType.Harvest;
    case 4: return BonusType.Wave;
    case 5: return BonusType.Supply;
    default: return BonusType.None;
  }
}

/**
 * Convert BonusType to contract value
 */
export function bonusTypeToContractValue(type: BonusType): number {
  switch (type) {
    case BonusType.None: return 0;
    case BonusType.Combo: return 1;
    case BonusType.Score: return 2;
    case BonusType.Harvest: return 3;
    case BonusType.Wave: return 4;
    case BonusType.Supply: return 5;
    default: return 0;
  }
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
      new Bonus(BonusType.Combo),
      new Bonus(BonusType.Score),
      new Bonus(BonusType.Harvest),
    ];
  }

  /**
   * Get all available bonuses
   */
  public static getAllBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Combo),
      new Bonus(BonusType.Score),
      new Bonus(BonusType.Harvest),
      new Bonus(BonusType.Wave),
      new Bonus(BonusType.Supply),
    ];
  }

  public isNone(): boolean {
    return this.value === BonusType.None;
  }

  public getIcon(): string {
    switch (this.value) {
      case BonusType.Combo:
        return imgAssets.combo;
      case BonusType.Score:
        return imgAssets.score;
      case BonusType.Harvest:
        return imgAssets.harvest;
      case BonusType.Wave:
        return imgAssets.wave;
      case BonusType.Supply:
        return imgAssets.supply;
      default:
        return "";
    }
  }

  public getDescription(): string {
    switch (this.value) {
      case BonusType.Combo:
        return "Add combo to next move";
      case BonusType.Score:
        return "Add bonus score";
      case BonusType.Harvest:
        return "Destroy all blocks of chosen size";
      case BonusType.Wave:
        return "Clear horizontal rows";
      case BonusType.Supply:
        return "Add new lines at no move cost";
      default:
        return "";
    }
  }

  public getName(): string {
    switch (this.value) {
      case BonusType.Combo:
        return "Combo";
      case BonusType.Score:
        return "Score";
      case BonusType.Harvest:
        return "Harvest";
      case BonusType.Wave:
        return "Wave";
      case BonusType.Supply:
        return "Supply";
      default:
        return "";
    }
  }

  public getEffect(): string {
    switch (this.value) {
      case BonusType.Combo:
        return "Add combo to next move";
      case BonusType.Score:
        return "Add bonus score";
      case BonusType.Harvest:
        return "Destroy all blocks of chosen size";
      case BonusType.Wave:
        return "Clear horizontal rows";
      case BonusType.Supply:
        return "Add new lines at no move cost";
      default:
        return "";
    }
  }
}
