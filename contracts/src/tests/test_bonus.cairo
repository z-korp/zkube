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
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;

// Test imports

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

#[test]
fn test_bonus_clean_board() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    world.grant_writer(Model::<Game>::selector(), PLAYER1());

    // [Set] Game
    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(1, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0b00100100100100011011011;
    game.colors = 0b00100100100100011011011;
    game.wave_bonus = 1; // unlock 1 wave bonus
    game.wave_used = 0;
    store.set_game(game);

    // [Move]
    systems.play.apply_bonus(Bonus::Wave, 0, 0);

    // [Assert] Game
    let game = store.game(game_id);
    assert(game.blocks != 0, 'Incorrect blocks');
}
