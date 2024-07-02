import { Card } from "@/dojo/game/types/card";
import { Resource } from "@/dojo/game/types/resource";
import { Side } from "@/dojo/game/types/side";
import { create } from "zustand";

interface GameState {
  resources: bigint;
  setResources: (resources: bigint) => void;
  storage: boolean;
  setStorage: (storageModal: boolean) => void;
  costs: Resource[];
  setCosts: (costs: Resource[]) => void;
  callback: (resources: bigint) => void;
  setCallback: (callback: (resources: bigint) => void) => void;
  upgradeToShow: { card: Card; side: Side } | null;
  resetUpgradeToShow: () => void;
  setUpgradeToShow: (card: Card, side: Side) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  resources: 0n,
  setResources: (resources) => set({ resources }),
  storage: false,
  setStorage: (storage) => set({ storage }),
  costs: [],
  setCosts: (costs) => set({ costs }),
  callback: () => {},
  setCallback: (callback) => set({ callback }),
  upgradeToShow: null,
  resetUpgradeToShow: () => set({ upgradeToShow: null }),
  setUpgradeToShow: (card, side) => set({ upgradeToShow: { card, side } }),
  reset: () =>
    set({
      resources: 0n,
      storage: false,
      costs: [],
      callback: () => {},
      upgradeToShow: null,
    }),
}));
