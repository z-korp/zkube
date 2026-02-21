import { useEffect, useCallback, useRef } from "react";
import { useAccount } from "@starknet-react/core";
import { useCubeBalanceStore } from "@/stores/cubeBalanceStore";
import { useDojo } from "@/dojo/useDojo";

const { VITE_PUBLIC_CUBE_TOKEN_ADDRESS } = import.meta.env;

const normalizeAddress = (addr: string): string => {
  if (!addr.startsWith("0x")) return addr;
  return "0x" + addr.slice(2).replace(/^0+/, "").toLowerCase();
};

const padAddress = (addr: string): string => {
  if (!addr) return addr;
  const hex = addr.startsWith("0x") ? addr.slice(2) : addr;
  return `0x${hex.padStart(64, "0")}`;
};

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCubeBalance = (): CubeBalanceResult => {
  const { address } = useAccount();
  const {
    setup: { toriiClient },
  } = useDojo();
  const {
    balance,
    isLoading,
    error,
    setBalance,
    setLoading,
    setError,
  } = useCubeBalanceStore();

  const subscriptionRef = useRef<{ cancel: () => void } | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS || !toriiClient) {
      setBalance(BigInt(0));
      return;
    }

    try {
      setLoading(true);

      const paddedContract = padAddress(VITE_PUBLIC_CUBE_TOKEN_ADDRESS);
      const paddedAccount = padAddress(address);

      const result = await toriiClient.getTokenBalances({
        contract_addresses: [paddedContract],
        account_addresses: [paddedAccount],
        token_ids: [],
        pagination: {
          limit: 10,
          cursor: undefined,
          direction: "Forward" as const,
          order_by: [],
        },
      });

      const cubeTokenNorm = normalizeAddress(VITE_PUBLIC_CUBE_TOKEN_ADDRESS);
      const cubeItem = result.items.find(
        (item) =>
          normalizeAddress(item.contract_address) === cubeTokenNorm,
      );

      setBalance(cubeItem ? BigInt(cubeItem.balance) : BigInt(0));
    } catch (err) {
      console.error("[useCubeBalance] Error fetching balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [address, toriiClient, setBalance, setLoading, setError]);

  useEffect(() => {
    if (!address || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS || !toriiClient) {
      return;
    }

    fetchBalance();

    let cancelled = false;

    const subscribe = async () => {
      try {
        const subscription = await toriiClient.onTokenBalanceUpdated(
          [padAddress(VITE_PUBLIC_CUBE_TOKEN_ADDRESS)],
          [padAddress(address)],
          [],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update: any) => {
            if (cancelled) return;
            if (update?.balance != null) {
              setBalance(BigInt(update.balance));
            }
          },
        );

        if (!cancelled) {
          subscriptionRef.current = subscription;
        } else {
          subscription.cancel();
        }
      } catch (err) {
        console.error("[useCubeBalance] Subscription error:", err);
      }
    };

    subscribe();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.cancel();
        } catch {
          // Ignore cancel errors
        }
        subscriptionRef.current = null;
      }
    };
  }, [address, toriiClient, fetchBalance, setBalance]);

  const refetch = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return {
    cubeBalance: balance,
    isLoading,
    error,
    refetch,
  };
};

export default useCubeBalance;
