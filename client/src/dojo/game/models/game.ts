import { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import {
  BLOCK_BIT_COUNT,
  ROW_BIT_COUNT,
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
} from "../constants";

export class Game {
  public id: string;
  public over: boolean;
  public next_row: number;
  public bonuses: number[];
  public blocks: number[][];
  public seed: bigint;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.over = game.over ? true : false;
    this.next_row = game.next_row;
    this.bonuses = game.bonuses;
    this.blocks = Packer.sized_unpack(
      BigInt(game.blocks),
      BigInt(ROW_BIT_COUNT),
      DEFAULT_GRID_HEIGHT,
    )
      .map((row) =>
        Packer.sized_unpack(
          BigInt(row),
          BigInt(BLOCK_BIT_COUNT),
          DEFAULT_GRID_WIDTH,
        ),
      )
      .reverse();
    this.seed = game.seed;
  }

  public isOver(): boolean {
    return this.over;
  }
}
