import { create } from "zustand";
import type { GameLevelData } from "@/hooks/useGameLevel";

export type TabId = "home" | "mygames" | "profile" | "ranks";
export type OverlayId = "play" | "daily" | "boss" | "mutator" | "map" | "settings";
export type PageId = TabId | OverlayId;

export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play", "boss", "mutator", "map"]);

export interface PendingLevelCompletion {
  level: number;
  levelMoves: number;
  prevTotalScore: number;
  totalScore: number;
  gameLevel: GameLevelData | null;
}

interface NavigationState {
  currentPage: PageId;
  previousPage: PageId | null;
  isTransitioning: boolean;
  transitionDirection: "forward" | "back" | null;
  gameId: bigint | null;
  selectedMode: number;
  pendingPreviewLevel: number | null;
  pendingLevelCompletion: PendingLevelCompletion | null;
  navigate: (page: PageId, gameId?: bigint) => void;
  goBack: () => void;
  setGameId: (id: bigint | null) => void;
  setSelectedMode: (mode: number) => void;
  setPendingPreviewLevel: (level: number | null) => void;
  setPendingLevelCompletion: (data: PendingLevelCompletion | null) => void;
}

const getBackTarget = (page: PageId): PageId => {
  switch (page) {
    case "play":
      return "map";
    case "daily":
      return "home";
    case "boss":
      return "map";
    case "map":
      return "mygames";
    case "mutator":
      return "mygames";
    case "settings":
      return "profile";
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
  selectedMode: 0,
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
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setPendingPreviewLevel: (level) => set({ pendingPreviewLevel: level }),
  setPendingLevelCompletion: (data) => set({ pendingLevelCompletion: data }),
}));
