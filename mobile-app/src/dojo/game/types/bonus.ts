/**
 * Bonus V3.0 — Five bonuses with distinct identities
 *
 * Contract values: 0=None, 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
 *
 * | # | Name    | Identity        | L1          | L2          | L3          | Default? |
 * |---|---------|-----------------|-------------|-------------|-------------|----------|
 * | 1 | Combo   | Combo helper    | +1 combo    | +2 combo    | +3 combo    | Unlocked |
 * | 2 | Score   | Score booster   | +10 score   | +20 score   | +30 score   | Unlocked |
 * | 3 | Harvest | Economic        | +1 CUBE/blk | +2 CUBE/blk | +3 CUBE/blk | Unlocked |
 * | 4 | Wave    | Line clearer    | Clear 1 row | Clear 2 rows| Clear 3 rows| Locked   |
 * | 5 | Supply  | Line adder      | Add 1 line  | Add 2 lines | Add 3 lines | Locked   |
 */

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

/**
 * Check if a bonus type requires unlock (purchased in permanent shop)
 */
export function requiresUnlock(type: BonusType): boolean {
  return type === BonusType.Wave || type === BonusType.Supply;
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

  /**
   * Get the 3 default (unlocked) bonuses
   */
  public static getBonuses(): Bonus[] {
    return [
      new Bonus(BonusType.Combo),
      new Bonus(BonusType.Score),
      new Bonus(BonusType.Harvest),
    ];
  }

  /**
   * Get all 5 bonuses including locked ones (Wave, Supply)
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

  public getName(): string {
    switch (this.value) {
      case BonusType.Combo: return "Combo";
      case BonusType.Score: return "Score";
      case BonusType.Harvest: return "Harvest";
      case BonusType.Wave: return "Wave";
      case BonusType.Supply: return "Supply";
      default: return "";
    }
  }

  public getEffect(): string {
    switch (this.value) {
      case BonusType.Combo: return "Add combo to your next move";
      case BonusType.Score: return "Instantly gain bonus score";
      case BonusType.Harvest: return "Destroy all blocks of a size, earn CUBEs per block";
      case BonusType.Wave: return "Clear entire horizontal rows";
      case BonusType.Supply: return "Add new lines at no move cost";
      default: return "";
    }
  }

  public getDescription(): string {
    switch (this.value) {
      case BonusType.Combo: return "Adds combo to your next move";
      case BonusType.Score: return "Instantly adds bonus score";
      case BonusType.Harvest: return "Select a block size to destroy all matching blocks";
      case BonusType.Wave: return "Select a row to clear";
      case BonusType.Supply: return "Adds new lines to the bottom of the grid";
      default: return "";
    }
  }
}
