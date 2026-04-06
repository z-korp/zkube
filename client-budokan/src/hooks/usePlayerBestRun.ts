import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
import { useDojo } from "@/dojo/useDojo";
import { unpackAllLevelStars } from "@/dojo/game/helpers/levelStarsPacking";

export interface PlayerBestRunData {
  settingsId: number;
  runType: number;
  bestScore: number;
  bestStars: number;
  bestLevel: number;
  zoneCleared: boolean;
  levelStars: number[];
  bestGameId: bigint;
}

export const usePlayerBestRun = (playerAddress: string | undefined) => {
  const {
    setup: {
      contractComponents: { PlayerBestRun },
    },
  } = useDojo();

  const ownerBigInt = useMemo(() => {
    if (!playerAddress) return null;
    try {
      return BigInt(playerAddress);
    } catch {
      return null;
    }
  }, [playerAddress]);

  const entityIds = useEntityQuery([Has(PlayerBestRun)]);

  const bestRuns = useMemo(() => {
    const result = new Map<string, PlayerBestRunData>();
    if (!ownerBigInt) return result;

    for (const entity of entityIds) {
      const bestRun = getComponentValue(PlayerBestRun, entity);
      if (!bestRun || BigInt(bestRun.player) !== ownerBigInt) continue;

      const settingsId = bestRun.settings_id;
      const runType = bestRun.run_type;
      result.set(`${settingsId}-${runType}`, {
        settingsId,
        runType,
        bestScore: bestRun.best_score,
        bestStars: bestRun.best_stars,
        bestLevel: bestRun.best_level,
        zoneCleared: bestRun.zone_cleared,
        levelStars: unpackAllLevelStars(BigInt(bestRun.best_level_stars)),
        bestGameId: BigInt(bestRun.best_game_id),
      });
    }

    return result;
  }, [entityIds, PlayerBestRun, ownerBigInt]);

  return {
    bestRuns,
    isLoading: !ownerBigInt,
  };
};
