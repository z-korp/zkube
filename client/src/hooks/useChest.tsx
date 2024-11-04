import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const useChest = ({ id }: { id: number }) => {
  const {
    setup: {
      clientModels: {
        models: { Chest },
        classes: { Chest: ChestClass },
      },
    },
  } = useDojo();

  const key = useMemo(() => getEntityIdFromKeys([BigInt(id)]) as Entity, [id]);

  const component = useComponentValue(Chest, key);
  const chest = useDeepMemo(() => {
    return component ? new ChestClass(component) : null;
  }, [component]);

  return { chest, key };
};
