import { defineComponent, Type as RecsType } from "@dojoengine/recs";
import type { World } from "@dojoengine/recs";

export type ContractComponents = Awaited<
  ReturnType<typeof defineContractComponents>
>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

export function defineContractComponents(world: World) {
  return {
    Game: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.Number,
          blocks: RecsType.BigInt,
          next_row: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          run_data: RecsType.BigInt,
          started_at: RecsType.Number,
          over: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Game",
            types: [
              "u64",
              "felt252",
              "u32",
              "u8",
              "u8",
              "felt252",
              "u64",
              "bool",
            ],
            customTypes: [],
          },
        }
      );
    })(),
    GameSettingsMetadata: (() => {
      return defineComponent(
        world,
        {
          settings_id: RecsType.Number,
          name: RecsType.String,
          description: RecsType.String,
          created_by: RecsType.String,
          created_at: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSettingsMetadata",
            types: ["u32", "felt252", "ByteArray", "ContractAddress", "u64"],
          },
        }
      );
    })(),
    GameSettings: (() => {
      return defineComponent(
        world,
        {
          settings_id: RecsType.Number,
          difficulty: RecsType.String,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSettings",
            types: ["u32", "Difficulty"],
          },
        }
      );
    })(),
    GameSeed: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.Number,
          seed: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSeed",
            types: ["u64", "felt252"],
            customTypes: [],
          },
        }
      );
    })(),
    PlayerMeta: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          data: RecsType.BigInt,
          best_level: RecsType.Number,
          cube_balance: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "PlayerMeta",
            types: ["ContractAddress", "felt252", "u8", "u64"],
            customTypes: [],
          },
        }
      );
    })(),
  };
}
