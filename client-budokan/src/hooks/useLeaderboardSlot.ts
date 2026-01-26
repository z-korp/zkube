import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

export interface LeaderboardEntry {
  token_id: number;
  game_id: number;
  level: number;
  totalStars: number;
  totalScore: number;
  gameOver: boolean;
  score: number; // Alias for totalScore for compatibility
  player_name?: string;
}

type UseLeaderboardSlotResult = {
  games: LeaderboardEntry[];
  loading: boolean;
  refetch: () => void;
};

/**
 * Slot-compatible hook for fetching leaderboard data.
 * Queries all Game entities and sorts by level -> stars -> totalScore.
 */
export const useLeaderboardSlot = (): UseLeaderboardSlotResult => {
  const {
    setup: {
      clientModels: {
        models: { Game },
      },
      world,
    },
  } = useDojo();

  const [games, setGames] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!isSlotMode) {
      setLoading(false);
      return;
    }

    const fetchGames = () => {
      setLoading(true);
      try {
        // Query all Game entities from RECS
        const gameEntities = runQuery([Has(Game)]);

        const gameList: LeaderboardEntry[] = [];

        for (const entity of gameEntities) {
          const gameData = getComponentValue(Game, entity);

          if (!gameData || gameData.game_id === 0) continue;

          // Skip games that haven't started
          if (gameData.blocks === 0n) continue;

          // Extract level data from run_data
          const runData = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          // Unpack run_data: bits 0-6 = level, bits 27-35 = total_stars, bits 52-67 = total_score
          const level = Number(runData & BigInt(0x7F)); // 7 bits (position 0)
          const totalStars = Number((runData >> BigInt(27)) & BigInt(0x1FF)); // 9 bits (position 27)
          const totalScore = Number((runData >> BigInt(52)) & BigInt(0xFFFF)); // 16 bits (position 52)

          gameList.push({
            token_id: gameData.game_id,
            game_id: gameData.game_id,
            level,
            totalStars,
            totalScore,
            gameOver: gameData.over || false,
            score: totalScore, // Alias for compatibility
            player_name: `Game #${gameData.game_id}`,
          });
        }

        // Sort by: level (desc) -> totalStars (desc) -> totalScore (desc)
        gameList.sort((a, b) => {
          if (b.level !== a.level) return b.level - a.level;
          if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
          return b.totalScore - a.totalScore;
        });

        setGames(gameList);
      } catch (error) {
        console.error("Error fetching leaderboard games:", error);
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [Game, world, refreshTrigger]);

  return {
    games,
    loading,
    refetch,
  };
};

export { isSlotMode };
