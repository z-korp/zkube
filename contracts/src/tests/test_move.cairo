// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{set_contract_address, set_transaction_hash};

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{Player, PlayerTrait};
use zkube::systems::dailygame::IDailyGameDispatcherTrait;
use zkube::types::mode::Mode;

// Test imports

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

#[test]
fn test_actions_move_01() {
    // [Setup]
    let (world, systems, context) = setup::spawn_game(Mode::Daily);
    let store = StoreTrait::new(world);
    let mut game = store.game(context.game_id);
    game.blocks = 0x9240526d825221b6906d96d8924049;
    game.colors = 0x9240526d825221b6906d96d8924049;
    store.set_game(game);

    // [Move]
    systems.dailygame.move(1, 1, 0);
}

#[test]
fn test_actions_move_02() {
    // [Setup]
    let (world, systems, context) = setup::spawn_game(Mode::Daily);
    let store = StoreTrait::new(world);
    let mut game = store.game(context.game_id);
    game.blocks = 0x48020924892429244829129048b6c8;
    game.colors = 0x4ab00120890981181a0410220c8111;
    store.set_game(game);

    // [Move]
    systems.dailygame.move(2, 1, 0);
}

/// Test when grid is empty after a new line is inserted.
/// # Arguments
/// # Returns
/// Asserts that the grid is equal to new line.
#[test]
fn test_actions_move_03() {
    // [Setup]
    let (world, systems, context) = setup::spawn_game(Mode::Daily);
    let store = StoreTrait::new(world);
    let mut game = store.game(context.game_id);
    game.blocks = 0b000_000_000_000_000_000_010_010;
    game.colors = 0b000_000_000_000_000_000_010_010;
    store.set_game(game);

    // [Move]
    systems.dailygame.move(0, 0, 2);

    let mut game2 = store.game(context.game_id);

    assert_eq!(game2.blocks, 19332072018);
}
