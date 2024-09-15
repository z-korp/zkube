export enum ModeType {
  None = "None",
  Normal = "Normal",
  Daily = "Daily",
  Tutorial =  "tutorial"
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
      case ModeType.Normal:
        return 60480000;
      case ModeType.Daily:
        return 86400;
      case ModeType.None:
        return 0;
      case ModeType.Tutorial:
        return 0; 
    }
  }

  public price(): bigint {
    switch (this.value) {
      case ModeType.Normal:
        return BigInt(0);
      case ModeType.Daily:
        return BigInt(0);
      case ModeType.None:
        return BigInt(0);
      case ModeType.Tutorial:
      return BigInt(0)
    }
  }


    public isTutorial(): boolean {
    return this.value === ModeType.Tutorial;
  }
}
