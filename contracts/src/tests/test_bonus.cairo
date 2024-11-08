// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{
    set_contract_address, set_account_contract_address, set_transaction_hash, set_block_timestamp
};

// Dojo imports

use dojo::world::{WorldStorage, IWorldDispatcherTrait, WorldStorageTrait};
use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
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

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1, user_mint_token, impersonate}};

#[test]
fn test_bonus_clean_board() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    // [Set] Game
    impersonate(PLAYER1());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let mut game = store.game(game_id);
    game.blocks = 0b00100100100100011011011;
    game.wave_bonus = 1; // unlock 1 wave bonus
    game.wave_used = 0;
    //store.set_game(game);
    world.write_model_test(@game);

    // [Move]
    systems.play.apply_bonus(Bonus::Wave, 0, 0);

    // [Assert] Game
    let game = store.game(game_id);
    assert(game.blocks != 0, 'Incorrect blocks');
}
