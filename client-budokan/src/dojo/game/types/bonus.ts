import ImageAssets from "@/ui/theme/ImageAssets";

const theme = "theme-1";
const imgAssets = ImageAssets(theme);

/**
 * vNext Bonus enum — 4 active skill types.
 * Contract values: None=0, ComboSurge=1, Momentum=2, Harvest=3, Tsunami=4
 */
export enum BonusType {
  None = "None",
  ComboSurge = "ComboSurge",
  Momentum = "Momentum",
  Harvest = "Harvest",
  Tsunami = "Tsunami",
}

/**
 * Contract uses these values for active skills:
 * 0 = None, 1 = ComboSurge, 2 = Momentum, 3 = Harvest, 4 = Tsunami
 */
export function bonusTypeFromContractValue(value: number): BonusType {
  switch (value) {
    case 0: return BonusType.None;
    case 1: return BonusType.ComboSurge;
    case 2: return BonusType.Momentum;
    case 3: return BonusType.Harvest;
    case 4: return BonusType.Tsunami;
    default: return BonusType.None;
  }
}

/**
 * Convert BonusType to contract value
 */
export function bonusTypeToContractValue(type: BonusType): number {
  switch (type) {
    case BonusType.None: return 0;
    case BonusType.ComboSurge: return 1;
    case BonusType.Momentum: return 2;
    case BonusType.Harvest: return 3;
    case BonusType.Tsunami: return 4;
    default: return 0;
  }
}

export class Bonus {
  value: BonusType;

  constructor(value: BonusType) {
    this.value = value;
  }

  public into(): number {
    return bonusTypeToContractValue(this.value);
  }

  public static from(index: number): Bonus {
    return new Bonus(bonusTypeFromContractValue(index));
  }

  /**
   * Create a Bonus from contract's active skill value (0-4)
   */
  public static fromContractValue(value: number): Bonus {
    return new Bonus(bonusTypeFromContractValue(value));
  }

  /**
   * Get the 4 active skill types (for UI selection)
   */
  public static getActiveSkills(): Bonus[] {
    return [
      new Bonus(BonusType.ComboSurge),
      new Bonus(BonusType.Momentum),
      new Bonus(BonusType.Harvest),
      new Bonus(BonusType.Tsunami),
    ];
  }

  /** @deprecated Use getActiveSkills() */
  public static getBonuses(): Bonus[] {
    return Bonus.getActiveSkills();
  }

  /** @deprecated Use getActiveSkills() */
  public static getAllBonuses(): Bonus[] {
    return Bonus.getActiveSkills();
  }

  public isNone(): boolean {
    return this.value === BonusType.None;
  }

  public getIcon(): string {
    switch (this.value) {
      case BonusType.ComboSurge:
        return imgAssets.combo;
      case BonusType.Momentum:
        return imgAssets.score;
      case BonusType.Harvest:
        return imgAssets.harvest;
      case BonusType.Tsunami:
        return imgAssets.wave;
      default:
        return "";
    }
  }

  public getDescription(): string {
    switch (this.value) {
      case BonusType.ComboSurge:
        return "Add combo depth to next move";
      case BonusType.Momentum:
        return "Add score burst based on zones cleared";
      case BonusType.Harvest:
        return "Destroy random blocks, earn cubes per block size";
      case BonusType.Tsunami:
        return "Clear targeted blocks or entire rows";
      default:
        return "";
    }
  }

  public getName(): string {
    switch (this.value) {
      case BonusType.ComboSurge:
        return "Combo Surge";
      case BonusType.Momentum:
        return "Momentum";
      case BonusType.Harvest:
        return "Harvest";
      case BonusType.Tsunami:
        return "Tsunami";
      default:
        return "";
    }
  }

  /**
   * Get a generic effect description. For level-specific effects,
   * use the skill_effects system which has branch-aware values.
   */
  public getEffect(_level: number = 0): string {
    switch (this.value) {
      case BonusType.ComboSurge:
        return "Add combo depth";
      case BonusType.Momentum:
        return "Add score";
      case BonusType.Harvest:
        return "Destroy blocks → earn cubes";
      case BonusType.Tsunami:
        return "Clear blocks/rows";
      default:
        return "";
    }
  }

  /**
   * Short effect for compact UI (action bar tooltips).
   */
  public getEffectShort(_level: number = 0): string {
    switch (this.value) {
      case BonusType.ComboSurge:
        return "combo";
      case BonusType.Momentum:
        return "score";
      case BonusType.Harvest:
        return "harvest";
      case BonusType.Tsunami:
        return "clear";
      default:
        return "";
    }
  }

  /**
   * Get effect comparison string showing current → next level.
   * vNext: levels are 1-5, branch-dependent. Generic preview only.
   */
  public getUpgradePreview(currentLevel: number): string | null {
    if (currentLevel >= 5) return null;
    const current = this.getEffectShort(currentLevel);
    const next = this.getEffectShort(currentLevel + 1);
    return `${current} → ${next}`;
  }
}
