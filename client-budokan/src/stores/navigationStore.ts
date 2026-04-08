import { create } from "zustand";
import type { GameLevelData } from "@/hooks/useGameLevel";

export type TabId = "home" | "rewards" | "profile" | "ranks";
export type OverlayId = "play" | "daily" | "boss" | "mutator" | "map" | "settings";
export type PageId = TabId | OverlayId;

export const FULLSCREEN_PAGES: ReadonlySet<PageId> = new Set(["play", "boss", "mutator", "map"]);
const NAV_TRANSITION_LOCK_MS = 300;

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
  mapZoneId: number;
  isDailyMap: boolean;
  selectedMode: number;
  profileAddress: string | null;
  pendingPreviewLevel: number | null;
  pendingLevelCompletion: PendingLevelCompletion | null;
  navigate: (page: PageId, gameId?: bigint) => void;
  goBack: () => void;
  setGameId: (id: bigint | null) => void;
  setMapZoneId: (zoneId: number) => void;
  setIsDailyMap: (isDaily: boolean) => void;
  setSelectedMode: (mode: number) => void;
  setProfileAddress: (address: string | null) => void;
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
      return "home";
    case "mutator":
      return "rewards";
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
  mapZoneId: 1,
  isDailyMap: false,
  selectedMode: 0,
  profileAddress: null,
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
    }, NAV_TRANSITION_LOCK_MS);
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
    }, NAV_TRANSITION_LOCK_MS);
  },

  setGameId: (id) => set({ gameId: id }),
  setMapZoneId: (zoneId) => set({ mapZoneId: zoneId }),
  setIsDailyMap: (isDaily) => set({ isDailyMap: isDaily }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setProfileAddress: (address) => set({ profileAddress: address }),
  setPendingPreviewLevel: (level) => set({ pendingPreviewLevel: level }),
  setPendingLevelCompletion: (data) => set({ pendingLevelCompletion: data }),
}));
