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
 * Build a daily leaderboard from DailyEntry models (client-side sort).
 * The on-chain DailyLeaderboard model has been removed; settlement now
 * accepts a caller-provided sorted list verified on-chain.
 */
export function useDailyLeaderboard(challengeId: number | undefined) {
  const {
    setup: {
      contractComponents: { DailyEntry },
    },
  } = useDojo();

  const allEntities = useMemo(() => {
    try {
      return Array.from(runQuery([Has(DailyEntry)]));
    } catch {
      return [];
    }
  }, [DailyEntry]);

  const rawEntries = useMemo(() => {
    if (challengeId === undefined) return [];

    const entries: DailyLeaderboardEntry[] = [];
    for (const entity of allEntities) {
      const data = getComponentValue(DailyEntry, entity);
      if (!data || data.challenge_id !== challengeId) continue;
      if (!data.best_score && !data.best_stars) continue; // no score yet

      // Compute composite ranking value: (stars << 32) | score
      const stars = Number(data.best_stars ?? 0);
      const score = Number(data.best_score ?? 0);
      const value = stars * 0x100000000 + score;

      entries.push({
        rank: 0, // will be assigned after sort
        player: `0x${BigInt(data.player).toString(16)}`,
        value,
      });
    }

    // Sort descending by value (higher is better)
    entries.sort((a, b) => b.value - a.value);

    // Assign ranks
    entries.forEach((entry, i) => {
      entry.rank = i + 1;
    });

    return entries;
  }, [allEntities, challengeId, DailyEntry]);

  const addresses = useMemo(() => {
    return rawEntries.map((e) => e.player);
  }, [rawEntries]);

  const { usernames } = useGetUsernames(addresses);

  const entries = useMemo(() => {
    return rawEntries.map((entry) => {
      if (usernames) {
        const normalized = normalizeAddress(entry.player);
        const name = usernames.get(normalized);
        if (name) return { ...entry, playerName: name };
      }

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
