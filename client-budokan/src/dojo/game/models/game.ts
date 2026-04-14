import type { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import {
  unpackRunData,
  type RunData,
} from "../helpers/runDataPacking";
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
  public id: bigint;
  public blocks: number[][];
  public blocksRaw: bigint;
  public rows: Row[];
  public next_row: number[];
  public combo: number;
  public max_combo: number;
  public over: boolean;
  public started_at: number;
  public levelStarsRaw: bigint;

  public runData: RunData;
  public runDataRaw: bigint;

  public get level(): number {
    return this.runData.currentLevel;
  }
  public get levelScore(): number {
    return this.runData.levelScore;
  }
  public get levelMoves(): number {
    return this.runData.levelMoves;
  }
  public get constraintProgress(): number {
    return this.runData.constraintProgress;
  }
  public get constraint2Progress(): number {
    return this.runData.constraint2Progress;
  }
  public get maxComboRun(): number {
    return this.runData.maxComboRun;
  }
  public get totalScore(): number {
    return this.runData.totalScore;
  }

  public get zoneId(): number {
    return this.runData.zoneId;
  }
  public get currentDifficulty(): number {
    return this.runData.currentDifficulty;
  }
  public get endlessDepth(): number {
    return this.runData.currentDifficulty;
  }
  public get zoneCleared(): boolean {
    return this.runData.zoneCleared;
  }
  public get activeMutatorId(): number {
    return this.runData.activeMutatorId;
  }
  public get mutatorMask(): number {
    return this.runData.activeMutatorId;
  }
  public get bonusType(): number {
    return this.runData.bonusType;
  }
  public get bonusCharges(): number {
    return this.runData.bonusCharges;
  }
  public get bonusTriggerType(): number {
    return this.runData.bonusTriggerType;
  }
  public get mode(): number {
    return this.runData.mode;
  }

  public get levelTransitionPending(): boolean {
    return !this.over && this.blocksRaw === 0n;
  }

  // Legacy compatibility
  public get score(): number {
    return this.runData.levelScore;
  }
  public get moves(): number {
    return this.runData.levelMoves;
  }

  constructor(game: ComponentValue) {
    this.id = BigInt(game.game_id ?? 0);
    this.over = game.over ? true : false;
    this.started_at = game.started_at || 0;
    
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH
    );

    this.combo = game.combo_counter || 0;
    this.max_combo = game.max_combo || 0;

    const runDataBigInt = game.run_data ? BigInt(game.run_data) : BigInt(0);
    this.runDataRaw = runDataBigInt;
    this.runData = unpackRunData(runDataBigInt);

    this.levelStarsRaw = game.level_stars ? BigInt(game.level_stars) : 0n;

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

  public getLevelStars(level: number): number {
    if (level < 1 || level > 50) return 0;
    const shift = BigInt((level - 1) * 2);
    return Number((this.levelStarsRaw >> shift) & 0x3n);
  }
}
