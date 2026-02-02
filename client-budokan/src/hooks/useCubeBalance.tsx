import { useEffect, useState, useCallback } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { CallData, hash } from "starknet";

const { VITE_PUBLIC_TORII, VITE_PUBLIC_CUBE_TOKEN_ADDRESS } = import.meta.env;

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch zCubes (ERC20) token balance
 * Tries Torii GraphQL first, falls back to direct RPC call
 */
export const useCubeBalance = (): CubeBalanceResult => {
  const { address } = useAccount();
  const { provider } = useProvider();
  const [cubeBalance, setCubeBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch balance directly from RPC using low-level call
  const fetchBalanceRpc = useCallback(async (): Promise<bigint | null> => {
    if (!address || !provider || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      return null;
    }

    try {
      // Use low-level provider.callContract to avoid ABI parsing issues
      // Try balance_of (snake_case) first, then balanceOf (camelCase)
      const selectors = [
        hash.getSelectorFromName("balance_of"),
        hash.getSelectorFromName("balanceOf"),
      ];
      
      for (const selector of selectors) {
        try {
          const result = await provider.callContract({
            contractAddress: VITE_PUBLIC_CUBE_TOKEN_ADDRESS,
            entrypoint: selector,
            calldata: CallData.compile([address]),
          });
          
          // Result is an array of felt252s - for u256, it's [low, high]
          if (result && result.length >= 1) {
            const low = BigInt(result[0] || "0");
            const high = result.length >= 2 ? BigInt(result[1] || "0") : 0n;
            return low + (high << 128n);
          }
        } catch {
          // Try next selector
          continue;
        }
      }
      
      return null;
    } catch (err) {
      console.warn("[useCubeBalance] RPC fallback failed:", err);
      return null;
    }
  }, [address, provider]);

  // Fetch balance from Torii GraphQL
  const fetchBalanceTorii = useCallback(async (): Promise<bigint | null> => {
    if (!address || !VITE_PUBLIC_TORII || !VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      return null;
    }

    // Normalize addresses (remove leading zeros after 0x for comparison)
    const normalizeAddr = (addr: string) => {
      const hex = addr.toLowerCase().replace(/^0x0*/, "0x");
      return hex === "0x" ? "0x0" : hex;
    };
    const normalizedAccount = normalizeAddr(address);
    const normalizedToken = normalizeAddr(VITE_PUBLIC_CUBE_TOKEN_ADDRESS);

    try {
      const graphqlUrl = `${VITE_PUBLIC_TORII}/graphql`;
      
      const query = `
        query GetCubeBalance($accountAddress: String!) {
          tokenBalances(accountAddress: $accountAddress) {
            edges {
              node {
                tokenMetadata {
                  ... on ERC20__Token {
                    contractAddress
                    amount
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          variables: { accountAddress: normalizedAccount },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (result.errors) {
        return null;
      }

      // Find the zCubes token balance
      const edges = result.data?.tokenBalances?.edges || [];
      for (const edge of edges) {
        const meta = edge.node?.tokenMetadata;
        if (!meta?.contractAddress) continue;
        
        if (normalizeAddr(meta.contractAddress) === normalizedToken) {
          const amountStr = meta.amount || "0";
          return amountStr.startsWith("0x") ? BigInt(amountStr) : BigInt(amountStr);
        }
      }
      
      return null; // Not found in Torii
    } catch (err) {
      console.warn("[useCubeBalance] Torii query failed:", err);
      return null;
    }
  }, [address]);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setCubeBalance(BigInt(0));
      setIsLoading(false);
      return;
    }

    if (!VITE_PUBLIC_CUBE_TOKEN_ADDRESS) {
      setError("CUBE token address not configured");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try Torii first
      let balance = await fetchBalanceTorii();
      
      // If Torii didn't return a balance, fallback to RPC
      if (balance === null) {
        balance = await fetchBalanceRpc();
      }

      if (balance !== null) {
        setCubeBalance(balance);
      } else {
        // Both methods failed, set to 0
        setCubeBalance(BigInt(0));
      }
    } catch (err) {
      console.error("Failed to fetch cube balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCubeBalance(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchBalanceTorii, fetchBalanceRpc]);

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Refetch every 10 seconds for updates
  useEffect(() => {
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return {
    cubeBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
};

export default useCubeBalance;
