import { ContractComponents } from "./generated/contractModels";
import { Game } from "./game/models/game";
import { Player } from "./game/models/player";

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
    },
  };
}
