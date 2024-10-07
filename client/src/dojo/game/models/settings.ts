import { ComponentValue } from "@dojoengine/recs";

export class Settings {
  zkorp_address: bigint;
  free_daily_credits: number;
  daily_mode_price: bigint;
  normal_mode_price: bigint;

  constructor(settings: ComponentValue) {
    this.zkorp_address = settings.zkorp_address;
    this.free_daily_credits = settings.free_daily_credits;
    this.daily_mode_price = settings.daily_mode_price;
    this.normal_mode_price = settings.normal_mode_price;
  }
}
