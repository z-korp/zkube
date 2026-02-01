//! Bonus application logic - separated from Game model to reduce contract size.
//! 
//! This module contains the apply_bonus function that dispatches to all bonus
//! implementations. It should ONLY be imported by bonus_system to avoid
//! duplicating the bonus code in other systems.

use zkube::types::bonus::{Bonus, BonusTrait};
use zkube::helpers::packing::RunData;
use zkube::helpers::scoring::{
    saturating_add_u8, saturating_add_u16, saturating_add_u8_capped,
    process_lines_cleared, update_score,
};
// Use minimal grid_utils instead of full Controller to reduce contract size
use zkube::helpers::grid_utils;

// Import all bonus implementations - this is the heavy part
use zkube::elements::bonuses::hammer;
use zkube::elements::bonuses::totem;
use zkube::elements::bonuses::wave;
use zkube::elements::bonuses::shrink::{self, apply_shrink_same_size, apply_shrink_all};
use zkube::elements::bonuses::shuffle::{self, shuffle_next_line, shuffle_entire_grid};

/// Apply a bonus effect to the grid and return the updated blocks.
/// This is the core dispatch function that routes to the appropriate bonus implementation.
#[inline(always)]
pub fn apply_bonus_effect(bonus: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
    match bonus {
        Bonus::None => blocks,
        Bonus::Hammer => hammer::BonusImpl::apply(blocks, row_index, index),
        Bonus::Totem => totem::BonusImpl::apply(blocks, row_index, index),
        Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
        Bonus::Shrink => shrink::BonusImpl::apply(blocks, row_index, index),
        Bonus::Shuffle => shuffle::BonusImpl::apply(blocks, row_index, index),
    }
}

/// Apply a bonus to a game, handling all the side effects.
/// 
/// This function:
/// 1. Validates bonus availability
/// 2. Applies the bonus effect (with level scaling)
/// 3. Updates inventory counts
/// 4. Marks bonus as used for constraint tracking
/// 5. Assesses the grid (gravity + line clearing)
/// 6. Awards combo cubes
/// 
/// NOTE: Constraint progress is NOT updated here. The caller (system) is responsible
/// for reading the constraints from GameLevel model and calling update_progress.
/// This avoids importing LevelGeneratorTrait which would bloat the contract size.
/// 
/// Arguments:
/// - blocks: Current grid state
/// - next_row: The upcoming row (for shuffle L2)
/// - combo_counter: Current combo (per-level)
/// - max_combo: Best combo this level
/// - run_data: Packed run progress data
/// - seed: Game seed (used for shuffle randomization)
/// - bonus: Which bonus to apply
/// - row_index: Target row
/// - index: Target column
/// 
/// Returns: (updated_blocks, updated_next_row, lines_cleared)
pub fn apply_bonus_to_game(
    blocks: felt252,
    next_row: u32,
    ref combo_counter: u8,
    ref max_combo: u8,
    ref run_data: RunData,
    seed: felt252,
    bonus: Bonus,
    row_index: u8,
    index: u8,
) -> (felt252, u32, u8) {
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

    // Get bonus type code and level
    let bonus_type_u8 = bonus.to_type_code();
    let bonus_level = get_bonus_level(ref run_data, bonus_type_u8);

    // Apply bonus effect based on type and level
    let mut new_blocks = blocks;
    let mut new_next_row = next_row;
    
    match bonus {
        Bonus::Totem => {
            if bonus_level == 2 {
                // L3 Totem: nuclear option - clear entire grid, no cube bonus
                new_blocks = 0;
            } else {
                // L1/L2 Totem: clear all blocks of same size
                new_blocks = apply_bonus_effect(bonus, blocks, row_index, index);
            }
        },
        Bonus::Shrink => {
            if bonus_level == 2 {
                // L3 Shrink: shrink ALL blocks on grid (except size 1)
                new_blocks = apply_shrink_all(blocks);
            } else if bonus_level == 1 {
                // L2 Shrink: shrink all blocks of the same size
                new_blocks = apply_shrink_same_size(blocks, row_index, index);
            } else {
                // L1 Shrink: shrink single target block
                new_blocks = apply_bonus_effect(bonus, blocks, row_index, index);
            }
        },
        Bonus::Shuffle => {
            if bonus_level == 2 {
                // L3 Shuffle: shuffle the entire grid
                new_blocks = shuffle_entire_grid(blocks, seed);
            } else if bonus_level == 1 {
                // L2 Shuffle: shuffle the upcoming next_row
                new_next_row = shuffle_next_line(next_row, seed);
            } else {
                // L1 Shuffle: shuffle a single row
                new_blocks = apply_bonus_effect(bonus, blocks, row_index, index);
            }
        },
        _ => {
            // Hammer, Wave, None: apply normal effect
            new_blocks = apply_bonus_effect(bonus, blocks, row_index, index);
        },
    }

    // Apply additional level-scaled effects (bonuses beyond the primary effect)
    match bonus {
        Bonus::Hammer => {
            // L2: +1 combo, L3: +2 combo
            if bonus_level >= 1 {
                combo_counter = saturating_add_u8(combo_counter, 1);
            }
            if bonus_level >= 2 {
                combo_counter = saturating_add_u8(combo_counter, 1);
            }
        },
        Bonus::Wave => {
            // L2: +1 free move, L3: +2 free moves
            if bonus_level >= 1 {
                run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
            }
            if bonus_level >= 2 {
                run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
            }
        },
        Bonus::Totem => {
            // L2: +3 bonus cubes (simplified flat award)
            if bonus_level == 1 {
                run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
            }
            // L3 handled above (clear grid, no additional bonus)
        },
        _ => {
            // Shrink, Shuffle, None: no additional level bonuses
        },
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

    // Mark bonus used for constraint tracking
    run_data.bonus_used_this_level = true;

    // Assess game (gravity + line clearing) using minimal grid_utils
    let mut lines_cleared: u8 = 0;
    let points = grid_utils::assess_game(ref new_blocks, ref lines_cleared);
    update_score(ref run_data, points);

    // Update combos and award cubes using shared helper
    process_lines_cleared(ref run_data, ref combo_counter, ref max_combo, lines_cleared);

    // Return lines_cleared so the caller can update constraint progress
    (new_blocks, new_next_row, lines_cleared)
}

/// Get the level (0-2) for a given bonus type based on selected bonuses.
/// @param bonus_type: 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
/// Returns 0 (L1), 1 (L2), or 2 (L3)
#[inline(always)]
fn get_bonus_level(ref run_data: RunData, bonus_type: u8) -> u8 {
    // Find which slot this bonus is in
    if run_data.selected_bonus_1 == bonus_type {
        run_data.bonus_1_level
    } else if run_data.selected_bonus_2 == bonus_type {
        run_data.bonus_2_level
    } else if run_data.selected_bonus_3 == bonus_type {
        run_data.bonus_3_level
    } else {
        0 // Default to L1 if not found (shouldn't happen)
    }
}


