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

  public into(): number {
    return Object.values(DifficultyType).indexOf(this.value);
  }

  public static from(index: number): Difficulty {
    const difficulty = Object.values(DifficultyType)[index];
    return new Difficulty(difficulty);
  }
}
