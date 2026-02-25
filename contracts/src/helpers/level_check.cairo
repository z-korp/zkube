//! Lightweight level completion check - no heavy imports.
//!
//! This module provides level completion checking using the GameLevel model,
//! avoiding the need to import LevelGeneratorTrait (949 lines).
//!
//! Use this in systems that need to CHECK completion but don't need to
//! GENERATE the next level (that's handled by level_system via dispatcher).

use zkube::helpers::packing::RunData;
use zkube::models::game::GameLevel;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};

/// Check if level is complete using GameLevel model data.
/// This is a lightweight alternative to Game::is_level_complete which imports LevelGeneratorTrait.
///
/// Arguments:
/// - game_level: The GameLevel model with current level config
/// - run_data: The unpacked run data with current progress
///
/// Returns: true if level is complete
#[inline(always)]
pub fn is_level_complete(game_level: @GameLevel, run_data: @RunData) -> bool {
    // Check score requirement
    if (*run_data.level_score).into() < *game_level.points_required {
        return false;
    }

    // Check primary constraint
    let constraint = LevelConstraint {
        constraint_type: (*game_level.constraint_type).into(),
        value: *game_level.constraint_value,
        required_count: *game_level.constraint_count,
    };
    if !constraint.is_satisfied(*run_data.constraint_progress, *run_data.bonus_used_this_level) {
        return false;
    }

    // Check secondary constraint
    let constraint_2 = LevelConstraint {
        constraint_type: (*game_level.constraint2_type).into(),
        value: *game_level.constraint2_value,
        required_count: *game_level.constraint2_count,
    };
    if !constraint_2
        .is_satisfied(*run_data.constraint_2_progress, *run_data.bonus_used_this_level) {
        return false;
    }

    // Check tertiary constraint
    let constraint_3 = LevelConstraint {
        constraint_type: (*game_level.constraint3_type).into(),
        value: *game_level.constraint3_value,
        required_count: *game_level.constraint3_count,
    };
    if !constraint_3
        .is_satisfied(*run_data.constraint_3_progress, *run_data.bonus_used_this_level) {
        return false;
    }

    true
}

/// Check if level is failed (move limit exceeded without completing).
#[inline(always)]
pub fn is_level_failed(game_level: @GameLevel, run_data: @RunData) -> bool {
    let current_moves: u16 = (*run_data.level_moves).into();

    current_moves >= *game_level.max_moves && !is_level_complete(game_level, run_data)
}

/// Calculate cubes earned based on moves used.
#[inline(always)]
pub fn calculate_cubes(game_level: @GameLevel, moves_used: u16) -> u8 {
    if moves_used <= *game_level.cube_3_threshold {
        3
    } else if moves_used <= *game_level.cube_2_threshold {
        2
    } else {
        1
    }
}
