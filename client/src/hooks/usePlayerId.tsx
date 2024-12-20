import { useDojo } from "@/dojo/useDojo";
import { useEffect } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has, HasValue } from "@dojoengine/recs";
import { useGeneralStore } from "@/stores/generalStore";
import { shortString } from "starknet";

export const usePlayerId = ({
  playerAddress,
}: {
  playerAddress: string | undefined;
}) => {
  const {
    setup: {
      clientModels: {
        models: { PlayerInfo },
      },
    },
  } = useDojo();
  const { setPlayerId, setPlayerName } = useGeneralStore();

  const playerKey = useEntityQuery([
    Has(PlayerInfo),
    HasValue(PlayerInfo, {
      address: playerAddress ? BigInt(playerAddress) : undefined,
    }),
  ]);

  useEffect(() => {
    if (playerKey.length === 0) {
      setPlayerId(undefined);
      setPlayerName(undefined);
    } else {
      const component = getComponentValue(PlayerInfo, playerKey[0]);

      if (component !== undefined) {
        setPlayerId(component.player_id);
        setPlayerName(shortString.decodeShortString(component.name.toString()));
      }
    }
  }, [PlayerInfo, playerKey, setPlayerId, setPlayerName]);

  return;
};
