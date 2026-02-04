export enum DifficultyType {
  None = "None",
  Increasing = "Increasing",
  VeryEasy = "VeryEasy",
  Easy = "Easy",
  Medium = "Medium",
  MediumHard = "MediumHard",
  Hard = "Hard",
  VeryHard = "VeryHard",
  Expert = "Expert",
  Master = "Master",
}

export class Difficulty {
  value: DifficultyType;

  constructor(value: DifficultyType) {
    this.value = value;
  }

  /**
   * Convert to tier number (0-7) for constraint interpolation
   * Maps VeryEasy=0, Easy=1, ..., Master=7
   * None and Increasing are treated as VeryEasy (tier 0)
   */
  public into(): number {
    switch (this.value) {
      case DifficultyType.VeryEasy:
        return 0;
      case DifficultyType.Easy:
        return 1;
      case DifficultyType.Medium:
        return 2;
      case DifficultyType.MediumHard:
        return 3;
      case DifficultyType.Hard:
        return 4;
      case DifficultyType.VeryHard:
        return 5;
      case DifficultyType.Expert:
        return 6;
      case DifficultyType.Master:
        return 7;
      case DifficultyType.None:
      case DifficultyType.Increasing:
      default:
        return 0; // Treat as VeryEasy
    }
  }

  public static from(index: number): Difficulty {
    const difficulty = Object.values(DifficultyType)[index];
    return new Difficulty(difficulty);
  }
}
