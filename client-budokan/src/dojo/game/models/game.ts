import type { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import {
  unpackRunData,
  type RunData,
  type SkillSlot,
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
  public id: number;
  public blocks: number[][];
  public blocksRaw: bigint;
  public rows: Row[];
  public next_row: number[];
  public combo: number;
  public max_combo: number;
  public over: boolean;
  public started_at: number;
  public levelStarsRaw: bigint;

  // Level system data (unpacked from run_data)
  public runData: RunData;

  // Convenience accessors for level data
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
  public get bonusUsedThisLevel(): boolean {
    return this.runData.bonusUsedThisLevel;
  }
  public get totalCubes(): number {
    return this.runData.totalCubes;
  }
  public get maxComboRun(): number {
    return this.runData.maxComboRun;
  }
  public get totalScore(): number {
    return this.runData.totalScore;
  }
  public get freeMoves(): number {
    return this.runData.freeMoves;
  }
  public get activeSlotCount(): number {
    return this.runData.activeSlotCount;
  }
  public get slots(): [SkillSlot, SkillSlot, SkillSlot] {
    return this.runData.slots;
  }
  // Victory state
  public get runCompleted(): boolean {
    return this.runData.runCompleted;
  }
  public get cubesAvailable(): number {
    return this.runData.totalCubes;
  }
  public get levelTransitionPending(): boolean {
    return this.runData.levelTransitionPending;
  }

  // Legacy compatibility - score now means levelScore
  public get score(): number {
    return this.runData.levelScore;
  }
  // Legacy compatibility - moves now means levelMoves
  public get moves(): number {
    return this.runData.levelMoves;
  }

  constructor(game: ComponentValue) {
    this.id = game.game_id;
    this.over = game.over ? true : false;
    this.started_at = game.started_at || 0;
    
    // Unpack next_row
    this.next_row = Packer.sized_unpack(
      BigInt(game.next_row),
      BigInt(BLOCK_BIT_COUNT),
      DEFAULT_GRID_WIDTH
    );

    // Per-level stats (stored directly in contract)
    this.combo = game.combo_counter || 0;
    this.max_combo = game.max_combo || 0;

    // Unpack run_data (contains all level system data)
    const runDataBigInt = game.run_data ? BigInt(game.run_data) : BigInt(0);
    this.runData = unpackRunData(runDataBigInt);

    // Level stars: 2 bits per level × 50 levels
    this.levelStarsRaw = game.level_stars ? BigInt(game.level_stars) : 0n;

    // Destructure blocks and colors bitmaps into Rows and Blocks
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

  // Helper methods for level system
  public getTotalBonuses(): number {
    return this.runData.slots.reduce((total, slot) => {
      if (slot.skillId < 1 || slot.skillId > 5) return total;
      return total + slot.charges;
    }, 0);
  }

  public hasBonuses(): boolean {
    return this.getTotalBonuses() > 0;
  }

  public getLevelStars(level: number): number {
    if (level < 1 || level > 50) return 0;
    const shift = BigInt((level - 1) * 2);
    return Number((this.levelStarsRaw >> shift) & 0x3n);
  }
}
