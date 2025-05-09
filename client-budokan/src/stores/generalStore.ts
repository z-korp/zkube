import { create } from "zustand";

interface GeneralState {
  gameId: number | undefined;
  isUnmounting: boolean;
  setIsUnmounting: (value: boolean) => void;
}

export const useGeneralStore = create<GeneralState>((set) => ({
  gameId: undefined,
  isUnmounting: false,
  setIsUnmounting: (value: boolean) => set({ isUnmounting: value }),
}));
