//! Inline grid operations for the hot path.
//! Called directly from moves_system — no dispatcher overhead.
//! Non-hot-path operations (initialize_grid, reset_grid_for_level)
//! remain in grid_system behind a dispatcher.

use alexandria_math::BitShift;
use core::hash::HashStateTrait;
use core::poseidon::{HashState, PoseidonTrait};
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use zkube::constants;
use zkube::helpers::controller::Controller;
use zkube::helpers::level::LevelGeneratorTrait;
use zkube::helpers::mutator::MutatorEffectsTrait;
use zkube::helpers::scoring::{apply_combo_mult, process_lines_cleared, update_score};
use zkube::models::config::GameSettings;
use zkube::models::game::{Game, GameLevel, GameSeed, GameTrait};
use zkube::models::mutator::MutatorDef;
use zkube::types::constraint::{
    ConstraintContext, ConstraintType, LevelConstraint, LevelConstraintTrait,
    any_needs_break_blocks, get_break_blocks_target_size,
};
use zkube::types::difficulty::Difficulty;

/// Execute a move (swipe) on the grid — inline, no dispatcher overhead.
/// Accepts pre-cached models so the caller controls storage reads.
/// Writes updated `game` to storage at the end.
/// Returns (lines_cleared, is_grid_full).
pub fn execute_move_inline(
    ref world: WorldStorage,
    game_id: felt252,
    ref game: Game,
    base_seed: GameSeed,
    game_level: GameLevel,
    settings: GameSettings,
    mutator_def: @MutatorDef,
    row_index: u8,
    start_index: u8,
    final_index: u8,
) -> (u8, bool) {
    let mut run_data = game.get_run_data();
    let score_difficulty: Difficulty = if run_data.run_type == 1
        && run_data.current_difficulty != 0 {
        run_data.current_difficulty.into()
    } else {
        game_level.difficulty.into()
    };

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

    // Compute highest occupied row BEFORE the move (for constraint context)
    let highest_row_before = highest_occupied_row(game.blocks);

    // Check if we need to track BreakBlocks (expensive — only when active)
    let track_break_blocks = any_needs_break_blocks(constraint, constraint_2);
    let break_target_size = if track_break_blocks {
        get_break_blocks_target_size(constraint, constraint_2)
    } else {
        0
    };
    let (break_count_before, break_added_count) = if track_break_blocks {
        (
            count_blocks_of_size(game.blocks, break_target_size),
            count_blocks_of_size_in_row(game.next_row, break_target_size),
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
    let mut new_blocks = Controller::swipe(game.blocks, row_index, start_index, direction, count);

    // Assess and score (gravity + line clearing)
    let mut lines_cleared: u8 = 0;
    let mut _cascade: u8 = 0;
    let base_points = assess_game(ref new_blocks, ref lines_cleared, ref _cascade);
    let mut move_subtotal: u32 = apply_score_modifiers(
        base_points, run_data.run_type, score_difficulty, @settings, mutator_def,
    )
        .into();
    let line_clear_bonus = MutatorEffectsTrait::get_line_clear_bonus(mutator_def);

    // Check grid full
    let is_full = is_grid_full(new_blocks);
    if is_full {
        if lines_cleared > 0 && line_clear_bonus > 0 {
            move_subtotal += (lines_cleared.into() * line_clear_bonus.into());
        }
        // Apply combo multiplier on multi-line clears
        let final_points = apply_combo_mult(move_subtotal, lines_cleared, mutator_def);
        update_score(ref run_data, final_points);

        game.blocks = new_blocks;
        game.set_run_data(run_data);
        world.write_model(@game);
        return (lines_cleared, true);
    }

    // Insert new line
    let difficulty: Difficulty = game_level.difficulty.into();
    let (new_blocks_after_insert, new_next_row) = insert_new_line(
        new_blocks, game.next_row, difficulty, base_seed.seed, run_data.current_level, settings,
    );
    new_blocks = new_blocks_after_insert;

    // Assess again after new line
    let more_base_points = assess_game(ref new_blocks, ref lines_cleared, ref _cascade);
    if more_base_points > 0 {
        let more_points: u32 = apply_score_modifiers(
            more_base_points, run_data.run_type, score_difficulty, @settings, mutator_def,
        )
            .into();
        move_subtotal += more_points;
    }

    if lines_cleared > 0 && line_clear_bonus > 0 {
        move_subtotal += (lines_cleared.into() * line_clear_bonus.into());
    }

    let perfect_clear_bonus = MutatorEffectsTrait::get_perfect_clear_bonus(mutator_def);
    if new_blocks == 0 && perfect_clear_bonus > 0 {
        move_subtotal += perfect_clear_bonus.into();
    }

    // Apply combo multiplier: on multi-line clears (lines_cleared > 1),
    // multiply the move's entire subtotal by combo_bonus_mult_x100 / 100.
    // At neutral (100) this is ×1.0 = no change. At 200 it doubles, etc.
    let final_points = apply_combo_mult(move_subtotal, lines_cleared, mutator_def);
    update_score(ref run_data, final_points);

    // Track combos for achievements/HUD (no scoring impact)
    process_lines_cleared(ref run_data, ref game.combo_counter, ref game.max_combo, lines_cleared);

    // Compute grid height once — recompute only when grid is modified below
    let mut current_height: u8 = if new_blocks == 0 {
        0
    } else {
        highest_occupied_row(new_blocks)
    };

    // Count destroyed block ENTITIES of target size.
    // count_blocks_of_size returns cell count (a size-3 block = 3 cells),
    // so divide by target_size to get entity count.
    let blocks_destroyed_of_target_size = if track_break_blocks && break_target_size > 0 {
        let count_after = count_blocks_of_size(new_blocks, break_target_size);
        let total_available: u8 = break_count_before + break_added_count;
        if total_available > count_after {
            let destroyed_cells: u8 = total_available - count_after;
            destroyed_cells / break_target_size
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

    // Update constraint progresses (skip when constraint type is None)
    if constraint.constraint_type != ConstraintType::None {
        run_data
            .constraint_progress = constraint
            .update_progress(run_data.constraint_progress, ctx);
    }
    if constraint_2.constraint_type != ConstraintType::None {
        run_data
            .constraint_2_progress = constraint_2
            .update_progress(run_data.constraint_2_progress, ctx);
    }

    // Increment level moves
    run_data.level_moves += 1;

    // If grid is empty after all that, add another line
    if new_blocks == 0 {
        let (final_blocks, final_next_row) = insert_new_line(
            new_blocks, new_next_row, difficulty, base_seed.seed, run_data.current_level, settings,
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

/// Apply gravity and assess lines until stable, tracking cascade depth.
pub fn assess_game(ref blocks: felt252, ref counter: u8, ref cascade_depth: u8) -> u16 {
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
        cascade_depth += 1;
    }
}

/// Check if grid is full (top row has blocks).
#[inline(always)]
pub fn is_grid_full(blocks: felt252) -> bool {
    let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1) * constants::ROW_BIT_COUNT.into();
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
    let new_seed = generate_seed(blocks, seed, current_level);
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
pub fn highest_occupied_row(blocks: felt252) -> u8 {
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
pub fn count_blocks_of_size(blocks: felt252, target_size: u8) -> u8 {
    let blocks_u256: u256 = blocks.into();
    if blocks_u256 == 0 {
        return 0;
    }
    let block_mask: u256 = 0x7; // 3-bit mask for one block
    let total_blocks: u8 = constants::DEFAULT_GRID_HEIGHT * constants::DEFAULT_GRID_WIDTH; // 80
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
    }
    count
}

/// Count blocks of a specific size in a single row (u32, 8 blocks x 3 bits).
pub fn count_blocks_of_size_in_row(row: u32, target_size: u8) -> u8 {
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
    }
    count
}

/// Count non-empty blocks in a specific row.
pub fn count_non_empty_blocks_in_row(blocks: felt252, row: u8) -> u8 {
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
        let val: u8 = (BitShift::shr(blocks_u256, shift) & 0x7_u256).try_into().unwrap();
        if val > 0 {
            count += 1;
        }
        col += 1;
    }

    count
}

fn apply_score_modifiers(
    base_score: u16,
    run_type: u8,
    difficulty: Difficulty,
    settings: @GameSettings,
    mutator_def: @MutatorDef,
) -> u16 {
    let mut score = base_score;

    // Dedicated endless mode uses configurable difficulty multipliers.
    if run_type == 1 {
        let multiplier_x10 = LevelGeneratorTrait::get_endless_score_multiplier(
            difficulty, settings,
        );
        score = apply_x10_multiplier(score, multiplier_x10);
    }

    // Apply mutator score modifier on top of base/endless multiplier.
    MutatorEffectsTrait::apply_mutator_to_score(mutator_def, score)
}

fn apply_x10_multiplier(score: u16, multiplier_x10: u16) -> u16 {
    if multiplier_x10 == 10 {
        return score;
    }

    let adjusted: u32 = (score.into() * multiplier_x10.into()) / 10_u32;
    if adjusted > 65535 {
        65535
    } else {
        adjusted.try_into().unwrap()
    }
}

/// Read and normalize a MutatorDef from storage.
pub fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
    if mutator_id == 0 {
        return MutatorEffectsTrait::neutral(0);
    }

    let stored: MutatorDef = world.read_model(mutator_id);
    MutatorEffectsTrait::normalize(mutator_id, stored)
}
