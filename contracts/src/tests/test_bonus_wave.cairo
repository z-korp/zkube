// Core imports
use core::debug::PrintTrait;

// Starknet imports
use starknet::testing::{set_contract_address, set_block_timestamp};

// Dojo imports
use dojo::world::{WorldStorage, IWorldDispatcherTrait, WorldStorageTrait};
use dojo::model::{ModelStorage, ModelValueStorage, ModelStorageTest};
use dojo::model::Model;

// Internal imports
use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait, GameAssert};
use zkube::models::settings::Settings;
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;

// Test imports
use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

// Helper function to update combo count and check wave bonus
fn update_combo_and_check(
    store: @Store,
    mut world: WorldStorage,
    game_id: u32,
    combo_count: u8,
    expected_available_wave: u8
) {
    // Update combo count
    let mut game = (*store).game(game_id);
    game.combo_counter = combo_count;
    // Check bonuses
    let (hammer, totem, wave) = game.assess_bonuses();
    game.hammer_bonus = hammer;
    game.totem_bonus = totem;
    game.wave_bonus = wave;
    //(*store).set_game(game);
    world.write_model_test(@game);

    let game = (*store).game(game_id);
    assert(game.wave_bonus - game.wave_used == expected_available_wave, 'Incorrect wave bonus');
}

#[test]
fn test_game_wave_bonus_unlock() {
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
    assert(game.wave_bonus == 0, 'Init wave should be 0');
    game.assert_not_over();

    // Test different combo count thresholds
    update_combo_and_check(@store, world, game_id, 0, 0); // Below first threshold
    update_combo_and_check(@store, world, game_id, 15, 0); // Just below first threshold
    update_combo_and_check(@store, world, game_id, 16, 1); // At first threshold
    update_combo_and_check(@store, world, game_id, 31, 1); // Between thresholds
    update_combo_and_check(@store, world, game_id, 32, 2); // At second threshold
    update_combo_and_check(@store, world, game_id, 63, 2); // Between thresholds
    update_combo_and_check(@store, world, game_id, 64, 3); // At third threshold
    update_combo_and_check(@store, world, game_id, 100, 3); // Above all thresholds
}

#[test]
fn test_game_wave_bonus_usage() {
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
    assert(game.wave_bonus == 0, 'Init wave should be 0');
    game.assert_not_over();

    // Test different combo count thresholds
    update_combo_and_check(@store, world, game_id, 15, 0); // Just below first threshold
    update_combo_and_check(@store, world, game_id, 16, 1); // At first threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Wave);

    // [Effect] Use wave bonus
    systems.play.apply_bonus(Bonus::Wave, 0, 1);

    // [Assert] Check wave bonus
    let game = store.game(game_id);
    assert(game.wave_used == 1, 'Wave used should be 1');
    update_combo_and_check(@store, world, game_id, 31, 0); // Between thresholds

    update_combo_and_check(@store, world, game_id, 32, 1); // At second threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Wave);
}

#[test]
#[should_panic(expected: ('Game: bonus not available', 'ENTRYPOINT_FAILED'))]
fn test_game_wave_bonus_not_available() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    assert(game.wave_bonus == 0, 'Init wave should be 0');

    // [Effect] Use wave bonus
    systems.play.apply_bonus(Bonus::Wave, 0, 1);
}
