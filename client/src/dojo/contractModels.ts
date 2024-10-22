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
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          hammer_used: RecsType.Number,
          wave_used: RecsType.Number,
          totem_used: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          blocks: RecsType.BigInt,
          player_id: RecsType.BigInt,
          seed: RecsType.BigInt,
          mode: RecsType.Number,
          start_time: RecsType.Number,
          score_in_tournament: RecsType.Number,
          combo_counter_in_tournament: RecsType.Number,
          max_combo_in_tournament: RecsType.Number,
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
              "u8",
              "u64",
              "u32",
              "u8",
              "u8",
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
          daily_streak: RecsType.Number,
          last_active_day: RecsType.Number,
          account_creation_day: RecsType.Number,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Player",
            types: ["felt252", "u32", "felt252", "u32", "u8", "u32", "u32"],
            customTypes: [],
          },
        },
      );
    })(),
    Credits: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.BigInt, // player_id (address)
          day_id: RecsType.Number,
          remaining: RecsType.Number,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Credits",
            types: ["felt252", "u64", "u8"],
            customTypes: [],
          },
        },
      );
    })(),
    Settings: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          free_daily_credits: RecsType.Number,
          daily_mode_price: RecsType.BigInt,
          normal_mode_price: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Settings",
            types: ["u8", "u8", "felt252", "felt252"],
            customTypes: [],
          },
        },
      );
    })(),
    Tournament: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          is_set: RecsType.Boolean,
          prize: RecsType.BigInt,
          top1_player_id: RecsType.BigInt,
          top2_player_id: RecsType.BigInt,
          top3_player_id: RecsType.BigInt,
          top1_score: RecsType.Number,
          top2_score: RecsType.Number,
          top3_score: RecsType.Number,
          top1_claimed: RecsType.Boolean,
          top2_claimed: RecsType.Boolean,
          top3_claimed: RecsType.Boolean,
          top1_game_id: RecsType.Number,
          top2_game_id: RecsType.Number,
          top3_game_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Tournament",
            types: [
              "u64",
              "bool",
              "felt252",
              "felt252",
              "felt252",
              "felt252",
              "u32",
              "u32",
              "u32",
              "bool",
              "bool",
              "bool",
              "u32",
              "u32",
              "u32",
            ],
            customTypes: [],
          },
        },
      );
    })(),
    Chest: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          point_target: RecsType.Number,
          points: RecsType.Number,
          prize: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Chest",
            types: ["u32", "u32", "u32", "felt252"],
            customTypes: [],
          },
        },
      );
    })(),
    Participation: (() => {
      return defineComponent(
        world,
        {
          chest_id: RecsType.Number,
          player_id: RecsType.BigInt,
          is_set: RecsType.Boolean,
          points: RecsType.Number,
          claimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Participation",
            types: ["u32", "felt252", "bool", "u32", "bool"],
            customTypes: [],
          },
        },
      );
    })(),
    Admin: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.BigInt,
          is_set: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: "zkube",
            name: "Admin",
            types: ["felt252", "bool"],
            customTypes: [],
          },
        },
      );
    })(),
  };
}
