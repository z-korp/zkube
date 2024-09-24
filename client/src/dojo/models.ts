import { ContractComponents } from "./contractModels";
import { Game } from "./game/models/game";
import { Player } from "./game/models/player";
import { Credits } from "./game/models/credits";

export type ClientModels = ReturnType<typeof models>;

export function models({
  contractModels,
}: {
  contractModels: ContractComponents;
}) {
  return {
    models: {
      ...contractModels,
    },
    classes: {
      Game,
      Player,
      Credits,
    },
  };
}
