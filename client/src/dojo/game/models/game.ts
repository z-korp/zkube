import { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import {
  BLOCK_BIT_COUNT,
  ROW_BIT_COUNT,
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
} from "../constants";

export interface Block {
  width: number;
  value: number;
  color: number;
}

export interface Row {
  blocks: Block[];
}

export class Game {
  public id: string;
  public over: boolean;
  public points: number;
  public next_row: number[];
  public next_color: number[];
  public bonuses: number[];
  public blocks: number[][];
  public rows: Row[];
  public seed: bigint;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.over = game.over ? true : false;
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH,
    );
    this.points = game.points;
    this.next_color = Packer.sized_unpack(
      BigInt(game.next_color),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH,
    );
    this.bonuses = game.bonuses;
    this.seed = game.seed;

    // Destructure blocks and colors bitmaps in to Rows and Blocks
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
    const colors = Packer.sized_unpack(
      BigInt(game.colors),
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
    this.rows = this.blocks.map((row, rowIndex) => {
      const blocks: Block[] = [];
      for (let index = 0; index < row.length; index++) {
        const value = row[index];
        const width = value ? value : 1;
        const color = colors[rowIndex][index];
        blocks.push({ width, value, color });
        index += width - 1;
      }
      return { blocks };
    });
    console.log("points", this.points);
  }

  public isOver(): boolean {
    return this.over;
  }
}
