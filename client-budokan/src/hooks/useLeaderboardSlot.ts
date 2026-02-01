import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState, useCallback, useMemo } from "react";
import { getComponentValue, Has, runQuery } from "@dojoengine/recs";
import { lookupAddresses } from "@cartridge/controller";
import { addAddressPadding } from "starknet";

const { VITE_PUBLIC_DEPLOY_TYPE } = import.meta.env;
export const isSlotMode = VITE_PUBLIC_DEPLOY_TYPE === "slot";

// Truncate address to 0x1234...5678 format
const truncateAddress = (address: string): string => {
  if (!address || address.length <= 13) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Convert bigint to padded hex address
const toHexAddress = (address: bigint | undefined): string => {
  if (!address) return "";
  return addAddressPadding(`0x${address.toString(16)}`);
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
  player_address?: string; // Raw address for username lookup
  started_at?: number;
}

type UseLeaderboardSlotResult = {
  games: LeaderboardEntry[];
  loading: boolean;
  refetch: () => void;
};

/**
 * Hook for fetching leaderboard data directly from RECS (Torii).
 * Works on slot mode by default, but can be forced on other networks via `forceRecs`.
 * Queries all Game entities and sorts by level -> cubes -> totalScore.
 */
export const useLeaderboardSlot = ({ 
  forceRecs = false 
}: { 
  forceRecs?: boolean 
} = {}): UseLeaderboardSlotResult => {
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

  const shouldFetch = isSlotMode || forceRecs;

  useEffect(() => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
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
          // bits 131-146 = total_cubes (16 bits)
          // bits 147-162 = total_score (16 bits)
          const level = Number(runData & BigInt(0xFF)); // 8 bits at position 0
          const totalCubes = Number((runData >> BigInt(131)) & BigInt(0xFFFF)); // 16 bits at position 131
          const totalScore = Number((runData >> BigInt(147)) & BigInt(0xFFFF)); // 16 bits at position 147

          const playerAddress = toHexAddress(gameData.player);
          gameList.push({
            token_id: gameData.game_id,
            game_id: gameData.game_id,
            level,
            totalCubes,
            totalScore,
            gameOver: gameData.over || false,
            score: totalScore, // Alias for compatibility
            player_address: playerAddress,
            player_name: undefined, // Will be populated by username lookup
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

        // Batch lookup usernames for all player addresses
        const addresses = gameList
          .map((g) => g.player_address)
          .filter((addr): addr is string => !!addr);
        
        if (addresses.length > 0) {
          try {
            const usernameMap = await lookupAddresses(addresses);
            // Update games with resolved usernames
            for (const game of gameList) {
              if (game.player_address) {
                const username = usernameMap.get(game.player_address);
                game.player_name = username || truncateAddress(game.player_address);
              }
            }
          } catch (error) {
            console.error("Error looking up usernames:", error);
            // Fallback to truncated addresses
            for (const game of gameList) {
              if (game.player_address) {
                game.player_name = truncateAddress(game.player_address);
              }
            }
          }
        }

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
