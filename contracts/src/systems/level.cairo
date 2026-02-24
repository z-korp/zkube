//! Level System - handles level transitions and heavy level operations.
//!
//! This system is called via dispatcher from other systems (bonus_system, move_system)
//! to avoid importing heavy dependencies like LevelGeneratorTrait directly.
//!
//! `finalize_level` is called internally (no VRF) when a level is completed.
//! `start_next_level` is called by the user as a separate VRF transaction.
//!
//! Pattern inspired by dark-shuffle's dispatcher architecture.

#[starknet::interface]
pub trait ILevelSystem<T> {
    /// Initialize level 1 for a new game.
    /// Generates the level config and writes to GameLevel model.
    /// Returns true if level has NoBonusUsed constraint.
    fn initialize_level(ref self: T, game_id: u64, skill_data: felt252) -> bool;

    /// Finalize the current level (NO VRF). Awards cubes, records stars,
    /// handles victory, and sets level_transition_pending if not victory.
    /// Called internally by move_system/bonus_system.
    /// Returns (cubes_earned, bonuses_awarded, is_victory)
    fn finalize_level(ref self: T, game_id: u64, skill_data: felt252) -> (u8, u8, bool);

    /// Start the next level (REQUIRES VRF). Consumes VRF random, reseeds,
    /// generates next level config, resets grid, opens draft if applicable.
    /// Called by the user as a separate transaction with VRF.
    fn start_next_level(ref self: T, game_id: u64);

    /// Insert a new line when grid is empty (but level not complete).
    /// This is needed when a bonus clears the entire grid.
    fn insert_line_if_empty(ref self: T, game_id: u64);
}

#[dojo::contract]
mod level_system {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use starknet::{get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::victory;
    use zkube::events::{LevelCompleted, LevelStarted, RunCompleted};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{
        GameLibsImpl, ICubeTokenDispatcherTrait, IDraftSystemDispatcherTrait,
        IGridSystemDispatcherTrait,
    };
    use zkube::helpers::level::{BossLevel, LevelGeneratorTrait};
    use zkube::helpers::packing::RunDataHelpersTrait;
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::scoring::saturating_add_u16;
    use zkube::helpers::skill_effects;
    use zkube::models::game::{Game, GameLevelTrait, GameSeed, GameTrait};
    use zkube::models::skill_tree::PlayerSkillTree;
    use zkube::types::constraint::ConstraintType;
    use zkube::types::level::LevelConfigTrait;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl LevelSystemImpl of super::ILevelSystem<ContractState> {
        fn initialize_level(ref self: ContractState, game_id: u64, skill_data: felt252) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();
            let run_data = game.get_run_data();
            let branch_ids_arr = skill_effects::build_branch_ids(skill_data);
            let world_effects = skill_effects::aggregate_world_effects(
                @run_data, branch_ids_arr.span(),
            );

            // Generate level 1 config using level_seed (at creation, level_seed = seed)
            let level_config = LevelGeneratorTrait::generate(base_seed.level_seed, 1, settings);

            // Check for NoBonusUsed constraint (any of the 3 constraints)
            let has_no_bonus = level_config
                .constraint
                .constraint_type == ConstraintType::NoBonusUsed
                || level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed
                || level_config.constraint_3.constraint_type == ConstraintType::NoBonusUsed;

            // Write level config to GameLevel model
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);
            if world_effects.extra_max_moves > 0 {
                game_level
                    .max_moves =
                        saturating_add_u16(game_level.max_moves, world_effects.extra_max_moves);
            }
            if world_effects.expansion_difficulty_reduction > 0 {
                game_level
                    .difficulty =
                        if game_level.difficulty > world_effects.expansion_difficulty_reduction {
                            game_level.difficulty - world_effects.expansion_difficulty_reduction
                        } else {
                            0
                        };
            }
            world.write_model(@game_level);

            let mut run_data_updated = game.get_run_data();
            if world_effects.resilience_free_moves > 0 {
                run_data_updated
                    .free_moves =
                        if world_effects.resilience_free_moves > 15 {
                            15
                        } else {
                            world_effects.resilience_free_moves
                        };
            }

            if world_effects.legacy_free_moves_per_10 > 0 {
                let bonus_free: u16 = world_effects.legacy_free_moves_per_10.into()
                    * (run_data_updated.current_level / 10).into();
                let total_free: u16 = run_data_updated.free_moves.into() + bonus_free;
                run_data_updated
                    .free_moves = if total_free > 15 {
                        15
                    } else {
                        total_free.try_into().unwrap()
                    };
            }

            if world_effects.focus_prefill_percent > 0 {
                let req1 = level_config.constraint.required_count;
                if req1 > 0 {
                    run_data_updated
                        .constraint_progress =
                            (req1.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }

                let req2 = level_config.constraint_2.required_count;
                if req2 > 0 {
                    run_data_updated
                        .constraint_2_progress =
                            (req2.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }

                let req3 = level_config.constraint_3.required_count;
                if req3 > 0 {
                    run_data_updated
                        .constraint_3_progress =
                            (req3.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }
            }

            if world_effects.legacy_cube_per_n_levels > 0
                && world_effects.legacy_cube_level_divisor > 0 {
                let levels_completed: u8 = run_data_updated.current_level
                    / world_effects.legacy_cube_level_divisor;
                let legacy_cubes: u16 = world_effects.legacy_cube_per_n_levels.into()
                    * levels_completed.into();
                run_data_updated
                    .total_cubes = saturating_add_u16(run_data_updated.total_cubes, legacy_cubes);
            }

            game.set_run_data(run_data_updated);
            world.write_model(@game);

            // Emit level 1 started event
            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: 1,
                        points_required: level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: level_config.constraint.constraint_type,
                        constraint_value: level_config.constraint.value,
                        constraint_required: level_config.constraint.required_count,
                    },
                );

            has_no_bonus
        }

        fn finalize_level(
            ref self: ContractState, game_id: u64, skill_data: felt252,
        ) -> (u8, u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Capture stats BEFORE completing level
            let pre_complete_data = game.get_run_data();
            let completed_level = pre_complete_data.current_level;
            let final_score = pre_complete_data.level_score;
            let final_moves = pre_complete_data.level_moves;
            let pre_total_score = pre_complete_data.total_score;
            let level_max_combo = game.max_combo;
            let branch_ids_arr = skill_effects::build_branch_ids(skill_data);
            let world_effects = skill_effects::aggregate_world_effects(
                @pre_complete_data, branch_ids_arr.span(),
            );

            let player = get_caller_address();

            // Calculate level rewards using LevelGeneratorTrait
            let level_config = LevelGeneratorTrait::generate(
                base_seed.level_seed, completed_level, settings,
            );
            let stars = level_config.calculate_cubes(pre_complete_data.level_moves.into());
            let cubes = match stars {
                3 => 5,
                2 => 3,
                1 => 1,
                _ => 0,
            };
            let bonuses: u8 = 0; // V3.0: No bonus rewards from level completion
            let boss_bonus = BossLevel::get_boss_cube_bonus(completed_level);
            let is_victory = completed_level >= 50;

            let base_level_cubes: u16 = cubes.into() + boss_bonus;
            let mut fortune_cubes: u16 = world_effects.fortune_flat_cubes.into();
            let pre_mult_total: u32 = base_level_cubes.into() + fortune_cubes.into();
            if stars >= 3 && world_effects.fortune_star_multiplier_3 > 0 {
                let multiplied_total: u32 = pre_mult_total
                    * world_effects.fortune_star_multiplier_3.into();
                let extra_total: u32 = if multiplied_total > base_level_cubes.into() {
                    multiplied_total - base_level_cubes.into()
                } else {
                    0
                };
                fortune_cubes =
                    if extra_total > 65535 {
                        65535
                    } else {
                        extra_total.try_into().unwrap()
                    };
            } else if stars >= 2 && world_effects.fortune_star_multiplier_2 > 0 {
                let multiplied_total: u32 = pre_mult_total
                    * world_effects.fortune_star_multiplier_2.into();
                let extra_total: u32 = if multiplied_total > base_level_cubes.into() {
                    multiplied_total - base_level_cubes.into()
                } else {
                    0
                };
                fortune_cubes =
                    if extra_total > 65535 {
                        65535
                    } else {
                        extra_total.try_into().unwrap()
                    };
            }
            let boss_bonus_with_fortune = saturating_add_u16(boss_bonus, fortune_cubes);

            // Record stars for this level (star tier is 0-3)
            game.set_level_stars(completed_level, stars);

            // Update run_data (no grid changes - that's done via grid_system)
            let (cubes_final, _bonuses_final, is_victory_final) = game
                .complete_level_data(cubes, bonuses, boss_bonus_with_fortune, is_victory);
            let bonuses_earned: u8 = 0; // V3.0: No bonus rewards from level completion

            // Emit level completed
            world
                .emit_event(
                    @LevelCompleted {
                        game_id,
                        player,
                        level: completed_level,
                        cubes: cubes_final,
                        moves_used: final_moves.into(),
                        score: final_score.into(),
                        total_score: pre_total_score,
                        bonuses_earned,
                    },
                );

            if is_victory_final {
                game.over = true;

                let final_run_data = game.get_run_data();

                world
                    .emit_event(
                        @RunCompleted {
                            game_id,
                            player,
                            final_score: final_run_data.total_score,
                            total_cubes: final_run_data.total_cubes,
                            started_at: game.started_at,
                            completed_at: get_block_timestamp(),
                        },
                    );

                // Track full-run victory achievement progress
                let libs = GameLibsImpl::new(world);
                libs
                    .track_achievement(
                        player, victory::Victory::identifier(), 1, settings.settings_id,
                    );

                // Mint cubes on victory via GameLibs
                let cubes_to_mint: u256 = final_run_data.total_cubes.into();
                if cubes_to_mint > 0 {
                    libs.cube.mint(player, cubes_to_mint);
                }
            } else {
                // NOT victory: set level_transition_pending and award charges.
                // VRF reseed + next level generation happens in start_next_level().
                let mut run_data_updated = game.get_run_data();
                run_data_updated.level_transition_pending = true;

                // --- Charge Distribution on Level Complete ---
                // Source A: deterministic cadence (every 5 levels)
                if completed_level % 5 == 0 {
                    run_data_updated.award_all_active_bonus_charges(1);
                }

                // Source B: highest combo tier reached this level (once per level)
                let combo_charge_bonus = InternalImpl::combo_charge_bonus(level_max_combo);
                if combo_charge_bonus > 0 {
                    run_data_updated.award_all_active_bonus_charges(combo_charge_bonus);
                }

                game.set_run_data(run_data_updated);
            }

            world.write_model(@game);

            (cubes_final, bonuses_earned, is_victory_final)
        }

        fn start_next_level(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            // Must be in level transition state
            assert!(run_data.level_transition_pending, "No level transition pending");
            assert!(!game.over, "Game is over");

            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();
            let skill_tree: PlayerSkillTree = world.read_model(player);
            let branch_ids_arr = skill_effects::build_branch_ids(skill_tree.skill_data);
            let world_effects = skill_effects::aggregate_world_effects(
                @run_data, branch_ids_arr.span(),
            );

            // current_level was already incremented by complete_level_data() in finalize_level
            let next_level = run_data.current_level;

            // Call VRF for per-level randomness.
            // Salt = poseidon(game_id, next_level) to ensure unique VRF per level transition.
            // VRF result stored in level_seed; base seed is NEVER overwritten.
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), next_level.into()].span(),
            );
            let next_seed_random = RandomImpl::from_vrf_enabled(base_seed.vrf_enabled, vrf_salt);
            let next_level_seed = next_seed_random.seed;

            let next_game_seed = GameSeed {
                game_id, seed: base_seed.seed, level_seed: next_level_seed, vrf_enabled: base_seed.vrf_enabled,
            };
            world.write_model(@next_game_seed);

            // Generate next level config using VRF-backed level seed
            let next_level_config = LevelGeneratorTrait::generate(next_level_seed, next_level, settings);

            // Set no_bonus_constraint flag for the next level (any of the 3 constraints)
            let has_no_bonus = next_level_config
                .constraint
                .constraint_type == ConstraintType::NoBonusUsed
                || next_level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed
                || next_level_config.constraint_3.constraint_type == ConstraintType::NoBonusUsed;
            let mut game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
            if world_effects.extra_max_moves > 0 {
                game_level
                    .max_moves =
                        saturating_add_u16(game_level.max_moves, world_effects.extra_max_moves);
            }
            if world_effects.expansion_difficulty_reduction > 0 {
                game_level
                    .difficulty =
                        if game_level.difficulty > world_effects.expansion_difficulty_reduction {
                            game_level.difficulty - world_effects.expansion_difficulty_reduction
                        } else {
                            0
                        };
            }
            world.write_model(@game_level);

            let mut run_data_updated = game.get_run_data();
            run_data_updated.no_bonus_constraint = has_no_bonus;
            run_data_updated.level_transition_pending = false; // Clear pending flag

            if world_effects.resilience_free_moves > 0 {
                run_data_updated
                    .free_moves =
                        if world_effects.resilience_free_moves > 15 {
                            15
                        } else {
                            world_effects.resilience_free_moves
                        };
            }

            if world_effects.legacy_free_moves_per_10 > 0 {
                let bonus_free: u16 = world_effects.legacy_free_moves_per_10.into()
                    * (run_data_updated.current_level / 10).into();
                let total_free: u16 = run_data_updated.free_moves.into() + bonus_free;
                run_data_updated
                    .free_moves = if total_free > 15 {
                        15
                    } else {
                        total_free.try_into().unwrap()
                    };
            }

            if world_effects.focus_prefill_percent > 0 {
                let req1 = next_level_config.constraint.required_count;
                if req1 > 0 {
                    run_data_updated
                        .constraint_progress =
                            (req1.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }

                let req2 = next_level_config.constraint_2.required_count;
                if req2 > 0 {
                    run_data_updated
                        .constraint_2_progress =
                            (req2.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }

                let req3 = next_level_config.constraint_3.required_count;
                if req3 > 0 {
                    run_data_updated
                        .constraint_3_progress =
                            (req3.into() * world_effects.focus_prefill_percent.into() / 100_u16)
                        .try_into()
                        .unwrap();
                }
            }

            if world_effects.expansion_cube_per_level > 0 {
                run_data_updated
                    .total_cubes =
                        saturating_add_u16(
                            run_data_updated.total_cubes,
                            world_effects.expansion_cube_per_level.into(),
                        );
            }

            if world_effects.legacy_cube_per_n_levels > 0
                && world_effects.legacy_cube_level_divisor > 0 {
                let levels_completed: u8 = run_data_updated.current_level
                    / world_effects.legacy_cube_level_divisor;
                let legacy_cubes: u16 = world_effects.legacy_cube_per_n_levels.into()
                    * levels_completed.into();
                run_data_updated
                    .total_cubes = saturating_add_u16(run_data_updated.total_cubes, legacy_cubes);
            }

            game.set_run_data(run_data_updated);

            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: next_level,
                        points_required: next_level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: next_level_config.constraint.constraint_type,
                        constraint_value: next_level_config.constraint.value,
                        constraint_required: next_level_config.constraint.required_count,
                    },
                );

            // Write game before resetting grid (grid_system will read the updated run_data)
            world.write_model(@game);

            // Reset grid for the new level via GameLibs
            let libs = GameLibsImpl::new(world);
            libs.grid.reset_grid_for_level(game_id);

            // Open draft if applicable (completed_level = next_level - 1)
            let completed_level = next_level - 1;
            libs.draft.maybe_open_after_level(game_id, completed_level, player);
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: u64) {
            let world: WorldStorage = self.world(@DEFAULT_NS());

            let game: Game = world.read_model(game_id);

            // Only insert if grid is actually empty
            if game.blocks != 0 {
                return;
            }

            // Delegate to grid_system via GameLibs
            let libs = GameLibsImpl::new(world);
            libs.grid.insert_line_if_empty(game_id);
        }
    }
    // V5: charges are granted by cadence and highest combo tier only

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn combo_charge_bonus(max_combo_depth: u8) -> u8 {
            if max_combo_depth >= 8 {
                3
            } else if max_combo_depth >= 6 {
                2
            } else if max_combo_depth >= 4 {
                1
            } else {
                0
            }
        }
    }
}
