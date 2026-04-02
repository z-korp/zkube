import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { useAccount } from "@starknet-react/core";
import { unpackMetaData } from "@/dojo/game/helpers/metaDataPacking";

// Normalize entity ID to match Torii's format (no leading zeros after 0x)
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

export interface PlayerMeta {
  player: string;
  bestLevel: number;
  totalRuns: number;
  dailyStars: number;
  lifetimeXp: number;
}

export const usePlayerMeta = () => {
  const { address } = useAccount();
  const {
    setup: {
      clientModels: {
        models: { PlayerMeta },
      },
    },
  } = useDojo();

  const playerKey = useMemo(() => {
    if (!address) return undefined;
    const rawKey = getEntityIdFromKeys([BigInt(address)]);
    return normalizeEntityId(rawKey);
  }, [address]);

  const component = useComponentValue(PlayerMeta, playerKey);

  const playerMeta = useMemo((): PlayerMeta | null => {
    if (!component) return null;
    const unpackedMeta = unpackMetaData(BigInt(component.data));

    return {
      player: address || "",
      bestLevel: component.best_level || 0,
      totalRuns: unpackedMeta.totalRuns,
      dailyStars: unpackedMeta.dailyStars,
      lifetimeXp: unpackedMeta.lifetimeXp,
    };
  }, [component, address]);

  return { playerMeta, isLoading: !component && !!address };
};
