//! Grid System - handles all grid operations.
//!
//! This system owns all heavy grid logic:
//! - Block swipes (Controller)
//! - Gravity and line clearing
//! - Line creation and insertion
//! - All bonus implementations
//!
//! Other systems call this via dispatcher to avoid importing heavy dependencies.

use zkube::types::bonus::Bonus;

#[starknet::interface]
pub trait IGridSystem<T> {
    /// Initialize a new game's grid with starting blocks.
    /// This fills the grid until it reaches 4 rows of blocks.
    fn initialize_grid(ref self: T, game_id: u64);

    /// Reset the grid for a new level.
    /// Called after level completion to reinitialize with the new difficulty.
    fn reset_grid_for_level(ref self: T, game_id: u64);

    /// Execute a move (swipe) on the grid.
    /// Returns (lines_cleared, is_grid_full)
    fn execute_move(
        ref self: T,
        game_id: u64,
        row_index: u8,
        start_index: u8,
        final_index: u8,
        skill_data: felt252,
    ) -> (u8, bool);

    /// Apply a bonus effect to the grid.
    /// Returns lines_cleared
    fn apply_bonus(
        ref self: T, game_id: u64, bonus: Bonus, row_index: u8, col_index: u8, skill_data: felt252,
    ) -> u8;

    /// Insert a new line if the grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: u64);

    /// Assess the grid (apply gravity, clear lines).
    /// Returns (lines_cleared, points)
    fn assess_grid(ref self: T, game_id: u64) -> (u8, u16);
}

#[dojo::contract]
mod grid_system {
    use alexandria_math::fast_power::fast_power;
    use core::hash::HashStateTrait;
    use core::poseidon::{HashState, PoseidonTrait};
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use zkube::constants::{self, DEFAULT_NS};

    // Import bonus implementations (only grid-modifying bonuses need element files)
    use zkube::elements::bonuses::harvest;
    use zkube::elements::bonuses::wave;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::packing::RunDataHelpersTrait;
    use zkube::helpers::scoring;
    use zkube::helpers::scoring::{
        process_lines_cleared, saturating_add_u16, saturating_add_u8, update_score,
    };
    use zkube::models::config::GameSettings;
    use zkube::models::game::{Game, GameLevel, GameSeed, GameTrait};
    use zkube::systems::skill_effects::{
        ISkillEffectsSystemDispatcher, ISkillEffectsSystemDispatcherTrait,
    };
    use zkube::types::bonus::{Bonus, BonusTrait};
    use zkube::types::constraint::{
        ConstraintContext, LevelConstraint, LevelConstraintTrait, any_needs_break_blocks,
        get_break_blocks_target_size,
    };
    use zkube::types::difficulty::Difficulty;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl GridSystemImpl of super::IGridSystem<ContractState> {
        fn initialize_grid(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let difficulty: Difficulty = game_level.difficulty.into();
            let level_seed = GameTrait::generate_level_seed(base_seed.level_seed, 1);

            // Create initial next_row
            game.next_row = Controller::create_line(level_seed, difficulty, settings);

            // Fill grid until it has at least 4 rows of blocks
            let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                // Insert the next_row and generate a new one
                let new_seed = InternalImpl::generate_seed(game.blocks, base_seed.level_seed, 1);
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                // Apply gravity and clear any lines
                let mut counter: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter);
            }

            world.write_model(@game);
        }

        fn reset_grid_for_level(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let run_data = game.get_run_data();
            let current_level = run_data.current_level;
            let difficulty: Difficulty = game_level.difficulty.into();
            let level_seed = GameTrait::generate_level_seed(base_seed.level_seed, current_level);

            // Reset grid
            game.blocks = 0;
            game.next_row = Controller::create_line(level_seed, difficulty, settings);

            // Fill grid until it has at least 4 rows of blocks
            let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                // Insert the next_row and generate a new one
                let new_seed = InternalImpl::generate_seed(
                    game.blocks, base_seed.level_seed, current_level,
                );
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                // Apply gravity and clear any lines
                let mut counter: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter);
            }

            world.write_model(@game);
        }

        fn execute_move(
            ref self: ContractState,
            game_id: u64,
            row_index: u8,
            start_index: u8,
            final_index: u8,
            skill_data: felt252,
        ) -> (u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let mut run_data = game.get_run_data();
            let (skill_effects_addr, _) = world.dns(@"skill_effects_system").unwrap();
            let skill_effects_dispatcher = ISkillEffectsSystemDispatcher {
                contract_address: skill_effects_addr,
            };
            let world_effects = skill_effects_dispatcher
                .get_world_effects(game.run_data, skill_data);

            // Validate move limit
            assert!(run_data.level_moves.into() < game_level.max_moves, "Move limit exceeded");

            // Build constraints from GameLevel
            let constraint = LevelConstraint {
                constraint_type: game_level.constraint_type.into(),
                value: game_level.constraint_value,
                required_count: game_level.constraint_count,
            };
            let constraint_2 = LevelConstraint {
                constraint_type: game_level.constraint2_type.into(),
                value: game_level.constraint2_value,
                required_count: game_level.constraint2_count,
            };
            let constraint_3 = LevelConstraint {
                constraint_type: game_level.constraint3_type.into(),
                value: game_level.constraint3_value,
                required_count: game_level.constraint3_count,
            };

            // Compute highest occupied row BEFORE the move (for FillAndClear constraint)
            let highest_row_before = InternalImpl::highest_occupied_row(game.blocks);

            // Check if we need to track BreakBlocks (expensive — only when active)
            let track_break_blocks = any_needs_break_blocks(constraint, constraint_2, constraint_3);
            let break_target_size = if track_break_blocks {
                get_break_blocks_target_size(constraint, constraint_2, constraint_3)
            } else {
                0
            };
            let blocks_before = if track_break_blocks {
                game.blocks
            } else {
                0
            };

            // Perform the swipe
            let direction = final_index > start_index;
            let count = if direction {
                final_index - start_index
            } else {
                start_index - final_index
            };
            let mut new_blocks = Controller::swipe(
                game.blocks, row_index, start_index, direction, count,
            );

            // Assess and score (gravity + line clearing)
            let mut lines_cleared: u8 = 0;
            let points = InternalImpl::assess_game(ref new_blocks, ref lines_cleared);
            update_score(ref run_data, points);

            // Check grid full
            let is_full = InternalImpl::is_grid_full(new_blocks);
            if is_full {
                game.blocks = new_blocks;
                game.set_run_data(run_data);
                world.write_model(@game);
                return (0, true);
            }

            // Insert new line
            let difficulty: Difficulty = game_level.difficulty.into();
            let (new_blocks_after_insert, new_next_row) = InternalImpl::insert_new_line(
                new_blocks,
                game.next_row,
                difficulty,
                base_seed.seed,
                run_data.current_level,
                settings,
            );
            new_blocks = new_blocks_after_insert;

            // Assess again after new line
            let more_points = InternalImpl::assess_game(ref new_blocks, ref lines_cleared);
            update_score(ref run_data, more_points);

            if world_effects.surge_score_percent > 0 {
                let total_points_u32: u32 = points.into() + more_points.into();
                if total_points_u32 > 0 {
                    let mut total_pct = world_effects.surge_score_percent;
                    if world_effects.surge_per_level_percent > 0 && run_data.current_level > 1 {
                        let level_scale: u16 = world_effects.surge_per_level_percent.into()
                            * (run_data.current_level - 1).into();
                        total_pct += level_scale;
                    }
                    let surge_bonus_u32: u32 = (total_points_u32 * total_pct.into()) / 100;
                    if surge_bonus_u32 > 0 {
                        let surge_bonus: u16 = if surge_bonus_u32 > 65535_u32 {
                            65535_u16
                        } else {
                            surge_bonus_u32.try_into().unwrap()
                        };
                        update_score(ref run_data, surge_bonus);
                    }
                }
            }

            // Update combos and award cubes
            process_lines_cleared(
                ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared,
            );

            if world_effects.catalyst_threshold_reduction > 0
                || world_effects.catalyst_bonus_cubes > 0
                || world_effects.catalyst_bonus_score > 0
                || world_effects.catalyst_free_moves_on_combo > 0 {
                let effective_lines = saturating_add_u8(
                    lines_cleared, world_effects.catalyst_threshold_reduction,
                );

                // Combo-cube payouts are removed globally.
                // Catalyst can still add explicit cubes/score/free-moves as bounded effects.

                if effective_lines > 1 && world_effects.catalyst_bonus_cubes > 0 {
                    run_data
                        .total_cubes =
                            saturating_add_u16(
                                run_data.total_cubes, world_effects.catalyst_bonus_cubes.into(),
                            );
                }

                if effective_lines > 0 && world_effects.catalyst_bonus_score > 0 {
                    let catalyst_bonus_score: u16 = effective_lines.into()
                        * world_effects.catalyst_bonus_score.into();
                    update_score(ref run_data, catalyst_bonus_score);
                }

                if effective_lines > 1 && world_effects.catalyst_free_moves_on_combo > 0 {
                    run_data
                        .free_moves =
                            scoring::saturating_add_u8_capped(
                                run_data.free_moves, world_effects.catalyst_free_moves_on_combo, 15,
                            );
                }
            }

            // Count destroyed blocks of target size if tracking BreakBlocks
            let blocks_destroyed_of_target_size = if track_break_blocks {
                InternalImpl::count_blocks_of_size_diff(
                    blocks_before, new_blocks, break_target_size,
                )
            } else {
                0
            };

            // Compute highest occupied row AFTER the move resolves (post-gravity, post-line-clear)
            let highest_row_after = if new_blocks == 0 {
                0
            } else {
                InternalImpl::highest_occupied_row(new_blocks)
            };

            if world_effects.resilience_regen_on_clear > 0
                && lines_cleared >= world_effects.resilience_regen_on_clear {
                run_data
                    .free_moves =
                        scoring::saturating_add_u8_capped(
                            run_data.free_moves, world_effects.resilience_regen_amount, 15,
                        );
            }

            if lines_cleared > 0 {
                if world_effects.momentum_score_per_consec > 0 {
                    update_score(ref run_data, world_effects.momentum_score_per_consec.into());
                }

                if world_effects.momentum_streak_cube_threshold > 0
                    && lines_cleared >= world_effects.momentum_streak_cube_threshold
                    && world_effects.momentum_streak_cubes > 0 {
                    run_data
                        .total_cubes =
                            saturating_add_u16(
                                run_data.total_cubes, world_effects.momentum_streak_cubes.into(),
                            );
                }

                if world_effects.momentum_move_refund > 0 {
                    run_data
                        .free_moves =
                            scoring::saturating_add_u8_capped(
                                run_data.free_moves, world_effects.momentum_move_refund, 15,
                            );
                }

                if world_effects.momentum_combo_on_streak > 0 {
                    game
                        .combo_counter =
                            saturating_add_u8(
                                game.combo_counter, world_effects.momentum_combo_on_streak,
                            );
                }
            }

            if world_effects.adrenaline_row_threshold > 0
                && highest_row_after >= world_effects.adrenaline_row_threshold
                && lines_cleared > 0 {
                if world_effects.adrenaline_score_per_clear > 0 {
                    let adrenaline_score: u16 = lines_cleared.into()
                        * world_effects.adrenaline_score_per_clear.into();
                    update_score(ref run_data, adrenaline_score);
                }

                if world_effects.adrenaline_cubes_per_clear > 0 {
                    let adrenaline_cubes: u16 = lines_cleared.into()
                        * world_effects.adrenaline_cubes_per_clear.into();
                    run_data
                        .total_cubes = saturating_add_u16(run_data.total_cubes, adrenaline_cubes);
                }

                if world_effects.adrenaline_combo_multiplier > 1 {
                    let extra_combo_u16: u16 = lines_cleared.into()
                        * (world_effects.adrenaline_combo_multiplier - 1).into();
                    let extra_combo: u8 = if extra_combo_u16 > 255_u16 {
                        255_u8
                    } else {
                        extra_combo_u16.try_into().unwrap()
                    };
                    game.combo_counter = saturating_add_u8(game.combo_counter, extra_combo);
                }

                if world_effects.adrenaline_free_moves > 0
                    && lines_cleared >= world_effects.adrenaline_free_moves_threshold {
                    run_data
                        .free_moves =
                            scoring::saturating_add_u8_capped(
                                run_data.free_moves, world_effects.adrenaline_free_moves, 15,
                            );
                }
            }

            // Build ConstraintContext
            let ctx = ConstraintContext {
                lines_cleared,
                combo_counter: game.combo_counter,
                highest_row_before,
                highest_row_after,
                grid_is_empty: new_blocks == 0,
                blocks_destroyed_of_target_size,
            };

            // Update all three constraint progresses
            run_data
                .constraint_progress = constraint
                .update_progress(run_data.constraint_progress, ctx);
            run_data
                .constraint_2_progress = constraint_2
                .update_progress(run_data.constraint_2_progress, ctx);
            run_data
                .constraint_3_progress = constraint_3
                .update_progress(run_data.constraint_3_progress, ctx);

            // Increment level moves (or consume free move)
            if run_data.free_moves > 0 {
                run_data.free_moves -= 1;
                if world_effects.resilience_score_per_free > 0 {
                    update_score(ref run_data, world_effects.resilience_score_per_free.into());
                }
            } else {
                run_data.level_moves += 1;
            }

            // Charge rewards are handled in level_system at level completion:
            // - cadence source (every 5 levels)
            // - highest combo-tier source (once per level)

            // If grid is empty after all that, add another line
            if new_blocks == 0 {
                let (final_blocks, final_next_row) = InternalImpl::insert_new_line(
                    new_blocks,
                    new_next_row,
                    difficulty,
                    base_seed.seed,
                    run_data.current_level,
                    settings,
                );
                new_blocks = final_blocks;
                game.next_row = final_next_row;
            } else {
                game.next_row = new_next_row;
            }

            game.blocks = new_blocks;
            game.set_run_data(run_data);
            world.write_model(@game);

            (lines_cleared, false)
        }

        fn apply_bonus(
            ref self: ContractState,
            game_id: u64,
            bonus: Bonus,
            row_index: u8,
            col_index: u8,
            skill_data: felt252,
        ) -> u8 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let mut run_data = game.get_run_data();

            // Check bonus availability
            let available = run_data.get_bonus_charges(bonus.to_type_code()) > 0;
            assert!(available, "Bonus not available");

            // Get bonus level
            let bonus_type_u8 = bonus.to_type_code();
            let bonus_level = run_data.get_bonus_level(bonus_type_u8);
            let (skill_effects_addr, _) = world.dns(@"skill_effects_system").unwrap();
            let skill_effects_dispatcher = ISkillEffectsSystemDispatcher {
                contract_address: skill_effects_addr,
            };
            let branch_id = skill_effects_dispatcher.get_branch_id(skill_data, bonus_type_u8);
            let effect = skill_effects_dispatcher
                .get_bonus_effect(bonus_type_u8, bonus_level, branch_id);

            // Apply bonus effect
            let mut new_blocks = game.blocks;
            let mut new_next_row = game.next_row;

            match bonus {
                Bonus::Combo => {
                    game.combo_counter = saturating_add_u8(game.combo_counter, effect.combo_add);

                    if effect.combo_add_from_score > 0 {
                        game
                            .combo_counter =
                                saturating_add_u8(game.combo_counter, effect.combo_add_from_score);
                    }

                    if effect.cube_per_use > 0 {
                        run_data
                            .total_cubes =
                                saturating_add_u16(
                                    run_data.total_cubes, effect.cube_per_use.into(),
                                );
                    }
                },
                Bonus::Score => {
                    let mut score: u16 = effect.score_add;

                    if effect.score_doubles_under_moves > 0 {
                        let moves_remaining: u16 = game_level.max_moves
                            - run_data.level_moves.into();
                        if moves_remaining <= effect.score_doubles_under_moves.into() {
                            if effect.score_triples {
                                score *= 3;
                            } else {
                                score *= 2;
                            }
                        }
                    }

                    update_score(ref run_data, score);

                    if effect.combo_add_from_score > 0 {
                        game
                            .combo_counter =
                                saturating_add_u8(game.combo_counter, effect.combo_add_from_score);
                    }

                    if effect.cube_per_use > 0 {
                        run_data
                            .total_cubes =
                                saturating_add_u16(
                                    run_data.total_cubes, effect.cube_per_use.into(),
                                );
                    }

                    if effect.score_div10_as_cubes {
                        let cube_bonus: u16 = score / 10;
                        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cube_bonus);
                    }
                },
                Bonus::Harvest => {
                    let blocks_destroyed = harvest::count_blocks_of_size(
                        game.blocks, row_index, col_index,
                    );
                    let cube_reward: u16 = blocks_destroyed.into()
                        * effect.cube_reward_per_block.into();
                    run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cube_reward);

                    if effect.harvest_score_per_block > 0 {
                        let score_bonus: u16 = blocks_destroyed.into()
                            * effect.harvest_score_per_block.into();
                        update_score(ref run_data, score_bonus);
                    }

                    if effect.harvest_free_moves > 0 {
                        run_data
                            .free_moves =
                                scoring::saturating_add_u8_capped(
                                    run_data.free_moves, effect.harvest_free_moves, 15,
                                );
                    }

                    new_blocks = harvest::BonusImpl::apply(game.blocks, row_index, col_index);
                },
                Bonus::Wave => {
                    let rows_to_clear = effect.rows_to_clear;
                    let mut wave_blocks_cleared: u8 = 0;
                    new_blocks = game.blocks;
                    let mut i: u8 = 0;
                    loop {
                        if i >= rows_to_clear {
                            break;
                        }
                        let target_row = if row_index + i < constants::DEFAULT_GRID_HEIGHT {
                            row_index + i
                        } else {
                            break;
                        };
                        wave_blocks_cleared +=
                            InternalImpl::count_non_empty_blocks_in_row(new_blocks, target_row);
                        new_blocks = wave::BonusImpl::apply(new_blocks, target_row, 0);
                        i += 1;
                    }

                    if effect.wave_score_per_block > 0 && wave_blocks_cleared > 0 {
                        let score_bonus: u16 = wave_blocks_cleared.into()
                            * effect.wave_score_per_block.into();
                        update_score(ref run_data, score_bonus);
                    }

                    if effect.wave_free_moves > 0 {
                        run_data
                            .free_moves =
                                scoring::saturating_add_u8_capped(
                                    run_data.free_moves, effect.wave_free_moves, 15,
                                );
                    }

                    if effect.wave_combo_add > 0 {
                        game
                            .combo_counter =
                                saturating_add_u8(game.combo_counter, effect.wave_combo_add);
                    }

                    if effect.wave_cube_per_row > 0 {
                        let cube_bonus: u16 = rows_to_clear.into()
                            * effect.wave_cube_per_row.into();
                        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cube_bonus);
                    }

                    if effect.wave_auto_add_line {
                        let difficulty: Difficulty = game_level.difficulty.into();
                        let new_seed = InternalImpl::generate_seed(
                            new_blocks, base_seed.seed, run_data.current_level,
                        );
                        let new_row = Controller::create_line(new_seed, difficulty, settings);
                        new_blocks = Controller::add_line(new_blocks, new_next_row);
                        new_next_row = new_row;
                    }
                },
                Bonus::Supply => {
                    let lines_to_add = effect.lines_to_add;
                    let difficulty: Difficulty = game_level.difficulty.into();
                    let mut i: u8 = 0;
                    loop {
                        if i >= lines_to_add {
                            break;
                        }
                        let new_seed = InternalImpl::generate_seed(
                            new_blocks, base_seed.seed, run_data.current_level,
                        );
                        let new_row = Controller::create_line(new_seed, difficulty, settings);
                        new_blocks = Controller::add_line(new_blocks, new_next_row);
                        new_next_row = new_row;
                        i += 1;
                    }

                    if effect.supply_score_per_line > 0 {
                        let score_bonus: u16 = lines_to_add.into()
                            * effect.supply_score_per_line.into();
                        update_score(ref run_data, score_bonus);
                    }

                    if effect.supply_cube_reward > 0 {
                        run_data
                            .total_cubes =
                                saturating_add_u16(
                                    run_data.total_cubes, effect.supply_cube_reward.into(),
                                );
                    }

                    if effect.supply_free_moves > 0 {
                        run_data
                            .free_moves =
                                scoring::saturating_add_u8_capped(
                                    run_data.free_moves, effect.supply_free_moves, 15,
                                );
                    }
                },
                Bonus::None => {},
            }

            let should_consume_charge = if effect.chance_no_consume_num > 0
                && effect.chance_no_consume_den > 0 {
                if effect.chance_no_consume_num >= effect.chance_no_consume_den {
                    false
                } else {
                    let rng_state = PoseidonTrait::new()
                        .update(base_seed.seed)
                        .update(run_data.level_moves.into())
                        .update(bonus_type_u8.into())
                        .finalize();
                    let rng_val: u256 = rng_state.into();
                    let roll: u8 = (rng_val % effect.chance_no_consume_den.into())
                        .try_into()
                        .unwrap();
                    roll >= effect.chance_no_consume_num
                }
            } else if effect.wave_chance_no_consume {
                let rng_state = PoseidonTrait::new()
                    .update(base_seed.seed)
                    .update(run_data.level_moves.into())
                    .update(4_felt252)
                    .finalize();
                let rng_val: u256 = rng_state.into();
                (rng_val % 2_u256) != 0_u256
            } else {
                true
            };

            if should_consume_charge {
                run_data.use_bonus_charge(bonus_type_u8);
            }

            if !should_consume_charge && effect.free_move_on_proc > 0 {
                run_data
                    .free_moves =
                        scoring::saturating_add_u8_capped(
                            run_data.free_moves, effect.free_move_on_proc, 15,
                        );
            }

            if effect.charge_all_bonus {
                let mut slot: u8 = 0;
                loop {
                    if slot >= run_data.active_slot_count || slot >= 3 {
                        break;
                    }
                    let sid = run_data.get_slot_skill(slot);
                    if sid >= 1 && sid <= 5 {
                        run_data.add_bonus_charge(sid);
                    }
                    slot += 1;
                };
            }

            // Mark bonus used
            run_data.bonus_used_this_level = true;

            // Assess game (gravity + line clearing)
            let mut lines_cleared: u8 = 0;
            let points = InternalImpl::assess_game(ref new_blocks, ref lines_cleared);
            update_score(ref run_data, points);

            if effect.bonus_score_per_line > 0 && lines_cleared > 0 {
                let extra_score: u16 = lines_cleared.into() * effect.bonus_score_per_line.into();
                update_score(ref run_data, extra_score);
            }

            // Update combos
            process_lines_cleared(
                ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared,
            );

            game.blocks = new_blocks;
            game.next_row = new_next_row;
            game.set_run_data(run_data);
            world.write_model(@game);

            lines_cleared
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);

            if game.blocks != 0 {
                return;
            }

            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let run_data = game.get_run_data();

            let difficulty: Difficulty = game_level.difficulty.into();
            let (new_blocks, new_next_row) = InternalImpl::insert_new_line(
                game.blocks,
                game.next_row,
                difficulty,
                base_seed.seed,
                run_data.current_level,
                settings,
            );

            game.blocks = new_blocks;
            game.next_row = new_next_row;
            world.write_model(@game);
        }

        fn assess_grid(ref self: ContractState, game_id: u64) -> (u8, u16) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let mut lines_cleared: u8 = 0;
            let points = InternalImpl::assess_game(ref game.blocks, ref lines_cleared);

            world.write_model(@game);

            (lines_cleared, points)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Apply gravity and assess lines until stable.
        fn assess_game(ref blocks: felt252, ref counter: u8) -> u16 {
            let mut points = 0;
            let mut upper_blocks = 0;
            loop {
                let mut inner_blocks = 0;
                loop {
                    if inner_blocks == blocks {
                        break;
                    }
                    inner_blocks = blocks;
                    blocks = Controller::apply_gravity(blocks);
                }
                blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
                if upper_blocks == blocks {
                    break points;
                }
                upper_blocks = blocks;
            }
        }

        /// Check if grid is full (top row has blocks).
        #[inline(always)]
        fn is_grid_full(blocks: felt252) -> bool {
            let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
                * constants::ROW_BIT_COUNT.into();
            let div: u256 = fast_power(2, exp) - 1;
            blocks.into() / div > 0
        }

        /// Insert a new line at the bottom.
        fn insert_new_line(
            blocks: felt252,
            current_next_row: u32,
            difficulty: Difficulty,
            seed: felt252,
            current_level: u8,
            settings: GameSettings,
        ) -> (felt252, u32) {
            let new_seed = Self::generate_seed(blocks, seed, current_level);
            let new_next_row = Controller::create_line(new_seed, difficulty, settings);
            let new_blocks = Controller::add_line(blocks, current_next_row);
            (new_blocks, new_next_row)
        }

        /// Generate deterministic seed from state.
        #[inline(always)]
        fn generate_seed(blocks: felt252, base_seed: felt252, current_level: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(base_seed);
            let state = state.update(blocks.into());
            let state = state.update(current_level.into());
            state.finalize()
        }

        // apply_bonus_effect removed - dispatch logic is now inline in apply_bonus()

        /// Compute the highest occupied row index (0 = bottom, 9 = top).
        /// Returns 0 if grid is empty.
        fn highest_occupied_row(blocks: felt252) -> u8 {
            let blocks_u256: u256 = blocks.into();
            if blocks_u256 == 0 {
                return 0;
            }
            let row_mask: u256 = 0xFFFFFF; // 24-bit mask for one row
            let mut row: u8 = constants::DEFAULT_GRID_HEIGHT - 1; // Start from top (row 9)
            loop {
                let shift: u256 = row.into() * constants::ROW_BIT_COUNT.into();
                let row_bits = (blocks_u256 / fast_power(2_u256, shift)) & row_mask;
                if row_bits > 0 {
                    break row;
                }
                if row == 0 {
                    break 0;
                }
                row -= 1;
            }
        }

        /// Count blocks of a specific size that were destroyed between two grid states.
        /// Compares blocks_before and blocks_after, counting blocks of target_size
        /// that exist in before but not in after.
        fn count_blocks_of_size_diff(
            blocks_before: felt252, blocks_after: felt252, target_size: u8,
        ) -> u8 {
            let before_u256: u256 = blocks_before.into();
            let after_u256: u256 = blocks_after.into();
            let block_mask: u256 = 0x7; // 3-bit mask for one block
            let total_blocks: u8 = constants::DEFAULT_GRID_HEIGHT
                * constants::DEFAULT_GRID_WIDTH; // 80
            let mut count: u8 = 0;
            let mut i: u8 = 0;
            loop {
                if i >= total_blocks {
                    break;
                }
                let shift: u256 = (i.into()) * constants::BLOCK_BIT_COUNT.into();
                let divisor = fast_power(2_u256, shift);
                let before_val: u8 = ((before_u256 / divisor) & block_mask).try_into().unwrap();
                let after_val: u8 = ((after_u256 / divisor) & block_mask).try_into().unwrap();
                // Block was present before and gone after, and matches target size
                if before_val == target_size && after_val == 0 {
                    count += 1;
                }
                i += 1;
            }
            count
        }

        /// Count non-empty blocks in a specific row.
        fn count_non_empty_blocks_in_row(blocks: felt252, row: u8) -> u8 {
            if row >= constants::DEFAULT_GRID_HEIGHT {
                return 0;
            }

            let blocks_u256: u256 = blocks.into();
            let mut col: u8 = 0;
            let mut count: u8 = 0;
            loop {
                if col >= constants::DEFAULT_GRID_WIDTH {
                    break;
                }

                let idx: u8 = row * constants::DEFAULT_GRID_WIDTH + col;
                let shift: u256 = idx.into() * constants::BLOCK_BIT_COUNT.into();
                let val: u8 = ((blocks_u256 / fast_power(2_u256, shift)) & 0x7_u256)
                    .try_into()
                    .unwrap();
                if val > 0 {
                    count += 1;
                }
                col += 1;
            }

            count
        }
    }
}
