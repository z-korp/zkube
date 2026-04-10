import { defineComponent, Type as RecsType } from "@dojoengine/recs";
import type { World } from "@dojoengine/recs";

export type ContractComponents = Awaited<
  ReturnType<typeof defineContractComponents>
>;

const { VITE_PUBLIC_NAMESPACE } = import.meta.env;
const ARCADE_NAMESPACE = "zkube_v2_1_1";

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
              "felt252",
              "felt252",
              "u32",
              "u8",
              "u8",
              "felt252",
              "u32",
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
          theme_id: RecsType.Number,
          is_free: RecsType.Boolean,
          enabled: RecsType.Boolean,
          price: RecsType.BigInt,
          payment_token: RecsType.String,
          star_cost: RecsType.BigInt,
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
              "u128",
              "ContractAddress",
              "u128",
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
          constraint_lines_budgets: RecsType.BigInt, // u64
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
          // Endless Mode Settings
          endless_difficulty_thresholds: RecsType.BigInt, // felt252 packed
          endless_score_multipliers: RecsType.BigInt,     // u64 packed
          // Zone & Mutator Assignment
          zone_id: RecsType.Number,
          active_mutator_id: RecsType.Number,
          passive_mutator_id: RecsType.Number,
          // Boss Settings
          boss_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameSettings",
            types: [
              "u32",  // settings_id
              "u8",   // mode
              "u16", "u16", "u16", "u16",  // level scaling (base_moves, max_moves, base_ratio, max_ratio)
              "u8", "u8", "u8", "u8", "u8", "u8", "u8",  // tier thresholds (7)
              "u8", "u8",  // constraint settings
              "u64",  // constraint_lines_budgets
              "u8", "u8", "u8", "u8", "u8",  // veryeasy block weights
              "u8", "u8", "u8", "u8", "u8",  // master block weights
              "u8", "u8", "u8",  // variance
              "u8", "u8",  // level thresholds
              "u8",  // level_cap
              "felt252",  // endless_difficulty_thresholds
              "u64",  // endless_score_multipliers
              "u8",  // zone_id
              "u8",  // active_mutator_id
              "u8",  // passive_mutator_id
              "u8",  // boss_id
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
            types: ["felt252", "felt252", "felt252", "bool"],
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
          mutator_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "GameLevel",
            types: [
              "felt252",  // game_id
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
              "u8",   // mutator_id
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
          last_active: RecsType.Number,
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

    PlayerBestRun: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          settings_id: RecsType.Number,
          run_type: RecsType.Number,
          best_score: RecsType.Number,
          best_stars: RecsType.Number,
          best_level: RecsType.Number,
          zone_cleared: RecsType.Boolean,
          best_level_stars: RecsType.BigInt,
          best_game_id: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "PlayerBestRun",
            types: ["ContractAddress", "u32", "u8", "u32", "u8", "u8", "bool", "u32", "felt252"],
            customTypes: [],
          },
        }
      );
    })(),

    ZoneEntitlement: (() => {
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
            name: "ZoneEntitlement",
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
          total_entries: RecsType.Number,
          settled: RecsType.Boolean,
          zone_id: RecsType.Number,
          active_mutator_id: RecsType.Number,
          passive_mutator_id: RecsType.Number,
          boss_id: RecsType.Number,
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
              "u32",           // total_entries
              "bool",          // settled
              "u8",            // zone_id
              "u8",            // active_mutator_id
              "u8",            // passive_mutator_id
              "u8",            // boss_id
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
          best_stars: RecsType.Number,
          best_game_id: RecsType.BigInt,
          rank: RecsType.Number,
          star_reward: RecsType.BigInt,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "DailyEntry",
            types: [
              "u32",               // challenge_id
              "ContractAddress",   // player
              "u32",               // attempts
              "u32",               // best_score
              "u8",                // best_level
              "u8",                // best_stars
              "felt252",           // best_game_id
              "u32",               // rank
              "u64",               // star_reward
            ],
            customTypes: [],
          },
        }
      );
    })(),
    DailyAttempt: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.BigInt,
          player: RecsType.BigInt,
          zone_id: RecsType.Number,
          challenge_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "DailyAttempt",
            types: [
              "felt252",           // game_id
              "ContractAddress",   // player
              "u8",                // zone_id
              "u32",               // challenge_id
            ],
            customTypes: [],
          },
        }
      );
    })(),
    ActiveDailyAttempt: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          game_id: RecsType.BigInt,
          challenge_id: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "ActiveDailyAttempt",
            types: [
              "ContractAddress",   // player (key)
              "felt252",           // game_id
              "u32",               // challenge_id
            ],
            customTypes: [],
          },
        }
      );
    })(),
    WeeklyEndless: (() => {
      return defineComponent(
        world,
        {
          week_id: RecsType.BigInt,
          total_participants: RecsType.Number,
          settled: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "WeeklyEndless",
            types: ["u32", "u32", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    WeeklyEndlessEntry: (() => {
      return defineComponent(
        world,
        {
          week_id: RecsType.BigInt,
          player: RecsType.BigInt,
          best_score: RecsType.Number,
          submitted: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "WeeklyEndlessEntry",
            types: ["u32", "ContractAddress", "u32", "bool"],
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
              "felt252",   // game_id
              "u32",   // challenge_id
            ],
            customTypes: [],
          },
        }
      );
    })(),
    StoryZoneProgress: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          zone_id: RecsType.Number,
          level_stars: RecsType.BigInt,
          highest_cleared: RecsType.Number,
          boss_cleared: RecsType.Boolean,
          perfection_claimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "StoryZoneProgress",
            types: ["ContractAddress", "u8", "u32", "u8", "bool", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    StoryAttempt: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.BigInt,
          player: RecsType.BigInt,
          zone_id: RecsType.Number,
          level: RecsType.Number,
          is_replay: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "StoryAttempt",
            types: ["felt252", "ContractAddress", "u8", "u8", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    ActiveStoryAttempt: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          game_id: RecsType.BigInt,
          zone_id: RecsType.Number,
          level: RecsType.Number,
          is_replay: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "ActiveStoryAttempt",
            types: ["ContractAddress", "felt252", "u8", "u8", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    MutatorDef: (() => {
      return defineComponent(
        world,
        {
          mutator_id: RecsType.Number,
          zone_id: RecsType.Number,
          moves_modifier: RecsType.Number,
          ratio_modifier: RecsType.Number,
          difficulty_offset: RecsType.Number,
          combo_score_mult_x100: RecsType.Number,
          star_threshold_modifier: RecsType.Number,
          endless_ramp_mult_x100: RecsType.Number,
          line_clear_bonus: RecsType.Number,
          perfect_clear_bonus: RecsType.Number,
          starting_rows: RecsType.Number,
          bonus_1_type: RecsType.Number,
          bonus_1_trigger_type: RecsType.Number,
          bonus_1_trigger_threshold: RecsType.Number,
          bonus_1_starting_charges: RecsType.Number,
          bonus_2_type: RecsType.Number,
          bonus_2_trigger_type: RecsType.Number,
          bonus_2_trigger_threshold: RecsType.Number,
          bonus_2_starting_charges: RecsType.Number,
          bonus_3_type: RecsType.Number,
          bonus_3_trigger_type: RecsType.Number,
          bonus_3_trigger_threshold: RecsType.Number,
          bonus_3_starting_charges: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "MutatorDef",
            types: [
              "u8", "u8",
              "u8", "u8", "u8",
              "u16", "u8", "u16",
              "u8", "u8", "u8",
              "u8", "u8", "u8", "u8",
              "u8", "u8", "u8", "u8",
              "u8", "u8", "u8", "u8",
            ],
            customTypes: [],
          },
        }
      );
    })(),
    CosmeticDef: (() => {
      return defineComponent(
        world,
        {
          cosmetic_id: RecsType.Number,
          name: RecsType.BigInt,
          star_cost: RecsType.BigInt,
          category: RecsType.Number,
          enabled: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "CosmeticDef",
            types: ["u32", "felt252", "u128", "u8", "bool"],
            customTypes: [],
          },
        }
      );
    })(),
    CosmeticUnlock: (() => {
      return defineComponent(
        world,
        {
          player: RecsType.BigInt,
          cosmetic_id: RecsType.Number,
          purchased_at: RecsType.Number,
        },
        {
          metadata: {
            namespace: VITE_PUBLIC_NAMESPACE,
            name: "CosmeticUnlock",
            types: ["ContractAddress", "u32", "u64"],
            customTypes: [],
          },
        }
      );
    })(),
    QuestAdvancement: (() => {
      return defineComponent(
        world,
        {
          player_id: RecsType.BigInt,
          quest_id: RecsType.BigInt,
          task_id: RecsType.BigInt,
          interval_id: RecsType.Number,
          count: RecsType.BigInt,
          timestamp: RecsType.Number,
        },
        {
          metadata: {
            namespace: ARCADE_NAMESPACE,
            name: "QuestAdvancement",
            types: ["felt252", "felt252", "felt252", "u64", "u128", "u64"],
          },
        }
      );
    })(),
    QuestCompletion: (() => {
      return defineComponent(
        world,
        {
          player_id: RecsType.BigInt,
          quest_id: RecsType.BigInt,
          interval_id: RecsType.Number,
          timestamp: RecsType.Number,
          unclaimed: RecsType.Boolean,
          lock_count: RecsType.Number,
        },
        {
          metadata: {
            namespace: ARCADE_NAMESPACE,
            name: "QuestCompletion",
            types: ["felt252", "felt252", "u64", "u64", "bool", "u32"],
          },
        }
      );
    })(),
    AchievementAdvancement: (() => {
      return defineComponent(
        world,
        {
          player_id: RecsType.BigInt,
          achievement_id: RecsType.BigInt,
          task_id: RecsType.BigInt,
          count: RecsType.BigInt,
          timestamp: RecsType.Number,
        },
        {
          metadata: {
            namespace: ARCADE_NAMESPACE,
            name: "AchievementAdvancement",
            types: ["felt252", "felt252", "felt252", "u128", "u64"],
          },
        }
      );
    })(),
    AchievementCompletion: (() => {
      return defineComponent(
        world,
        {
          player_id: RecsType.BigInt,
          achievement_id: RecsType.BigInt,
          timestamp: RecsType.Number,
          unclaimed: RecsType.Boolean,
        },
        {
          metadata: {
            namespace: ARCADE_NAMESPACE,
            name: "AchievementCompletion",
            types: ["felt252", "felt252", "u64", "bool"],
          },
        }
      );
    })(),
  };
}
