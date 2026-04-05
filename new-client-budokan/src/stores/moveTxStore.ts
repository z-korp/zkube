import { create } from "zustand";

export type QueuedMoveStatus = "queued" | "submitting";

export interface QueuedMove {
  id: string;
  gameId: bigint;
  rowIndex: number;
  startIndex: number;
  finalIndex: number;
  createdAt: number;
  status: QueuedMoveStatus;
}

interface MoveState {
  isMoveComplete: boolean;
  setMoveComplete: (value: boolean) => void;
  queue: QueuedMove[];
  isQueueProcessing: boolean;
  lastFailedMoveError: string | null;
  enqueueMove: (move: Omit<QueuedMove, "id" | "createdAt" | "status">) => string;
  markSubmitting: (id: string) => void;
  markConfirmed: (id: string) => void;
  setQueueProcessing: (value: boolean) => void;
  markFailed: (id: string, error: string) => void;
  clearQueueForGame: (gameId: bigint) => void;
  clearFailure: () => void;
}

export const useMoveStore = create<MoveState>((set) => ({
  isMoveComplete: false,
  setMoveComplete: (value: boolean) => set({ isMoveComplete: value }),
  queue: [],
  isQueueProcessing: false,
  lastFailedMoveError: null,
  enqueueMove: (move) => {
    const id = `move-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    set((state) => ({
      queue: [
        ...state.queue,
        {
          ...move,
          id,
          createdAt: Date.now(),
          status: "queued",
        },
      ],
      lastFailedMoveError: null,
    }));
    return id;
  },
  markSubmitting: (id) =>
    set((state) => ({
      queue: state.queue.map((move) =>
        move.id === id ? { ...move, status: "submitting" } : move,
      ),
    })),
  markConfirmed: (id) =>
    set((state) => ({
      queue: state.queue.filter((move) => move.id !== id),
    })),
  setQueueProcessing: (value) => set({ isQueueProcessing: value }),
  markFailed: (id, error) =>
    set((state) => ({
      queue: state.queue.filter((move) => move.id !== id),
      lastFailedMoveError: error,
    })),
  clearQueueForGame: (gameId) =>
    set((state) => ({
      queue: state.queue.filter((move) => move.gameId !== gameId),
    })),
  clearFailure: () => set({ lastFailedMoveError: null }),
}));
