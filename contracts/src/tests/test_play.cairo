use zkube::models::game::AssertTrait;
// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{set_contract_address, set_block_timestamp};

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::game::{Game, GameTrait, GameAssert};
use zkube::models::tournament::{TournamentImpl};
use zkube::systems::play::IPlayDispatcherTrait;
use zkube::systems::tournament::ITournamentSystemDispatcherTrait;
use zkube::tests::mocks::erc721::{
    IERC721Dispatcher, IERC721DispatcherTrait, IERC721MintableDispatcher,
    IERC721MintableDispatcherTrait
};


use zkube::tests::setup::{
    setup,
    setup::{
        Mode, Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4, IERC20DispatcherTrait,
        verify_system_allowance, user_mint_token, admin_mint_token, impersonate
    }
};

#[test]
fn test_play_play_ranked_tournament_started() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);

    let erc721 = IERC721Dispatcher { contract_address: context.erc721.contract_address };

    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());

    impersonate(PLAYER1());
    // [Action] Give allowance
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Game
    let mut game = store.game(game_id);
    game.assert_exists();

    // Check if still full allowance
    let max_u128 = 0xffffffffffffffffffffffffffffffff_u128;
    let max_u256: u256 = u256 { low: max_u128, high: max_u128 };
    verify_system_allowance(erc20_addr, erc721_addr, context.tournament_address, max_u256);
}


#[test]
fn test_play_play_daily_tournament_claim() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;

    let erc721_mintable = IERC721MintableDispatcher {
        contract_address: context.erc721.contract_address
    };
    let price = erc721_mintable.get_mint_price();

    let store = StoreTrait::new(world);
    let settings = store.settings();
    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    // [Start] Player1
    impersonate(PLAYER1());
    let player1_balance = context.erc20.balance_of(PLAYER1());

    // game 1, free
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Assert] Balance post creation
    let balance = context.erc20.balance_of(PLAYER1());
    // println!("balance {}", balance);
    // println!("player1_balance {}", player1_balance);
    // println!("constants::DAILY_MODE_PRICE {}", constants::DAILY_MODE_PRICE);
    assert(balance == player1_balance, 'Balance post free creation');

    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 2, free
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 3, free
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // game 4, paid
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // [Assert] Balance post paid creation
    let balance = context.erc20.balance_of(PLAYER1());
    // println!("balance {}", balance);
    // println!("player1_balance {}", player1_balance);
    // println!("constants::DAILY_MODE_PRICE {}", constants::DAILY_MODE_PRICE);
    assert(balance + price == player1_balance, 'Balance post paid creation');

    // game 5, paid
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    let game = store.game(game_id);
    game.assert_exists();
    systems.play.surrender();

    // [Start] Player2
    impersonate(PLAYER2());
    let player2_balance = context.erc20.balance_of(PLAYER2());
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER2().into());
    impersonate(PLAYER2());
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

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
    // 000_000_000_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 011_011_011_000_100_100_100_100
    // 010_010_001_000_011_011_011_001
    println!("qqqqq 3");
    systems.play.move(2, 2, 1);
    let game = store.game(game_id);

    // println!("game.score {}", game.score);
    assert(game.score == 7, 'Score post move 2');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();

    let top1_score = game.score;

    // [Start] Player3
    impersonate(PLAYER3());
    let player3_balance = context.erc20.balance_of(PLAYER3());
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER3().into());
    impersonate(PLAYER3());
    println!("token_id {}", token_id);
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

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
    // 000_000_000_001_000_001_010_010
    // 011_011_011_010_010_001_000_001
    // 011_011_011_000_100_100_100_100
    // 010_010_001_000_011_011_011_001
    println!("qqqqq 5");
    systems.play.move(2, 2, 1);
    let game = store.game(game_id);
    // println!("game.score {}", game.score);

    assert(game.score == 4, 'Score post move 3');

    systems.play.surrender();
    let game = store.game(game_id);
    game.assert_is_over();
    let top2_score = game.score;

    // [Start] Player 4
    impersonate(PLAYER4());
    let player4_balance = context.erc20.balance_of(PLAYER4());
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER4().into());
    impersonate(PLAYER4());
    println!("token_id {}", token_id);
    let game_id = systems
        .play
        .create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

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
    let prize_per_game = price * constants::TOURNAMENT_PERCENTAGE.into() / 100_u256;
    let expected_prize = prize_per_game * total_paid_games;
    assert(tournament.prize.into() == expected_prize, 'Tournament prize mismatch');
    assert(tournament.top1_player_id == PLAYER2().into(), 'Tournament top1_player_id');
    assert(tournament.top2_player_id == PLAYER3().into(), 'Tournament top2_player_id');
    assert(tournament.top3_player_id == PLAYER4().into(), 'Tournament top3_player_id');
    assert(tournament.top1_score == top1_score, 'Tournament top1_score');
    assert(tournament.top2_score == top2_score, 'Tournament top2_score');
    assert(tournament.top3_score == top3_score, 'Tournament top3_score');

    // [Claim]
    impersonate(PLAYER2());
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
    impersonate(PLAYER3());
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    let rank = 2;
    systems.tournament.claim(Mode::Daily, tournament_id, rank);

    // [Assert] Player3 balance
    let final_player3 = context.erc20.balance_of(PLAYER3());
    let tournament = store.tournament(tournament_id);
    let reward: u256 = tournament.reward(rank).into();
    assert(final_player3 == player3_balance + reward, 'Player3 balance post claim');

    // [Claim]
    impersonate(PLAYER4());
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
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);
    let settings = store.settings();
    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    impersonate(PLAYER1());
    // free game 1
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    println!("token_id {}", token_id);
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 2
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    println!("token_id {}", token_id);
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 3
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    println!("token_id {}", token_id);
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // paid game 1
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    println!("token_id {}", token_id);
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Claim]
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    systems.tournament.claim(Mode::Daily, tournament_id, 1);
}

#[test]
#[should_panic(expected: ('Tournament: invalid player', 'ENTRYPOINT_FAILED',))]
fn test_play_play_ranked_tournament_claim_revert_invalid_player() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let erc721_addr = context.erc721.contract_address;
    let erc20_addr = context.erc20.contract_address;
    let store = StoreTrait::new(world);
    let settings = store.settings();

    let time = constants::DAILY_MODE_DURATION + 1;
    set_block_timestamp(time);

    impersonate(PLAYER1());

    // free game 1
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 2
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // free game 3
    let token_id = admin_mint_token(erc721_addr, erc20_addr, PLAYER1().into());
    impersonate(PLAYER1());
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);
    systems.play.surrender();

    // paid game 1
    let token_id = user_mint_token(context.play_address, erc721_addr, erc20_addr, PLAYER1().into());
    systems.play.create(token_id, Mode::Daily, context.proof.clone(), context.seed, context.beta);

    // [Claim]
    set_block_timestamp(2 * constants::DAILY_MODE_DURATION);
    let tournament_id = TournamentImpl::compute_id(time, constants::DAILY_MODE_DURATION);
    impersonate(PLAYER2());
    systems.tournament.claim(Mode::Daily, tournament_id, 1);
}

