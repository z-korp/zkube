import { create } from "zustand";

interface MoveState {
  isMoveComplete: boolean;
  setMoveComplete: (value: boolean) => void;
}

export const useMoveStore = create<MoveState>((set) => ({
  isMoveComplete: false,
  setMoveComplete: (value: boolean) => set({ isMoveComplete: value }),
}));
