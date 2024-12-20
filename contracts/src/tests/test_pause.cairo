use zkube::models::game::AssertTrait;
// Core imports
use core::debug::PrintTrait;

// Starknet imports
use starknet::testing::{set_contract_address, set_block_timestamp};
use starknet::get_block_timestamp;

// Dojo imports
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports
use zkube::constants::{DAILY_MODE_DURATION};
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait, GameAssert};
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::systems::settings::ISettingsDispatcherTrait;
use zkube::tests::mocks::erc721::{
    IERC721Dispatcher, IERC721DispatcherTrait, IERC721MintableDispatcher,
    IERC721MintableDispatcherTrait
};

use zkube::tests::setup::{
    setup,
    setup::{
        Mode, Systems, ADMIN, PLAYER1, PLAYER2, IERC20DispatcherTrait, impersonate, user_mint_token
    }
};

#[test]
#[should_panic(expected: ('Games are paused', 'ENTRYPOINT_FAILED',))]
fn test_pause_create_while_paused() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // [Action] Admin pauses games
    impersonate(ADMIN());
    systems.settings.update_are_game_paused(true);

    // [Assert] Check settings updated
    let settings = store.settings();
    assert(settings.are_games_paused == true, 'Games should be paused');

    // [Action] Try to create game while paused
    impersonate(PLAYER1());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());

    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
}

#[test]
fn test_pause_unpause() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // [Action] Admin pauses games
    impersonate(ADMIN());
    systems.settings.update_are_game_paused(true);

    // [Assert] Check settings updated
    let settings = store.settings();
    assert(settings.are_games_paused == true, 'Games should be paused');

    // [Action] Admin unpauses games
    impersonate(ADMIN());
    systems.settings.update_are_game_paused(false);

    // [Assert] Check settings updated
    let settings = store.settings();
    assert(settings.are_games_paused == false, 'Games should be unpaused');

    // [Action] Try to create game while unpaused
    impersonate(PLAYER1());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());

    // This should succeed
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Game created successfully
    let game = store.game(game_id);
    game.assert_exists();
}

#[test]
#[should_panic(expected: ('Admin: Not an admin', 'ENTRYPOINT_FAILED',))]
fn test_pause_not_admin() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // [Action] Non-admin tries to pause games
    impersonate(PLAYER1());
    systems.settings.update_are_game_paused(true);
}

#[test]
fn test_pause_move_while_paused() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    let time = DAILY_MODE_DURATION + 1;
    set_block_timestamp(time.into());

    // Create game before pausing
    impersonate(PLAYER2());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER2().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Action] Admin pauses games
    impersonate(ADMIN());
    systems.settings.update_are_game_paused(true);

    // [Action] Try to make a move while paused
    impersonate(PLAYER2());
    systems.play.move(1, 6, 7);
}

#[test]
#[should_panic(expected: ('Chests are unlocked', 'ENTRYPOINT_FAILED',))]
fn test_pause_move_while_chest_unlocked() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    let time = DAILY_MODE_DURATION + 1;
    set_block_timestamp(time.into());

    // Create game before unlocking chests
    impersonate(PLAYER1());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Action] Admin unlocks chests
    impersonate(ADMIN());
    systems.settings.update_are_chests_unlock(true);

    // [Assert] Check settings updated
    let settings = store.settings();
    assert(settings.are_chests_unlock == true, 'Chests should be unlocked');

    // [Action] Try to make a move while chests are unlocked
    impersonate(PLAYER1());
    systems.play.move(1, 6, 7);
}

#[test]
#[should_panic(expected: ('Chests are unlocked', 'ENTRYPOINT_FAILED',))]
fn test_pause_surrender_while_chest_unlocked() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    let time = DAILY_MODE_DURATION + 1;
    set_block_timestamp(time.into());

    // Create game before unlocking chests
    impersonate(PLAYER1());
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Action] Admin unlocks chests
    impersonate(ADMIN());
    systems.settings.update_are_chests_unlock(true);

    // [Assert] Check settings updated
    let settings = store.settings();
    assert(settings.are_chests_unlock == true, 'Chests should be unlocked');

    // [Action] Try to surrender while chests are unlocked
    impersonate(PLAYER1());
    systems.play.surrender();
}

#[test]
#[should_panic(expected: ('Admin: Not an admin', 'ENTRYPOINT_FAILED',))]
fn test_pause_unlock_chests_not_admin() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // [Action] Non-admin tries to unlock chests
    impersonate(PLAYER1());
    systems.settings.update_are_chests_unlock(true);
}
