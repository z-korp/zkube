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
use zkube::systems::dailygame::IDailyGameDispatcherTrait;

use zkube::tests::setup::{
    setup, setup::{Mode, Systems, PLAYER1, PLAYER2, PLAYER3, PLAYER4, IERC20DispatcherTrait}
};

#[test]
fn test_play_ranked_tournament_started() {
    // [Setup]
    let (world, _, context) = setup::spawn_game(Mode::Daily);
    let store = StoreTrait::new(world);

    // [Assert] Game
    let mut game = store.game(context.game_id);
    game.assert_started();
}
