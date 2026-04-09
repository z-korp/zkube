import { useEffect, useMemo, useState } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";

export function useCurrentChallenge() {
  const {
    setup: {
      contractComponents: { DailyChallenge },
    },
  } = useDojo();

  const allEntities = useEntityQuery([Has(DailyChallenge)]);

  // With auto-creation, zero entities is a valid state (no one has played today yet).
  // Wait briefly for Torii sync, then treat empty as "no challenge".
  const [syncGracePeriod, setSyncGracePeriod] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setSyncGracePeriod(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Recompute `now` every 60s so the hook picks up day transitions
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayDayId = Math.floor(now / 86400);

  const challenge = useMemo(() => {
    let active: any = null;
    let todayChallenge: any = null;

    for (const entity of allEntities) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;

      // Prefer an active (non-settled, time-valid) challenge
      if (!data.settled && data.start_time <= now && data.end_time > now) {
        if (!active || data.challenge_id > active.challenge_id) {
          active = data;
        }
      }

      // Also track today's challenge by day_id match
      if (data.challenge_id === todayDayId) {
        todayChallenge = data;
      }
    }

    // Return active challenge, or today's if it exists, or null (not yesterday's)
    return active ?? todayChallenge ?? null;
  }, [allEntities, DailyChallenge, now, todayDayId]);

  return {
    challenge,
    isLoading: allEntities.length === 0 && syncGracePeriod,
    challengeCount: allEntities.length,
  };
}

export default useCurrentChallenge;
