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
//! libs.level.finalize_level(game_id, skill_data);
//! libs.grid.execute_move(game_id, row, start, end);
//! libs.cube.mint(player, amount);
//! ```

use dojo::world::{WorldStorage, WorldStorageTrait};
pub use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
pub use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
pub use zkube::systems::draft::{IDraftSystemDispatcher, IDraftSystemDispatcherTrait};
pub use zkube::systems::grid::{IGridSystemDispatcher, IGridSystemDispatcherTrait};

// Re-export dispatcher types and traits for convenience
pub use zkube::systems::level::{ILevelSystemDispatcher, ILevelSystemDispatcherTrait};

/// Bundled dispatchers for all game systems.
/// Initialize once with GameLibsImpl::new(world) and use throughout the function.
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub level: ILevelSystemDispatcher,
    pub draft: IDraftSystemDispatcher,
    pub grid: IGridSystemDispatcher,
    pub cube: ICubeTokenDispatcher,
}

#[generate_trait]
pub impl GameLibsImpl of GameLibsTrait {
    /// Create a new GameLibs bundle from world storage.
    /// Performs DNS lookups for all required systems.
    fn new(world: WorldStorage) -> GameLibs {
        let level_addr = world.dns_address(@"level_system").expect('LevelSystem not found in DNS');
        let draft_addr = world.dns_address(@"draft_system").expect('DraftSystem not found in DNS');
        let grid_addr = world.dns_address(@"grid_system").expect('GridSystem not found in DNS');
        let config_addr = world
            .dns_address(@"config_system")
            .expect('ConfigSystem not found in DNS');
        let config = IConfigSystemDispatcher { contract_address: config_addr };
        let cube_addr = config.get_cube_token_address();

        GameLibs {
            level: ILevelSystemDispatcher { contract_address: level_addr },
            draft: IDraftSystemDispatcher { contract_address: draft_addr },
            grid: IGridSystemDispatcher { contract_address: grid_addr },
            cube: ICubeTokenDispatcher { contract_address: cube_addr },
        }
    }
}
