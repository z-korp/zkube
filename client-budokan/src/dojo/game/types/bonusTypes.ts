export enum BonusType {
  None = 0,
  Combo = 1,
  Score = 2,
  Harvest = 3,
  Wave = 4,
  Supply = 5,
}

export class Bonus {
  constructor(private readonly type: BonusType) {}

  into(): number {
    return this.type;
  }

  getEffect(level = 0): string {
    switch (this.type) {
      case BonusType.Combo:
        return `+${level + 1} combo`;
      case BonusType.Score:
        return `+${(level + 1) * 10} score`;
      case BonusType.Harvest:
        return "Clear blocks of selected size";
      case BonusType.Wave:
        return `Clear ${level + 1} row(s)`;
      case BonusType.Supply:
        return `Add ${level + 1} line(s)`;
      default:
        return "";
    }
  }
}

export const bonusTypeFromContractValue = (value: number): BonusType => {
  switch (value) {
    case 1:
      return BonusType.Combo;
    case 2:
      return BonusType.Score;
    case 3:
      return BonusType.Harvest;
    case 4:
      return BonusType.Wave;
    case 5:
      return BonusType.Supply;
    default:
      return BonusType.None;
  }
};

export const bonusTypeToContractValue = (type: BonusType): number => type;
