use zkube::models::game::AssertTrait;
// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{set_contract_address, set_caller_address, set_block_timestamp};

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait, GameAssert};
use zkube::models::tournament::{TournamentImpl};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::systems::tournament::ITournamentSystemDispatcherTrait;

use zkube::tests::setup::{
    setup, setup::{Mode, Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4, IERC20DispatcherTrait}
};

#[test]
fn test_play_play_ranked_tournament_started() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Game
    let mut game = store.game(game_id);
    game.assert_exists();
}


#[test]
fn test_play_play_daily_tournament_claim() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);
    let settings = store.settings();
    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    // [Start] Player1
    set_contract_address(PLAYER1());
    let player1_balance = context.erc20.balance_of(PLAYER1());

    // game 1, free credits
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Balance post creation
    let balance = context.erc20.balance_of(PLAYER1());
    // println!("balance {}", balance);
    // println!("player1_balance {}", player1_balance);
    // println!("constants::DAILY_MODE_PRICE {}", constants::DAILY_MODE_PRICE);
    assert(balance == player1_balance, 'Balance post free creation');

    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 2, free credits
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 3, free credits
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 4, paid
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // [Assert] Balance post paid creation
    let balance = context.erc20.balance_of(PLAYER1());
    // println!("balance {}", balance);
    // println!("player1_balance {}", player1_balance);
    // println!("constants::DAILY_MODE_PRICE {}", constants::DAILY_MODE_PRICE);
    assert(
        balance + constants::DAILY_MODE_PRICE.into() == player1_balance,
        'Balance post paid creation'
    );

    // game 5, paid
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // [Start] Player2
    set_contract_address(PLAYER2());
    let player2_balance = context.erc20.balance_of(PLAYER2());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let game = store.game(game_id);
    game.assert_exists();

    // println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 010_010_001_000_100_100_100_100
    // 000_001_001_011_011_011_010_010
    // 000_100_100_100_100_011_011_011
    println!("qqqqq 1");
    systems.play.move(1, 6, 7);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    // println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 000_000_001_000_100_100_100_100
    // 001_000_100_100_100_100_010_010
    println!("qqqqq 2");
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 000_000_001_000_100_100_100_100
    // 001_000_100_100_100_100_010_010
    println!("qqqqq 3");
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);

    // println!("game.score {}", game.score);
    assert(game.score == 7, 'Score post move 2');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();

    let top1_score = game.score;

    // [Start] Player3
    set_contract_address(PLAYER3());
    let player3_balance = context.erc20.balance_of(PLAYER3());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 010_010_001_000_100_100_100_100
    // 000_001_001_011_011_011_010_010
    // 000_100_100_100_100_011_011_011
    println!("qqqqq 4");
    systems.play.move(1, 6, 7);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    // println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 000_000_001_000_100_100_100_100
    // 001_000_100_100_100_100_010_010
    println!("qqqqq 5");
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    assert(game.score == 4, 'Score post move 3');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();
    let top2_score = game.score;

    // [Start] Player 4
    set_contract_address(PLAYER4());
    let player4_balance = context.erc20.balance_of(PLAYER4());
    let game_id = systems
        .play
        .create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    game.assert_exists();

    // println!("blocks {}", game.blocks);
    // 011_011_011_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 010_010_001_000_100_100_100_100
    // 000_001_001_011_011_011_010_010
    // 000_100_100_100_100_011_011_011
    println!("qqqqq 6");
    systems.play.move(1, 6, 7);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    assert(game.score == 3, 'Score post move 3');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();

    let top3_score = game.score;

    // [Assert] Tournament
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let tournament = store.tournament(tournament_id);

    // Calculate the expected prize
    let total_paid_games = 2_u256;
    let prize_per_game = constants::DAILY_MODE_PRICE.into()
        * constants::TOURNAMENT_PERCENTAGE.into()
        / 100_u256;
    let expected_prize = prize_per_game * total_paid_games;
    assert(tournament.prize.into() == expected_prize, 'Tournament prize mismatch');
    assert(tournament.top1_player_id == PLAYER2().into(), 'Tournament top1_player_id');
    assert(tournament.top2_player_id == PLAYER3().into(), 'Tournament top2_player_id');
    assert(tournament.top3_player_id == PLAYER4().into(), 'Tournament top3_player_id');
    assert(tournament.top1_score == top1_score, 'Tournament top1_score');
    assert(tournament.top2_score == top2_score, 'Tournament top2_score');
    assert(tournament.top3_score == top3_score, 'Tournament top3_score');

    // [Claim]
    set_contract_address(PLAYER2());
    set_block_timestamp(2 * constants::DAILY_MODE_DURATION);
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 1;
    systems.tournament.claim(Mode::Daily, tournament_id, rank);

    // [Assert] Player2 balance
    let final_player2 = context.erc20.balance_of(PLAYER2());
    let tournament = store.tournament(tournament_id);
    let reward: u256 = tournament.reward(rank).into();
    assert(final_player2 == player2_balance + reward, 'Player2 balance post claim');

    // [Claim]
    set_contract_address(PLAYER3());
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 2;
    systems.tournament.claim(Mode::Daily, tournament_id, rank);

    // [Assert] Player3 balance
    let final_player3 = context.erc20.balance_of(PLAYER3());
    let tournament = store.tournament(tournament_id);
    let reward: u256 = tournament.reward(rank).into();
    assert(final_player3 == player3_balance + reward, 'Player3 balance post claim');

    // [Claim]
    set_contract_address(PLAYER4());
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 3;
    systems.tournament.claim(Mode::Daily, tournament_id, rank);

    // [Assert] Player4 balance
    let final_player4 = context.erc20.balance_of(PLAYER4());
    let tournament = store.tournament(tournament_id);
    let reward: u256 = tournament.reward(rank).into();
    assert(final_player4 == player4_balance + reward, 'Player3 balance post claim');

    // [Assert] Rewards
    assert(final_player2 > final_player3 && final_player2 > final_player4, 'Player2 reward');
    assert(final_player3 > final_player4, 'Player3 reward');
}

#[test]
#[should_panic(expected: ('Tournament: not over', 'ENTRYPOINT_FAILED',))]
fn test_play_play_ranked_tournament_claim_revert_not_over() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);
    let settings = store.settings();
    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    set_contract_address(PLAYER1());
    // free game 1
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 2
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 3
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // paid game 1
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Claim]
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    systems.tournament.claim(Mode::Daily, tournament_id, 1);
}

#[test]
#[should_panic(expected: ('Tournament: invalid player', 'ENTRYPOINT_FAILED',))]
fn test_play_play_ranked_tournament_claim_revert_invalid_player() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);
    let settings = store.settings();

    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    set_contract_address(PLAYER1());

    // free game 1
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 2
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 3
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // paid game 1
    context.erc20.approve(context.tournament_address, settings.daily_mode_price.into());
    context.erc20.approve(context.chest_address, settings.daily_mode_price.into());
    context.erc20.approve(context.zkorp_address, settings.daily_mode_price.into());
    systems.play.create(Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Claim]
    set_block_timestamp(2 * constants::DAILY_MODE_DURATION);
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    set_contract_address(PLAYER2());
    systems.tournament.claim(Mode::Daily, tournament_id, 1);
}

