import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

// Truncate address to 0x1234...5678 format
const truncateAddress = (address: string | bigint | undefined): string => {
  if (!address) return "Unknown";
  const addr = typeof address === "bigint" ? `0x${address.toString(16)}` : address;
  if (addr.length <= 13) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export interface LeaderboardEntry {
  token_id: number;
  game_id: number;
  level: number;
  totalCubes: number;
  totalScore: number;
  gameOver: boolean;
  score: number; // Alias for totalScore for compatibility
  player_name?: string;
  started_at?: number;
}

type UseLeaderboardSlotResult = {
  games: LeaderboardEntry[];
  loading: boolean;
  refetch: () => void;
};

/**
 * Slot-compatible hook for fetching leaderboard data.
 * Queries all Game entities and sorts by level -> cubes -> totalScore.
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
          // See contracts/src/helpers/packing.cairo for bit layout (RunDataBits)
          const runData = gameData.run_data ? BigInt(gameData.run_data) : BigInt(0);
          // Unpack run_data fields:
          // bits 0-7 = current_level (8 bits)
          // bits 115-130 = total_cubes (16 bits)
          // bits 131-146 = total_score (16 bits)
          const level = Number(runData & BigInt(0xFF)); // 8 bits at position 0
          const totalCubes = Number((runData >> BigInt(115)) & BigInt(0xFFFF)); // 16 bits at position 115
          const totalScore = Number((runData >> BigInt(131)) & BigInt(0xFFFF)); // 16 bits at position 131

          gameList.push({
            token_id: gameData.game_id,
            game_id: gameData.game_id,
            level,
            totalCubes,
            totalScore,
            gameOver: gameData.over || false,
            score: totalScore, // Alias for compatibility
            player_name: truncateAddress(gameData.player),
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
