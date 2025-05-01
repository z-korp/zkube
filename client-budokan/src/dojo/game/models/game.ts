import { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import { Difficulty } from "../types/difficulty";
import {
  BLOCK_BIT_COUNT,
  ROW_BIT_COUNT,
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
  GAME_MODE_FREE_MULTIPLIER,
  GAME_MODE_PAID_MULTIPLIER,
} from "../constants";
import { Mode } from "../types/mode";

export interface Block {
  width: number;
  value: number;
}

export interface Row {
  blocks: Block[];
}

export class Game {
  public id: string;
  public difficulty: Difficulty;
  public mode: Mode;
  public over: boolean;
  public hammer: number;
  public wave: number;
  public totem: number;
  public hammer_used: number;
  public wave_used: number;
  public totem_used: number;
  public combo: number;
  public max_combo: number;
  public score: number;
  public moves: number;
  public buyIn: number;
  public next_row: number[];
  public bonuses: number[];
  public blocks: number[][];
  public blocksRaw: bigint;
  public rows: Row[];
  public player_id: string;
  public seed: bigint;
  public start_time: Date;
  public score_in_tournament: number;
  public combo_counter_in_tournament: number;
  public max_combo_in_tournament: number;
  public tournament_id: number;

  constructor(game: ComponentValue) {
    this.id = game.id;
    this.difficulty = Difficulty.from(game.difficulty);
    this.mode = Mode.from(game.mode);
    this.over = game.over ? true : false;
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH,
    );
    this.hammer = game.hammer_bonus;
    this.wave = game.wave_bonus;
    this.totem = game.totem_bonus;
    this.hammer_used = game.hammer_used;
    this.wave_used = game.wave_used;
    this.totem_used = game.totem_used;
    this.combo = Math.max(game.combo_counter, game.combo_counter_2); // because of the patch u8 u16 for combo_counter
    this.max_combo = game.max_combo;
    this.score = game.score;
    this.buyIn = 100; // Set default buy-in of $100
    this.moves = game.moves;
    this.bonuses = game.bonuses;
    this.player_id = "0x" + game.player_id.toString(16);
    this.seed = game.seed;
    this.start_time = new Date(game.start_time * 1000);
    this.score_in_tournament = game.score_in_tournament;
    this.combo_counter_in_tournament = Math.max(
      game.combo_counter_in_tournament,
      game.combo_counter_in_tournament_2,
    ); // because of the patch u8 u16 for combo_counter_in_tournament
    this.max_combo_in_tournament = game.max_combo_in_tournament;
    this.tournament_id = game.tournament_id;

    // Destructure blocks and colors bitmaps in to Rows and Blocks
    this.blocksRaw = game.blocks;
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
    this.rows = this.blocks.map((row, rowIndex) => {
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

  public isPaid(): boolean {
    return this.mode.price() > 0n;
  }

  public getGameModeMultiplier(): number {
    return this.mode.price() === 0n
      ? GAME_MODE_FREE_MULTIPLIER
      : GAME_MODE_PAID_MULTIPLIER;
  }
}
