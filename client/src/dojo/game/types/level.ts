const MAX_LEVEL = 20;

export class Level {
  value: number;

  constructor(value: number) {
    this.value = Math.max(1, Math.min(MAX_LEVEL, Math.floor(value)));
  }

  public static getLevels(): Level[] {
    return Array.from({ length: MAX_LEVEL }, (_, i) => new Level(i + 1));
  }

  public getPoints(): number {
    const pointsTable = [
      100, 300, 600, 1_000, 1_500, 2_200, 3_100, 4_300, 5_800, 7_800, 10_300,
      13_500, 17_500, 22_500, 28_500, 36_000, 45_000, 56_000, 70_000, 100_000,
    ];
    return pointsTable[this.value - 1];
  }

  public static fromPoints(points: number): Level {
    const pointsTable = [
      300, 600, 1_000, 1_500, 2_200, 3_100, 4_300, 5_800, 7_800, 10_300, 13_500,
      17_500, 22_500, 28_500, 36_000, 45_000, 56_000, 70_000, 100_000,
    ];
    const level = pointsTable.findIndex((threshold) => points < threshold) + 1;
    return new Level(level === 0 ? MAX_LEVEL : level);
  }

  public next(): Level | null {
    return this.value < MAX_LEVEL ? new Level(this.value + 1) : null;
  }

  public getPointsToNextLevel(): number | null {
    const nextLevel = this.next();
    return nextLevel ? nextLevel.getPoints() - this.getPoints() : null;
  }
}
