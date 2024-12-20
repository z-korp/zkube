import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { getComponentValue, Has, HasValue } from "@dojoengine/recs";
import { useGeneralStore } from "@/stores/generalStore";

export const usePlayer = () => {
  const {
    setup: {
      clientModels: {
        models: { Player },
        classes: { Player: PlayerClass },
      },
    },
  } = useDojo();
  const { playerId, playerName } = useGeneralStore();

  type PlayerInstance = InstanceType<typeof PlayerClass>;
  const [player, setPlayer] = useState<PlayerInstance | null>(null);

  const playerKey = useEntityQuery([
    Has(Player),
    HasValue(Player, {
      id: playerId ? playerId : undefined,
    }),
  ]);

  useEffect(() => {
    if (playerKey.length === 0) {
      setPlayer(null);
    } else {
      const component = getComponentValue(Player, playerKey[0]);

      if (component !== undefined && playerName) {
        setPlayer(new PlayerClass(component, playerName));
      }
    }
  }, [Player, PlayerClass, playerKey, playerName]);

  return { player };
};
