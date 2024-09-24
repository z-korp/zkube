import { ComponentValue } from "@dojoengine/recs";

const SECONDS_PER_DAY = 86400; // 24 * 60 * 60
const DAILY_CREDITS = 3; // Assuming this value from the Cairo implementation

export class Credits {
  id: bigint; // player_id
  day_id: number;
  remaining: number;
  max_per_day: number;

  constructor(credits: ComponentValue) {
    this.id = credits.id;
    this.day_id = credits.day_id;
    this.remaining = credits.remaining;
    this.max_per_day = 3;
  }

  private static computeId(time: number): number {
    return Math.floor(time / SECONDS_PER_DAY);
  }

  public get_remaining(currentTime: number): number {
    const currentDayId = Credits.computeId(currentTime);

    if (currentDayId !== this.day_id) {
      // New day, reinitialize credits
      this.day_id = currentDayId;
      this.remaining = DAILY_CREDITS;
    }

    return this.remaining;
  }

  public has_credits(currentTime: number): boolean {
    const currentDayId = Credits.computeId(currentTime);
    if (currentDayId !== this.day_id) {
      // If it's a new day, they would have full credits
      return true;
    } else {
      return this.remaining > 0;
    }
  }

  public get_max_per_day(): number {
    return this.max_per_day;
  }
}
