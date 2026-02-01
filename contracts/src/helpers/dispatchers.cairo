//! Shared dispatcher helpers for accessing system contracts via world DNS.
//! This module consolidates duplicate dispatcher code from game, play, shop, and quest systems.

use starknet::ContractAddress;
use dojo::world::{WorldStorage, WorldStorageTrait};
use dojo::model::ModelStorage;

use zkube::constants::DEFAULT_SETTINGS::is_default_settings;
use zkube::systems::cube_token::ICubeTokenDispatcher;
use zkube::systems::quest::{IQuestSystemDispatcher, IQuestSystemDispatcherTrait};
use zkube::systems::level::{ILevelSystemDispatcher, ILevelSystemDispatcherTrait};
use zkube::systems::grid::{IGridSystemDispatcher, IGridSystemDispatcherTrait};
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};

/// Get the CubeToken contract dispatcher via world DNS
pub fn get_cube_token_dispatcher(world: WorldStorage) -> ICubeTokenDispatcher {
    let cube_token_address = world.dns_address(@"cube_token")
        .expect('CubeToken not found in DNS');
    ICubeTokenDispatcher { contract_address: cube_token_address }
}

/// Get the QuestSystem contract dispatcher via world DNS
/// Returns Option to gracefully handle missing quest_system (during migration)
pub fn get_quest_system_dispatcher(world: WorldStorage) -> Option<IQuestSystemDispatcher> {
    match world.dns_address(@"quest_system") {
        Option::Some(addr) => Option::Some(
            IQuestSystemDispatcher { contract_address: addr },
        ),
        Option::None => Option::None,
    }
}

/// Track quest progress for a player (no-op if quest system not deployed or custom settings)
/// Only tracks progress for games using default settings (settings_id == 0)
pub fn track_quest_progress(
    world: WorldStorage, player: ContractAddress, task_id: felt252, count: u32, settings_id: u32,
) {
    // Only track quest progress for default settings games
    if !is_default_settings(settings_id) {
        return;
    }
    if let Option::Some(quest_system) = get_quest_system_dispatcher(world) {
        quest_system.progress(player, task_id, count);
    }
}

/// Get or create a PlayerMeta for the given player
/// Reads from world storage, returns new instance if player doesn't exist
pub fn get_or_create_player_meta(world: WorldStorage, player: ContractAddress) -> PlayerMeta {
    let player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        PlayerMetaTrait::new(player)
    } else {
        player_meta
    }
}

/// Get the LevelSystem contract dispatcher via world DNS
pub fn get_level_system_dispatcher(world: WorldStorage) -> ILevelSystemDispatcher {
    let level_system_address = world.dns_address(@"level_system")
        .expect('LevelSystem not found in DNS');
    ILevelSystemDispatcher { contract_address: level_system_address }
}

/// Get the GridSystem contract dispatcher via world DNS
pub fn get_grid_system_dispatcher(world: WorldStorage) -> IGridSystemDispatcher {
    let grid_system_address = world.dns_address(@"grid_system")
        .expect('GridSystem not found in DNS');
    IGridSystemDispatcher { contract_address: grid_system_address }
}
