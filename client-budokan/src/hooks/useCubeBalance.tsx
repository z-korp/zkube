import { useEffect, useCallback, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { useCubeBalanceStore } from "@/stores/cubeBalanceStore";
import { addAddressPadding } from "starknet";
import type { Subscription, TokenBalance } from "@dojoengine/torii-client";

const { VITE_PUBLIC_CUBE_TOKEN_ADDRESS } = import.meta.env;

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  // Optimistic update functions (for immediate UI feedback before subscription update)
  addOptimistic: (amount: number | bigint) => void;
  subtractOptimistic: (amount: number | bigint) => void;
}

/**
 * Hook to subscribe to zCubes (ERC20) token balance via Torii.
 * Uses real-time subscription for automatic updates.
 */
export const useCubeBalance = (): CubeBalanceResult => {
  const { address } = useAccount();
  const { setup: { toriiClient } } = useDojo();
  
  // Use Zustand store for shared state
  const { 
    balance, 
    isLoading, 
    error, 
    setBalance, 
    setLoading, 
    setError,
    addOptimistic,
    subtractOptimistic,
  } = useCubeBalanceStore();

  const subscriptionRef = useRef<Subscription | null>(null);

  // Fetch initial balance and setup subscription
  const setupSubscription = useCallback(async () => {
    if (!address || !toriiClient || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      setBalance(BigInt(0));
      return;
    }

    try {
      setLoading(true);

      // Normalize addresses with padding
      const contractAddresses = [addAddressPadding(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)];
      const accountAddresses = [addAddressPadding(address)];

      // Fetch initial balance
      const balances = await toriiClient.getTokenBalances({
        contract_addresses: contractAddresses,
        account_addresses: accountAddresses,
        token_ids: [], // Empty for ERC20
        pagination: {
          cursor: undefined,
          direction: "Backward",
          limit: 100,
          order_by: [],
        },
      });

      // Find the CUBE token balance
      const cubeBalance = balances.items.find((b: TokenBalance) => 
        BigInt(b.contract_address) === BigInt(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)
      );
      
      const initialBalance = cubeBalance ? BigInt(cubeBalance.balance) : BigInt(0);
      setBalance(initialBalance);
      
      console.log("[useCubeBalance] Initial balance:", initialBalance.toString());

      // Cancel existing subscription
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
        subscriptionRef.current = null;
      }

      // Subscribe to balance updates
      const subscription = await toriiClient.onTokenBalanceUpdated(
        contractAddresses,
        accountAddresses,
        [], // Empty token_ids for ERC20
        (data: TokenBalance) => {
          // Check if this is for our token
          if (BigInt(data.contract_address) === BigInt(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)) {
            const newBalance = BigInt(data.balance);
            console.log("[useCubeBalance] Balance updated via subscription:", newBalance.toString());
            setBalance(newBalance);
          }
        },
      );

      subscriptionRef.current = subscription;
    } catch (err) {
      console.error("[useCubeBalance] Error setting up subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [address, toriiClient, setBalance, setLoading, setError]);

  // Manual refetch (triggers re-subscription)
  const refetch = useCallback(async () => {
    await setupSubscription();
  }, [setupSubscription]);

  // Setup subscription on mount and when address changes
  useEffect(() => {
    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
        subscriptionRef.current = null;
      }
    };
  }, [setupSubscription]);

  return {
    cubeBalance: balance,
    isLoading,
    error,
    refetch,
    addOptimistic,
    subtractOptimistic,
  };
};

export default useCubeBalance;
