import { useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useComponentValue } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import type { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";

export interface SkillTreeInfo {
  level: number;
  branchChosen: boolean;
  branchId: number;
}

export interface SkillTreeState {
  skills: SkillTreeInfo[];
}

const normalizeEntityId = (entityId: string): Entity => {
  if (!entityId.startsWith("0x")) return entityId as Entity;
  const hex = entityId.slice(2).replace(/^0+/, "") || "0";
  return `0x${hex}` as Entity;
};

const unpackSkillTree = (packed: bigint): SkillTreeState => {
  const skills: SkillTreeInfo[] = [];

  for (let index = 0; index < 15; index += 1) {
    const shift = BigInt(index * 6);
    const chunk = (packed >> shift) & 0x3fn;
    skills.push({
      level: Number(chunk & 0xfn),
      branchChosen: ((chunk >> 4n) & 0x1n) === 1n,
      branchId: Number((chunk >> 5n) & 0x1n),
    });
  }

  return { skills };
};

export const useSkillTree = () => {
  const { address } = useAccount();
  const {
    setup: {
      clientModels: {
        models: { PlayerSkillTree },
      },
    },
  } = useDojo();

  const playerKey = useMemo(() => {
    if (!address) return undefined;
    const rawKey = getEntityIdFromKeys([BigInt(address)]);
    return normalizeEntityId(rawKey);
  }, [address]);

  const component = useComponentValue(PlayerSkillTree, playerKey);

  const skillTree = useMemo((): SkillTreeState | null => {
    if (!component) return null;
    const packed = component.skill_data ? BigInt(component.skill_data) : 0n;
    return unpackSkillTree(packed);
  }, [component]);

  return { skillTree, isLoading: !component && !!address };
};
