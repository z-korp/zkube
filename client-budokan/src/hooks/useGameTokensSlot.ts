import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import type { GameTokenData } from "metagame-sdk";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

type UseGameTokensSlotResult = {
  games: GameTokenData[];
  loading: boolean;
  metadataLoading: boolean;
  refetch: () => void;
};

/**
 * Slot-compatible hook for fetching games.
 * On slot, we query our own Torii for Game entities.
 * This is a simpler approach that works without the metagame relayer.
 */
export const useGameTokensSlot = ({
  owner,
  limit = 100,
}: {
  owner?: string;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  includeMetadata?: boolean;
  gameAddresses?: string[];
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

  useEffect(() => {
    if (!isSlotMode || !owner) {
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

        for (const entity of gameEntities) {
          const gameData = getComponentValue(Game, entity);

          if (!gameData || gameData.game_id === 0) continue;

          // Deduplicate by game_id (RECS may have multiple entities for same game)
          if (seenIds.has(gameData.game_id)) continue;
          seenIds.add(gameData.game_id);

          // On slot, we show all games that have started (blocks != 0)
          // In production, ownership is verified via metagame SDK
          if (gameData.blocks === 0n) continue;

          // Extract level data from run_data
          const runData = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          // Unpack run_data: bits 0-6 = level, bits 27-35 = total_cubes, bits 52-67 = total_score
          const level = Number(runData & BigInt(0x7F)); // 7 bits (position 0)
          const totalCubes = Number((runData >> BigInt(27)) & BigInt(0x1FF)); // 9 bits (position 27)
          const totalScore = Number((runData >> BigInt(52)) & BigInt(0xFFFF)); // 16 bits (position 52)

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

export { isSlotMode };
