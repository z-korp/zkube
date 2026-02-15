import { useEffect, useCallback, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { useCubeBalanceStore } from "@/stores/cubeBalanceStore";
import { addAddressPadding } from "starknet";
import type { Subscription, TokenBalance } from "@dojoengine/torii-client";
import { createLogger } from "@/utils/logger";

const log = createLogger("useCubeBalance");

const { VITE_PUBLIC_CUBE_TOKEN_ADDRESS } = import.meta.env;

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to subscribe to CUBE token balance via Torii.
 * Uses empty token_ids (ERC20-style query) — Torii returns all balances
 * for the contract, then we filter client-side by contract_address.
 * This matches client-budokan's working approach.
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
  } = useCubeBalanceStore();

  const subscriptionRef = useRef<Subscription | null>(null);

  // Fetch initial balance and setup subscription
  const setupSubscription = useCallback(async () => {
    log.info("setupSubscription called", {
      address: address ?? "null",
      hasToriiClient: !!toriiClient,
      cubeTokenAddress: VITE_PUBLIC_CUBE_TOKEN_ADDRESS ?? "NOT SET",
    });

    if (!address || !toriiClient || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      log.warn("Missing prerequisites", {
        address: !!address,
        toriiClient: !!toriiClient,
        cubeTokenAddress: !!VITE_PUBLIC_CUBE_TOKEN_ADDRESS,
      });
      setBalance(BigInt(0));
      return;
    }

    try {
      setLoading(true);

      const contractAddresses = [addAddressPadding(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)];
      const accountAddresses = [addAddressPadding(address)];

      log.info("Fetching balance", {
        contractAddresses,
        accountAddresses,
      });

      const balances = await toriiClient.getTokenBalances({
        contract_addresses: contractAddresses,
        account_addresses: accountAddresses,
        token_ids: [],
        pagination: {
          cursor: undefined,
          direction: "Backward",
          limit: 100,
          order_by: [],
        },
      });

      log.info("getTokenBalances response", {
        itemCount: balances.items.length,
        items: balances.items.map((b: TokenBalance) => ({
          contract_address: b.contract_address,
          balance: b.balance,
          token_id: (b as Record<string, unknown>).token_id ?? (b as Record<string, unknown>).tokenId ?? "N/A",
        })),
      });

      const cubeBalance = balances.items.find((b: TokenBalance) =>
        BigInt(b.contract_address) === BigInt(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)
      );
      
      const initialBalance = cubeBalance ? BigInt(cubeBalance.balance) : BigInt(0);
      setBalance(initialBalance);
      
      log.info("Initial balance set:", initialBalance.toString());

      // Cancel existing subscription
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
        subscriptionRef.current = null;
      }

      const subscription = await toriiClient.onTokenBalanceUpdated(
        contractAddresses,
        accountAddresses,
        [],
        (data: TokenBalance) => {
          if (BigInt(data.contract_address) === BigInt(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)) {
            const newBalance = BigInt(data.balance);
            log.info("Balance updated via subscription:", newBalance.toString());
            setBalance(newBalance);
          }
        },
      );

      subscriptionRef.current = subscription;
      log.info("Subscription set up successfully");
    } catch (err) {
      log.error("Error setting up subscription:", err);
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
  };
};

export default useCubeBalance;
