import { create } from "zustand";

interface GeneralState {
  isUnmounting: boolean;
  setIsUnmounting: (value: boolean) => void;
}

export const useGeneralStore = create<GeneralState>((set) => ({
  isUnmounting: false,
  setIsUnmounting: (value: boolean) => set({ isUnmounting: value }),
}));
