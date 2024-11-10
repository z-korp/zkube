import { ComponentValue } from "@dojoengine/recs";

export class Settings {
  zkorp_address: bigint;
  erc721_address: bigint;
  game_price: bigint;
  are_games_paused: boolean;
  are_chests_unlock: boolean;

  constructor(settings: ComponentValue) {
    this.zkorp_address = settings.zkorp_address;
    this.erc721_address = settings.erc721_address;
    this.game_price = settings.game_price;
    this.are_games_paused = settings.are_games_paused;
    this.are_chests_unlock = settings.are_chests_unlock;
  }
}
