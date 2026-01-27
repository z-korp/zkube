import { useEffect, useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";

const { VITE_PUBLIC_TORII, VITE_PUBLIC_CUBE_TOKEN_ADDRESS } = import.meta.env;

// CUBE token ID (matches contract constant)
const CUBE_TOKEN_ID = "0x1";

interface CubeBalanceResult {
  cubeBalance: bigint;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch CUBE token balance from Torii ERC1155 indexer
 * Uses GraphQL to query the balance for the connected account
 */
export const useCubeBalance = (): CubeBalanceResult => {
  const { address } = useAccount();
  const [cubeBalance, setCubeBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setCubeBalance(BigInt(0));
      setIsLoading(false);
      return;
    }

    const cubeTokenAddress = VITE_PUBLIC_CUBE_TOKEN_ADDRESS;
    if (!cubeTokenAddress) {
      setError("CUBE token address not configured");
      setIsLoading(false);
      return;
    }

    const toriiUrl = VITE_PUBLIC_TORII;
    if (!toriiUrl) {
      setError("Torii URL not configured");
      setIsLoading(false);
      return;
    }

    // Normalize addresses (remove leading zeros after 0x for comparison)
    const normalizeAddr = (addr: string) => {
      const hex = addr.toLowerCase().replace(/^0x0*/, "0x");
      return hex === "0x" ? "0x0" : hex;
    };
    const normalizedAccount = normalizeAddr(address);
    const normalizedToken = normalizeAddr(cubeTokenAddress);

    try {
      setIsLoading(true);
      setError(null);

      // Query Torii GraphQL for ERC1155 balance via tokenBalances
      const graphqlUrl = `${toriiUrl}/graphql`;
      
      const query = `
        query GetCubeBalance($accountAddress: String!) {
          tokenBalances(accountAddress: $accountAddress) {
            edges {
              node {
                tokenMetadata {
                  ... on ERC1155__Token {
                    contractAddress
                    tokenId
                    amount
                  }
                }
              }
            }
          }
        }
      `;

      console.log("[useCubeBalance] fetching from:", graphqlUrl, "account:", normalizedAccount, "token:", normalizedToken);
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            accountAddress: normalizedAccount,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("[useCubeBalance] raw response:", JSON.stringify(result, null, 2));
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }

      // Find the CUBE token balance among all token balances
      const edges = result.data?.tokenBalances?.edges || [];
      let found = false;
      for (const edge of edges) {
        const meta = edge.node?.tokenMetadata;
        if (!meta?.contractAddress || !meta?.tokenId) continue;
        // Match by contract address and token ID
        const contractMatch = normalizeAddr(meta.contractAddress) === normalizedToken;
        const tokenIdMatch = normalizeAddr(meta.tokenId) === normalizeAddr(CUBE_TOKEN_ID);
        if (contractMatch && tokenIdMatch) {
          const amountStr = meta.amount || "0";
          const balance = amountStr.startsWith("0x")
            ? BigInt(amountStr)
            : BigInt(amountStr);
          setCubeBalance(balance);
          found = true;
          break;
        }
      }
      if (!found) {
        console.log("[useCubeBalance] no matching CUBE balance found in", edges.length, "edges");
        setCubeBalance(BigInt(0));
      }
    } catch (err) {
      console.error("Failed to fetch cube balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCubeBalance(BigInt(0));
    } finally {
      setIsLoading(false);
    }
  }, [address]);

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
