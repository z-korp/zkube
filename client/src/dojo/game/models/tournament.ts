import { ComponentValue } from "@dojoengine/recs";

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
  }
}
