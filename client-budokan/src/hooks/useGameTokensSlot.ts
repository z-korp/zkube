import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import type { GameTokenData } from "metagame-sdk";

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_TORII, VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;
export const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

// Pad address to 66 characters (0x + 64 hex chars)
const padAddress = (address: string): string => {
  if (!address) return "";
  const hex = address.startsWith("0x") ? address.slice(2) : address;
  return `0x${hex.padStart(64, "0")}`;
};

type UseGameTokensSlotResult = {
  games: GameTokenData[];
  loading: boolean;
  metadataLoading: boolean;
  refetch: () => void;
};

// GraphQL query for ERC721 token balances
const TOKEN_BALANCES_QUERY = `
  query GetTokenBalances($accountAddress: String!, $limit: Int) {
    tokenBalances(accountAddress: $accountAddress, limit: $limit) {
      edges {
        node {
          tokenMetadata {
            __typename
            ... on ERC721__Token {
              tokenId
              contractAddress
              metadata
              metadataName
            }
          }
        }
      }
    }
  }
`;

interface ERC721TokenMetadata {
  __typename: "ERC721__Token";
  tokenId: string;
  contractAddress: string;
  metadata: string;
  metadataName: string;
}

interface TokenBalanceNode {
  tokenMetadata: ERC721TokenMetadata | { __typename: string };
}

interface TokenBalancesResponse {
  data?: {
    tokenBalances?: {
      edges: Array<{ node: TokenBalanceNode }>;
    };
  };
  errors?: Array<{ message: string }>;
}

/**
 * Hook for fetching game tokens directly from Torii GraphQL.
 * Works on slot mode by default, but can be forced on other networks via `forceRecs`.
 * This is a fallback approach that works without the metagame relayer.
 * 
 * Uses Torii's tokenBalances query to get owned ERC721 tokens, then matches
 * with Game model data from RECS for additional game state info.
 */
export const useGameTokensSlot = ({
  owner,
  limit = 100,
  forceRecs = false,
}: {
  owner?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  includeMetadata?: boolean;
  gameAddresses?: string[];
  forceRecs?: boolean; // Force query even on non-slot modes
}): UseGameTokensSlotResult => {
  const {
    setup: {
      clientModels: {
        models: { Game },
      },
    },
  } = useDojo();

  const [games, setGames] = useState<GameTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const shouldFetch = (isSlotMode || forceRecs) && !!owner;

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      setLoading(true);
      try {
        const toriiUrl = VITE_PUBLIC_TORII;
        const gameTokenAddress = VITE_PUBLIC_GAME_TOKEN_ADDRESS?.toLowerCase();
        
        if (!toriiUrl) {
          console.warn("[useGameTokensSlot] No TORII URL configured");
          setGames([]);
          return;
        }

        // Pad the owner address for Torii query
        const paddedOwner = padAddress(owner!);
        
        console.log("[useGameTokensSlot] Fetching ERC721 tokens for owner:", paddedOwner);

        // Query Torii GraphQL for token balances
        const response = await fetch(`${toriiUrl}/graphql`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: TOKEN_BALANCES_QUERY,
            variables: { accountAddress: paddedOwner, limit },
          }),
        });

        if (!response.ok) {
          throw new Error(`Torii GraphQL request failed: ${response.status}`);
        }

        const result: TokenBalancesResponse = await response.json();

        if (result.errors?.length) {
          console.error("[useGameTokensSlot] GraphQL errors:", result.errors);
          throw new Error(result.errors[0].message);
        }

        const edges = result.data?.tokenBalances?.edges || [];
        
        // Filter for ERC721 tokens from our game contract
        const erc721Tokens = edges
          .map((edge) => edge.node.tokenMetadata)
          .filter((meta): meta is ERC721TokenMetadata => {
            if (meta.__typename !== "ERC721__Token") return false;
            // Filter by game token contract if configured
            if (gameTokenAddress) {
              const tokenContract = (meta as ERC721TokenMetadata).contractAddress?.toLowerCase();
              return tokenContract?.includes(gameTokenAddress.replace("0x", ""));
            }
            return true;
          });

        console.log("[useGameTokensSlot] Found ERC721 tokens:", erc721Tokens.length);

        // Get owned token IDs
        const ownedTokenIds = new Set(
          erc721Tokens.map((token) => {
            // tokenId is hex string like "0x0000...0001"
            return Number(BigInt(token.tokenId));
          })
        );

        // Query all Game entities from RECS
        const gameEntities = runQuery([Has(Game)]);

        const gameList: GameTokenData[] = [];
        const seenIds = new Set<number>();

        for (const entity of gameEntities) {
          const gameData = getComponentValue(Game, entity);

          if (!gameData || gameData.game_id === 0) continue;

          // Only include games owned by the user
          if (!ownedTokenIds.has(gameData.game_id)) continue;

          // Deduplicate by game_id
          if (seenIds.has(gameData.game_id)) continue;
          seenIds.add(gameData.game_id);

          // Find the token metadata from Torii response
          const tokenMeta = erc721Tokens.find(
            (t) => Number(BigInt(t.tokenId)) === gameData.game_id
          );

          // Parse metadata from token for name/description only
          let parsedMetadata: Record<string, unknown> | undefined;
          if (tokenMeta?.metadata) {
            try {
              parsedMetadata = JSON.parse(tokenMeta.metadata);
            } catch {
              // Ignore parse errors
            }
          }

          // Always extract game stats from run_data (RECS) for accuracy
          // Token metadata may have stale values
          const runData = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          const level = Number(runData & BigInt(0xFF));
          const cubesBrought = Number((runData >> BigInt(99)) & BigInt(0xFFFF));
          const cubesSpent = Number((runData >> BigInt(115)) & BigInt(0xFFFF));
          const totalCubes = Number((runData >> BigInt(131)) & BigInt(0xFFFF));
          const totalScore = Number((runData >> BigInt(147)) & BigInt(0xFFFF));

          // Always use RECS-computed values for game stats
          // Token metadata may have stale/incorrect values
          const gameName = (parsedMetadata?.name as string) || tokenMeta?.metadataName || `Game #${gameData.game_id}`;
          const metadata = JSON.stringify({
            name: gameName,
            attributes: [
              { trait_type: "Level", value: level },
              { trait_type: "Total Cubes", value: totalCubes },
              { trait_type: "Total Score", value: totalScore },
              { trait_type: "Cubes Brought", value: cubesBrought },
              { trait_type: "Cubes Spent", value: cubesSpent },
            ],
          });

          gameList.push({
            token_id: gameData.game_id,
            score: totalScore,
            game_over: gameData.over,
            metadata,
            gameMetadata: { 
              name: tokenMeta?.metadataName || `Game #${gameData.game_id}` 
            },
          } as GameTokenData);

          if (gameList.length >= limit) break;
        }

        // Sort by token_id descending (newest first)
        gameList.sort((a, b) => b.token_id - a.token_id);

        console.log("[useGameTokensSlot] Final game list:", gameList.length);
        setGames(gameList);
      } catch (error) {
        console.error("[useGameTokensSlot] Error fetching games:", error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [Game, owner, limit, refreshTrigger, shouldFetch]);

  return {
    games,
    loading,
    metadataLoading: false,
    refetch,
  };
};
