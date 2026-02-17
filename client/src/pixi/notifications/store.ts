import { create } from "zustand";

export type PixiToastType = "loading" | "success" | "error" | "info";

export type PixiToast = {
  id: string;
  message: string;
  description?: string;
  type: PixiToastType;
  createdAt: number;
  expiresAt: number | null;
};

type ToastStore = {
  toasts: PixiToast[];
  upsertToast: (toast: Omit<PixiToast, "createdAt" | "expiresAt"> & { durationMs?: number }) => void;
  removeToast: (id: string) => void;
  pruneExpired: (now: number) => void;
};

const defaultDuration = (type: PixiToastType) => {
  if (type === "loading") return null;
  if (type === "error") return 4500;
  return 3200;
};

export const usePixiToastStore = create<ToastStore>((set) => ({
  toasts: [],
  upsertToast: (toast) => {
    const now = Date.now();
    const duration = toast.durationMs ?? defaultDuration(toast.type);
    const expiresAt = duration === null ? null : now + duration;

    set((state) => {
      const existingIndex = state.toasts.findIndex((t) => t.id === toast.id);
      const nextToast: PixiToast = {
        id: toast.id,
        message: toast.message,
        description: toast.description,
        type: toast.type,
        createdAt: existingIndex >= 0 ? state.toasts[existingIndex].createdAt : now,
        expiresAt,
      };

      if (existingIndex >= 0) {
        const updated = state.toasts.slice();
        updated[existingIndex] = nextToast;
        return { toasts: updated };
      }

      const capped = [nextToast, ...state.toasts].slice(0, 4);
      return { toasts: capped };
    });
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
  pruneExpired: (now) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.expiresAt === null || t.expiresAt > now),
    }));
  },
}));
