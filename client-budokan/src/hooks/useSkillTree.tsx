import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useComponentValue } from "@dojoengine/react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import type { Entity } from "@dojoengine/recs";
import { useDojo } from "@/dojo/useDojo";
import { TOTAL_SKILLS, BRANCH_POINT_LEVEL } from "@/dojo/game/constants";

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

  // Unpack skills 1-12 (skip index 0 which is reserved)
  for (let index = 1; index <= TOTAL_SKILLS; index += 1) {
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

  // --- Optimistic overrides ---
  // Map of skillId (1-based) → partial SkillTreeInfo override
  const [optimistic, setOptimistic] = useState<Map<number, Partial<SkillTreeInfo>>>(new Map());
  // Track the last component value to detect when RECS catches up
  const lastComponentRef = useRef(component);

  // When RECS data changes (Torii indexed), clear optimistic overrides
  useEffect(() => {
    if (component && component !== lastComponentRef.current) {
      lastComponentRef.current = component;
      if (optimistic.size > 0) {
        setOptimistic(new Map());
      }
    }
  }, [component, optimistic.size]);

  const skillTree = useMemo((): SkillTreeState | null => {
    if (!component) return null;
    const packed = component.skill_data ? BigInt(component.skill_data) : 0n;
    const base = unpackSkillTree(packed);

    // Apply optimistic overrides on top of chain data
    if (optimistic.size > 0) {
      const merged = base.skills.map((skill, index) => {
        const override = optimistic.get(index + 1);
        return override ? { ...skill, ...override } : skill;
      });
      return { skills: merged };
    }

    return base;
  }, [component, optimistic]);

  // Optimistic mutators — call after successful tx
  const optimisticUpgrade = useCallback((skillId: number) => {
    setOptimistic((prev) => {
      const next = new Map(prev);
      const current = skillTree?.skills[skillId - 1];
      if (current) {
        next.set(skillId, { level: current.level + 1 });
      }
      return next;
    });
  }, [skillTree]);

  const optimisticBranch = useCallback((skillId: number, branchId: number) => {
    setOptimistic((prev) => {
      const next = new Map(prev);
      next.set(skillId, { branchChosen: true, branchId });
      return next;
    });
  }, []);

  const optimisticRespec = useCallback((skillId: number) => {
    setOptimistic((prev) => {
      const next = new Map(prev);
      next.set(skillId, { level: BRANCH_POINT_LEVEL, branchChosen: false, branchId: 0 });
      return next;
    });
  }, []);

  return {
    skillTree,
    isLoading: !component && !!address,
    optimisticUpgrade,
    optimisticBranch,
    optimisticRespec,
  };
};
