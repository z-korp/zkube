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
          score: RecsType.Number,
          moves: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          hammer_used: RecsType.Number,
          wave_used: RecsType.Number,
          totem_used: RecsType.Number,
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
              "u16",
              "u16",
              "u16",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
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
  };
}
