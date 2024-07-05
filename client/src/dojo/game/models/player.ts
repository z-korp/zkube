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
}

export class Player {
  public id: string;
  public game_id: string;
  public name: string;

  constructor(player: ComponentValue) {
    this.id = player.id;
    this.game_id = player.game_id;
    this.name = shortString.decodeShortString(player.name);
  }

  public getShortAddress(): string {
    return shortenHex(this.id);
  }

  public static getBonuses(): BonusDetail[] {
    const details: BonusDetail[] = [];
    const bonuses = Bonus.getBonuses();
    bonuses.forEach((bonus) => {
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
        };
      });
      details.push(...bonus_conditions);
    });
    return details;
  }
}
