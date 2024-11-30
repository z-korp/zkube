import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const useFreeMint = ({
  player_id,
}: {
  player_id: string | undefined;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Mint },
        classes: { Mint: MintClass },
      },
    },
  } = useDojo();

  const key = useMemo(
    () => getEntityIdFromKeys([BigInt(player_id ? player_id : -1)]) as Entity,
    [player_id],
  );

  const component = useComponentValue(Mint, key);
  const mint = useDeepMemo(() => {
    return component ? new MintClass(component) : null;
  }, [component]);

  return MintClass.fromId(player_id); // mint;
};
