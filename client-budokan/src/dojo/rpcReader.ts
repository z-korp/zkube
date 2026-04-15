/**
 * Parse Game model data from TX receipt events.
 * Dojo StoreSetRecord events format:
 *   data[0] = num_keys
 *   data[1..num_keys] = key fields (game_id)
 *   data[num_keys+1] = num_values
 *   data[num_keys+2..] = value fields in struct order
 */

import { Game } from "@/dojo/game/models/game";

export interface ContractEvent {
  data?: string[];
  keys?: string[];
}

export interface ReceiptGameData {
  blocks: number[][];
  nextRow: number[];
  over: boolean;
  game: Game;
}

export function parseGameFromReceipt(
  events: ContractEvent[],
  gameId: bigint,
): ReceiptGameData | null {
  if (!events || events.length === 0) return null;

  // Use the LAST matching StoreSetRecord event — the contract may emit
  // multiple writes to the Game model per TX (intermediate states).
  // The last one is the authoritative final state (with correct over flag).
  let result: ReceiptGameData | null = null;

  for (let i = 0; i < events.length; i++) {
    const data = events[i].data ?? [];
    if (data.length < 10) continue;

    try {
      const numKeys = Number(BigInt(data[0]));
      if (numKeys !== 1) continue;

      const eventGameId = BigInt(data[1]);
      if (eventGameId !== gameId) continue;

      const numValues = Number(BigInt(data[1 + numKeys]));
      if (numValues < 7) continue;

      const valStart = 1 + numKeys + 1;
      // Game model value fields in struct order:
      // blocks, next_row, combo_counter, max_combo, run_data, level_stars, started_at, over
      const blocks = BigInt(data[valStart]);
      const nextRow = Number(BigInt(data[valStart + 1]));
      const comboCounter = Number(BigInt(data[valStart + 2]));
      const maxCombo = Number(BigInt(data[valStart + 3]));
      const runData = BigInt(data[valStart + 4]);
      const levelStars = BigInt(data[valStart + 5]);
      const startedAt = Number(BigInt(data[valStart + 6]));
      const over = numValues > 7 ? BigInt(data[valStart + 7]) !== 0n : false;

      if (blocks === 0n && !over) continue;

      const game = new Game({
        game_id: gameId.toString(),
        blocks,
        next_row: nextRow,
        run_data: runData.toString(),
        combo_counter: comboCounter,
        max_combo: maxCombo,
        over,
        started_at: startedAt,
        level_stars: levelStars.toString(),
      });

      if (game.level === 0 && !over) continue;

      result = {
        blocks: game.blocks,
        nextRow: game.next_row,
        over: game.isOver(),
        game,
      };
    } catch {
      continue;
    }
  }

  return result;
}
