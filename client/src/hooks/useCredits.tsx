import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";
import useDeepMemo from "./useDeepMemo";

export const useCredits = ({ playerId }: { playerId: string | undefined }) => {
  const {
    setup: {
      clientModels: {
        models: { Credits },
        classes: { Credits: CreditsClass },
      },
    },
  } = useDojo();

  const creditsKey = useMemo(() => {
    //console.log("[useCredits] playerId", playerId);
    return getEntityIdFromKeys([BigInt(playerId || 0)]) as Entity;
  }, [playerId]);
  //console.log("[useCredits] creditsKey", creditsKey);
  const component = useComponentValue(Credits, creditsKey);
  //console.log("[useCredits] component", component);
  const credits = useDeepMemo(() => {
    return component ? new CreditsClass(component) : null;
  }, [component]);
  //console.log("[useCredits] credits", credits);

  return { credits, creditsKey };
};
