import { ComponentValue } from "@dojoengine/recs";

export class Game {
  public id: string;
  public over: boolean;
  public bonuses: number[];
  public blocks: number[];
  public seed: bigint;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.over = game.over ? true : false;
    this.bonuses = game.bonuses;
    this.blocks = game.blocks;
    this.seed = game.seed;
  }

  public isOver(): boolean {
    return this.over;
  }
}
