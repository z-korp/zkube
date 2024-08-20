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

use zkube::tests::setup::{
    setup, setup::{Mode, Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4, IERC20DispatcherTrait}
};

#[test]
fn test_play_play_ranked_tournament_started() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_contract_address(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    // [Assert] Game
    let mut game = store.game(game_id);
    game.assert_exists();
}


#[test]
fn test_play_play_daily_tournament_claim() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);
    let time = 0;
    set_block_timestamp(time);

    // [Start] Player1
    set_contract_address(PLAYER1());
    let player1_balance = context.erc20.balance_of(PLAYER1());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    // [Assert] Balance post creation
    let balance = context.erc20.balance_of(PLAYER1());
    assert(
        balance + constants::DAILY_MODE_PRICE.into() == player1_balance, 'Balance post creation'
    );

    // [Start] Player2
    set_contract_address(PLAYER2());
    let player2_balance = context.erc20.balance_of(PLAYER2());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let game = store.game(game_id);
    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_001_011_011_011_010_010
    // 001_000_010_010_001_011_011_011
    game.assert_exists();
    systems.play.move(1, 5, 6);
    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_000_011_011_011_010_010
    // 010_010_000_000_001_001_010_010
    // println!("game.score {}", game.score);
    assert(game.score == 1, 'Score post move');

    systems.play.move(1, 7, 5);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);
    assert(game.score == 4, 'Score post move');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();

    let top1_score = game.score;

    // [Start] Player3
    set_contract_address(PLAYER3());
    let player3_balance = context.erc20.balance_of(PLAYER3());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    game.assert_exists();
    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_001_011_011_011_010_010
    // 001_000_010_010_001_011_011_011

    systems.play.move(1, 5, 6);
    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_000_011_011_011_010_010
    // 010_010_000_000_001_001_010_010

    // println!("game.score {}", game.score);
    assert(game.score == 1, 'Score post move');

    systems.play.move(4, 1, 0);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);
    assert(game.score == 2, 'Score post move');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();
    let top2_score = game.score;

    // [Start] Player 4
    set_contract_address(PLAYER4());
    let player4_balance = context.erc20.balance_of(PLAYER4());
    let game_id = systems.play.create(context.proof.clone(), context.seed, context.beta);

    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    game.assert_exists();

    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_001_011_011_011_010_010
    // 001_000_010_010_001_011_011_011

    systems.play.move(1, 5, 6);
    let game = store.game(game_id);
    // println!("blocks {}", game.blocks);
    // 011_011_011_011_011_011_001_000
    // 011_011_011_010_010_010_010_000
    // 011_011_011_000_001_011_011_011
    // 001_000_000_011_011_011_010_010
    // 010_010_000_000_001_001_010_010
    // println!("game.score {}", game.score);

    assert(game.score == 1, 'Score post move');
    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();

    let top3_score = game.score;

    // [Assert] Tournament
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let tournament = store.tournament(tournament_id);
    assert(tournament.prize == constants::DAILY_MODE_PRICE * 4, 'Tournament prize');
    assert(tournament.top1_player_id == PLAYER2().into(), 'Tournament top1_player_id');
    assert(tournament.top2_player_id == PLAYER3().into(), 'Tournament top2_player_id');
    assert(tournament.top3_player_id == PLAYER4().into(), 'Tournament top3_player_id');
    assert(tournament.top1_score == top1_score, 'Tournament top1_score');
    assert(tournament.top2_score == top2_score, 'Tournament top2_score');
    assert(tournament.top3_score == top3_score, 'Tournament top3_score');

    // [Claim]
    set_contract_address(PLAYER2());
    set_block_timestamp(constants::DAILY_MODE_DURATION);
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 1;
    systems.play.claim(tournament_id, rank);

    // [Assert] Player1 balance
    let final_player1 = context.erc20.balance_of(PLAYER2());
    let tournament = store.tournament(tournament_id);
    let reward = tournament.reward(rank);
    assert(
        final_player1 + constants::DAILY_MODE_PRICE.into() == player1_balance + reward,
        'Player1 balance post claim'
    );

    // [Claim]
    set_contract_address(PLAYER3());
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 2;
    systems.play.claim(tournament_id, rank);

    // [Assert] Player2 balance
    let final_player2 = context.erc20.balance_of(PLAYER3());
    let tournament = store.tournament(tournament_id);
    let reward = tournament.reward(rank);
    assert(
        final_player2 + constants::DAILY_MODE_PRICE.into() == player2_balance + reward,
        'Player2 balance post claim'
    );

    // [Claim]
    set_contract_address(PLAYER4());
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 3;
    systems.play.claim(tournament_id, rank);

    // [Assert] Player3 balance
    let final_player3 = context.erc20.balance_of(PLAYER4());
    let tournament = store.tournament(tournament_id);
    let reward = tournament.reward(rank);
    assert(
        final_player3 + constants::DAILY_MODE_PRICE.into() == player3_balance + reward,
        'Player3 balance post claim'
    );

    // [Assert] Rewards
    assert(final_player1 > final_player2 && final_player1 > final_player3, 'Player1 reward');
    assert(final_player2 > final_player3, 'Player2 reward');
}

#[test]
#[should_panic(expected: ('Tournament: not over', 'ENTRYPOINT_FAILED',))]
fn test_play_play_ranked_tournament_claim_revert_not_over() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let time = 0;
    set_block_timestamp(time);

    set_contract_address(PLAYER1());
    systems.play.create(context.proof.clone(), context.seed, context.beta);

    // [Claim]
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    systems.play.claim(tournament_id, 1);
}

#[test]
#[should_panic(expected: ('Tournament: invalid player', 'ENTRYPOINT_FAILED',))]
fn test_play_play_ranked_tournament_claim_revert_invalid_player() {
    // [Setup]
    let (world, systems, context) = setup::create_accounts();
    let time = 0;
    set_block_timestamp(time);

    set_contract_address(PLAYER1());
    systems.play.create(context.proof.clone(), context.seed, context.beta);

    // [Claim]
    set_block_timestamp(constants::DAILY_MODE_DURATION);
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    systems.play.claim(tournament_id, 1);
}

