import { create } from "zustand";

interface GeneralState {
  isUnmounting: boolean;
  setIsUnmounting: (value: boolean) => void;
  playerId: number | undefined;
  setPlayerId: (value: number | undefined) => void;
  playerName: string | undefined;
  setPlayerName: (value: string | undefined) => void;
}

export const useGeneralStore = create<GeneralState>((set) => ({
  isUnmounting: false,
  setIsUnmounting: (value: boolean) => set({ isUnmounting: value }),
  playerId: undefined,
  setPlayerId: (value: number | undefined) => set({ playerId: value }),
  playerName: undefined,
  setPlayerName: (value: string | undefined) => set({ playerName: value }),
}));
