import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import { useGetUsernames, normalizeAddress } from "./useGetUsernames";
import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";

const { VITE_PUBLIC_TORII, VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;

// Truncate address to 0x1234...5678 format
const truncateAddress = (address: string): string => {
  if (!address || address.length <= 13) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export interface LeaderboardEntry {
  token_id: bigint;
  game_id: bigint;
  level: number;
  endlessDepth: number;
  totalCubes: number;
  totalScore: number;
  gameOver: boolean;
  score: number; // Alias for totalScore for compatibility
  player_name?: string;
  player_address?: string; // Raw address for username lookup
  owner?: string; // Token owner address
  started_at?: number;
}

type UseLeaderboardSlotResult = {
  games: LeaderboardEntry[];
  loading: boolean;
  refetch: () => void;
};

// GraphQL query for all token transfers (mints from 0x0)
const TOKEN_TRANSFERS_QUERY = `
  query GetTokenTransfers($limit: Int) {
    tokenTransfers(accountAddress: "0x0", limit: $limit) {
      edges {
        node {
          from
          to
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

interface TokenTransferNode {
  from: string;
  to: string;
  tokenMetadata: ERC721TokenMetadata | { __typename: string };
}

interface TokenTransfersResponse {
  data?: {
    tokenTransfers?: {
      edges: Array<{ node: TokenTransferNode }>;
    };
  };
  errors?: Array<{ message: string }>;
}

// Parse player name from token metadata JSON
const parsePlayerName = (metadata: string | undefined): string | undefined => {
  if (!metadata) return undefined;
  try {
    const parsed = JSON.parse(metadata);
    const attributes = parsed.attributes || [];
    const playerNameAttr = attributes.find(
      (attr: { trait?: string; trait_type?: string; value?: string }) =>
        attr.trait === "Player Name" || attr.trait_type === "Player Name"
    );
    return playerNameAttr?.value;
  } catch {
    return undefined;
  }
};

/**
 * Hook for fetching leaderboard data directly from RECS (Torii).
 * Queries all Game entities and sorts by level -> totalScore -> totalCubes.
 * 
 * Uses Torii's tokenTransfers query to get token ownership and player names.
 * Uses Cartridge's lookupAddresses for username resolution.
 */
export const useLeaderboardSlot = (): UseLeaderboardSlotResult => {
  const {
    setup: {
      clientModels: {
        models: { Game },
      },
    },
  } = useDojo();

  const [rawGames, setRawGames] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const shouldFetch = true;

  // Extract unique addresses that need username lookups
  const addressesNeedingLookup = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const g of rawGames) {
      if (g.player_address && !g.player_name && !seen.has(g.player_address)) {
        seen.add(g.player_address);
        result.push(g.player_address);
      }
    }
    return result;
  }, [rawGames]);

  // Batch fetch usernames for all addresses
  const { usernames } = useGetUsernames(addressesNeedingLookup);

  // Fetch raw game data
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

        // First, fetch token ownership data from Torii GraphQL
        let tokenOwnerMap = new Map<bigint, { owner: string; playerName?: string }>();
        
        if (toriiUrl) {
          try {
            const response = await fetch(`${toriiUrl}/graphql`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: TOKEN_TRANSFERS_QUERY,
                variables: { limit: 500 },
              }),
            });

            if (response.ok) {
              const result: TokenTransfersResponse = await response.json();
              const edges = result.data?.tokenTransfers?.edges || [];

              for (const edge of edges) {
                const meta = edge.node.tokenMetadata;
                if (meta.__typename !== "ERC721__Token") continue;

                const erc721Meta = meta as ERC721TokenMetadata;
                
                // Filter by game token contract if configured
                if (gameTokenAddress) {
                  const tokenContract = erc721Meta.contractAddress?.toLowerCase();
                  if (!tokenContract?.includes(gameTokenAddress.replace("0x", ""))) continue;
                }

                const tokenId = BigInt(erc721Meta.tokenId);
                const owner = edge.node.to;
                const playerName = parsePlayerName(erc721Meta.metadata);

                tokenOwnerMap.set(tokenId, { owner, playerName });
              }
            }
          } catch (error) {
            console.error("[useLeaderboardSlot] Error fetching token data:", error);
          }
        }

        // Query all Game entities from RECS
        const gameEntities = runQuery([Has(Game)]);

        const gameList: LeaderboardEntry[] = [];
        const seenIds = new Set<bigint>();

        for (const entity of gameEntities) {
          const gameData = getComponentValue(Game, entity);

          if (!gameData || gameData.game_id === 0n) continue;

          // Deduplicate
          if (seenIds.has(gameData.game_id)) continue;
          seenIds.add(gameData.game_id);

          // Skip games that haven't started
          if (gameData.blocks === 0n) continue;

          // Extract level data from run_data using the canonical unpacker
          const runDataPacked = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          const runData = unpackRunData(runDataPacked);
          const level = runData.currentLevel;
          const endlessDepth = runData.endlessDepth;
          const totalCubes = 0;
          const totalScore = runData.totalScore;

          // Get owner info from token data
          const tokenInfo = tokenOwnerMap.get(gameData.game_id);
          
          gameList.push({
            token_id: gameData.game_id,
            game_id: gameData.game_id,
            level,
            endlessDepth,
            totalCubes,
            totalScore,
            gameOver: gameData.over || false,
            score: totalScore, // Alias for compatibility
            player_address: tokenInfo?.owner,
            player_name: tokenInfo?.playerName,
            owner: tokenInfo?.owner,
            started_at: gameData.started_at ? Number(gameData.started_at) : 0,
          });
        }

        // Sort by: level (desc) -> totalScore (desc) -> totalCubes (desc) -> timestamp (asc, earlier = better)
        gameList.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
          if (b.totalCubes !== a.totalCubes) return b.totalCubes - a.totalCubes;
          return (a.started_at ?? 0) - (b.started_at ?? 0);
        });

        setRawGames(gameList);
      } catch (error) {
        console.error("[useLeaderboardSlot] Error fetching leaderboard:", error);
        setRawGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [Game, refreshTrigger, shouldFetch]);

  // Combine raw games with resolved usernames
  const games = useMemo(() => {
    return rawGames.map((game) => {
      // If already has player_name from token metadata, use it
      if (game.player_name) return game;

      // Try to get username from Cartridge lookup
      if (game.player_address && usernames) {
        const normalized = normalizeAddress(game.player_address);
        const username = usernames.get(normalized);
        if (username) {
          return { ...game, player_name: username };
        }
      }

      // Fallback to truncated address or game ID
      if (game.player_address) {
        return { ...game, player_name: truncateAddress(game.player_address) };
      }

      return { ...game, player_name: `Game #${game.token_id}` };
    });
  }, [rawGames, usernames]);

  return {
    games,
    loading,
    refetch,
  };
};
