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
        final_index: u8
    ) -> (u8, bool);
    
    /// Apply a bonus effect to the grid.
    /// Returns lines_cleared
    fn apply_bonus(
        ref self: T, 
        game_id: u64, 
        bonus: Bonus, 
        row_index: u8, 
        col_index: u8
    ) -> u8;
    
    /// Insert a new line if the grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: u64);
    
    /// Assess the grid (apply gravity, clear lines).
    /// Returns (lines_cleared, points)
    fn assess_grid(ref self: T, game_id: u64) -> (u8, u16);
}

#[dojo::contract]
mod grid_system {
    use zkube::constants::{self, DEFAULT_NS};
    use zkube::models::game::{Game, GameTrait, GameLevel};
    use zkube::models::game::GameSeed;
    use zkube::models::config::GameSettings;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::packing::RunData;
    use zkube::helpers::scoring::{
        saturating_add_u8, saturating_add_u16,
        process_lines_cleared, update_score,
    };
    use zkube::types::bonus::{Bonus, BonusTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::constraint::{
        LevelConstraint, LevelConstraintTrait, ConstraintContext,
        any_needs_break_blocks, get_break_blocks_target_size,
    };

    // Import bonus implementations (only grid-modifying bonuses need element files)
    use zkube::elements::bonuses::harvest;
    use zkube::elements::bonuses::wave;

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;

    use alexandria_math::fast_power::fast_power;
    use core::poseidon::{PoseidonTrait, HashState};
    use core::hash::HashStateTrait;

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
            let level_seed = GameTrait::generate_level_seed(base_seed.seed, 1);
            
            // Create initial next_row
            game.next_row = Controller::create_line(level_seed, difficulty, settings);
            
            // Fill grid until it has at least 4 rows of blocks
            let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                };
                // Insert the next_row and generate a new one
                let new_seed = InternalImpl::generate_seed(game.blocks, base_seed.seed, 1);
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;
                
                // Apply gravity and clear any lines
                let mut counter: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter);
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
            let level_seed = GameTrait::generate_level_seed(base_seed.seed, current_level);
            
            // Reset grid
            game.blocks = 0;
            game.next_row = Controller::create_line(level_seed, difficulty, settings);
            
            // Fill grid until it has at least 4 rows of blocks
            let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
            loop {
                if game.blocks.into() / div > 0 {
                    break;
                };
                // Insert the next_row and generate a new one
                let new_seed = InternalImpl::generate_seed(game.blocks, base_seed.seed, current_level);
                let new_next_row = Controller::create_line(new_seed, difficulty, settings);
                game.blocks = Controller::add_line(game.blocks, game.next_row);
                game.next_row = new_next_row;
                
                // Apply gravity and clear any lines
                let mut counter: u8 = 0;
                InternalImpl::assess_game(ref game.blocks, ref counter);
            };
            
            world.write_model(@game);
        }
        
        fn execute_move(
            ref self: ContractState,
            game_id: u64,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) -> (u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            
            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            
            let mut run_data = game.get_run_data();
            
            // Validate move limit
            let effective_max_moves: u16 = game_level.max_moves + run_data.extra_moves.into();
            assert!(run_data.level_moves.into() < effective_max_moves, "Move limit exceeded");
            
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
            let blocks_before = if track_break_blocks { game.blocks } else { 0 };
            
            // Perform the swipe
            let direction = final_index > start_index;
            let count = if direction {
                final_index - start_index
            } else {
                start_index - final_index
            };
            let mut new_blocks = Controller::swipe(game.blocks, row_index, start_index, direction, count);
            
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
                new_blocks, game.next_row, difficulty, base_seed.seed, run_data.current_level, settings
            );
            new_blocks = new_blocks_after_insert;
            
            // Assess again after new line
            let more_points = InternalImpl::assess_game(ref new_blocks, ref lines_cleared);
            update_score(ref run_data, more_points);
            
            // Update combos and award cubes
            process_lines_cleared(ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared);
            
            // Count destroyed blocks of target size if tracking BreakBlocks
            let blocks_destroyed_of_target_size = if track_break_blocks {
                InternalImpl::count_blocks_of_size_diff(blocks_before, new_blocks, break_target_size)
            } else {
                0
            };
            
            // Compute highest occupied row AFTER the move resolves (post-gravity, post-line-clear)
            let highest_row_after = if new_blocks == 0 { 0 } else { InternalImpl::highest_occupied_row(new_blocks) };
            
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
            run_data.constraint_progress = constraint.update_progress(run_data.constraint_progress, ctx);
            run_data.constraint_2_progress = constraint_2.update_progress(run_data.constraint_2_progress, ctx);
            run_data.constraint_3_progress = constraint_3.update_progress(run_data.constraint_3_progress, ctx);
            
            // Increment level moves (or consume free move)
            if run_data.free_moves > 0 {
                run_data.free_moves -= 1;
            } else {
                run_data.level_moves += 1;
            }
            
            // If grid is empty after all that, add another line
            if new_blocks == 0 {
                let (final_blocks, final_next_row) = InternalImpl::insert_new_line(
                    new_blocks, new_next_row, difficulty, base_seed.seed, run_data.current_level, settings
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
        ) -> u8 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            
            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            
            let mut run_data = game.get_run_data();
            
            // Check bonus availability
            let available = match bonus {
                Bonus::Combo => run_data.combo_count > 0,
                Bonus::Score => run_data.score_count > 0,
                Bonus::Harvest => run_data.harvest_count > 0,
                Bonus::Wave => run_data.wave_count > 0,
                Bonus::Supply => run_data.supply_count > 0,
                Bonus::None => false,
            };
            assert!(available, "Bonus not available");
            
            // Get bonus level
            let bonus_type_u8 = bonus.to_type_code();
            let bonus_level = InternalImpl::get_bonus_level(@run_data, bonus_type_u8);
            
            // Apply bonus effect
            let mut new_blocks = game.blocks;
            let mut new_next_row = game.next_row;
            
            match bonus {
                Bonus::Combo => {
                    // Non-grid bonus: Add (bonus_level + 1) to combo counter
                    let combo_add: u8 = bonus_level + 1;
                    game.combo_counter = saturating_add_u8(game.combo_counter, combo_add);
                },
                Bonus::Score => {
                    // Non-grid bonus: Add (bonus_level + 1) * 10 to level score
                    let score_add: u16 = ((bonus_level + 1).into()) * 10_u16;
                    update_score(ref run_data, score_add);
                },
                Bonus::Harvest => {
                    // Grid bonus: Clear all blocks of target size + CUBE rewards
                    // Count blocks before clearing for CUBE calculation
                    let blocks_destroyed = harvest::count_blocks_of_size(game.blocks, row_index, col_index);
                    let cube_reward: u16 = blocks_destroyed.into() * (bonus_level + 1).into();
                    run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cube_reward);
                    // Apply the grid clear
                    new_blocks = harvest::BonusImpl::apply(game.blocks, row_index, col_index);
                },
                Bonus::Wave => {
                    // Grid bonus: Clear (bonus_level + 1) rows starting from row_index
                    let rows_to_clear: u8 = bonus_level + 1;
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
                        new_blocks = wave::BonusImpl::apply(new_blocks, target_row, 0);
                        i += 1;
                    };
                },
                Bonus::Supply => {
                    // Non-grid technically: Add (bonus_level + 1) lines at no move cost
                    let lines_to_add: u8 = bonus_level + 1;
                    let difficulty: Difficulty = game_level.difficulty.into();
                    let mut i: u8 = 0;
                    loop {
                        if i >= lines_to_add {
                            break;
                        }
                        let new_seed = InternalImpl::generate_seed(new_blocks, base_seed.seed, run_data.current_level);
                        let new_row = Controller::create_line(new_seed, difficulty, settings);
                        new_blocks = Controller::add_line(new_blocks, new_next_row);
                        new_next_row = new_row;
                        i += 1;
                    };
                },
                Bonus::None => {},
            }
            
            // Decrement bonus count
            match bonus {
                Bonus::Combo => run_data.combo_count -= 1,
                Bonus::Score => run_data.score_count -= 1,
                Bonus::Harvest => run_data.harvest_count -= 1,
                Bonus::Wave => run_data.wave_count -= 1,
                Bonus::Supply => run_data.supply_count -= 1,
                Bonus::None => {},
            }
            
            // Mark bonus used
            run_data.bonus_used_this_level = true;
            
            // Assess game (gravity + line clearing)
            let mut lines_cleared: u8 = 0;
            let points = InternalImpl::assess_game(ref new_blocks, ref lines_cleared);
            update_score(ref run_data, points);
            
            // Update combos
            process_lines_cleared(ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared);
            
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
                game.blocks, game.next_row, difficulty, base_seed.seed, run_data.current_level, settings
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
                    };
                    inner_blocks = blocks;
                    blocks = Controller::apply_gravity(blocks);
                };
                blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
                if upper_blocks == blocks {
                    break points;
                };
                upper_blocks = blocks;
            }
        }
        
        /// Check if grid is full (top row has blocks).
        #[inline(always)]
        fn is_grid_full(blocks: felt252) -> bool {
            let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1) * constants::ROW_BIT_COUNT.into();
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
        fn count_blocks_of_size_diff(blocks_before: felt252, blocks_after: felt252, target_size: u8) -> u8 {
            let before_u256: u256 = blocks_before.into();
            let after_u256: u256 = blocks_after.into();
            let block_mask: u256 = 0x7; // 3-bit mask for one block
            let total_blocks: u8 = constants::DEFAULT_GRID_HEIGHT * constants::DEFAULT_GRID_WIDTH; // 80
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
            };
            count
        }
        
        /// Get bonus level (0-2) for a bonus type.
        #[inline(always)]
        fn get_bonus_level(run_data: @RunData, bonus_type: u8) -> u8 {
            if *run_data.selected_bonus_1 == bonus_type {
                *run_data.bonus_1_level
            } else if *run_data.selected_bonus_2 == bonus_type {
                *run_data.bonus_2_level
            } else if *run_data.selected_bonus_3 == bonus_type {
                *run_data.bonus_3_level
            } else {
                0
            }
        }
    }
}
