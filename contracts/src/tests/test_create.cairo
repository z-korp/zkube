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
fn test_actions_create() {
    // [Setup]
    let (world, _, context) = setup::spawn_game(Mode::Daily);
    let store = StoreTrait::new(world);

    // [Assert]
    let game = store.game(context.game_id);
    assert(game.id == context.game_id, 'Game: id');
}
