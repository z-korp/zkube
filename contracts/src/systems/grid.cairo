//! Grid System - handles all grid operations.
//!
//! This system owns all heavy grid logic:
//! - Block swipes (Controller)
//! - Gravity and line clearing
//! - Line creation and insertion
//! - All active skill implementations
//! - Passive skill hooks during move resolution
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

    /// Apply an active skill effect to the grid.
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
    use alexandria_math::BitShift;
    use core::hash::HashStateTrait;
    use core::poseidon::{HashState, PoseidonTrait};
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use zkube::constants::{self, DEFAULT_NS};

    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::scoring::{
        process_lines_cleared, update_score,
    };
    use zkube::models::config::GameSettings;
    use zkube::models::game::{Game, GameLevel, GameSeed, GameTrait};
    use zkube::types::bonus::Bonus;
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
            let div: u256 = BitShift::shl(1_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                let new_seed = InternalImpl::generate_seed(game.blocks, base_seed.level_seed, 1);
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                let mut counter: u8 = 0;
                let mut _cascade: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter, ref _cascade);
            };

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
            let div: u256 = BitShift::shl(1_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                }
                let new_seed = InternalImpl::generate_seed(
                    game.blocks, base_seed.level_seed, current_level,
                );
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;

                let mut counter: u8 = 0;
                let mut _cascade: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter, ref _cascade);
            };

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
            let constraint_3 = LevelConstraintTrait::none();

            // Compute highest occupied row BEFORE the move (for FillAndClear constraint)
            let highest_row_before = InternalImpl::highest_occupied_row(game.blocks);

            // Check if we need to track BreakBlocks (expensive — only when active)
            let track_break_blocks = any_needs_break_blocks(constraint, constraint_2, constraint_3);
            let break_target_size = if track_break_blocks {
                get_break_blocks_target_size(constraint, constraint_2, constraint_3)
            } else {
                0
            };
            let (break_count_before, break_added_count) = if track_break_blocks {
                (
                    InternalImpl::count_blocks_of_size(game.blocks, break_target_size),
                    InternalImpl::count_blocks_of_size_in_row(game.next_row, break_target_size),
                )
            } else {
                (0_u8, 0_u8)
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

            // Assess and score (gravity + line clearing) with cascade depth tracking
            let mut lines_cleared: u8 = 0;
            let mut cascade_depth: u8 = 0;
            let points = InternalImpl::assess_game(
                ref new_blocks, ref lines_cleared, ref cascade_depth,
            );
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
            let mut cascade_depth_2: u8 = 0;
            let more_points = InternalImpl::assess_game(
                ref new_blocks, ref lines_cleared, ref cascade_depth_2,
            );
            update_score(ref run_data, more_points);
            // Use the max cascade depth from both phases
            if cascade_depth_2 > cascade_depth {
                cascade_depth = cascade_depth_2;
            }

            // Update combos and award cube bonuses for multi-line clears
            process_lines_cleared(
                ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared,
            );

            // Compute grid height once — recompute only when grid is modified below
            let mut current_height: u8 = if new_blocks == 0 {
                0
            } else {
                InternalImpl::highest_occupied_row(new_blocks)
            };

            // Count destroyed blocks of target size using total count approach
            // Positional diff is wrong because blocks shift (gravity, new line insertion)
            let blocks_destroyed_of_target_size = if track_break_blocks {
                let count_after = InternalImpl::count_blocks_of_size(
                    new_blocks, break_target_size,
                );
                let total_available: u8 = break_count_before + break_added_count;
                if total_available > count_after {
                    total_available - count_after
                } else {
                    0
                }
            } else {
                0
            };

            let ctx = ConstraintContext {
                lines_cleared,
                combo_counter: game.combo_counter,
                highest_row_before,
                highest_row_after: current_height,
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

            // Increment level moves
            run_data.level_moves += 1;

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
            let _ = game_id;
            let _ = bonus;
            let _ = row_index;
            let _ = col_index;
            let _ = skill_data;
            0
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
            let mut _cascade_depth: u8 = 0;
            let points = InternalImpl::assess_game(ref game.blocks, ref lines_cleared, ref _cascade_depth);

            world.write_model(@game);

            (lines_cleared, points)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Apply gravity and assess lines until stable, tracking cascade depth.
        fn assess_game(
            ref blocks: felt252, ref counter: u8, ref cascade_depth: u8,
        ) -> u16 {
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
                };
                blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
                if upper_blocks == blocks {
                    break points;
                }
                upper_blocks = blocks;
                cascade_depth += 1;
            }
        }

        /// Check if grid is full (top row has blocks).
        #[inline(always)]
        fn is_grid_full(blocks: felt252) -> bool {
            let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
                * constants::ROW_BIT_COUNT.into();
            BitShift::shr(blocks.into(), exp) > 0
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
                let row_bits = BitShift::shr(blocks_u256, shift) & row_mask;
                if row_bits > 0 {
                    break row;
                }
                if row == 0 {
                    break 0;
                }
                row -= 1;
            }
        }

        /// Count total blocks of a specific size in the entire grid.
        fn count_blocks_of_size(blocks: felt252, target_size: u8) -> u8 {
            let blocks_u256: u256 = blocks.into();
            if blocks_u256 == 0 {
                return 0;
            }
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
                let val: u8 = (BitShift::shr(blocks_u256, shift) & block_mask).try_into().unwrap();
                if val == target_size {
                    count += 1;
                }
                i += 1;
            };
            count
        }

        /// Count blocks of a specific size in a single row (u32, 8 blocks × 3 bits).
        fn count_blocks_of_size_in_row(row: u32, target_size: u8) -> u8 {
            let row_u256: u256 = row.into();
            let block_mask: u256 = 0x7;
            let mut count: u8 = 0;
            let mut col: u8 = 0;
            loop {
                if col >= constants::DEFAULT_GRID_WIDTH {
                    break;
                }
                let shift: u256 = col.into() * constants::BLOCK_BIT_COUNT.into();
                let val: u8 = (BitShift::shr(row_u256, shift) & block_mask).try_into().unwrap();
                if val == target_size {
                    count += 1;
                }
                col += 1;
            };
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
                let val: u8 = (BitShift::shr(blocks_u256, shift) & 0x7_u256)
                    .try_into()
                    .unwrap();
                if val > 0 {
                    count += 1;
                }
                col += 1;
            };

            count
        }
    }
}
