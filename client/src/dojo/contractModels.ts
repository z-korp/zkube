import { defineComponent, Type as RecsType, World } from "@dojoengine/recs";

export type ContractComponents = Awaited<
  ReturnType<typeof defineContractComponents>
>;

export function defineContractComponents(world: World) {
  return {
    Game: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          over: RecsType.Boolean,
          score: RecsType.Number,
          moves: RecsType.Number,
          next_row: RecsType.Number,
          next_color: RecsType.Number,
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          hammer_used: RecsType.Number,
          wave_used: RecsType.Number,
          totem_used: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          blocks: RecsType.BigInt,
          colors: RecsType.BigInt,
          player_id: RecsType.BigInt,
          seed: RecsType.BigInt,
          mode: RecsType.Number,
          start_time: RecsType.Number,
          tournament_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Game",
            types: [
              "u32",
              "bool",
              "u32",
              "u32",
              "u32",
              "u32",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "felt252",
              "felt252",
              "felt252",
              "felt252",
              "u8",
              "u64",
              "u64",
            ],
            customTypes: [],
          },
        },
      );
    })(),
    Player: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.BigInt,
          game_id: RecsType.Number,
          name: RecsType.BigInt,
          points: RecsType.Number,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Player",
            types: ["felt252", "u32", "felt252", "u32"],
            customTypes: [],
          },
        },
      );
    })(),
  };
}
