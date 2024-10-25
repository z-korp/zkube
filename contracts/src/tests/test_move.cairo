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
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0x9240526d825221b6906d96d8924049;
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
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0x48020924892429244829129048b6c8;
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
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0b000_000_000_000_000_000_010_010;
    store.set_game(game);

    // [Move]
    systems.play.move(0, 0, 4);

    let game = store.game(game_id);
    // 010_010_000_010_010_011_011_011

    assert(game.blocks != 0, 'Grid should not be empty');
}

#[test]
fn test_actions_move_04_real_bug() {
    // Initial grid
    // [0, 0, 0, 0, 0, 0, 0, 0] 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // [0, 0, 0, 0, 0, 0, 0, 0] 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // [3, 3, 3, 0, 0, 0, 0, 0] 011_011_011_000_000_000_000_000 -> 000_000_000_000_000_011_011_011
    // [2, 2, 0, 2, 2, 3, 3, 3] 010_010_000_010_010_011_011_011 -> 011_011_011_010_010_000_010_010
    // [0, 2, 2, 3, 3, 3, 2, 2] 000_010_010_011_011_011_010_010 -> 010_010_011_011_011_010_010_000
    // [0, 1, 0, 3, 3, 3, 2, 2] 000_001_000_011_011_011_010_010 -> 010_010_011_011_011_000_001_000
    // [3, 3, 3, 2, 2, 0, 2, 2] 011_011_011_010_010_000_010_010 -> 010_010_000_010_010_011_011_011
    // [0, 2, 2, 1, 3, 3, 3, 1] 000_010_010_001_011_011_011_001 -> 001_011_011_011_001_010_010_000
    // [2, 2, 0, 1, 1, 3, 3, 3] 010_010_000_001_001_011_011_011 -> 011_011_011_001_001_000_010_010
    // [0, 4, 4, 4, 4, 2, 2, 1] 000_100_100_100_100_010_010_001 -> 001_010_010_100_100_100_100_000

    // Final grid
    // 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // 010_010_000_011_011_011_010_010 -> 010_010_011_011_011_000_010_010
    // 011_011_011_010_010_000_010_010 -> 010_010_000_010_010_011_011_011
    // 000_010_010_001_011_011_011_001 -> 001_011_011_011_001_010_010_000
    // 010_010_000_001_001_011_011_011 -> 011_011_011_001_001_000_010_010
    // 000_100_100_100_100_010_010_001 -> 001_010_010_100_100_100_100_000
    // 010_010_000_011_011_011_010_010 -> 010_010_011_011_011_000_010_010

    // Result
    // 010_010_011_011_011_000_010_010_
    // 010_010_000_010_010_011_011_011_
    // 001_011_011_011_001_010_010_000_
    // 011_011_011_001_001_000_010_010_
    // 001_010_010_100_100_100_100_000_
    // 010_010_000_000_001_001_010_010

    // Should be
    // [0, 0, 0, 0, 0, 0, 0, 0] 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // [0, 0, 0, 0, 0, 0, 0, 0] 000_000_000_000_000_000_000_000 -> 000_000_000_000_000_000_000_000
    // [0, 0, 0, 0, 0, 0, 0, 0] 011_011_011_000_000_000_000_000 -> 000_000_000_000_000_011_011_011
    // [2, 2, 0, 3, 3, 3, 2, 2] 000_010_010_011_011_011_010_010 -> 010_010_011_011_011_010_010_000
    // [3, 3, 3, 2, 2, 0, 2, 2] 011_011_011_010_010_000_010_010 -> 010_010_000_010_010_011_011_011
    // [0, 2, 2, 1, 3, 3, 3, 1] 000_010_010_001_011_011_011_001 -> 001_011_011_011_001_010_010_000
    // [2, 2, 0, 1, 1, 3, 3, 3] 010_010_000_001_001_011_011_011 -> 011_011_011_001_001_000_010_010
    // [0, 4, 4, 4, 4, 2, 2, 1]

    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game
        .blocks =
            0b000_000_000_000_000_011_011_011__011_011_011_010_010_000_010_010__010_010_011_011_011_010_010_000__010_010_011_011_011_000_001_000__010_010_000_010_010_011_011_011__001_011_011_011_001_010_010_000__011_011_011_001_001_000_010_010__001_010_010_100_100_100_100_000;
    store.set_game(game);

    // [Move]
    systems.play.move(4, 1, 0);

    let game = store.game(game_id);

    assert_eq!(
        game.blocks,
        0b010_010_011_011_011_000_010_010__010_010_000_010_010_011_011_011__001_011_011_011_001_010_010_000__011_011_011_001_001_000_010_010__001_010_010_100_100_100_100_000__010_010_000_000_001_001_010_010
    );
}

#[test]
fn test_actions_move_05_real_bug() {
    // Initial grid
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 001_000_000_000_100_100_100_100
    // 001_000_000_010_010_011_011_011
    // 011_011_011_010_010_001_001_000
    // 010_010_000_000_001_001_010_010
    // 011_011_011_000_010_010_001_000
    // 001_001_000_011_011_011_010_010

    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game
        .blocks =
            0b001_000_000_000_100_100_100_100__001_000_000_010_010_011_011_011__011_011_011_010_010_001_001_000__010_010_000_000_001_001_010_010__011_011_011_000_010_010_001_000__001_001_000_011_011_011_010_010;
    store.set_game(game);

    // [Move]
    systems.play.move(1, 1, 0);

    let game = store.game(game_id);
}

#[test]
#[should_panic(expected: ('Controller: not in boundaries',))]
fn test_actions_move_06_real_bug() {
    // Initial grid
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 001_010_010_010_010_000_000_000
    // 011_011_011_001_001_010_010_000
    // 000_000_001_010_010_010_010_000
    // 001_001_011_011_011_001_001_000
    // 010_010_001_100_100_100_100_000

    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game
        .blocks =
            0b001_010_010_010_010_000_000_000__011_011_011_001_001_010_010_000__000_000_001_010_010_010_010_000__001_001_011_011_011_001_001_000__010_010_001_100_100_100_100_000;
    store.set_game(game);

    // [Move]
    systems.play.move(2, 5, 7);

    let game = store.game(game_id);

    // Grid 1:
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 000_000_000_000_000_000_000_000
    // 001_010_010_010_010_000_000_000
    // 011_011_011_001_001_010_010_000
    // 001_000_000_010_010_010_010_000
    // 001_001_011_011_011_001_001_000
    // 010_010_001_100_100_100_100_000
    // 010_010_010_010_001_010_010_000

    systems.play.move(2, 5, 7);

    let game = store.game(game_id);
    println!("blocks {}", game.blocks);
// Grid final
// 001_010_010_010_010_000_000_000
// 011_011_011_001_001_010_010_000
// 001_000_000_010_010_010_011_000
// 011_000_000_011_011_001_001_000
// 010_010_000_100_100_100_100_001
// 010_010_000_000_001_001_010_010
//assert_eq!(
//    game.blocks & 0b000_000_000_000_000_000_000_000,
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//    
//    0b001_010_010_010_010_000_000_000__011_011_011_001_001_010_010_000__001_000_000_010_010_010_010_000__001_001_011_011_011_001_001_000__010_010_001_100_100_100_100_000__000_000_000_000_000_000_000_000
//)
// Grid 1:
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 001_010_010_010_010_000_000_000
// 011_011_011_001_001_010_010_000
// 001_000_000_010_010_010_010_000
// 001_001_011_011_011_001_001_000
// 010_010_001_100_100_100_100_000
// 010_010_010_010_001_010_010_000

// Move TX (row, start col, end col) 2 5 7

// Grid 2:
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 000_000_000_000_000_000_000_000
// 001_010_010_010_010_000_000_000
// 011_011_011_001_001_010_010_000
// 001_000_000_010_010_010_011_000
// 011_000_000_011_011_001_001_000
// 010_010_001_100_100_100_100_000
// 100_100_100_100_001_010_010_000
}
