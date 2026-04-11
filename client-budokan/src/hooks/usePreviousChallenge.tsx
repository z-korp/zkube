import { useEffect, useMemo, useState } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";

/**
 * Find the most recent ENDED daily challenge (not today's).
 * Used to show a claim/settle panel for yesterday's (or older) daily.
 */
export function usePreviousChallenge() {
  const {
    setup: {
      contractComponents: { DailyChallenge },
    },
  } = useDojo();

  const allEntities = useEntityQuery([Has(DailyChallenge)]);

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const todayDayId = Math.floor(now / 86400);

  const challenge = useMemo(() => {
    let best: any = null;

    for (const entity of allEntities) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;

      // Skip today's challenge
      if (data.challenge_id === todayDayId) continue;

      // Must have ended
      if (data.end_time > now) continue;

      // Pick the most recent one (highest challenge_id)
      if (!best || data.challenge_id > best.challenge_id) {
        best = data;
      }
    }

    return best ?? null;
  }, [allEntities, DailyChallenge, now, todayDayId]);

  return { challenge };
}

export default usePreviousChallenge;
