//! Game helper functions that require heavy imports.
//!
//! These functions are separated from the Game model to avoid bloating
//! systems that don't need them. Only import this in systems that need
//! line insertion functionality.

use core::hash::HashStateTrait;
use core::poseidon::{HashState, PoseidonTrait};
use zkube::helpers::controller::Controller;
use zkube::models::config::GameSettings;
use zkube::models::game::{Game, GameTrait};
use zkube::types::difficulty::Difficulty;

/// Insert a new line at the bottom of the grid.
/// This creates a new line using Controller and updates the game state.
///
/// NOTE: This function imports Controller which is heavy (~2000 lines).
/// Only use in systems that actually need to insert lines.
pub fn insert_new_line(
    ref game: Game, difficulty: Difficulty, seed: felt252, settings: GameSettings,
) -> felt252 {
    let new_seed = generate_seed_from_base(@game, seed);
    let row = Controller::create_line(new_seed, difficulty, settings);
    game.blocks = Controller::add_line(game.blocks, game.next_row);
    game.next_row = row;
    new_seed
}

/// Generate a deterministic seed from base seed and current state.
fn generate_seed_from_base(game: @Game, base_seed: felt252) -> felt252 {
    let run_data = (*game).get_run_data();
    let state: HashState = PoseidonTrait::new();
    let state = state.update(base_seed);
    let state = state.update((*game.blocks).into());
    let state = state.update(run_data.current_level.into());
    state.finalize()
}
