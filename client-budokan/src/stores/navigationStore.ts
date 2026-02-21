import { create } from "zustand";
import type { GameLevelData } from "@/hooks/useGameLevel";

export type PageId =
  | "home"
  | "loadout"
  | "map"
  | "play"
  | "shop"
  | "quests"
  | "leaderboard"
  | "settings"
  | "mygames"
  | "tutorial"
  | "ingameshop";

export interface PendingLevelCompletion {
  level: number;
  levelMoves: number;
  prevTotalCubes: number;
  totalCubes: number;
  prevTotalScore: number;
  totalScore: number;
  gameLevel: GameLevelData | null;
}

interface NavigationState {
  currentPage: PageId;
  previousPage: PageId | null;
  isTransitioning: boolean;
  transitionDirection: "forward" | "back" | null;
  gameId: number | null;
  pendingPreviewLevel: number | null;
  pendingLevelCompletion: PendingLevelCompletion | null;
  navigate: (page: PageId, gameId?: number) => void;
  goBack: () => void;
  setGameId: (id: number | null) => void;
  setPendingPreviewLevel: (level: number | null) => void;
  setPendingLevelCompletion: (data: PendingLevelCompletion | null) => void;
}

const getBackTarget = (page: PageId): PageId => {
  switch (page) {
    case "play":
      return "map";
    case "ingameshop":
      return "play";
    case "map":
      return "home";
    default:
      return "home";
  }
};

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentPage: "home",
  previousPage: null,
  isTransitioning: false,
  transitionDirection: null,
  gameId: null,
  pendingPreviewLevel: null,
  pendingLevelCompletion: null,

  navigate: (page, gameId) => {
    const { currentPage, isTransitioning } = get();
    if (isTransitioning || page === currentPage) return;

    set({
      previousPage: currentPage,
      currentPage: page,
      transitionDirection: "forward",
      isTransitioning: true,
      ...(gameId !== undefined ? { gameId } : {}),
    });

    setTimeout(() => {
      set({ isTransitioning: false, transitionDirection: null });
    }, 150);
  },

  goBack: () => {
    const { currentPage, isTransitioning } = get();
    if (isTransitioning) return;

    const target = getBackTarget(currentPage);
    set({
      previousPage: currentPage,
      currentPage: target,
      transitionDirection: "back",
      isTransitioning: true,
    });

    setTimeout(() => {
      set({ isTransitioning: false, transitionDirection: null });
    }, 150);
  },

  setGameId: (id) => set({ gameId: id }),
  setPendingPreviewLevel: (level) => set({ pendingPreviewLevel: level }),
  setPendingLevelCompletion: (data) => set({ pendingLevelCompletion: data }),
}));
