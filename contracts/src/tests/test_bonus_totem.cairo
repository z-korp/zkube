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
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;

// Test imports
use zkube::tests::setup::{setup, setup::{Systems, PLAYER1}};

// Helper function to update combo count, max combo and check totem bonus
fn update_combo_and_check(
    store: @Store,
    mut world: WorldStorage,
    game_id: u32,
    combo_count: u8,
    max_combo: u8,
    expected_available_totem: u8
) {
    // Update combo count and max combo
    let mut game = (*store).game(game_id);
    game.combo_counter = combo_count;
    game.max_combo = max_combo;
    // Check bonuses
    let (hammer, totem, wave) = game.assess_bonuses();
    game.hammer_bonus = hammer;
    game.totem_bonus = totem;
    game.wave_bonus = wave;
    //(*store).set_game(game);
    world.write_model_test(@game);

    let game = (*store).game(game_id);
    assert(game.totem_bonus - game.totem_used == expected_available_totem, 'Incorrect totem bonus');
}

#[test]
fn test_game_totem_bonus_unlock() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(1, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    game.assert_exists();
    assert(game.totem_bonus == 0, 'Init totem should be 0');
    game.assert_not_over();

    // Test different combo count and max combo thresholds
    update_combo_and_check(@store, world, game_id, 0, 0, 0); // Below first threshold
    update_combo_and_check(@store, world, game_id, 1, 1, 0); // Below first threshold
    update_combo_and_check(@store, world, game_id, 2, 2, 1); // At first threshold
    update_combo_and_check(@store, world, game_id, 3, 3, 1); // Between thresholds
    update_combo_and_check(@store, world, game_id, 4, 4, 2); // At second threshold
    update_combo_and_check(@store, world, game_id, 5, 5, 2); // Between thresholds
    update_combo_and_check(@store, world, game_id, 6, 6, 3); // At third threshold
    update_combo_and_check(@store, world, game_id, 7, 7, 3); // Above all thresholds

    // Test max combo influence
    update_combo_and_check(@store, world, game_id, 2, 6, 3); // Low combo, high max combo
    update_combo_and_check(@store, world, game_id, 7, 3, 1); // High combo, low max combo
}

#[test]
fn test_game_totem_bonus_usage() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(1, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    game.assert_exists();
    assert(game.totem_bonus == 0, 'Init totem should be 0');
    game.assert_not_over();

    // Test totem bonus unlock and usage
    update_combo_and_check(@store, world, game_id, 2, 2, 1); // At first threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Totem);

    // [Effect] Use totem bonus
    systems.play.apply_bonus(Bonus::Totem, 0, 1);

    // [Assert] Check totem bonus
    let game = store.game(game_id);
    assert(game.totem_used == 1, 'Totem used should be 1');
    update_combo_and_check(@store, world, game_id, 3, 3, 0); // Between thresholds

    update_combo_and_check(@store, world, game_id, 4, 4, 1); // At second threshold

    let game = store.game(game_id);
    game.assert_is_available(Bonus::Totem);
}

#[test]
#[should_panic(expected: ('Game: bonus not available', 'ENTRYPOINT_FAILED'))]
fn test_game_totem_bonus_not_available() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(1, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Initial state
    let mut game = store.game(game_id);
    assert(game.totem_bonus == 0, 'Init totem should be 0');

    // [Effect] Use totem bonus
    systems.play.apply_bonus(Bonus::Totem, 0, 1);
}
