use core::traits::Into;
use core::Zeroable;
use starknet::testing::{set_contract_address, set_caller_address, set_block_timestamp};

use zkube::models::chest::{Chest, ChestTrait, ChestAssert, ZeroableChest};
use zkube::models::participation::{
    Participation, ParticipationTrait, ParticipationAssert, ZeroableParticipation
};
use zkube::store::{Store, StoreTrait};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::systems::settings::{ISettingsDispatcherTrait, ISettingsDispatcher};
use zkube::types::mode::Mode;
use zkube::constants::{PRECISION_FACTOR, DAILY_MODE_DURATION, CHEST_PERCENTAGE, DAILY_MODE_PRICE};

use zkube::tests::setup::{
    setup, setup::{Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4, IERC20DispatcherTrait}
};

#[test]
fn test_chest_creation_and_completion() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    let time = DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    store.chest(1).assert_exists(); // Chest 1 should exist
    store.chest(2).assert_exists(); // Chest 2 should exist
    store.chest(3).assert_exists(); // Chest 3 should not exist
    store.chest(4).assert_exists(); // Chest 4 should not exist
    store.chest(5).assert_exists(); // Chest 5 should not exist
    store.chest(6).assert_exists(); // Chest 6 should not exist
    store.chest(7).assert_exists(); // Chest 7 should not exist
    store.chest(8).assert_exists(); // Chest 8 should not exist
    store.chest(9).assert_exists(); // Chest 9 should not exist
    store.chest(10).assert_exists(); // Chest 10 should not exist

    let mut chest = store.chest(1);
    chest.points = 9_995;
    store.set_chest(chest);

    set_contract_address(PLAYER1());
    // 1st game
    let player3_balance = context.erc20.balance_of(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    systems.play.move(1, 6, 7);
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);

    assert(game.score == 4, 'Score post move 3');

    systems.play.surrender();

    let chest = store.chest(1);
    assert(chest.points == 9_999, 'Chest1 points should be 9_999');
    assert(!chest.is_complete(), 'Chest1 should not be completed');
    assert(chest.remaining_points() == 1, 'Chest1 remain pts should be 1');

    // 2nd game
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    systems.play.move(1, 6, 7);
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);

    assert(game.score == 4, 'Score post move 3');

    systems.play.surrender();

    let chest = store.chest(1);
    assert(chest.points == 10_000, 'Chest1 points should be 1_000');
    assert(chest.is_complete(), 'Chest1 should be completed');
    assert(chest.remaining_points() == 0, 'Chest1 remain pts should 0');

    let chest2 = store.chest(2);
    assert(chest2.points == 3, 'Chest2 points should be 3');
    assert(!chest2.is_complete(), 'Chest2 should not be completed');
    assert(chest2.remaining_points() == 24_997, 'Chest2 remain pts be 24997');
}

#[test]
fn test_chest_claim() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    let time = DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    // [Create admin]
    set_contract_address(PLAYER1());
    let new_free_daily_credits: u8 = 0;
    systems.settings.update_free_daily_credits(new_free_daily_credits);

    // [Assert] Settings updated
    let settings = store.settings();
    assert(settings.free_daily_credits == new_free_daily_credits, 'Free credits not updated');

    // Now let's finish a chest with 4 players

    set_contract_address(context.owner);
    let mut chest = store.chest(1);
    chest.points = 9_982;
    store.set_chest(chest);

    // Player 1
    set_contract_address(PLAYER1());
    let player1_balance = context.erc20.balance_of(PLAYER1());
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.move(1, 6, 7);
    systems.play.surrender(); // 3 points
    let player1_new_balance = context.erc20.balance_of(PLAYER1());

    // Player 2
    set_contract_address(PLAYER2());
    let player2_balance = context.erc20.balance_of(PLAYER2());
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.move(1, 6, 7);
    systems.play.move(1, 5, 6);
    systems.play.surrender(); // 4 points
    let player2_new_balance = context.erc20.balance_of(PLAYER2());

    // Player 3
    set_contract_address(PLAYER3());
    let player3_balance = context.erc20.balance_of(PLAYER3());
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.move(1, 6, 7);
    systems.play.move(1, 5, 6);
    systems.play.move(1, 5, 6);
    systems.play.surrender(); // 7 points
    let player3_new_balance = context.erc20.balance_of(PLAYER3());

    // Player 4
    set_contract_address(PLAYER4());
    let player4_balance = context.erc20.balance_of(PLAYER4());
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.move(1, 6, 7);
    systems.play.move(1, 5, 6);
    systems.play.move(1, 5, 6);
    systems.play.surrender(); // 7 points
    let player4_new_balance = context.erc20.balance_of(PLAYER4());

    // [Assert] Player balances
    let daily_mode_price: felt252 = DAILY_MODE_PRICE;
    let daily_mode_price_u256 = daily_mode_price.into();
    assert(player1_new_balance == player1_balance - daily_mode_price_u256, 'Player1 balance wrong');
    assert(player2_new_balance == player2_balance - daily_mode_price_u256, 'Player2 balance wrong');
    assert(player3_new_balance == player3_balance - daily_mode_price_u256, 'Player3 balance wrong');
    assert(player4_new_balance == player4_balance - daily_mode_price_u256, 'Player4 balance wrong');

    // [Assert] Chest
    let chest = store.chest(1);
    assert(chest.points == 10_000, 'Chest points should be 10_000');
    assert(chest.is_complete(), 'Chest should be completed');
    assert(chest.remaining_points() == 0, 'Chest remain pts should be 0');

    // Calculate the expected prize
    let total_paid_games = 4_u256; // Four paid games were created
    let prize_per_game = DAILY_MODE_PRICE.into() * CHEST_PERCENTAGE.into() / 100_u256;

    // Chest 1 gets 3 full games + 4/7 of the last game
    let chest1_fraction = (3_u256 * PRECISION_FACTOR.into())
        + (4_u256 * PRECISION_FACTOR.into()) / 7_u256;
    let expected_prize1 = (prize_per_game * chest1_fraction) / PRECISION_FACTOR.into();

    // Chest 2 gets 3/7 of the last game
    let chest2_fraction = 3_u256 * PRECISION_FACTOR.into() / 7_u256;
    let expected_prize2 = (prize_per_game * chest2_fraction) / PRECISION_FACTOR.into();

    println!("Chest 1 prize: {}", chest.prize);
    println!("Expected prize 1: {}", expected_prize1);
    assert(chest.prize.into() - expected_prize1, 'Chest1 prize mismatch');

    let chest2 = store.chest(2);
    println!("Chest 2 prize: {}", chest2.prize);
    println!("Expected prize 2: {}", expected_prize2);
    assert(chest2.prize.into() == expected_prize2, 'Chest2 prize mismatch');

    let chest2 = store.chest(2);
    assert(chest2.points == 3, 'Chest2 points should be 3');
    assert(!chest2.is_complete(), 'Chest2 should not be completed');
    assert(chest2.remaining_points() == 24_999, 'Chest2 remain pts should 24999');
    assert(chest.prize == 0, 'Chest2 wrong prize');
}

