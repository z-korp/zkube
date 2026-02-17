import type { ComponentValue } from "@dojoengine/recs";
import { Packer } from "../helpers/packer";
import { unpackRunData, type RunData } from "../helpers/runDataPacking";
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
  public get comboBonus(): number {
    return this.runData.comboCount;
  }
  public get scoreBonus(): number {
    return this.runData.scoreCount;
  }
  public get harvest(): number {
    return this.runData.harvestCount;
  }
  public get wave(): number {
    return this.runData.waveCount;
  }
  public get supply(): number {
    return this.runData.supplyCount;
  }
  public get maxComboRun(): number {
    return this.runData.maxComboRun;
  }
  public get totalScore(): number {
    return this.runData.totalScore;
  }
  public get selectedBonus1(): number {
    return this.runData.selectedBonus1;
  }
  public get selectedBonus2(): number {
    return this.runData.selectedBonus2;
  }
  public get selectedBonus3(): number {
    return this.runData.selectedBonus3;
  }
  public get bonus1Level(): number {
    return this.runData.bonus1Level;
  }
  public get bonus2Level(): number {
    return this.runData.bonus2Level;
  }
  public get bonus3Level(): number {
    return this.runData.bonus3Level;
  }
  public get freeMoves(): number {
    return this.runData.freeMoves;
  }
  public get pendingLevelUp(): boolean {
    return this.runData.pendingLevelUp;
  }
  public get lastShopLevel(): number {
    return this.runData.lastShopLevel;
  }
  public get shopBonus1Bought(): boolean {
    return this.runData.shopBonus1Bought;
  }
  public get shopBonus2Bought(): boolean {
    return this.runData.shopBonus2Bought;
  }
  public get shopBonus3Bought(): boolean {
    return this.runData.shopBonus3Bought;
  }
  public get shopRefills(): number {
    return this.runData.shopRefills;
  }
  // Victory state
  public get runCompleted(): boolean {
    return this.runData.runCompleted;
  }
  // In-game shop data
  public get cubesBrought(): number {
    return this.runData.cubesBrought;
  }
  public get cubesSpent(): number {
    return this.runData.cubesSpent;
  }
  public get cubesAvailable(): number {
    // Available = brought + earned - spent
    const totalBudget = this.runData.cubesBrought + this.runData.totalCubes;
    return Math.max(0, totalBudget - this.runData.cubesSpent);
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
    return this.comboBonus + this.scoreBonus + this.harvest + this.wave + this.supply;
  }

  public hasBonuses(): boolean {
    return this.getTotalBonuses() > 0;
  }
}
