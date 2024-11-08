import { ComponentValue } from "@dojoengine/recs";

export class Mint {
  public player_id: string;
  public number: number;
  public expiration_timestamp: number;

  constructor(mint: ComponentValue) {
    this.player_id = mint.player_id;
    this.number = mint.number;
    this.expiration_timestamp = mint.expiration_timestamp;
  }
}
