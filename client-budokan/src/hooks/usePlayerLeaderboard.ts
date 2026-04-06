import { useMemo } from "react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { useGetUsernames, normalizeAddress } from "./useGetUsernames";
import { unpackMetaData } from "@/dojo/game/helpers/metaDataPacking";

export interface PlayerLeaderboardEntry {
  rank: number;
  player: string;
  playerName?: string;
  lifetimeXp: number;
  totalRuns: number;
}

export function usePlayerLeaderboard() {
  const {
    setup: {
      contractComponents: { PlayerMeta },
    },
  } = useDojo();

  const allEntities = useMemo(() => {
    try {
      return Array.from(runQuery([Has(PlayerMeta)]));
    } catch {
      return [];
    }
  }, [PlayerMeta]);

  const rawEntries = useMemo(() => {
    const entries: Omit<PlayerLeaderboardEntry, "rank" | "playerName">[] = [];

    for (const entity of allEntities) {
      const data = getComponentValue(PlayerMeta, entity);
      if (!data) continue;

      const playerAddr = `0x${BigInt(data.player).toString(16)}`;
      const meta = unpackMetaData(BigInt(data.data));

      entries.push({
        player: playerAddr,
        lifetimeXp: meta.lifetimeXp,
        totalRuns: meta.totalRuns,
      });
    }

    return entries.sort((a, b) => b.lifetimeXp - a.lifetimeXp);
  }, [allEntities, PlayerMeta]);

  const addresses = useMemo(() => {
    return rawEntries.map((e) => e.player);
  }, [rawEntries]);

  const { usernames } = useGetUsernames(addresses);

  const entries: PlayerLeaderboardEntry[] = useMemo(() => {
    return rawEntries.map((entry, index) => {
      let playerName: string;
      if (usernames) {
        const normalized = normalizeAddress(entry.player);
        const name = usernames.get(normalized);
        playerName = name ?? (
          entry.player.length > 13
            ? `${entry.player.slice(0, 6)}...${entry.player.slice(-4)}`
            : entry.player
        );
      } else {
        playerName = entry.player.length > 13
          ? `${entry.player.slice(0, 6)}...${entry.player.slice(-4)}`
          : entry.player;
      }

      return {
        ...entry,
        rank: index + 1,
        playerName,
      };
    });
  }, [rawEntries, usernames]);

  return {
    entries,
    isLoading: allEntities.length === 0,
  };
}

export default usePlayerLeaderboard;
