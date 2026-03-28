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
          game_id: RecsType.BigInt,
          blocks: RecsType.BigInt,
          next_row: RecsType.Number,
          combo_counter: RecsType.Number,
          max_combo: RecsType.Number,
          run_data: RecsType.BigInt,
          level_stars: RecsType.BigInt,
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
          theme_id: RecsType.Number,
          name: RecsType.String,
          description: RecsType.String,
          created_by: RecsType.String,
          created_at: RecsType.Number,
          is_free: RecsType.Boolean,
          enabled: RecsType.Boolean,
          price: RecsType.BigInt,
          payment_token: RecsType.String,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSettingsMetadata",
            types: [
              "u32",
              "felt252",
              "ByteArray",
              "ContractAddress",
              "u64",
              "u8",
              "bool",
              "bool",
              "u256",
              "ContractAddress",
            ],
          },
        }
      );
    })(),
    GameSettings: (() => {
      return defineComponent(
        world,
        {
          // Key
          settings_id: RecsType.Number,
          // Mode
          mode: RecsType.Number,
          // Level Scaling
          base_moves: RecsType.Number,
          max_moves: RecsType.Number,
          base_ratio_x100: RecsType.Number,
          max_ratio_x100: RecsType.Number,
          // Cube Thresholds
          cube_3_percent: RecsType.Number,
          cube_2_percent: RecsType.Number,
          // Difficulty Tier Thresholds (non-linear)
          tier_1_threshold: RecsType.Number,
          tier_2_threshold: RecsType.Number,
          tier_3_threshold: RecsType.Number,
          tier_4_threshold: RecsType.Number,
          tier_5_threshold: RecsType.Number,
          tier_6_threshold: RecsType.Number,
          tier_7_threshold: RecsType.Number,
          // Constraint Settings
          constraints_enabled: RecsType.Number,
          constraint_start_level: RecsType.Number,
          // Constraint Distribution (PACKED fields)
          constraint_lines_budgets: RecsType.BigInt, // u64: lines + budgets + times packed
          constraint_chances: RecsType.Number,       // u32: dual_chance + secondary_no_bonus packed
          // Block Distribution (VeryEasy to Master)
          veryeasy_size1_weight: RecsType.Number,
          veryeasy_size2_weight: RecsType.Number,
          veryeasy_size3_weight: RecsType.Number,
          veryeasy_size4_weight: RecsType.Number,
          veryeasy_size5_weight: RecsType.Number,
          master_size1_weight: RecsType.Number,
          master_size2_weight: RecsType.Number,
          master_size3_weight: RecsType.Number,
          master_size4_weight: RecsType.Number,
          master_size5_weight: RecsType.Number,
          // Variance Settings
          early_variance_percent: RecsType.Number,
          mid_variance_percent: RecsType.Number,
          late_variance_percent: RecsType.Number,
          // Level Tier Thresholds
          early_level_threshold: RecsType.Number,
          mid_level_threshold: RecsType.Number,
          // Level Cap
          level_cap: RecsType.Number,
          boss_upgrades_enabled: RecsType.Number,
          reroll_base_cost: RecsType.Number,
          starting_charges: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSettings",
            types: [
              "u32",  // settings_id
              "u8",   // mode
              "u16", "u16", "u16", "u16",  // level scaling
              "u8", "u8",  // cube thresholds
              "u8", "u8", "u8", "u8", "u8", "u8", "u8",  // tier thresholds (7)
              "u8", "u8",  // constraint settings
              "u64",  // constraint_lines_budgets (packed)
              "u32",  // constraint_chances (packed)
              "u8", "u8", "u8", "u8", "u8",  // veryeasy block weights
              "u8", "u8", "u8", "u8", "u8",  // master block weights
               "u8", "u8", "u8",  // variance
               "u8", "u8",  // level thresholds
               "u8",  // level_cap
               "u8",   // boss_upgrades_enabled
               "u8",   // reroll_base_cost
               "u8",   // starting_charges
            ],
          },
        }
      );
    })(),
    GameSeed: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.BigInt,
          seed: RecsType.BigInt,
          level_seed: RecsType.BigInt,
          vrf_enabled: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSeed",
            types: ["u64", "felt252", "felt252", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    GameLevel: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.BigInt,
          level: RecsType.Number,
          points_required: RecsType.Number,
          max_moves: RecsType.Number,
          difficulty: RecsType.Number,
          // Primary constraint
          constraint_type: RecsType.Number,
          constraint_value: RecsType.Number,
          constraint_count: RecsType.Number,
          // Secondary constraint (for boss levels)
          constraint2_type: RecsType.Number,
          constraint2_value: RecsType.Number,
          constraint2_count: RecsType.Number,
          constraint3_type: RecsType.Number,
          constraint3_value: RecsType.Number,
          constraint3_count: RecsType.Number,
          cube_3_threshold: RecsType.Number,
          cube_2_threshold: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameLevel",
            types: [
              "u64",  // game_id
              "u8",   // level
              "u16",  // points_required
              "u16",  // max_moves
              "u8",   // difficulty
              "u8",   // constraint_type
              "u8",   // constraint_value
              "u8",   // constraint_count
              "u8",   // constraint2_type
              "u8",   // constraint2_value
              "u8",   // constraint2_count
              "u8",   // constraint3_type
              "u8",   // constraint3_value
              "u8",   // constraint3_count
              "u16",  // cube_3_threshold
              "u16",  // cube_2_threshold
            ],
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
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "PlayerMeta",
            types: ["ContractAddress", "felt252", "u8"],
            customTypes: [],
          },
        }
      );
    })(),

    MapEntitlement: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          settings_id: RecsType.Number,
          purchased_at: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "MapEntitlement",
            types: ["ContractAddress", "u32", "u64"],
            customTypes: [],
          },
        }
      );
    })(),

    DailyChallenge: (() => {
      return defineComponent(
        world,
        {
          challenge_id: RecsType.Number,
          settings_id: RecsType.Number,
          seed: RecsType.BigInt,
          start_time: RecsType.Number,
          end_time: RecsType.Number,
          ranking_metric: RecsType.Number,
          total_entries: RecsType.Number,
          prize_pool: RecsType.BigInt,
          settled: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "DailyChallenge",
            types: [
              "u32",           // challenge_id
              "u32",           // settings_id
              "felt252",       // seed
              "u64",           // start_time
              "u64",           // end_time
              "u8",            // ranking_metric
              "u32",           // total_entries
              "u256",          // prize_pool
              "bool",          // settled
            ],
            customTypes: [],
          },
        }
      );
    })(),
    DailyEntry: (() => {
      return defineComponent(
        world,
        {
          challenge_id: RecsType.Number,
          player: RecsType.BigInt,
          attempts: RecsType.Number,
          best_score: RecsType.Number,
          best_level: RecsType.Number,
          best_cubes: RecsType.Number,
          best_game_id: RecsType.BigInt,
          rank: RecsType.Number,
          prize_amount: RecsType.BigInt,
          claimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "DailyEntry",
            types: [
              "u32",               // challenge_id
              "ContractAddress",   // player
              "u32",               // attempts
              "u16",               // best_score
              "u8",                // best_level
              "u16",               // best_cubes
              "u64",               // best_game_id
              "u32",               // rank
              "u256",              // prize_amount
              "bool",              // claimed
            ],
            customTypes: [],
          },
        }
      );
    })(),
    DailyLeaderboard: (() => {
      return defineComponent(
        world,
        {
          challenge_id: RecsType.Number,
          rank: RecsType.Number,
          player: RecsType.BigInt,
          value: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "DailyLeaderboard",
            types: [
              "u32",               // challenge_id
              "u32",               // rank
              "ContractAddress",   // player
              "u32",               // value
            ],
            customTypes: [],
          },
        }
      );
    })(),
    GameChallenge: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.BigInt,
          challenge_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameChallenge",
            types: [
              "u64",   // game_id
              "u32",   // challenge_id
            ],
            customTypes: [],
          },
        }
      );
    })(),
  };
}
