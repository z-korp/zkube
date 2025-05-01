import { ContractComponents } from "./contractModels";
import { Game } from "./game/models/game";

export type ClientModels = ReturnType<typeof models>;

export function models({
  contractComponents,
}: {
  contractComponents: ContractComponents;
}) {
  return {
    models: {
      ...contractComponents,
    },
    classes: {
      Game,
    },
  };
}
