import {
  DAILY_MODE_DURATION,
  DAILY_MODE_PRICE,
  FREE_MODE_DURATION,
  FREE_MODE_PRICE,
  NORMAL_MODE_DURATION,
  NORMAL_MODE_PRICE,
} from "../constants";

export enum ModeType {
  None = "None",
  Normal = "Weekly Marathon",
  Daily = "Daily Challenge",
  Free = "Freeplay Arena",
  Tutorial = "Tutorial",
}

export class Mode {
  value: ModeType;

  constructor(mode: ModeType) {
    this.value = mode;
  }

  public into(): number {
    return Object.values(ModeType).indexOf(this.value);
  }

  public static from(index: number): Mode {
    const mode = Object.values(ModeType)[index];
    return new Mode(mode);
  }

  public duration(): number {
    switch (this.value) {
      case ModeType.None:
        return 0;
      case ModeType.Tutorial:
        return 0;
      case ModeType.Normal:
        return NORMAL_MODE_DURATION;
      case ModeType.Daily:
        return DAILY_MODE_DURATION;
      case ModeType.Free:
        return FREE_MODE_DURATION;
    }
  }

  public price(): bigint {
    switch (this.value) {
      case ModeType.None:
        return BigInt(0);
      case ModeType.Normal:
        return BigInt(NORMAL_MODE_PRICE);
      case ModeType.Daily:
        return BigInt(DAILY_MODE_PRICE);
      case ModeType.Free:
        return BigInt(FREE_MODE_PRICE);
      case ModeType.Tutorial:
        return BigInt(0);
    }
  }

  public isTutorial(): boolean {
    return this.value === ModeType.Tutorial;
  }
}
