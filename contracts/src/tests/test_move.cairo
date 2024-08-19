// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{
    set_contract_address, set_account_contract_address, set_transaction_hash, set_caller_address,
    set_block_timestamp
};

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};
use dojo::model::Model;

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{Player, PlayerTrait};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::types::mode::Mode;

// Test imports

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

#[test]
fn test_actions_move_01() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0x9240526d825221b6906d96d8924049;
    game.colors = 0x9240526d825221b6906d96d8924049;
    store.set_game(game);

    // [Move]
    systems.play.move(1, 1, 0);
}

#[test]
fn test_actions_move_02() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0x48020924892429244829129048b6c8;
    game.colors = 0x4ab00120890981181a0410220c8111;
    store.set_game(game);

    // [Move]
    systems.play.move(2, 1, 0);
}

/// Test when grid is empty after a new line is inserted.
/// # Arguments
/// # Returns
/// Asserts that the grid is equal to new line.
#[test]
fn test_actions_move_03() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0b000_000_000_000_000_000_010_010;
    game.colors = 0b000_000_000_000_000_000_010_010;
    store.set_game(game);

    // [Move]
    systems.play.move(0, 0, 2);

    let game = store.game(game_id);

    assert_eq!(game.blocks, 19332072018);
}
