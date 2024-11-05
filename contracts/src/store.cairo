// Starknet imports
use starknet::ContractAddress;

// Core imports
use core::debug::PrintTrait;

// Dojo imports
use dojo::world::WorldStorage;
use dojo::model::ModelStorage;

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
    world: WorldStorage,
}

/// Implementation of the `StoreTrait` trait for the `Store` struct.
#[generate_trait]
impl StoreImpl of StoreTrait {
    #[inline(always)]
    fn new(world: WorldStorage) -> Store {
        Store { world: world }
    }

    // GETTERS

    #[inline(always)]
    fn player(self: Store, player_id: felt252) -> Player {
        self.world.read_model(player_id)
    }

    #[inline(always)]
    fn game(self: Store, game_id: u32) -> Game {
        self.world.read_model(game_id)
    }

    #[inline(always)]
    fn tournament(self: Store, tournament_id: u64) -> Tournament {
        self.world.read_model(tournament_id)
    }

    #[inline(always)]
    fn mint(self: Store, player_id: felt252) -> Mint {
        self.world.read_model(player_id)
    }

    #[inline(always)]
    fn settings(self: Store) -> Settings {
        self.world.read_model(1)
    }

    #[inline(always)]
    fn chest(self: Store, chest_id: u32) -> Chest {
        self.world.read_model(chest_id)
    }

    #[inline(always)]
    fn participation(self: Store, chest_id: u32, player_id: felt252) -> Participation {
        self.world.read_model((chest_id, player_id))
    }

    #[inline(always)]
    fn admin(self: Store, address: ContractAddress) -> Admin {
        let address: felt252 = address.into();
        self.world.read_model(address)
    }

    // SETTERS

    #[inline(always)]
    fn set_game(mut self: Store, mut game: Game) {
        self.world.write_model(@game)
    }

    #[inline(always)]
    fn set_player(mut self: Store, player: Player) {
        self.world.write_model(@player)
    }

    #[inline(always)]
    fn set_tournament(mut self: Store, tournament: Tournament) {
        self.world.write_model(@tournament)
    }

    #[inline(always)]
    fn set_mint(mut self: Store, mint: Mint) {
        self.world.write_model(@mint)
    }

    #[inline(always)]
    fn set_settings(mut self: Store, settings: Settings) {
        self.world.write_model(@settings)
    }

    #[inline(always)]
    fn set_chest(mut self: Store, chest: Chest) {
        self.world.write_model(@chest)
    }

    #[inline(always)]
    fn set_participation(mut self: Store, participation: Participation) {
        self.world.write_model(@participation)
    }

    #[inline(always)]
    fn set_admin(mut self: Store, admin: Admin) {
        self.world.write_model(@admin)
    }

    // DELETE
    #[inline(always)]
    fn delete_admin(mut self: Store, address: ContractAddress) {
        let admin = self.admin(address.into());
        self.world.erase_model(@admin);
    }
}
