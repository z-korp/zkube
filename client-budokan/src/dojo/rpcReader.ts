/**
 * Parse Dojo model writes from TX receipt events.
 *
 * Dojo StoreSetRecord events format:
 *   data[0] = num_keys
 *   data[1..num_keys] = key fields (game_id)
 *   data[num_keys+1] = num_values
 *   data[num_keys+2..] = value fields in struct order
 *
 * The contract may emit multiple StoreSetRecord events to the same model per
 * TX (intermediate states). Always prefer the LAST matching event — it carries
 * the authoritative final state.
 */

import { Game } from "@/dojo/game/models/game";
import { useReceiptGameStore } from "@/stores/receiptGameStore";
import type { ReceiptGameLevelComponent } from "@/stores/receiptGameStore";

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

export interface ReceiptGameSeedData {
  seed: bigint;
  levelSeed: bigint;
  vrfEnabled: boolean;
}

export function parseGameFromReceipt(
  events: ContractEvent[],
  gameId: bigint,
): ReceiptGameData | null {
  if (!events || events.length === 0) return null;

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

/**
 * Extract GameSeed model writes from a TX receipt.
 *
 * GameSeed schema (contracts/src/models/game.cairo):
 *   key:    game_id: felt252
 *   values: seed: felt252, level_seed: felt252, vrf_enabled: bool   (3 values)
 */
export function parseGameSeedFromReceipt(
  events: ContractEvent[],
  gameId: bigint,
): ReceiptGameSeedData | null {
  if (!events || events.length === 0) return null;

  let result: ReceiptGameSeedData | null = null;

  for (let i = 0; i < events.length; i++) {
    const data = events[i].data ?? [];
    // 1 (num_keys) + 1 (game_id) + 1 (num_values) + 3 (values) = 6 minimum
    if (data.length < 6) continue;

    try {
      const numKeys = Number(BigInt(data[0]));
      if (numKeys !== 1) continue;

      const eventGameId = BigInt(data[1]);
      if (eventGameId !== gameId) continue;

      const numValues = Number(BigInt(data[1 + numKeys]));
      if (numValues !== 3) continue;

      const valStart = 1 + numKeys + 1;
      const seed = BigInt(data[valStart]);
      const levelSeed = BigInt(data[valStart + 1]);
      const vrfEnabled = BigInt(data[valStart + 2]) !== 0n;

      // Reject the zero-seed write that occurs when GameSeed is first
      // declared but not yet populated (defensive — shouldn't happen in
      // create_game, but cheap guard).
      if (seed === 0n) continue;

      result = { seed, levelSeed, vrfEnabled };
    } catch {
      continue;
    }
  }

  return result;
}

/**
 * Extract GameLevel model writes from a TX receipt.
 *
 * GameLevel schema (contracts/src/models/game.cairo):
 *   key:    game_id: felt252
 *   values (in struct order, all unsigned ints, one felt each):
 *     level, points_required, max_moves, difficulty,
 *     constraint_type, constraint_value, constraint_count,
 *     constraint2_type, constraint2_value, constraint2_count,
 *     mutator_id    (11 values)
 */
export function parseGameLevelFromReceipt(
  events: ContractEvent[],
  gameId: bigint,
): ReceiptGameLevelComponent | null {
  if (!events || events.length === 0) return null;

  let result: ReceiptGameLevelComponent | null = null;

  for (let i = 0; i < events.length; i++) {
    const data = events[i].data ?? [];
    // 1 (num_keys) + 1 (game_id) + 1 (num_values) + 11 (values) = 14 minimum
    if (data.length < 14) continue;

    try {
      const numKeys = Number(BigInt(data[0]));
      if (numKeys !== 1) continue;

      const eventGameId = BigInt(data[1]);
      if (eventGameId !== gameId) continue;

      const numValues = Number(BigInt(data[1 + numKeys]));
      if (numValues !== 11) continue;

      const valStart = 1 + numKeys + 1;
      const level = Number(BigInt(data[valStart]));
      // Reject pre-init writes where level=0 (the model exists but
      // initialize_level hasn't yet populated it).
      if (level === 0) continue;

      result = {
        game_id: gameId,
        level,
        points_required: Number(BigInt(data[valStart + 1])),
        max_moves: Number(BigInt(data[valStart + 2])),
        difficulty: Number(BigInt(data[valStart + 3])),
        constraint_type: Number(BigInt(data[valStart + 4])),
        constraint_value: Number(BigInt(data[valStart + 5])),
        constraint_count: Number(BigInt(data[valStart + 6])),
        constraint2_type: Number(BigInt(data[valStart + 7])),
        constraint2_value: Number(BigInt(data[valStart + 8])),
        constraint2_count: Number(BigInt(data[valStart + 9])),
        mutator_id: Number(BigInt(data[valStart + 10])),
      };
    } catch {
      continue;
    }
  }

  return result;
}

/**
 * After a start-game TX (create / createRun / startRun / replayLevel /
 * startDailyGame / replayDailyLevel), parse the receipt for Game + GameSeed +
 * GameLevel and seed the receipt store. This lets the client render the board
 * without waiting for Torii to index the new entities.
 *
 * Returns true on full success. On any parse failure, leaves the store
 * untouched and returns false — the Torii fallback path takes over.
 */
export function tryApplyStartGameReceipt(
  events: ContractEvent[],
  gameId: bigint,
): boolean {
  if (gameId <= 0n) return false;

  const game = parseGameFromReceipt(events, gameId);
  const seed = parseGameSeedFromReceipt(events, gameId);
  const level = parseGameLevelFromReceipt(events, gameId);

  if (!game || !seed || !level) return false;

  useReceiptGameStore.getState().setStartGameReceipt({
    gameId,
    game: game.game,
    seed: seed.seed,
    level,
  });

  return true;
}
