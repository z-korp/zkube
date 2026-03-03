import { useMemo } from "react";
import { Has, runQuery, getComponentValue } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";

/**
 * Hook to get the current active daily challenge
 * Scans all DailyChallenge entities and finds the one that is:
 * - Not settled
 * - Current time is between start_time and end_time
 * Falls back to the highest challenge_id if none is currently active
 */
export function useCurrentChallenge() {
  const {
    setup: {
      contractComponents: { DailyChallenge },
    },
  } = useDojo();

  // Query all DailyChallenge entities
  const allEntities = useMemo(() => {
    try {
      return Array.from(runQuery([Has(DailyChallenge)]));
    } catch {
      return [];
    }
  }, [DailyChallenge]);

  const challenge = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let best: ReturnType<typeof getComponentValue<typeof DailyChallenge>> | null = null;
    let highestId = 0;
    let latestChallenge: ReturnType<typeof getComponentValue<typeof DailyChallenge>> | null = null;

    for (const entity of allEntities) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;

      // Track highest ID for fallback
      if (data.challenge_id > highestId) {
        highestId = data.challenge_id;
        latestChallenge = data;
      }

      // Check if currently active (not settled, within time window)
      if (!data.settled && data.start_time <= now && data.end_time > now) {
        if (!best || data.challenge_id > best.challenge_id) {
          best = data;
        }
      }
    }

    return best ?? latestChallenge;
  }, [allEntities, DailyChallenge]);

  return {
    challenge,
    isLoading: allEntities.length === 0,
    challengeCount: allEntities.length,
  };
}

export default useCurrentChallenge;
