import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has } from "@dojoengine/recs";

export const usePlayerList = () => {
  const {
    setup: {
      clientModels: {
        models: { Player },
        classes: { Player: PlayerClass },
      },
    },
  } = useDojo();
  type PlayerInstance = InstanceType<typeof PlayerClass>;
  const [players, setPlayers] = useState<PlayerInstance[]>([]);

  const playerKeys = useEntityQuery([Has(Player)]);

  useEffect(() => {
    const components = playerKeys.map((entity) => {
      const component = getComponentValue(Player, entity);
      if (!component) {
        return undefined;
      }
      return new PlayerClass(component);
    });

    setPlayers(
      components.map(
        (component) => new PlayerClass(component as ComponentValue),
      ),
    );
  }, [playerKeys]);

  return players;
};
