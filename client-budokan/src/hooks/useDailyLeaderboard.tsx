import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";
import { useGetUsernames, normalizeAddress } from "./useGetUsernames";

export interface DailyLeaderboardEntry {
  rank: number;
  player: string;
  /** BigInt composite for settlement ordering: (stars << 48) | (MAX_48 - time) */
  sortKey: bigint;
  totalStars: number;
  highestCleared: number;
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

  const allEntities = useEntityQuery([Has(DailyEntry)]);

  const rawEntries = useMemo(() => {
    if (challengeId === undefined) return [];

    const MAX_48 = (1n << 48n) - 1n;
    const entries: DailyLeaderboardEntry[] = [];
    for (const entity of allEntities) {
      const data = getComponentValue(DailyEntry, entity);
      if (!data || data.challenge_id !== challengeId) continue;
      if (!data.total_stars && !data.highest_cleared) continue; // no progress yet

      const stars = Number(data.total_stars ?? 0);
      const cleared = Number(data.highest_cleared ?? 0);
      const lastStarTime = BigInt(data.last_star_time ?? 0);

      // Match contract ranking: (total_stars << 48) | (MAX_48 - (last_star_time & MAX_48))
      // Higher = better (more stars, earlier time)
      const sortKey = (BigInt(stars) << 48n) | (MAX_48 - (lastStarTime & MAX_48));

      entries.push({
        rank: 0,
        player: `0x${BigInt(data.player).toString(16)}`,
        sortKey,
        totalStars: stars,
        highestCleared: cleared,
      });
    }

    // Sort descending by sortKey (higher is better)
    entries.sort((a, b) => (b.sortKey > a.sortKey ? 1 : b.sortKey < a.sortKey ? -1 : 0));

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
