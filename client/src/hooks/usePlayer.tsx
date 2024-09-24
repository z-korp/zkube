import { useDojo } from "@/dojo/useDojo";
import { useMemo } from "react";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { useComponentValue } from "@dojoengine/react";
import { Entity } from "@dojoengine/recs";

export const usePlayer = ({ playerId }: { playerId: string | undefined }) => {
  const {
    setup: {
      clientModels: {
        models: { Player },
        classes: { Player: PlayerClass },
      },
    },
  } = useDojo();

  /*const gameEntities: any = useEntityQuery([Has(Player)]);
  const games = useMemo(
    () => gameEntities.map((id: any) => getComponentValue(Player, id)),
    [gameEntities, Player],
  );
  console.log(
    "XXXXXXXXXXXXXX",
    games.map((game: any) => game.id.toString(16)),
  );*/

  //console.log("playerId", playerId);
  const playerKey = useMemo(
    () => getEntityIdFromKeys([BigInt(playerId ? playerId : -1)]) as Entity,
    [playerId],
  );
  //console.log("playerKey", playerKey);
  const component = useComponentValue(Player, playerKey);
  //console.log("component", component);
  const player = useMemo(() => {
    return component ? new PlayerClass(component) : null;
  }, [component]);

  if (!playerId) return { player: null, playerKey: null };

  return { player, playerKey };
};
