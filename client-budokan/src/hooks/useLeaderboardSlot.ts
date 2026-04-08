import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";
import { useGetUsernames, normalizeAddress } from "./useGetUsernames";

const truncateAddress = (address: string): string => {
  if (!address || address.length <= 13) return address || "Unknown";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export interface LeaderboardEntry {
  token_id: bigint;
  game_id: bigint;
  level: number;
  score: number;
  stars: number;
  player_name?: string;
  player_address?: string;
}

type UseLeaderboardSlotResult = {
  games: LeaderboardEntry[];
  loading: boolean;
  refetch: () => void;
};

/**
 * Hook for the Endless leaderboard tab.
 * Queries PlayerBestRun entities with run_type=1 (endless),
 * deduplicates per player (best score across all zones),
 * and resolves usernames via Cartridge Controller.
 */
export const useLeaderboardSlot = (): UseLeaderboardSlotResult => {
  const {
    setup: {
      contractComponents: { PlayerBestRun },
    },
  } = useDojo();

  const allEntities = useEntityQuery([Has(PlayerBestRun)]);

  const rawEntries = useMemo(() => {
    const bestByPlayer = new Map<
      string,
      { player: string; score: number; level: number; stars: number; gameId: bigint }
    >();

    for (const entity of allEntities) {
      const data = getComponentValue(PlayerBestRun, entity);
      if (!data) continue;

      // Only endless mode (run_type=1)
      if (data.run_type !== 1) continue;

      // Skip entries with no actual run
      if (!data.best_score && !data.best_level) continue;

      const playerAddr = `0x${BigInt(data.player).toString(16)}`;
      const normalized = normalizeAddress(playerAddr);

      const existing = bestByPlayer.get(normalized);
      if (!existing || data.best_score > existing.score) {
        bestByPlayer.set(normalized, {
          player: playerAddr,
          score: data.best_score,
          level: data.best_level,
          stars: data.best_stars ?? 0,
          gameId: BigInt(data.best_game_id),
        });
      }
    }

    const entries = Array.from(bestByPlayer.values());
    entries.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.level - a.level;
    });

    return entries;
  }, [allEntities, PlayerBestRun]);

  const addresses = useMemo(
    () => rawEntries.map((e) => e.player),
    [rawEntries],
  );

  const { usernames } = useGetUsernames(addresses);

  const games: LeaderboardEntry[] = useMemo(() => {
    return rawEntries.map((entry) => {
      let playerName: string;
      if (usernames) {
        const normalized = normalizeAddress(entry.player);
        const name = usernames.get(normalized);
        playerName = name ?? truncateAddress(entry.player);
      } else {
        playerName = truncateAddress(entry.player);
      }

      return {
        token_id: entry.gameId,
        game_id: entry.gameId,
        level: entry.level,
        score: entry.score,
        stars: entry.stars,
        player_name: playerName,
        player_address: entry.player,
      };
    });
  }, [rawEntries, usernames]);

  return {
    games,
    loading: allEntities.length === 0,
    refetch: () => {},
  };
};
