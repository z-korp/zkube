import { useEffect, useMemo, useState } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import type { Entity } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useDojo } from "@/dojo/useDojo";
import useAccountCustom from "@/hooks/useAccountCustom";
import { normalizeEntityId } from "@/utils/entityId";

const SECONDS_PER_WEEK = 604800;
const MONDAY_OFFSET = 345600;

/**
 * Returns a set of zone IDs (1-10) that have unsettled weekly endless
 * rewards from the previous week, plus whether there's an unsettled daily.
 */
export function useUnsettledRewards() {
  const { account } = useAccountCustom();
  const {
    setup: {
      contractComponents: { DailyChallenge, DailyEntry, WeeklyEndless, PlayerBestRun },
    },
  } = useDojo();

  const allChallenges = useEntityQuery([Has(DailyChallenge)]);
  const allDailyEntries = useEntityQuery([Has(DailyEntry)]);
  const allWeeklyEndless = useEntityQuery([Has(WeeklyEndless)]);
  const allBestRuns = useEntityQuery([Has(PlayerBestRun)]);

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayDayId = Math.floor(now / 86400);
  const normalizedAccount = account?.address?.toLowerCase();

  // Check for unsettled previous daily
  const hasUnsettledDaily = useMemo(() => {
    if (!normalizedAccount) return false;

    // Find most recent ended, unsettled daily (not today's)
    let prevChallenge: any = null;
    for (const entity of allChallenges) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;
      if (data.challenge_id === todayDayId) continue;
      if (data.end_time > now) continue;
      if (data.settled) continue;
      if (!prevChallenge || data.challenge_id > prevChallenge.challenge_id) {
        prevChallenge = data;
      }
    }
    if (!prevChallenge) return false;

    // Check if user participated
    for (const entity of allDailyEntries) {
      const entry = getComponentValue(DailyEntry, entity);
      if (!entry) continue;
      if (entry.challenge_id !== prevChallenge.challenge_id) continue;
      const entryPlayer = `0x${BigInt(entry.player).toString(16)}`.toLowerCase();
      if (entryPlayer === normalizedAccount) return true;
    }
    return false;
  }, [allChallenges, allDailyEntries, DailyChallenge, DailyEntry, normalizedAccount, now, todayDayId]);

  // Check which zones have unsettled weekly endless
  const unsettledWeeklyZones = useMemo(() => {
    const weekId = Math.floor((now - MONDAY_OFFSET) / SECONDS_PER_WEEK);
    const prevWeekId = weekId - 1;
    const zones = new Set<number>();

    // Find which zones the player has endless entries for
    const playerZones = new Set<number>();
    if (normalizedAccount) {
      for (const entity of allBestRuns) {
        const data = getComponentValue(PlayerBestRun, entity);
        if (!data || data.run_type !== 1) continue;
        if (!data.best_score && !data.best_level) continue;
        const playerAddr = `0x${BigInt(data.player).toString(16)}`.toLowerCase();
        if (playerAddr === normalizedAccount) {
          // Derive zone from settings_id: endlessSettingsId = (zone-1)*2+1
          const zoneId = Math.floor(data.settings_id / 2) + 1;
          playerZones.add(zoneId);
        }
      }
    }

    // Check settlement status for each zone the player is in
    for (const zoneId of playerZones) {
      const endlessSettingsId = (zoneId - 1) * 2 + 1;
      const settlementKey = prevWeekId * 1000 + endlessSettingsId;
      const rawKey = getEntityIdFromKeys([BigInt(settlementKey)]);
      const entityKey = normalizeEntityId(rawKey);

      const data = getComponentValue(WeeklyEndless, entityKey as Entity);
      if (!data?.settled) {
        zones.add(zoneId);
      }
    }

    return zones;
  }, [allBestRuns, allWeeklyEndless, PlayerBestRun, WeeklyEndless, normalizedAccount, now]);

  const totalUnsettled = (hasUnsettledDaily ? 1 : 0) + unsettledWeeklyZones.size;

  return {
    hasUnsettledDaily,
    unsettledWeeklyZones,
    totalUnsettled,
  };
}
