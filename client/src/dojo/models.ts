import { ContractComponents } from "./contractModels";
import { Game } from "./game/models/game";
import { Chest } from "./game/models/chest";
import { Player } from "./game/models/player";
import { Credits } from "./game/models/credits";
import { Settings } from "./game/models/settings";
import { Tournament } from "./game/models/tournament";
import { Participation } from "./game/models/participation";

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
      Chest,
      Player,
      Credits,
      Settings,
      Tournament,
      Participation,
    },
  };
}
