import { useMemo } from "react";
import { Has, getComponentValue, runQuery } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { unpackAllLevelStars } from "@/dojo/game/helpers/levelStarsPacking";
import { ZONE_EMOJIS, ZONE_NAMES, type ZoneProgressData } from "@/config/profileData";

type ZoneProgressResult = {
  zones: ZoneProgressData[];
  totalStars: number;
  isLoading: boolean;
};

export const useZoneProgress = (
  playerAddress: string | undefined,
  zStarBalance: number,
): ZoneProgressResult => {
  const {
    setup: {
      contractComponents: { GameSettings, GameSettingsMetadata, PlayerBestRun, MapEntitlement },
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

  return useMemo(() => {
    const gameSettingsEntities = Array.from(runQuery([Has(GameSettings)]));
    const mapModeSettings = new Set<number>();
    for (const entity of gameSettingsEntities) {
      const gameSetting = getComponentValue(GameSettings, entity);
      if (!gameSetting || gameSetting.mode !== 0) continue;
      mapModeSettings.add(gameSetting.settings_id);
    }

    const metadataEntities = Array.from(runQuery([Has(GameSettingsMetadata)]));
    const metadataMap = new Map<
      number,
      { starCost: bigint; price: bigint; isFree: boolean; themeId: number; enabled: boolean }
    >();

    for (const entity of metadataEntities) {
      const metadata = getComponentValue(GameSettingsMetadata, entity);
      if (!metadata) continue;
      metadataMap.set(metadata.settings_id, {
        starCost: BigInt(metadata.star_cost),
        price: BigInt(metadata.price),
        isFree: metadata.is_free,
        themeId: metadata.theme_id,
        enabled: metadata.enabled,
      });
    }

    const bestRunEntities = Array.from(runQuery([Has(PlayerBestRun)]));
    const bestRunMap = new Map<
      number,
      { bestStars: number; mapCleared: boolean; levelStars: number[] }
    >();

    for (const entity of bestRunEntities) {
      const bestRun = getComponentValue(PlayerBestRun, entity);
      if (!bestRun || ownerBigInt === null || BigInt(bestRun.player) !== ownerBigInt || bestRun.mode !== 0) continue;

      bestRunMap.set(bestRun.settings_id, {
        bestStars: bestRun.best_stars,
        mapCleared: bestRun.map_cleared,
        levelStars: unpackAllLevelStars(BigInt(bestRun.best_level_stars)),
      });
    }

    const entitlementEntities = Array.from(runQuery([Has(MapEntitlement)]));
    const entitlements = new Set<number>();
    for (const entity of entitlementEntities) {
      const entitlement = getComponentValue(MapEntitlement, entity);
      if (!entitlement || ownerBigInt === null || BigInt(entitlement.player) !== ownerBigInt) continue;
      entitlements.add(entitlement.settings_id);
    }

    const zones: ZoneProgressData[] = Array.from(metadataMap.entries())
      .filter(([settingsId, metadata]) => metadata.enabled && (mapModeSettings.size === 0 || mapModeSettings.has(settingsId)))
      .sort(([a], [b]) => a - b)
      .map(([settingsId, metadata]) => {
        const bestRun = bestRunMap.get(settingsId);
        return {
          zoneId: metadata.themeId,
          settingsId,
          name: ZONE_NAMES[metadata.themeId] ?? `Zone ${metadata.themeId}`,
          emoji: ZONE_EMOJIS[metadata.themeId] ?? "🗺️",
          stars: bestRun?.bestStars ?? 0,
          maxStars: 30,
          unlocked: metadata.isFree || (ownerBigInt !== null && entitlements.has(settingsId)),
          cleared: bestRun?.mapCleared ?? false,
          isFree: metadata.isFree,
          starCost: Number(metadata.starCost),
          price: metadata.price,
          currentStars: zStarBalance,
          levelStars: bestRun?.levelStars,
        };
      });

    const totalStars = zones.reduce((sum, zone) => sum + zone.stars, 0);
    return { zones, totalStars, isLoading: false };
  }, [ownerBigInt, zStarBalance, GameSettings, GameSettingsMetadata, PlayerBestRun, MapEntitlement]);
};
