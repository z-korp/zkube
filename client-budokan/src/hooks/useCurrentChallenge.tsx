import { useMemo } from "react";
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

  const challenge = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let best: any = null;
    let highestId = 0;
    let latestChallenge: any = null;

    for (const entity of allEntities) {
      const data = getComponentValue(DailyChallenge, entity);
      if (!data) continue;

      if (data.challenge_id > highestId) {
        highestId = data.challenge_id;
        latestChallenge = data;
      }

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
