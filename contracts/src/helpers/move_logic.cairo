//! Move application logic - separated from Game model to reduce contract size.
//! 
//! This module contains the make_move function and grid manipulation logic.
//! It should ONLY be imported by move_system to avoid duplicating the code
//! in other systems.

use zkube::helpers::packing::{RunData, RunDataPackingTrait};
use zkube::helpers::scoring::{process_lines_cleared, update_score};
use zkube::helpers::controller::Controller;
use zkube::helpers::level::LevelGeneratorTrait;
use zkube::models::config::GameSettings;
use zkube::types::difficulty::Difficulty;
use zkube::types::constraint::LevelConstraintTrait;

use alexandria_math::fast_power::fast_power;
use zkube::constants;

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

/// Make a move on the grid.
/// 
/// This function:
/// 1. Validates move is within bounds
/// 2. Performs the swipe
/// 3. Applies gravity and assesses lines
/// 4. Inserts new line
/// 5. Updates score and combo tracking
/// 6. Updates constraint progress
/// 
/// Arguments:
/// - blocks: Current grid state
/// - next_row: The upcoming row
/// - combo_counter: Current combo (per-level)
/// - max_combo: Best combo this level
/// - run_data: Packed run progress data
/// - seed: Game seed for level generation
/// - row_index: Row to swipe
/// - start_index: Starting column
/// - final_index: Target column
/// - settings: Game settings for level config
/// 
/// Returns: (updated_blocks, updated_next_row, lines_cleared, is_grid_full)
pub fn make_move_on_grid(
    blocks: felt252,
    next_row: u32,
    ref combo_counter: u8,
    ref max_combo: u8,
    ref run_data: RunData,
    seed: felt252,
    row_index: u8,
    start_index: u8,
    final_index: u8,
    settings: GameSettings,
) -> (felt252, u32, u8, bool) {
    // Get current level config using settings
    let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);

    // Prevent overflowing the move counter; failing happens when moves reach max.
    let effective_max_moves: u16 = level_config.max_moves + run_data.extra_moves.into();
    assert!(run_data.level_moves.into() < effective_max_moves, "Move limit exceeded");

    // Perform the swipe
    let direction = final_index > start_index;
    let count = if direction {
        final_index - start_index
    } else {
        start_index - final_index
    };
    let mut new_blocks = Controller::swipe(blocks, row_index, start_index, direction, count);

    // Assess and score
    let mut lines_cleared: u8 = 0;
    let points = assess_game(ref new_blocks, ref lines_cleared);
    update_score(ref run_data, points);

    // Check grid full
    let is_full = is_grid_full(new_blocks);
    if is_full {
        return (new_blocks, next_row, 0, true);
    }

    // Insert new line with configurable block weights
    let (new_blocks_after_insert, new_next_row) = insert_new_line(
        new_blocks, next_row, level_config.difficulty, seed, run_data.current_level, settings
    );
    let mut new_blocks = new_blocks_after_insert;

    // Assess again after new line
    let more_points = assess_game(ref new_blocks, ref lines_cleared);
    update_score(ref run_data, more_points);

    // Update combos and award cubes using shared helper
    process_lines_cleared(ref run_data, ref combo_counter, ref max_combo, lines_cleared);

    // Update constraint progress with TOTAL lines cleared in this move
    run_data.constraint_progress = level_config
        .constraint
        .update_progress(run_data.constraint_progress, lines_cleared);

    // Update secondary constraint progress
    run_data.constraint_2_progress = level_config
        .constraint_2
        .update_progress(run_data.constraint_2_progress, lines_cleared);

    // Increment level moves (or consume free move from Wave L2/L3)
    if run_data.free_moves > 0 {
        run_data.free_moves -= 1;
    } else {
        run_data.level_moves += 1;
    }

    // If grid is empty, add a new line with settings
    let (final_blocks, final_next_row) = if new_blocks == 0 {
        insert_new_line(
            new_blocks, new_next_row, level_config.difficulty, seed, run_data.current_level, settings
        )
    } else {
        (new_blocks, new_next_row)
    };

    (final_blocks, final_next_row, lines_cleared, false)
}

/// Check if the grid is full (game over condition).
#[inline(always)]
fn is_grid_full(blocks: felt252) -> bool {
    let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1) * constants::ROW_BIT_COUNT.into();
    let div: u256 = fast_power(2, exp) - 1;
    blocks.into() / div > 0
}

/// Assess the game state (gravity, line clearing).
/// Returns points earned and updates lines_cleared counter.
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

/// Insert a new line at the bottom of the grid.
/// Returns (updated_blocks, new_next_row)
fn insert_new_line(
    blocks: felt252,
    current_next_row: u32,
    difficulty: Difficulty,
    seed: felt252,
    current_level: u8,
    settings: GameSettings,
) -> (felt252, u32) {
    let new_seed = generate_seed_from_base(blocks, seed, current_level);
    let new_next_row = Controller::create_line(new_seed, difficulty, settings);
    let new_blocks = Controller::add_line(blocks, current_next_row);
    (new_blocks, new_next_row)
}

/// Generate a deterministic seed from base seed and current state.
/// Includes level number for more diversity across levels.
#[inline(always)]
fn generate_seed_from_base(blocks: felt252, base_seed: felt252, current_level: u8) -> felt252 {
    let state: HashState = PoseidonTrait::new();
    let state = state.update(base_seed);
    let state = state.update(blocks.into());
    let state = state.update(current_level.into());
    state.finalize()
}
