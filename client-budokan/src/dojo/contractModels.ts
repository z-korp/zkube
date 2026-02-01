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
          // Consumable Costs
          hammer_cost: RecsType.Number,
          wave_cost: RecsType.Number,
          totem_cost: RecsType.Number,
          extra_moves_cost: RecsType.Number,
          // Reward Multiplier
          cube_multiplier_x100: RecsType.Number,
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
              "u8", "u8", "u8", "u8",  // consumable costs
              "u16",  // cube_multiplier_x100
              "u8", "u8", "u8", "u8", "u8", "u8", "u8",  // tier thresholds (7)
              "u8", "u8",  // constraint settings
              "u64",  // constraint_lines_budgets (packed)
              "u32",  // constraint_chances (packed)
              "u8", "u8", "u8", "u8", "u8",  // veryeasy block weights
              "u8", "u8", "u8", "u8", "u8",  // master block weights
              "u8", "u8", "u8",  // variance
              "u8", "u8",  // level thresholds
              "u8",  // level_cap
            ],
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
    GameLevel: (() => {
      return defineComponent(
        world,
        {
          game_id: RecsType.Number,
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
          // Cube thresholds
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
  };
}
