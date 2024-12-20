import { defineComponent, Type as RecsType, World } from "@dojoengine/recs";

export type ContractComponents = Awaited<
  ReturnType<typeof defineContractComponents>
>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;

export function defineContractComponents(world: World) {
  return {
    Player: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          game_id: RecsType.Number,
          points: RecsType.Number,
          last_active_day: RecsType.Number,
          account_creation_day: RecsType.Number,
          daily_streak: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Player",
            types: ["u32", "u32", "u32", "u32", "u32", "u16"],
            customTypes: [],
          },
        },
      );
    })(),
    PlayerInfo: (() => {
      return defineComponent(
        world,
        {
          address: RecsType.BigInt,
          name: RecsType.BigInt,
          player_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "PlayerInfo",
            types: ["felt252", "felt252", "u32"],
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
          top1_score: RecsType.Number,
          top2_score: RecsType.Number,
          top3_score: RecsType.Number,
          top1_player_id: RecsType.Number,
          top2_player_id: RecsType.Number,
          top3_player_id: RecsType.Number,
          top1_game_id: RecsType.Number,
          top2_game_id: RecsType.Number,
          top3_game_id: RecsType.Number,
          is_set: RecsType.Boolean,
          top1_claimed: RecsType.Boolean,
          top2_claimed: RecsType.Boolean,
          top3_claimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Tournament",
            types: [
              "u32",
              "u16",
              "u16",
              "u16",
              "u32",
              "u32",
              "u32",
              "u32",
              "u32",
              "u32",
              "bool",
              "bool",
              "bool",
              "bool",
            ],
            customTypes: [],
          },
        },
      );
    })(),
    TournamentPrize: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          prize: RecsType.BigInt,
          is_set: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Tournament",
            types: ["u32", "felt252", "bool"],
            customTypes: [],
          },
        },
      );
    })(),
    Mint: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.BigInt,
          number: RecsType.Number,
          expiration_timestamp: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Mint",
            types: ["felt252", "u32", "u32"],
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
          zkorp_address: RecsType.BigInt,
          erc721_address: RecsType.BigInt,
          game_price: RecsType.BigInt,
          is_set: RecsType.Boolean,
          are_games_paused: RecsType.Boolean,
          are_chests_unlock: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Settings",
            types: ["u8", "felt252", "felt252", "u128", "bool", "bool", "bool"],
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
          prize: RecsType.BigInt,
          point_target: RecsType.Number,
          points: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Chest",
            types: ["u32", "u128", "u32", "u32"],
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
          player_id: RecsType.Number,
          points: RecsType.Number,
          is_set: RecsType.Boolean,
          claimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Participation",
            types: ["u32", "u32", "u32", "bool", "bool"],
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
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Admin",
            types: ["felt252", "bool"],
            customTypes: [],
          },
        },
      );
    })(),
    Game: (() => {
      return defineComponent(
        world,
        {
          id: RecsType.Number,
          seed: RecsType.BigInt,
          blocks: RecsType.BigInt,
          player_id: RecsType.Number,
          over: RecsType.Boolean,
          mode: RecsType.Number,
          score: RecsType.Number,
          moves: RecsType.Number,
          next_row: RecsType.Number,
          start_time: RecsType.Number,
          hammer_bonus: RecsType.Number,
          wave_bonus: RecsType.Number,
          totem_bonus: RecsType.Number,
          hammer_used: RecsType.Number,
          wave_used: RecsType.Number,
          totem_used: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          tournament_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "Game",
            types: [
              "u32",
              "felt252",
              "felt252",
              "u32",
              "bool",
              "u8",
              "u16",
              "u16",
              "u32",
              "u32",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u8",
              "u16",
              "u8",
              "u32",
            ],
            customTypes: [],
          },
        },
      );
    })(),
    GamePrize: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.Number,
          pending_chest_prize: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GamePrize",
            types: ["u32", "u128"],
            customTypes: [],
          },
        },
      );
    })(),
  };
}
