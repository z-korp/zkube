import { create } from "zustand";
import type { Game } from "@/dojo/game/models/game";

interface ReceiptGameStore {
  /** Game object parsed from the latest TX receipt — overrides Torii until it catches up */
  game: Game | null;
  setGame: (game: Game | null) => void;
}

export const useReceiptGameStore = create<ReceiptGameStore>((set) => ({
  game: null,
  setGame: (game) => set({ game }),
}));
