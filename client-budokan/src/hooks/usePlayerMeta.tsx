import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import type { Entity } from "@dojoengine/recs";
import { useAccount } from "@starknet-react/core";

// Normalize entity ID to match Torii's format (no leading zeros after 0x)
const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

// Bit positions for MetaData unpacking (matching Cairo)
const META_DATA_POSITIONS = {
  STARTING_HAMMER: 0,      // 2 bits
  STARTING_WAVE: 2,        // 2 bits
  STARTING_TOTEM: 4,       // 2 bits
  BAG_HAMMER_LEVEL: 6,     // 4 bits
  BAG_WAVE_LEVEL: 10,      // 4 bits
  BAG_TOTEM_LEVEL: 14,     // 4 bits
  BRIDGING_RANK: 18,       // 4 bits
  TOTAL_RUNS: 22,          // 16 bits
  TOTAL_CUBES_EARNED: 38,  // 32 bits
};

export interface PlayerMetaData {
  startingHammer: number;
  startingWave: number;
  startingTotem: number;
  bagHammerLevel: number;
  bagWaveLevel: number;
  bagTotemLevel: number;
  bridgingRank: number;
  totalRuns: number;
  totalCubesEarned: number;
}

export interface PlayerMeta {
  player: string;
  data: PlayerMetaData;
  bestLevel: number;
  // Note: cubeBalance is now tracked via ERC1155 CubeToken - use useCubeBalance hook
}

function unpackMetaData(packed: bigint): PlayerMetaData {
  return {
    startingHammer: Number((packed >> BigInt(META_DATA_POSITIONS.STARTING_HAMMER)) & BigInt(0x3)),
    startingWave: Number((packed >> BigInt(META_DATA_POSITIONS.STARTING_WAVE)) & BigInt(0x3)),
    startingTotem: Number((packed >> BigInt(META_DATA_POSITIONS.STARTING_TOTEM)) & BigInt(0x3)),
    bagHammerLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_HAMMER_LEVEL)) & BigInt(0xF)),
    bagWaveLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_WAVE_LEVEL)) & BigInt(0xF)),
    bagTotemLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_TOTEM_LEVEL)) & BigInt(0xF)),
    bridgingRank: Number((packed >> BigInt(META_DATA_POSITIONS.BRIDGING_RANK)) & BigInt(0xF)),
    totalRuns: Number((packed >> BigInt(META_DATA_POSITIONS.TOTAL_RUNS)) & BigInt(0xFFFF)),
    totalCubesEarned: Number((packed >> BigInt(META_DATA_POSITIONS.TOTAL_CUBES_EARNED)) & BigInt(0xFFFFFFFF)),
  };
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
    
    const packedData = component.data ? BigInt(component.data) : BigInt(0);
    
    return {
      player: address || "",
      data: unpackMetaData(packedData),
      bestLevel: component.best_level || 0,
      // Note: cubeBalance removed - use useCubeBalance hook for ERC1155 balance
    };
  }, [component, address]);

  return { playerMeta, isLoading: !component && !!address };
};
