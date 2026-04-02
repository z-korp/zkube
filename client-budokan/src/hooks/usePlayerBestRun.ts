import { useMemo } from "react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { unpackAllLevelStars } from "@/dojo/game/helpers/levelStarsPacking";

export interface PlayerBestRunData {
  settingsId: number;
  mode: number;
  bestScore: number;
  bestStars: number;
  bestLevel: number;
  mapCleared: boolean;
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

  const bestRuns = useMemo(() => {
    const result = new Map<string, PlayerBestRunData>();
    if (!ownerBigInt) return result;

    const entities = Array.from(runQuery([Has(PlayerBestRun)]));
    for (const entity of entities) {
      const bestRun = getComponentValue(PlayerBestRun, entity);
      if (!bestRun || BigInt(bestRun.player) !== ownerBigInt) continue;

      const settingsId = bestRun.settings_id;
      const mode = bestRun.mode;
      result.set(`${settingsId}-${mode}`, {
        settingsId,
        mode,
        bestScore: bestRun.best_score,
        bestStars: bestRun.best_stars,
        bestLevel: bestRun.best_level,
        mapCleared: bestRun.map_cleared,
        levelStars: unpackAllLevelStars(BigInt(bestRun.best_level_stars)),
        bestGameId: BigInt(bestRun.best_game_id),
      });
    }

    return result;
  }, [PlayerBestRun, ownerBigInt]);

  return {
    bestRuns,
    isLoading: !ownerBigInt,
  };
};
