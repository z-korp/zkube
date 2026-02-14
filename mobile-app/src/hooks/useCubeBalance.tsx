import { useEffect, useCallback, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojo } from "@/dojo/useDojo";
import { useCubeBalanceStore } from "@/stores/cubeBalanceStore";
import { addAddressPadding } from "starknet";
import type { Subscription, TokenBalance } from "@dojoengine/torii-client";
import { createLogger } from "@/utils/logger";
import { padAddress } from "@/utils/address";

const log = createLogger("useCubeBalance");

const { VITE_PUBLIC_CUBE_TOKEN_ADDRESS, VITE_PUBLIC_CUBE_TOKEN_ID } = import.meta.env;

type TokenBalanceWithTokenId = TokenBalance & { token_id?: string; tokenId?: string };

const parseBigInt = (value: string): bigint => {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
};

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to subscribe to CUBE (ERC1155) token balance via Torii.
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
  } = useCubeBalanceStore();

  const subscriptionRef = useRef<Subscription | null>(null);

  // Fetch initial balance and setup subscription
  const setupSubscription = useCallback(async () => {
    if (!address || !toriiClient || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      setBalance(BigInt(0));
      return;
    }

    const cubeTokenId = parseBigInt(VITE_PUBLIC_CUBE_TOKEN_ID ?? "0x1");
    const cubeTokenAddress = parseBigInt(VITE_PUBLIC_CUBE_TOKEN_ADDRESS);

    try {
      setLoading(true);

      const contractAddresses = [addAddressPadding(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)];
      const accountAddresses = [addAddressPadding(address)];
      const tokenIds = [padAddress(`0x${cubeTokenId.toString(16)}`)];

      // Fetch initial balance
      const balances = await toriiClient.getTokenBalances({
        contract_addresses: contractAddresses,
        account_addresses: accountAddresses,
        token_ids: tokenIds,
        pagination: {
          cursor: undefined,
          direction: "Backward",
          limit: 100,
          order_by: [],
        },
      });

      // Find the CUBE token balance
      const cubeBalance = balances.items.find((b: TokenBalance) => {
        const balance = b as TokenBalanceWithTokenId;
        const tokenIdValue = balance.token_id ?? balance.tokenId ?? "0x0";
        return (
          parseBigInt(balance.contract_address) === cubeTokenAddress &&
          parseBigInt(tokenIdValue) === cubeTokenId
        );
      });
      
      const initialBalance = cubeBalance ? BigInt(cubeBalance.balance) : BigInt(0);
      setBalance(initialBalance);
      
      log.info("Initial balance:", initialBalance.toString());

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
        tokenIds,
        (data: TokenBalance) => {
          const balance = data as TokenBalanceWithTokenId;
          const tokenIdValue = balance.token_id ?? balance.tokenId ?? "0x0";
          if (
            parseBigInt(balance.contract_address) === cubeTokenAddress &&
            parseBigInt(tokenIdValue) === cubeTokenId
          ) {
            const newBalance = BigInt(data.balance);
            log.info("Balance updated via subscription:", newBalance.toString());
            setBalance(newBalance);
          }
        },
      );

      subscriptionRef.current = subscription;
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
