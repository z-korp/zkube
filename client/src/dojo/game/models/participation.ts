import { ComponentValue } from "@dojoengine/recs";

export class Participation {
  chest_id: number;
  player_id: bigint;
  is_set: boolean;
  points: number;
  claimed: boolean;

  constructor(participation: ComponentValue) {
    this.chest_id = participation.chest_id;
    this.player_id = participation.player_id;
    this.is_set = participation.is_set;
    this.points = participation.points;
    this.claimed = participation.claimed;
  }

  public isParticipating(): boolean {
    return this.is_set;
  }

  public addPoints(pointsToAdd: number): void {
    this.points += pointsToAdd;
  }

  public canClaim(): boolean {
    return this.is_set && !this.claimed;
  }

  public claim(): void {
    if (this.canClaim()) {
      this.claimed = true;
    }
  }

  public getProgress(targetPoints: number): number {
    return Math.min(this.points / targetPoints, 1);
  }
}
