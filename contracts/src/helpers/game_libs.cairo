//! GameLibs - Bundled dispatcher pattern for cross-system calls.
//! 
//! Inspired by death-mountain's GameLibs pattern. Provides a single initialization
//! point for all system dispatchers, reducing boilerplate and ensuring type safety.
//! 
//! Usage:
//! ```cairo
//! use zkube::helpers::game_libs::{GameLibs, GameLibsImpl};
//! 
//! let libs = GameLibsImpl::new(world);
//! libs.level.complete_level(game_id);
//! libs.grid.execute_move(game_id, row, start, end);
//! libs.cube.mint(player, amount);
//! ```

use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::ContractAddress;

// Re-export dispatcher types and traits for convenience
pub use zkube::systems::level::{ILevelSystemDispatcher, ILevelSystemDispatcherTrait};
pub use zkube::systems::grid::{IGridSystemDispatcher, IGridSystemDispatcherTrait};
pub use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
pub use zkube::systems::quest::{IQuestSystemDispatcher, IQuestSystemDispatcherTrait};

use zkube::constants::DEFAULT_SETTINGS::is_default_settings;

/// Bundled dispatchers for all game systems.
/// Initialize once with GameLibsImpl::new(world) and use throughout the function.
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub level: ILevelSystemDispatcher,
    pub grid: IGridSystemDispatcher,
    pub cube: ICubeTokenDispatcher,
    pub quest: Option<IQuestSystemDispatcher>,
}

#[generate_trait]
pub impl GameLibsImpl of GameLibsTrait {
    /// Create a new GameLibs bundle from world storage.
    /// Performs DNS lookups for all required systems.
    fn new(world: WorldStorage) -> GameLibs {
        let level_addr = world.dns_address(@"level_system")
            .expect('LevelSystem not found in DNS');
        let grid_addr = world.dns_address(@"grid_system")
            .expect('GridSystem not found in DNS');
        let cube_addr = world.dns_address(@"cube_token")
            .expect('CubeToken not found in DNS');
        
        // Quest system is optional (may not be deployed during migration)
        let quest = match world.dns_address(@"quest_system") {
            Option::Some(addr) => Option::Some(
                IQuestSystemDispatcher { contract_address: addr }
            ),
            Option::None => Option::None,
        };
        
        GameLibs {
            level: ILevelSystemDispatcher { contract_address: level_addr },
            grid: IGridSystemDispatcher { contract_address: grid_addr },
            cube: ICubeTokenDispatcher { contract_address: cube_addr },
            quest,
        }
    }
    
    /// Track quest progress for a player.
    /// No-op if quest system not deployed or using custom settings.
    fn track_quest(self: @GameLibs, player: ContractAddress, task_id: felt252, count: u32, settings_id: u32) {
        // Only track for default settings games
        if !is_default_settings(settings_id) {
            return;
        }
        if let Option::Some(quest) = *self.quest {
            quest.progress(player, task_id, count);
        }
    }
}
