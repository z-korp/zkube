import { useDojo } from "@/dojo/useDojo";
import { useEffect, useMemo, useRef } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { useAccount } from "@starknet-react/core";
import { normalizeEntityId } from "@/utils/entityId";
import { normalizeAddress } from "@/utils/address";
import { getSyncEntities } from "@dojoengine/state";
import { KeysClause } from "@dojoengine/sdk";

// Bit positions for MetaData unpacking (matching Cairo)
const META_DATA_POSITIONS = {
  STARTING_HAMMER: 0,       // 2 bits
  STARTING_WAVE: 2,         // 2 bits
  STARTING_TOTEM: 4,        // 2 bits
  STARTING_SHRINK: 6,       // 2 bits
  STARTING_SHUFFLE: 8,      // 2 bits
  BAG_HAMMER_LEVEL: 10,     // 4 bits
  BAG_WAVE_LEVEL: 14,       // 4 bits
  BAG_TOTEM_LEVEL: 18,      // 4 bits
  BAG_SHRINK_LEVEL: 22,     // 4 bits
  BAG_SHUFFLE_LEVEL: 26,    // 4 bits
  BRIDGING_RANK: 30,        // 4 bits
  SHRINK_UNLOCKED: 34,      // 1 bit
  SHUFFLE_UNLOCKED: 35,     // 1 bit
  TOTAL_RUNS: 36,           // 16 bits
  TOTAL_CUBES_EARNED: 52,   // 32 bits
};

export interface PlayerMetaData {
  startingHammer: number;
  startingWave: number;
  startingTotem: number;
  startingShrink: number;
  startingShuffle: number;
  bagHammerLevel: number;
  bagWaveLevel: number;
  bagTotemLevel: number;
  bagShrinkLevel: number;
  bagShuffleLevel: number;
  bridgingRank: number;
  shrinkUnlocked: boolean;
  shuffleUnlocked: boolean;
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
    startingShrink: Number((packed >> BigInt(META_DATA_POSITIONS.STARTING_SHRINK)) & BigInt(0x3)),
    startingShuffle: Number((packed >> BigInt(META_DATA_POSITIONS.STARTING_SHUFFLE)) & BigInt(0x3)),
    bagHammerLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_HAMMER_LEVEL)) & BigInt(0xF)),
    bagWaveLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_WAVE_LEVEL)) & BigInt(0xF)),
    bagTotemLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_TOTEM_LEVEL)) & BigInt(0xF)),
    bagShrinkLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_SHRINK_LEVEL)) & BigInt(0xF)),
    bagShuffleLevel: Number((packed >> BigInt(META_DATA_POSITIONS.BAG_SHUFFLE_LEVEL)) & BigInt(0xF)),
    bridgingRank: Number((packed >> BigInt(META_DATA_POSITIONS.BRIDGING_RANK)) & BigInt(0xF)),
    shrinkUnlocked: ((packed >> BigInt(META_DATA_POSITIONS.SHRINK_UNLOCKED)) & BigInt(0x1)) === BigInt(1),
    shuffleUnlocked: ((packed >> BigInt(META_DATA_POSITIONS.SHUFFLE_UNLOCKED)) & BigInt(0x1)) === BigInt(1),
    totalRuns: Number((packed >> BigInt(META_DATA_POSITIONS.TOTAL_RUNS)) & BigInt(0xFFFF)),
    totalCubesEarned: Number((packed >> BigInt(META_DATA_POSITIONS.TOTAL_CUBES_EARNED)) & BigInt(0xFFFFFFFF)),
  };
}

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;
const playerMetaNamespace = VITE_PUBLIC_NAMESPACE || "zkube_budo_v1_2_0";
const playerMetaModel = `${playerMetaNamespace}-PlayerMeta`;

export const usePlayerMeta = () => {
  const { address } = useAccount();
  const {
    setup: {
      toriiClient,
      contractComponents,
      clientModels: {
        models: { PlayerMeta },
      },
    },
  } = useDojo();

  const syncRef = useRef<{ cancel: () => void } | null>(null);

  useEffect(() => {
    if (!address || !toriiClient) return;

    const normalizedAddr = normalizeAddress(address);

    getSyncEntities(
      toriiClient,
      contractComponents as any,
      KeysClause(
        [playerMetaModel],
        [normalizedAddr],
        "FixedLen",
      ).build(),
      [],
      [playerMetaModel],
      10000,
      true,
    ).then((sub) => {
      syncRef.current = sub;
    });

    return () => {
      syncRef.current?.cancel();
      syncRef.current = null;
    };
  }, [address, toriiClient, contractComponents]);

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
