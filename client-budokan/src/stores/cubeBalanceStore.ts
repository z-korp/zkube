import { create } from "zustand";

interface CubeBalanceState {
  balance: bigint;
  isLoading: boolean;
  error: string | null;
  setBalance: (balance: bigint) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCubeBalanceStore = create<CubeBalanceState>((set) => ({
  balance: BigInt(0),
  isLoading: true,
  error: null,
  
  setBalance: (balance: bigint) => set({ balance, isLoading: false, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error, isLoading: false }),
}));
