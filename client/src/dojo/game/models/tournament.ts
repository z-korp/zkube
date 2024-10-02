import { ComponentValue } from "@dojoengine/recs";
import { Mode, ModeType } from "../types/mode";
import { DAILY_MODE_DURATION, NORMAL_MODE_DURATION } from "../constants";

// Distribute potential winnings amongs top 3 winners
const distributionRatios = [
  { numerator: 5n, denominator: 9n },
  { numerator: 5n, denominator: 18n },
  { numerator: 1n, denominator: 6n },
];

export class Tournament {
  id: number;
  prize: bigint;
  top1_player_id: bigint;
  top2_player_id: bigint;
  top3_player_id: bigint;
  top1_score: number;
  top2_score: number;
  top3_score: number;
  top1_claimed: boolean;
  top2_claimed: boolean;
  top3_claimed: boolean;
  top1_prize: bigint;
  top2_prize: bigint;
  top3_prize: bigint;
  mode: Mode;

  constructor(tournament: ComponentValue) {
    this.id = tournament.id;
    this.prize = tournament.prize;
    this.top1_player_id = tournament.top1_player_id;
    this.top2_player_id = tournament.top2_player_id;
    this.top3_player_id = tournament.top3_player_id;
    this.top1_score = tournament.top1_score;
    this.top2_score = tournament.top2_score;
    this.top3_score = tournament.top3_score;
    this.top1_claimed = tournament.top1_claimed;
    this.top2_claimed = tournament.top2_claimed;
    this.top3_claimed = tournament.top3_claimed;
    this.mode =
      tournament.id > 19000
        ? new Mode(ModeType.Daily)
        : new Mode(ModeType.Normal);
    this.top1_prize =
      (BigInt(tournament.prize) * distributionRatios[0].numerator) /
      distributionRatios[0].denominator;
    this.top2_prize =
      (BigInt(tournament.prize) * distributionRatios[1].numerator) /
      distributionRatios[1].denominator;
    this.top3_prize =
      (BigInt(tournament.prize) * distributionRatios[2].numerator) /
      distributionRatios[2].denominator;
  }

  getStartDate(): Date {
    const startTimestamp =
      this.id *
      (this.mode.value === ModeType.Daily
        ? DAILY_MODE_DURATION
        : NORMAL_MODE_DURATION);
    return new Date(startTimestamp * 1000); // Convert seconds to milliseconds
  }

  getEndDate(): Date | null {
    if (this.mode.value === ModeType.Daily) {
      return null; // Daily tournaments don't have an end date
    }
    const startTimestamp = this.id * NORMAL_MODE_DURATION;
    const endTimestamp = startTimestamp + NORMAL_MODE_DURATION;
    return new Date(endTimestamp * 1000); // Convert seconds to milliseconds
  }

  getTournamentDates(): { start: Date; end: Date | null } {
    return {
      start: this.getStartDate(),
      end: this.getEndDate(),
    };
  }

  isOver(): boolean {
    const endDate = this.getEndDate();
    return endDate ? endDate < new Date() : false;
  }
}
