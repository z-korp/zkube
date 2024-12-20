import { ComponentValue } from "@dojoengine/recs";

export class Mint {
  public player_id: string;
  public number: number;
  public expiration_timestamp: number;

  constructor(mint: ComponentValue) {
    this.player_id = mint.player_id;
    if (mint.expiration_timestamp < Date.now() / 1000) {
      this.number = 0;
    } else {
      this.number = mint.number;
    }
    this.expiration_timestamp = mint.expiration_timestamp;
  }

  // Static method to create a Mint instance from an ID string
  // used to 0 mint before airdrop
  public static fromId(player_id: string | undefined): Mint {
    return new Mint({
      player_id: player_id || "",
      number: 0,
      expiration_timestamp: 1735544192,
    });
  }
}
