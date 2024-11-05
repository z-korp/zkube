import { ContractComponents } from "./contractModels";
import { Mint } from "./game/models/mint";
import { Game } from "./game/models/game";
import { Chest } from "./game/models/chest";
import { Player } from "./game/models/player";
import { Settings } from "./game/models/settings";
import { Tournament } from "./game/models/tournament";
import { Participation } from "./game/models/participation";

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
      Mint,
      Game,
      Chest,
      Player,
      Settings,
      Tournament,
      Participation,
    },
  };
}
