//! Store struct and component management methods.

// Core imports

use core::debug::PrintTrait;

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Models imports

use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{Player, PlayerTrait};
use zkube::models::tournament::Tournament;
use zkube::models::credits::Credits;

/// Store struct.
#[derive(Copy, Drop)]
struct Store {
    world: IWorldDispatcher,
}

/// Implementation of the `StoreTrait` trait for the `Store` struct.
#[generate_trait]
impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: IWorldDispatcher) -> Store {
        Store { world: world }
    }

    #[inline(always)]
    fn player(self: Store, player_id: felt252) -> Player {
        get!(self.world, player_id, (Player))
    }

    #[inline(always)]
    fn game(self: Store, game_id: u32) -> Game {
        get!(self.world, game_id, (Game))
    }

    #[inline(always)]
    fn tournament(self: Store, tournament_id: u64) -> Tournament {
        get!(self.world, tournament_id, (Tournament))
    }

    #[inline(always)]
    fn credits(self: Store, player_id: felt252) -> Credits {
        get!(self.world, player_id, (Credits))
    }

    #[inline(always)]
    fn set_game(self: Store, game: Game) {
        set!(self.world, (game))
    }

    #[inline(always)]
    fn set_player(self: Store, player: Player) {
        set!(self.world, (player))
    }

    #[inline(always)]
    fn set_tournament(self: Store, tournament: Tournament) {
        set!(self.world, (tournament))
    }

    #[inline(always)]
    fn set_credits(self: Store, credits: Credits) {
        set!(self.world, (credits))
    }
}
