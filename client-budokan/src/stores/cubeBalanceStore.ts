import { create } from "zustand";

interface CubeBalanceState {
  balance: bigint;
  isLoading: boolean;
  error: string | null;
  // Set balance from fetch
  setBalance: (balance: bigint) => void;
  // Optimistic updates
  addOptimistic: (amount: number | bigint) => void;
  subtractOptimistic: (amount: number | bigint) => void;
  // Loading state
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCubeBalanceStore = create<CubeBalanceState>((set) => ({
  balance: BigInt(0),
  isLoading: true,
  error: null,
  
  setBalance: (balance: bigint) => set({ balance, isLoading: false, error: null }),
  
  addOptimistic: (amount: number | bigint) =>
    set((state) => ({ 
      balance: state.balance + BigInt(amount) 
    })),
  
  subtractOptimistic: (amount: number | bigint) =>
    set((state) => ({ 
      balance: state.balance - BigInt(amount) 
    })),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  setError: (error: string | null) => set({ error, isLoading: false }),
}));
