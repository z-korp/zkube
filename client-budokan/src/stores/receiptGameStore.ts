import { create } from "zustand";
import type { Game } from "@/dojo/game/models/game";

/**
 * Subset of the GameLevel RECS component shape needed by useGameLevel.
 * Receipt-parsed levels populate this; useGameLevel transforms it into
 * the public GameLevelData (applying star-threshold modifier).
 */
export interface ReceiptGameLevelComponent {
  game_id: bigint;
  level: number;
  points_required: number;
  max_moves: number;
  difficulty: number;
  constraint_type: number;
  constraint_value: number;
  constraint_count: number;
  constraint2_type: number;
  constraint2_value: number;
  constraint2_count: number;
  mutator_id: number;
}

interface ReceiptGameStore {
  /** Game object — receipt override for HUD/grid (move/bonus path or start-game) */
  game: Game | null;
  /** Game-creation seed from the start-game TX receipt */
  seed: bigint | null;
  /** Initial GameLevel from the start-game TX receipt */
  level: ReceiptGameLevelComponent | null;
  /** Anchors all overrides — id-mismatched consumers ignore the cache */
  gameId: bigint | null;

  /** Update only the Game model (move/bonus path; preserves seed/level) */
  setGame: (game: Game | null) => void;

  /** Atomic write for the start-game path: seeds game + seed + level together */
  setStartGameReceipt: (params: {
    gameId: bigint;
    game: Game;
    seed: bigint;
    level: ReceiptGameLevelComponent;
  }) => void;

  /** Drop all overrides (on game switch / receipt-parse failure / navigate away) */
  clear: () => void;
}

export const useReceiptGameStore = create<ReceiptGameStore>((set) => ({
  game: null,
  seed: null,
  level: null,
  gameId: null,
  setGame: (game) => set({ game }),
  setStartGameReceipt: ({ gameId, game, seed, level }) =>
    set({ gameId, game, seed, level }),
  clear: () => set({ gameId: null, game: null, seed: null, level: null }),
}));
