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

/// Default charge cadence: +1 charge to all actives every N levels.
/// Overdrive passive can reduce this from 5 to 4/3/2/1.
const CHARGE_CADENCE_BASE: u8 = 5;

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

            // Generate level 1 config using level_seed (at creation, level_seed = seed)
            let level_config = LevelGeneratorTrait::generate(base_seed.level_seed, 1, settings);

            // Check for NoBonusUsed constraint (any of the 3 constraints)
            let has_no_bonus = level_config
                .constraint
                .constraint_type == ConstraintType::NoBonusUsed
                || level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed
                || level_config.constraint_3.constraint_type == ConstraintType::NoBonusUsed;

            // Write level config to GameLevel model
            let game_level = GameLevelTrait::from_level_config(game_id, level_config);
            world.write_model(@game_level);

            // --- vNext: Apply Endgame Focus score at level start ---
            let mut run_data_updated = game.get_run_data();
            let passives = skill_effects::get_passive_effects(@run_data_updated);
            let endgame_score = InternalImpl::calculate_endgame_score(
                @passives, run_data_updated.current_level,
            );
            if endgame_score > 0 {
                run_data_updated
                    .level_score = if endgame_score > 255 {
                        255
                    } else {
                        endgame_score.try_into().unwrap()
                    };
            }

            // Reset per-level flags
            run_data_updated.gambit_triggered_this_level = false;
            run_data_updated.combo_surge_flow_active = false;

            // Apply Overdrive starting charges (only on level 1 / game start)
            if passives.overdrive_starting_charges > 0 {
                run_data_updated.award_all_active_charges(passives.overdrive_starting_charges);
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

            let player = get_caller_address();

            // --- vNext: Get passive effects for Gambit cube award ---
            let passives = skill_effects::get_passive_effects(@pre_complete_data);

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
            let bonuses: u8 = 0; // vNext: No bonus rewards from level completion
            let boss_bonus = BossLevel::get_boss_cube_bonus(completed_level);
            let is_victory = completed_level >= 50;

            // --- vNext: Gambit cube award (once per level, on level complete) ---
            // If gambit_triggered_this_level is set (grid reached >= gambit_height during this
            // level),
            // and the player survived (completing the level = survived), award gambit cubes.
            let mut gambit_cubes: u16 = 0;
            if pre_complete_data.gambit_triggered_this_level && passives.gambit_cubes > 0 {
                gambit_cubes = passives.gambit_cubes;
            }

            // Record stars for this level (star tier is 0-3)
            game.set_level_stars(completed_level, stars);

            // Update run_data (no grid changes - that's done via grid_system)
            // boss_bonus passed directly (no fortune multipliers in vNext)
            let (cubes_final, _bonuses_final, is_victory_final) = game
                .complete_level_data(cubes, bonuses, boss_bonus, is_victory);
            let bonuses_earned: u8 = 0; // vNext: No bonus rewards from level completion

            // Add gambit cubes to total (after complete_level_data which already advanced level)
            if gambit_cubes > 0 {
                let mut run_data_post = game.get_run_data();
                run_data_post.total_cubes = saturating_add_u16(run_data_post.total_cubes, gambit_cubes);
                game.set_run_data(run_data_post);
            }

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

                // --- vNext: Charge Distribution on Level Complete ---
                // Overdrive-aware cadence: every N levels (default 5, reduced by Overdrive passive)
                let cadence = if passives.overdrive_cadence > 0 {
                    passives.overdrive_cadence
                } else {
                    super::CHARGE_CADENCE_BASE
                };
                if cadence > 0 && completed_level % cadence == 0 {
                    run_data_updated.award_all_active_charges(1);
                }

                // NOTE: combo_charge_bonus is REMOVED in vNext.
                // Charges from combos are FORBIDDEN per design spec.

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
                game_id,
                seed: base_seed.seed,
                level_seed: next_level_seed,
                vrf_enabled: base_seed.vrf_enabled,
            };
            world.write_model(@next_game_seed);

            // Generate next level config using VRF-backed level seed
            let next_level_config = LevelGeneratorTrait::generate(
                next_level_seed, next_level, settings,
            );

            // Set no_bonus_constraint flag for the next level (any of the 3 constraints)
            let has_no_bonus = next_level_config
                .constraint
                .constraint_type == ConstraintType::NoBonusUsed
                || next_level_config.constraint_2.constraint_type == ConstraintType::NoBonusUsed
                || next_level_config.constraint_3.constraint_type == ConstraintType::NoBonusUsed;
            let game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
            world.write_model(@game_level);

            let mut run_data_updated = game.get_run_data();
            run_data_updated.no_bonus_constraint = has_no_bonus;
            run_data_updated.level_transition_pending = false; // Clear pending flag

            // --- vNext: Reset per-level flags ---
            run_data_updated.gambit_triggered_this_level = false;
            run_data_updated.combo_surge_flow_active = false;

            // --- vNext: Apply Endgame Focus score at level start ---
            let passives = skill_effects::get_passive_effects(@run_data_updated);
            let endgame_score = InternalImpl::calculate_endgame_score(
                @passives, next_level,
            );
            if endgame_score > 0 {
                // level_score was already reset to 0 by complete_level_data
                run_data_updated
                    .level_score = if endgame_score > 255 {
                        255
                    } else {
                        endgame_score.try_into().unwrap()
                    };
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

            // Open boss upgrade draft if a boss level was just completed
            let completed_level = next_level - 1;
            if completed_level == 10
                || completed_level == 20
                || completed_level == 30
                || completed_level == 40
                || completed_level == 50 {
                libs.draft.open_boss_upgrade(game_id, completed_level);
            }
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

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Calculate Endgame Focus score injection at level start.
        /// Two modes:
        ///   - Branch A (Deep End): endgame_per_level_x10 > 0 → score = value × levels_cleared / 10
        ///   - Branch B (Smooth Ramp): endgame_score > 0 && current_level >= min_level → flat score
        fn calculate_endgame_score(
            passives: @skill_effects::PassiveEffect, current_level: u8,
        ) -> u16 {
            let per_level_x10 = *passives.endgame_per_level_x10;
            if per_level_x10 > 0 {
                // Branch A: +X per level cleared (fractional, stored as ×10)
                // levels_cleared = current_level - 1 (level 1 means 0 levels cleared)
                let levels_cleared: u16 = if current_level > 1 {
                    (current_level - 1).into()
                } else {
                    0
                };
                return (per_level_x10.into() * levels_cleared) / 10;
            }

            let flat_score = *passives.endgame_score;
            let min_level = *passives.endgame_min_level;
            if flat_score > 0 && current_level >= min_level {
                return flat_score;
            }

            0
        }
    }
}
