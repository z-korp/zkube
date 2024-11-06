// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{
    set_contract_address, set_transaction_hash, set_caller_address, set_block_timestamp
};

// Dojo imports

use dojo::world::{WorldStorage, IWorldDispatcherTrait, WorldStorageTrait};
use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
use dojo::model::Model;

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait, GameAssert};
use zkube::models::player::{Player, PlayerTrait};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::types::mode::Mode;
use zkube::types::bonus::Bonus;

// Test imports

use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

// Helper function to update score and check hammer bonus
fn update_score_and_check(
    store: @Store, mut world: WorldStorage, game_id: u32, score: u32, expected_available_hammer: u8
) {
    // Update score
    let mut game = (*store).game(game_id);
    game.score = score;
    // Check bonuses
    let (hammer, totem, wave) = game.assess_bonuses();
    game.hammer_bonus = hammer;
    game.totem_bonus = totem;
    game.wave_bonus = wave;
    //(*store).set_game(game);
    world.write_model_test(@game);

    let game = (*store).game(game_id);
    assert(
        game.hammer_bonus - game.hammer_used == expected_available_hammer, 'Incorrect hammer bonus'
    );
}

#[test]
fn test_game_hammer_bonus_unlock() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    game.assert_exists();
    assert(game.hammer_bonus == 0, 'Init hammer should be 0');
    game.assert_not_over();

    // Test different score thresholds
    update_score_and_check(@store, world, game_id, 30, 0); // Below first threshold
    update_score_and_check(@store, world, game_id, 40, 1); // At first threshold
    update_score_and_check(@store, world, game_id, 60, 1); // Between thresholds
    update_score_and_check(@store, world, game_id, 80, 2); // At second threshold
    update_score_and_check(@store, world, game_id, 100, 2); // Between thresholds
    update_score_and_check(@store, world, game_id, 120, 3); // At third threshold
    update_score_and_check(@store, world, game_id, 150, 3); // Above all thresholds
}

#[test]
fn test_game_hammer_bonus_usage() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    game.assert_exists();
    assert(game.hammer_bonus == 0, 'Init hammer should be 0');
    game.assert_not_over();

    // Test different score thresholds
    update_score_and_check(@store, world, game_id, 30, 0); // Below first threshold
    update_score_and_check(@store, world, game_id, 40, 1); // At first threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Hammer);

    // [Effect] Use hammer bonus
    systems.play.apply_bonus(Bonus::Hammer, 0, 0);

    // [Assert] Check hammer bonus
    let game = store.game(game_id);
    assert(game.hammer_used == 1, 'Hammer used should be 1');
    update_score_and_check(@store, world, game_id, 60, 0); // Between thresholds

    update_score_and_check(@store, world, game_id, 80, 1); // At second threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Hammer);
}

#[test]
#[should_panic(expected: ('Game: bonus not available', 'ENTRYPOINT_FAILED'))]
fn test_game_hammer_bonus_not_available() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    assert(game.hammer_bonus == 0, 'Init hammer should be 0');

    // [Effect] Use hammer bonus
    systems.play.apply_bonus(Bonus::Hammer, 0, 1);
}
