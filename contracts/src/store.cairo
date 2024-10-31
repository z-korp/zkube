// Starknet imports
use starknet::ContractAddress;

// Core imports
use core::debug::PrintTrait;

// Dojo imports
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Models imports
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{Player, PlayerTrait};
use zkube::models::tournament::Tournament;
use zkube::models::mint::Mint;
use zkube::models::settings::Settings;
use zkube::models::chest::Chest;
use zkube::models::participation::Participation;
use zkube::models::admin::Admin;

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

    // GETTERS

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
    fn mint(self: Store, player_id: felt252) -> Mint {
        get!(self.world, player_id, (Mint))
    }

    #[inline(always)]
    fn settings(self: Store) -> Settings {
        get!(self.world, 1, (Settings))
    }

    #[inline(always)]
    fn chest(self: Store, chest_id: u32) -> Chest {
        get!(self.world, chest_id, (Chest))
    }

    #[inline(always)]
    fn participation(self: Store, chest_id: u32, player_id: felt252) -> Participation {
        get!(self.world, (chest_id, player_id), (Participation))
    }

    #[inline(always)]
    fn admin(self: Store, address: ContractAddress) -> Admin {
        let address: felt252 = address.into();
        get!(self.world, address, (Admin))
    }

    // SETTERS

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
    fn set_mint(self: Store, mint: Mint) {
        set!(self.world, (mint))
    }

    #[inline(always)]
    fn set_settings(self: Store, settings: Settings) {
        set!(self.world, (settings))
    }

    #[inline(always)]
    fn set_chest(self: Store, chest: Chest) {
        set!(self.world, (chest))
    }

    #[inline(always)]
    fn set_participation(self: Store, participation: Participation) {
        set!(self.world, (participation))
    }

    #[inline(always)]
    fn set_admin(self: Store, admin: Admin) {
        set!(self.world, (admin))
    }

    // DELETE
    #[inline(always)]
    fn delete_admin(self: Store, address: ContractAddress) {
        let admin = self.admin(address.into());
        delete!(self.world, (admin));
    }
}
