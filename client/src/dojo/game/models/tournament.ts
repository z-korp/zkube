import { ComponentValue } from "@dojoengine/recs";
import { Mode, ModeType } from "../types/mode";
import {
  DAILY_MODE_DURATION,
  FREE_MODE_DURATION,
  NORMAL_MODE_DURATION,
} from "../constants";

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
  top1_game_id: number;
  top2_game_id: number;
  top3_game_id: number;
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

    // Determine the mode based on the tournament ID
    const modeType = this.determineModeById(tournament.id);
    this.mode = new Mode(modeType);

    this.top1_game_id = tournament.top1_game_id;
    this.top2_game_id = tournament.top2_game_id;
    this.top3_game_id = tournament.top3_game_id;

    // Compute prizes using the reward function
    this.top1_prize = this.reward(1);
    this.top2_prize = this.reward(2);
    this.top3_prize = this.reward(3);
  }

  static createNullTournament(id: number, mode: ModeType): Tournament {
    return new Tournament({
      id,
      prize: 0n,
      top1_player_id: 0n,
      top2_player_id: 0n,
      top3_player_id: 0n,
      top1_score: 0,
      top2_score: 0,
      top3_score: 0,
      top1_claimed: false,
      top2_claimed: false,
      top3_claimed: false,
      top1_prize: 0n,
      top2_prize: 0n,
      top3_prize: 0n,
      mode: new Mode(mode),
    });
  }

  reward(rank: number): bigint {
    switch (rank) {
      case 0:
        return 0n;
      case 1: {
        const secondPrize = this.reward(2);
        const thirdPrize = this.reward(3);
        return this.prize - secondPrize - thirdPrize;
      }
      case 2: {
        if (this.top2_player_id === 0n) {
          return 0n;
        }
        const thirdReward = this.reward(3);
        return (this.prize - thirdReward) / 3n;
      }
      case 3: {
        if (this.top3_player_id === 0n) {
          return 0n;
        }
        return this.prize / 6n;
      }
      default:
        return 0n;
    }
  }

  getStartDate(): Date {
    const startTimestamp = this.id * this.mode.duration();
    return new Date(startTimestamp * 1000); // Convert seconds to milliseconds
  }

  getEndDate(): Date {
    const startTimestamp = this.id * this.mode.duration(); // Tournament start time is the same as the end time
    const endTimestamp = startTimestamp + this.mode.duration();
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

  computeTournamentIds = (date: Date): { [key in ModeType]?: number } => {
    const timestamp = Math.floor(date.getTime() / 1000); // Convert to seconds

    // Initialize an object to store IDs
    const ids: { [key in ModeType]?: number } = {};

    // Loop through each mode type
    for (const modeType of Object.values(ModeType)) {
      // Skip the 'None' mode
      if (modeType === ModeType.None) {
        continue;
      }

      let duration: number;

      switch (modeType) {
        case ModeType.Daily:
          duration = DAILY_MODE_DURATION;
          break;
        case ModeType.Normal:
          duration = NORMAL_MODE_DURATION;
          break;
        case ModeType.Free:
          duration = FREE_MODE_DURATION;
          break;
        default:
          throw new Error(`Unknown mode type: ${modeType}`);
      }

      // Compute the start of the period for the current mode
      const startOfPeriod = timestamp - (timestamp % duration);

      // Compute the tournament ID for the current mode
      ids[modeType] = Math.floor(startOfPeriod / duration);
    }

    return ids;
  };

  determineModeById = (id: number): ModeType => {
    const date = new Date();
    const ids = this.computeTournamentIds(date);

    // Find the mode whose ID matches the given ID
    let closestMode: ModeType = ModeType.Normal;
    let smallestDiff = Infinity;

    for (const modeType of Object.values(ModeType)) {
      if (modeType === ModeType.None) {
        continue;
      }

      const modeId = ids[modeType];
      if (modeId !== undefined) {
        const diff = Math.abs(id - modeId);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestMode = modeType;
        }
      }
    }

    return closestMode;
  };
}
