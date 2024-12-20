import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has } from "@dojoengine/recs";
import { shortString } from "starknet";

export const usePlayerInfoList = () => {
  const {
    setup: {
      clientModels: {
        models: { PlayerInfo },
      },
    },
  } = useDojo();
  const [playerInfos, setPlayerInfos] = useState<
    { id: number; address: string; name: string }[]
  >([]);

  const playerKeys = useEntityQuery([Has(PlayerInfo)]);

  useEffect(() => {
    setPlayerInfos(
      playerKeys
        .map((entity) => {
          const component = getComponentValue(PlayerInfo, entity);
          if (!component) {
            return undefined;
          }
          return {
            id: component.player_id,
            address: "0x" + component.address.toString(16),
            name: shortString.decodeShortString(component.name.toString()),
          };
        })
        .filter((e) => e !== undefined),
    );
  }, [PlayerInfo, playerKeys]);

  return playerInfos;
};
