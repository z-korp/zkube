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
        saturating_add_u8, saturating_add_u16, saturating_add_u8_capped,
        process_lines_cleared, update_score,
    };
    use zkube::types::bonus::{Bonus, BonusTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::constraint::LevelConstraintTrait;

    // Import all bonus implementations
    use zkube::elements::bonuses::hammer;
    use zkube::elements::bonuses::totem;
    use zkube::elements::bonuses::wave;
    use zkube::elements::bonuses::shrink::{self, apply_shrink_same_size, apply_shrink_all};
    use zkube::elements::bonuses::shuffle::{self, shuffle_next_line, shuffle_entire_grid};

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;

    use alexandria_math::fast_power::fast_power;
    use core::poseidon::{PoseidonTrait, HashState};
    use core::hash::HashStateTrait;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl GridSystemImpl of super::IGridSystem<ContractState> {
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
            
            // Update constraint progress
            let constraint_type: zkube::types::constraint::ConstraintType = game_level.constraint_type.into();
            let constraint = zkube::types::constraint::LevelConstraint {
                constraint_type,
                value: game_level.constraint_value,
                required_count: game_level.constraint_count,
            };
            run_data.constraint_progress = constraint.update_progress(run_data.constraint_progress, lines_cleared);
            
            // Update secondary constraint
            let constraint2_type: zkube::types::constraint::ConstraintType = game_level.constraint2_type.into();
            let constraint_2 = zkube::types::constraint::LevelConstraint {
                constraint_type: constraint2_type,
                value: game_level.constraint2_value,
                required_count: game_level.constraint2_count,
            };
            run_data.constraint_2_progress = constraint_2.update_progress(run_data.constraint_2_progress, lines_cleared);
            
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
            
            let mut run_data = game.get_run_data();
            
            // Check bonus availability
            let available = match bonus {
                Bonus::Hammer => run_data.hammer_count > 0,
                Bonus::Wave => run_data.wave_count > 0,
                Bonus::Totem => run_data.totem_count > 0,
                Bonus::Shrink => run_data.shrink_count > 0,
                Bonus::Shuffle => run_data.shuffle_count > 0,
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
                Bonus::Totem => {
                    if bonus_level == 2 {
                        new_blocks = 0; // L3: clear entire grid
                    } else {
                        new_blocks = InternalImpl::apply_bonus_effect(bonus, game.blocks, row_index, col_index);
                    }
                },
                Bonus::Shrink => {
                    if bonus_level == 2 {
                        new_blocks = apply_shrink_all(game.blocks);
                    } else if bonus_level == 1 {
                        new_blocks = apply_shrink_same_size(game.blocks, row_index, col_index);
                    } else {
                        new_blocks = InternalImpl::apply_bonus_effect(bonus, game.blocks, row_index, col_index);
                    }
                },
                Bonus::Shuffle => {
                    if bonus_level == 2 {
                        new_blocks = shuffle_entire_grid(game.blocks, base_seed.seed);
                    } else if bonus_level == 1 {
                        new_next_row = shuffle_next_line(game.next_row, base_seed.seed);
                    } else {
                        new_blocks = InternalImpl::apply_bonus_effect(bonus, game.blocks, row_index, col_index);
                    }
                },
                _ => {
                    new_blocks = InternalImpl::apply_bonus_effect(bonus, game.blocks, row_index, col_index);
                },
            }
            
            // Apply level-scaled effects
            match bonus {
                Bonus::Hammer => {
                    if bonus_level >= 1 {
                        game.combo_counter = saturating_add_u8(game.combo_counter, 1);
                    }
                    if bonus_level >= 2 {
                        game.combo_counter = saturating_add_u8(game.combo_counter, 1);
                    }
                },
                Bonus::Wave => {
                    if bonus_level >= 1 {
                        run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
                    }
                    if bonus_level >= 2 {
                        run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
                    }
                },
                Bonus::Totem => {
                    if bonus_level == 1 {
                        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
                    }
                },
                _ => {},
            }
            
            // Decrement bonus count
            match bonus {
                Bonus::Hammer => run_data.hammer_count -= 1,
                Bonus::Wave => run_data.wave_count -= 1,
                Bonus::Totem => run_data.totem_count -= 1,
                Bonus::Shrink => run_data.shrink_count -= 1,
                Bonus::Shuffle => run_data.shuffle_count -= 1,
                Bonus::None => {},
            }
            
            // Mark bonus used
            run_data.bonus_used_this_level = true;
            
            // Assess game
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
        
        /// Apply bonus effect (dispatch to implementation).
        #[inline(always)]
        fn apply_bonus_effect(bonus: Bonus, blocks: felt252, row: u8, col: u8) -> felt252 {
            match bonus {
                Bonus::None => blocks,
                Bonus::Hammer => hammer::BonusImpl::apply(blocks, row, col),
                Bonus::Totem => totem::BonusImpl::apply(blocks, row, col),
                Bonus::Wave => wave::BonusImpl::apply(blocks, row, col),
                Bonus::Shrink => shrink::BonusImpl::apply(blocks, row, col),
                Bonus::Shuffle => shuffle::BonusImpl::apply(blocks, row, col),
            }
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
