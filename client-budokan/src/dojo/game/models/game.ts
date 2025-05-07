import type { ComponentValue } from "@dojoengine/recs";
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
}

export interface Row {
  blocks: Block[];
}

export class Game {
  public id: string;
  public blocks: number[][];
  public blocksRaw: bigint;
  public rows: Row[];
  public next_row: number[];
  public score: number;
  public moves: number;
  public combo: number;
  public max_combo: number;
  public hammer: number;
  public wave: number;
  public totem: number;
  public hammer_used: number;
  public wave_used: number;
  public totem_used: number;
  public over: boolean;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.over = game.over ? true : false;
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH
    );
    this.hammer = game.hammer_bonus;
    this.wave = game.wave_bonus;
    this.totem = game.totem_bonus;
    this.hammer_used = game.hammer_used;
    this.wave_used = game.wave_used;
    this.totem_used = game.totem_used;
    this.combo = game.combo_counter;
    this.max_combo = game.max_combo;
    this.score = game.score;
    this.moves = game.moves;

    // Destructure blocks and colors bitmaps in to Rows and Blocks
    this.blocksRaw = game.blocks;
    this.blocks = Packer.sized_unpack(
      BigInt(game.blocks),
      BigInt(ROW_BIT_COUNT),
      DEFAULT_GRID_HEIGHT
    )
      .map((row) =>
        Packer.sized_unpack(
          BigInt(row),
          BigInt(BLOCK_BIT_COUNT),
          DEFAULT_GRID_WIDTH
        )
      )
      .reverse();
    this.rows = this.blocks.map((row) => {
      const blocks: Block[] = [];
      for (let index = 0; index < row.length; index++) {
        const value = row[index];
        const width = value ? value : 1;
        blocks.push({ width, value });
        index += width - 1;
      }
      return { blocks };
    });
  }

  public isOver(): boolean {
    return this.over;
  }
}
