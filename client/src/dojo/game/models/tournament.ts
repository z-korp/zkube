import { ComponentValue } from "@dojoengine/recs";
import { ModeType } from "../types/mode";
import { DAILY_MODE_DURATION, NORMAL_MODE_DURATION } from "../constants";

export function computeTournamentId(time: number, mode: ModeType) {
  const duration =
    mode === ModeType.Daily ? DAILY_MODE_DURATION : NORMAL_MODE_DURATION;
  return Math.floor(time / duration);
}

export function getTournamentEndDate(tournamentId: number, mode: ModeType) {
  const duration =
    mode === ModeType.Daily ? DAILY_MODE_DURATION : NORMAL_MODE_DURATION;
  const endTimestamp = (tournamentId + 1) * duration;
  return new Date(endTimestamp * 1000); // Convert seconds to milliseconds
}

export class Tournament {
  id: number;
  start_time: number;
  end_time: number;
  max_players: number;
  registered_players: number;
  entry_fee: bigint;
  prize_pool: bigint;
  is_cancelled: boolean;

  constructor(tournament: ComponentValue) {
    this.id = tournament.id;
    this.start_time = tournament.start_time;
    this.end_time = tournament.end_time;
    this.max_players = tournament.max_players;
    this.registered_players = tournament.registered_players;
    this.entry_fee = tournament.entry_fee;
    this.prize_pool = tournament.prize_pool;
    this.is_cancelled = tournament.is_cancelled;
  }

  public isActive(currentTime: number): boolean {
    return (
      currentTime >= this.start_time &&
      currentTime < this.end_time &&
      !this.is_cancelled
    );
  }

  public canRegister(): boolean {
    return this.registered_players < this.max_players && !this.is_cancelled;
  }

  public registerPlayer(): void {
    if (this.canRegister()) {
      this.registered_players++;
      this.prize_pool += this.entry_fee;
    }
  }

  public getRemainingTime(currentTime: number): number {
    return Math.max(0, this.end_time - currentTime);
  }

  public getRegistrationProgress(): number {
    return this.registered_players / this.max_players;
  }

  public cancel(): void {
    this.is_cancelled = true;
  }
}
