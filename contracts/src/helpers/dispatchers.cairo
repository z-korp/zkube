//! Helper utilities for common operations.
//!
//! Note: For system dispatchers, use GameLibs from helpers/game_libs.cairo instead.

use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::ContractAddress;
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};

/// Get or create a PlayerMeta for the given player.
/// Reads from world storage, returns new instance if player doesn't exist.
pub fn get_or_create_player_meta(world: WorldStorage, player: ContractAddress) -> PlayerMeta {
    let player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        PlayerMetaTrait::new(player)
    } else {
        player_meta
    }
}
