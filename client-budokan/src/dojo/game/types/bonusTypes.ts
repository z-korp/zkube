export enum BonusType {
  None = 0,
  Hammer = 1,  // Destroy single block at target position
  Totem = 2,   // Destroy all blocks of same size across grid
  Wave = 3,    // Destroy entire target row
}

export class Bonus {
  constructor(private readonly type: BonusType) {}

  into(): number {
    return this.type;
  }

  getEffect(): string {
    switch (this.type) {
      case BonusType.Hammer:
        return "Destroy target block";
      case BonusType.Totem:
        return "Clear blocks of same size";
      case BonusType.Wave:
        return "Clear entire row";
      default:
        return "";
    }
  }
}

export const bonusTypeFromContractValue = (value: number): BonusType => {
  switch (value) {
    case 1:
      return BonusType.Hammer;
    case 2:
      return BonusType.Totem;
    case 3:
      return BonusType.Wave;
    default:
      return BonusType.None;
  }
};
