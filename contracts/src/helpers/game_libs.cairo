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
//! libs.level.finalize_level(game_id);
//! libs.grid.execute_move(game_id, row, start, end);
//! ```

use dojo::world::{WorldStorage, WorldStorageTrait};
pub use zkube::systems::grid::{IGridSystemDispatcher, IGridSystemDispatcherTrait};

// Re-export dispatcher types and traits for convenience
pub use zkube::systems::level::{ILevelSystemDispatcher, ILevelSystemDispatcherTrait};

/// Bundled dispatchers for all game systems.
/// Initialize once with GameLibsImpl::new(world) and use throughout the function.
#[derive(Copy, Drop)]
pub struct GameLibs {
    pub level: ILevelSystemDispatcher,
    pub grid: IGridSystemDispatcher,
}

#[generate_trait]
pub impl GameLibsImpl of GameLibsTrait {
    /// Create a new GameLibs bundle from world storage.
    /// Performs DNS lookups for all required systems.
    fn new(world: WorldStorage) -> GameLibs {
        let level_addr = world.dns_address(@"level_system").expect('LevelSystem not found in DNS');
        let grid_addr = world.dns_address(@"grid_system").expect('GridSystem not found in DNS');

        GameLibs {
            level: ILevelSystemDispatcher { contract_address: level_addr },
            grid: IGridSystemDispatcher { contract_address: grid_addr },
        }
    }
}
