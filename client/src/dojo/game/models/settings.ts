import { ComponentValue } from "@dojoengine/recs";

export class Settings {
  zkorp_address: bigint;
  erc721_address: bigint;
  game_price: bigint;

  constructor(settings: ComponentValue) {
    this.zkorp_address = settings.zkorp_address;
    this.erc721_address = settings.erc721_address;
    this.game_price = settings.game_price;
  }
}
