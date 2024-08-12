import { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import { Difficulty, numberToDifficultyType } from "../types/difficulty";
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
  public difficulty: Difficulty;
  public over: boolean;
  public hammer: number;
  public wave: number;
  public totem: number;
  public combo: number;
  public score: number;
  public moves: number;
  public next_row: number[];
  public next_color: number[];
  public bonuses: number[];
  public blocks: number[][];
  public rows: Row[];
  public player_id: string;
  public seed: bigint;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.difficulty = new Difficulty(numberToDifficultyType(game.difficulty));
    this.over = game.over ? true : false;
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH,
    );
    this.hammer = game.hammer_bonus;
    this.wave = game.wave_bonus;
    this.totem = game.totem_bonus;
    this.combo = game.combo_counter;
    this.score = game.score;
    this.moves = game.moves;
    this.next_color = Packer.sized_unpack(
      BigInt(game.next_color),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH,
    );
    this.bonuses = game.bonuses;
    this.player_id = "0x" + game.player_id.toString(16);
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
  }

  public isOver(): boolean {
    return this.over;
  }
}
