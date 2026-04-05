import { useMemo } from "react";
import { Has, getComponentValue } from "@dojoengine/recs";
import { useEntityQuery } from "@dojoengine/react";
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
      contractComponents: { GameSettingsMetadata, StoryProgress, MapEntitlement },
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

  const metadataEntityIds = useEntityQuery([Has(GameSettingsMetadata)]);
  const storyProgressEntityIds = useEntityQuery([Has(StoryProgress)]);
  const entitlementEntityIds = useEntityQuery([Has(MapEntitlement)]);

  return useMemo(() => {
    const fallbackZones = [
      { settingsId: 0, zoneId: 1, themeId: 1, isFree: true, enabled: true, starCost: 0n, price: 0n },
      { settingsId: 2, zoneId: 2, themeId: 2, isFree: false, enabled: true, starCost: 50n, price: 5000000n },
    ];

    const metadataMap = new Map<
      number,
      { starCost: bigint; price: bigint; isFree: boolean; themeId: number; enabled: boolean }
    >();

    for (const entity of metadataEntityIds) {
      const metadata = getComponentValue(GameSettingsMetadata, entity);
      if (!metadata) continue;
      metadataMap.set(metadata.settings_id, {
        starCost: BigInt(metadata.star_cost ?? 0),
        price: BigInt(metadata.price ?? 0),
        isFree: metadata.is_free,
        themeId: metadata.theme_id,
        enabled: metadata.enabled,
      });
    }

    for (const zone of fallbackZones) {
      if (!metadataMap.has(zone.settingsId)) {
        metadataMap.set(zone.settingsId, {
          starCost: zone.starCost,
          price: zone.price,
          isFree: zone.isFree,
          themeId: zone.themeId,
          enabled: zone.enabled,
        });
      }
    }

    const storyMap = new Map<
      number,
      {
        stars: number;
        cleared: boolean;
        bossCleared: boolean;
        levelStars: number[];
        highestCleared: number;
      }
    >();
    for (const entity of storyProgressEntityIds) {
      const progress = getComponentValue(StoryProgress, entity);
      if (!progress || ownerBigInt === null || BigInt(progress.player) !== ownerBigInt) continue;
      const levelStars = unpackAllLevelStars(BigInt(progress.level_stars ?? 0));
      storyMap.set(progress.zone_id, {
        stars: levelStars.reduce((sum, stars) => sum + stars, 0),
        cleared: progress.boss_cleared,
        bossCleared: progress.boss_cleared,
        levelStars,
        highestCleared: progress.highest_cleared,
      });
    }

    const entitlements = new Set<number>();
    for (const entity of entitlementEntityIds) {
      const entitlement = getComponentValue(MapEntitlement, entity);
      if (!entitlement || ownerBigInt === null || BigInt(entitlement.player) !== ownerBigInt) continue;
      entitlements.add(entitlement.settings_id);
    }

    const zonesToShow = Array.from(metadataMap.entries())
      .filter(([_, metadata]) => metadata.enabled)
      .sort(([a], [b]) => a - b)
      .filter(([settingsId, metadata]) => settingsId % 2 === 0 && metadata.themeId <= 2)
      .map(([settingsId, metadata]) => {
        const story = storyMap.get(metadata.themeId);
        return {
          zoneId: metadata.themeId,
          settingsId,
          name: ZONE_NAMES[metadata.themeId] ?? `Zone ${metadata.themeId}`,
          emoji: ZONE_EMOJIS[metadata.themeId] ?? "🗺️",
          stars: story?.stars ?? 0,
          maxStars: 30,
          unlocked: metadata.isFree || (ownerBigInt !== null && entitlements.has(settingsId)),
          cleared: story?.bossCleared ?? false,
          isFree: metadata.isFree,
          starCost: Number(metadata.starCost),
          price: metadata.price,
          currentStars: zStarBalance,
          levelStars: story?.levelStars ?? [],
          highestCleared: story?.highestCleared ?? 0,
          bossCleared: story?.bossCleared ?? false,
        };
      });

    const totalStars = zonesToShow.reduce((sum, zone) => sum + zone.stars, 0);
    return { zones: zonesToShow, totalStars, isLoading: false };
  }, [ownerBigInt, zStarBalance, metadataEntityIds, storyProgressEntityIds, entitlementEntityIds, GameSettingsMetadata, StoryProgress, MapEntitlement]);
};
