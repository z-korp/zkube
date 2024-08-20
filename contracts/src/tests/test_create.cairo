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
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::types::mode::Mode;

// Test imports

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

#[test]
fn test_actions_create() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    // [Create]
    set_contract_address(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    // [Assert]
    let game = store.game(game_id);
    assert(game.id == game_id, 'Game: id');
}
