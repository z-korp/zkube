import { useMemo } from "react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { useGetUsernames, normalizeAddress } from "./useGetUsernames";

export interface DailyLeaderboardEntry {
  rank: number;
  player: string;
  value: number;
  playerName?: string;
}

/**
 * Hook to get the leaderboard for a specific daily challenge
 * Queries all DailyLeaderboard entities and filters by challenge_id
 */
export function useDailyLeaderboard(challengeId: number | undefined) {
  const {
    setup: {
      contractComponents: { DailyLeaderboard },
    },
  } = useDojo();

  const allEntities = useMemo(() => {
    try {
      return Array.from(runQuery([Has(DailyLeaderboard)]));
    } catch {
      return [];
    }
  }, [DailyLeaderboard]);

  const rawEntries = useMemo(() => {
    if (challengeId === undefined) return [];

    const entries: DailyLeaderboardEntry[] = [];
    for (const entity of allEntities) {
      const data = getComponentValue(DailyLeaderboard, entity);
      if (!data || data.challenge_id !== challengeId) continue;
      entries.push({
        rank: data.rank,
        player: `0x${BigInt(data.player).toString(16)}`,
        value: data.value,
      });
    }

    return entries.sort((a, b) => a.rank - b.rank);
  }, [allEntities, challengeId, DailyLeaderboard]);

  // Collect addresses for username lookup
  const addresses = useMemo(() => {
    return rawEntries.map((e) => e.player);
  }, [rawEntries]);

  const { usernames } = useGetUsernames(addresses);

  // Merge usernames
  const entries = useMemo(() => {
    return rawEntries.map((entry) => {
      if (usernames) {
        const normalized = normalizeAddress(entry.player);
        const name = usernames.get(normalized);
        if (name) return { ...entry, playerName: name };
      }
      // Fallback: truncate address
      const addr = entry.player;
      const truncated =
        addr.length > 13
          ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
          : addr;
      return { ...entry, playerName: truncated };
    });
  }, [rawEntries, usernames]);

  return {
    entries,
    isLoading: allEntities.length === 0 && challengeId !== undefined,
  };
}

export default useDailyLeaderboard;
