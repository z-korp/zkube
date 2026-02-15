import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback, useRef } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import type { GameTokenData } from "metagame-sdk";
import { normalizeAddress } from "@/utils/address";
import { unpackRunData } from "@/dojo/game/helpers/runDataPacking";
import { createLogger } from "@/utils/logger";
import { showToast } from "@/utils/toast";
import { addAddressPadding } from "starknet";
import type { Subscription } from "@dojoengine/torii-client";

const log = createLogger("useGameTokensSlot");

const { VITE_PUBLIC_DEPLOY_TYPE, VITE_PUBLIC_TORII, VITE_PUBLIC_GAME_TOKEN_ADDRESS } = import.meta.env;
export const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

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
      toriiClient,
      clientModels: {
        models: { Game },
      },
    },
  } = useDojo();

  const [games, setGames] = useState<GameTokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fetchErrorShownRef = useRef(false);
  const subscriptionRef = useRef<Subscription | null>(null);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const shouldFetch = (isSlotMode || forceRecs) && !!owner;

  const fetchGames = useCallback(async () => {
    if (!shouldFetch) return;

    setLoading(true);
    try {
      const toriiUrl = VITE_PUBLIC_TORII;
      const gameTokenAddress = VITE_PUBLIC_GAME_TOKEN_ADDRESS?.toLowerCase();
      
      if (!toriiUrl) {
        log.warn("No TORII URL configured");
        if (!fetchErrorShownRef.current) {
          showToast({
            message: "Game indexer is not configured.",
            type: "error",
            toastId: "games-torii-missing",
          });
          fetchErrorShownRef.current = true;
        }
        setGames([]);
        return;
      }

      // Pad the owner address for Torii query
      const paddedOwner = padAddress(owner!);
      
      log.debug("Fetching ERC721 tokens for owner:", paddedOwner);

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
        log.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0].message);
      }

      const edges = result.data?.tokenBalances?.edges || [];
      
      // Filter for ERC721 tokens from our game contract
      const erc721Tokens = edges
        .map((edge) => edge.node.tokenMetadata)
        .filter((meta): meta is ERC721TokenMetadata => {
          if (meta.__typename !== "ERC721__Token") return false;
          if (gameTokenAddress) {
            const tokenContract = normalizeAddress((meta as ERC721TokenMetadata).contractAddress || "");
            return tokenContract === normalizeAddress(gameTokenAddress);
          }
          return true;
        });

      log.debug("Found ERC721 tokens:", erc721Tokens.length);

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

        const runData = unpackRunData(gameData.run_data ? BigInt(gameData.run_data) : BigInt(0));
        const { currentLevel: level, cubesBrought, cubesSpent, totalCubes, totalScore } = runData;

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

      log.info("Final game list:", gameList.length);
      fetchErrorShownRef.current = false;
      setGames(gameList);
    } catch (error) {
      log.error("Error fetching games:", error);
      if (!fetchErrorShownRef.current) {
        showToast({
          message: "Could not load your games. Please try again.",
          type: "error",
          toastId: "games-fetch-error",
        });
        fetchErrorShownRef.current = true;
      }
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, [Game, owner, limit, shouldFetch]);

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    fetchGames();
  }, [fetchGames, refreshTrigger, shouldFetch]);

  // Subscribe to ERC721 token balance updates (same pattern as useCubeBalance)
  useEffect(() => {
    if (!shouldFetch || !toriiClient || !VITE_PUBLIC_GAME_TOKEN_ADDRESS || !owner) {
      return;
    }

    let cancelled = false;

    const setupSubscription = async () => {
      if (subscriptionRef.current) {
        try { subscriptionRef.current.cancel(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }

      try {
        const contractAddresses = [addAddressPadding(VITE_PUBLIC_GAME_TOKEN_ADDRESS)];
        const accountAddresses = [addAddressPadding(owner)];

        log.info("Setting up ERC721 token subscription", {
          contractAddresses,
          accountAddresses,
        });

        const subscription = await toriiClient.onTokenBalanceUpdated(
          contractAddresses,
          accountAddresses,
          [],
          () => {
            if (cancelled) return;
            log.info("ERC721 token balance updated, refreshing games list");
            // Small delay to let RECS sync the new Game entity
            setTimeout(() => {
              if (!cancelled) {
                setRefreshTrigger((prev) => prev + 1);
              }
            }, 1000);
          },
        );

        if (!cancelled) {
          subscriptionRef.current = subscription;
          log.info("ERC721 token subscription set up successfully");
        } else {
          try { subscription.cancel(); } catch { /* ignore */ }
        }
      } catch (err) {
        log.error("Error setting up ERC721 token subscription:", err);
      }
    };

    setupSubscription();

    return () => {
      cancelled = true;
      if (subscriptionRef.current) {
        try { subscriptionRef.current.cancel(); } catch { /* ignore */ }
        subscriptionRef.current = null;
      }
    };
  }, [toriiClient, owner, shouldFetch]);

  return {
    games,
    loading,
    metadataLoading: false,
    refetch,
  };
};
