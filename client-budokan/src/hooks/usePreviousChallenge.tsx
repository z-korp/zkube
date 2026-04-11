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

    console.log("[usePreviousChallenge] entities:", allEntities.length, "todayDayId:", todayDayId, "now:", now);

    for (const entity of allEntities) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;

      console.log("[usePreviousChallenge] challenge:", {
        challenge_id: data.challenge_id,
        challenge_id_type: typeof data.challenge_id,
        start_time: data.start_time,
        end_time: data.end_time,
        settled: data.settled,
        skipToday: data.challenge_id === todayDayId,
        skipNotEnded: data.end_time > now,
        todayDayId,
        todayDayId_type: typeof todayDayId,
      });

      // Skip today's challenge
      if (data.challenge_id === todayDayId) continue;

      // Must have ended
      if (data.end_time > now) continue;

      // Pick the most recent one (highest challenge_id)
      if (!best || data.challenge_id > best.challenge_id) {
        best = data;
      }
    }

    console.log("[usePreviousChallenge] result:", best ? { id: best.challenge_id, settled: best.settled } : null);
    return best ?? null;
  }, [allEntities, DailyChallenge, now, todayDayId]);

  return { challenge };
}

export default usePreviousChallenge;
