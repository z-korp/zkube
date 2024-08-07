import { ComponentValue } from "@dojoengine/recs";
import { shortenHex } from "@dojoengine/utils";
import { shortString } from "starknet";
import { Bonus, Condition } from "../types/bonus";

export interface BonusDetail {
  bonus: Bonus;
  score: number;
  combo: number;
  description: string;
  name: string;
  has: boolean;
}

export class Player {
  public id: string;
  public game_id: string;
  public hammer: number;
  public wave: number;
  public totem: number;
  public name: string;

  constructor(player: ComponentValue) {
    this.id = player.id;
    this.game_id = player.game_id;
    this.hammer = player.hammer_bonus;
    this.wave = player.wave_bonus;
    this.totem = player.totem_bonus;
    this.name = shortString.decodeShortString(player.name);
  }

  public getShortAddress(): string {
    return shortenHex(this.id);
  }

  public static getBonuses({
    counts = [0, 0, 0],
  }: {
    counts?: number[];
  }): BonusDetail[] {
    const details: BonusDetail[] = [];
    const bonuses = Bonus.getBonuses();
    bonuses.forEach((bonus, bonus_index) => {
      const count = bonus_index < counts.length ? counts[bonus_index] : 0;
      const conditions: Condition[] = bonus.getConditions();
      const description = bonus.getDescription();
      const name = bonus.getName();
      const bonus_conditions = conditions.map((condition, index) => {
        return {
          bonus,
          score: condition.score,
          combo: condition.combo,
          description,
          name: `${name} ${index + 1}`,
          has: count > index,
        };
      });
      // console.log(`Bonus: ${name}, Count: ${count}`);
      details.push(...bonus_conditions);
    });
    return details;
  }
}
