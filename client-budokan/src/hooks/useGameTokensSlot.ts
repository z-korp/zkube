import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import type { GameTokenData } from "metagame-sdk";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
export const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

// Normalize address for comparison (remove leading zeros, lowercase)
const normalizeAddress = (address: string | bigint | undefined): string => {
  if (!address) return "";
  const hex = typeof address === "bigint" 
    ? address.toString(16) 
    : address.startsWith("0x") 
      ? address.slice(2) 
      : address;
  return `0x${hex.replace(/^0+/, "").toLowerCase()}`;
};

type UseGameTokensSlotResult = {
  games: GameTokenData[];
  loading: boolean;
  metadataLoading: boolean;
  refetch: () => void;
};

/**
 * Hook for fetching games directly from RECS (Torii).
 * Works on slot mode by default, but can be forced on other networks via `forceRecs`.
 * This is a fallback approach that works without the metagame relayer.
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
  forceRecs?: boolean; // Force RECS query even on non-slot modes
}): UseGameTokensSlotResult => {
  const {
    setup: {
      clientModels: {
        models: { Game },
      },
      world,
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

    const fetchGames = () => {
      setLoading(true);
      try {
        // Query all Game entities from RECS
        const gameEntities = runQuery([Has(Game)]);

        const gameList: GameTokenData[] = [];
        const seenIds = new Set<number>();
        const normalizedOwner = normalizeAddress(owner);

        console.log("[useGameTokensSlot] Fetching games for owner:", normalizedOwner);

        for (const entity of gameEntities) {
          const gameData = getComponentValue(Game, entity);

          if (!gameData || gameData.game_id === 0) continue;

          // Deduplicate by game_id (RECS may have multiple entities for same game)
          if (seenIds.has(gameData.game_id)) continue;
          seenIds.add(gameData.game_id);

          // Skip games that haven't started (blocks == 0)
          if (gameData.blocks === 0n) continue;

          // NOTE: Game model doesn't have a player field - ownership is tracked by ERC721 token
          // For now, we show all games. In production, query the token contract for ownership
          // or use metagame-sdk which handles this properly.

          // Extract level data from run_data
          // See contracts/src/helpers/packing.cairo for bit layout
          const runData = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          // Unpack run_data fields (from RunDataBits in packing.cairo):
          // bits 0-7 = current_level (8 bits)
          // bits 99-114 = cubes_brought (16 bits)
          // bits 115-130 = cubes_spent (16 bits)
          // bits 131-146 = total_cubes (16 bits)
          // bits 147-162 = total_score (16 bits)
          const level = Number(runData & BigInt(0xFF)); // 8 bits at position 0
          const cubesBrought = Number((runData >> BigInt(99)) & BigInt(0xFFFF)); // 16 bits at position 99
          const cubesSpent = Number((runData >> BigInt(115)) & BigInt(0xFFFF)); // 16 bits at position 115
          const totalCubes = Number((runData >> BigInt(131)) & BigInt(0xFFFF)); // 16 bits at position 131
          const totalScore = Number((runData >> BigInt(147)) & BigInt(0xFFFF)); // 16 bits at position 147

          gameList.push({
            token_id: gameData.game_id,
            score: totalScore,
            game_over: gameData.over,
            metadata: JSON.stringify({
              name: `Game #${gameData.game_id}`,
              attributes: [
                { trait_type: "Level", value: level },
                { trait_type: "Total Cubes", value: totalCubes },
                { trait_type: "Total Score", value: totalScore },
                { trait_type: "Cubes Brought", value: cubesBrought },
                { trait_type: "Cubes Spent", value: cubesSpent },
              ],
            }),
            gameMetadata: { name: `Game #${gameData.game_id}` },
          } as GameTokenData);

          if (gameList.length >= limit) break;
        }

        // Sort by token_id descending (newest first)
        gameList.sort((a, b) => b.token_id - a.token_id);

        setGames(gameList);
      } catch (error) {
        console.error("Error fetching slot games:", error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [Game, owner, limit, world, refreshTrigger]);

  return {
    games,
    loading,
    metadataLoading: false,
    refetch,
  };
};
