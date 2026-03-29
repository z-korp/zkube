use starknet::ContractAddress;
use zkube::helpers::packing::{MetaData, MetaDataPacking, MetaDataPackingTrait};

/// PlayerMeta stores persistent player data across all runs
/// This is used for meta-progression (unlocks, stats)
/// Note: Cube balance is now tracked via ERC1155 CubeToken contract
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    /// Bit-packed meta-progression data (unlocks, lifetime stats)
    pub data: felt252,
    /// Highest level ever reached (any run) - used for unlocks
    pub best_level: u8,
}

#[generate_trait]
pub impl PlayerMetaImpl of PlayerMetaTrait {
    /// Create a new PlayerMeta with default values
    fn new(player: ContractAddress) -> PlayerMeta {
        PlayerMeta { player, data: MetaDataPackingTrait::new().pack(), best_level: 0 }
    }

    /// Get unpacked meta data
    fn get_meta_data(self: PlayerMeta) -> MetaData {
        MetaDataPackingTrait::unpack(self.data)
    }

    /// Update meta data and repack
    fn set_meta_data(ref self: PlayerMeta, meta: MetaData) {
        self.data = meta.pack();
    }

    /// Update best level if new level is higher
    fn update_best_level(ref self: PlayerMeta, level: u8) {
        if level > self.best_level {
            self.best_level = level;
        }
    }

    /// Increment total runs count
    fn increment_runs(ref self: PlayerMeta) {
        let mut meta = self.get_meta_data();
        if meta.total_runs < 65535 {
            meta.total_runs += 1;
        }
        self.set_meta_data(meta);
    }

    /// Add cubes to lifetime total (stat tracking in MetaData)
    fn add_cubes_earned(ref self: PlayerMeta, cubes: u32) {
        let mut meta = self.get_meta_data();
        // Cap at max u32
        let new_total: u64 = meta.total_cubes_earned.into() + cubes.into();
        meta
            .total_cubes_earned =
                if new_total > 0xFFFFFFFF {
                    0xFFFFFFFF
                } else {
                    new_total.try_into().unwrap()
                };
        self.set_meta_data(meta);
    }

    /// Increment lifetime daily participation stars.
    fn increment_daily_stars(ref self: PlayerMeta) {
        let mut meta = self.get_meta_data();
        if meta.daily_stars < 65535 {
            meta.daily_stars += 1;
        }
        self.set_meta_data(meta);
    }


    /// Check if player exists (has played at least once)
    fn exists(self: PlayerMeta) -> bool {
        self.best_level > 0 || self.data != 0
    }
}

/// Tracks the best run per player × map × mode combination
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct PlayerBestRun {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub settings_id: u32,
    #[key]
    pub mode: u8, // 0=Map, 1=Endless
    /// Best total score across all runs for this combination
    pub best_score: u32,
    /// Best total stars (Map mode only, 0-30)
    pub best_stars: u8,
    /// Best level reached (Map mode only, 1-10)
    pub best_level: u8,
    /// Whether map was fully cleared (Map mode, L10 boss beaten)
    pub map_cleared: bool,
    /// Game ID of the best run
    pub best_game_id: felt252,
}

#[generate_trait]
pub impl PlayerBestRunImpl of PlayerBestRunTrait {
    /// Check whether a best-run record has been initialized.
    fn exists(self: @PlayerBestRun) -> bool {
        *self.best_game_id != 0 || *self.best_score > 0 || *self.best_stars > 0 || *self.best_level > 0
            || *self.map_cleared
    }

    /// Check if this run beats the existing best. Returns true if it should replace.
    fn is_new_best(self: @PlayerBestRun, mode: u8, score: u32, stars: u8) -> bool {
        if !self.exists() {
            return true;
        }

        if mode == 1 {
            // Endless: pure score comparison
            score > *self.best_score
        } else {
            // Map: stars × 65536 + score (composite)
            let new_rank: u64 = stars.into() * 65536 + score.into();
            let old_rank: u64 = (*self.best_stars).into() * 65536 + (*self.best_score).into();
            new_rank > old_rank
        }
    }
}

#[cfg(test)]
mod tests {
    use starknet::ContractAddress;
    use super::PlayerMetaTrait;

    #[test]
    fn test_player_meta_new() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let meta = PlayerMetaTrait::new(player);

        assert!(meta.player == player, "Player should match");
        assert!(meta.best_level == 0, "Best level should be 0");

        let data = meta.get_meta_data();
        assert!(data.total_runs == 0, "Should have 0 runs");
        assert!(data.total_cubes_earned == 0, "Should have 0 cubes earned");
        assert!(data.daily_stars == 0, "Should have 0 daily stars");
    }

    #[test]
    fn test_update_best_level() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let mut meta = PlayerMetaTrait::new(player);

        meta.update_best_level(10);
        assert!(meta.best_level == 10, "Best level should be 10");

        meta.update_best_level(5);
        assert!(meta.best_level == 10, "Best level should still be 10 (not lower)");

        meta.update_best_level(25);
        assert!(meta.best_level == 25, "Best level should be 25");
    }

    #[test]
    fn test_increment_runs() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let mut meta = PlayerMetaTrait::new(player);

        meta.increment_runs();
        let data = meta.get_meta_data();
        assert!(data.total_runs == 1, "Should have 1 run");

        meta.increment_runs();
        meta.increment_runs();
        let data = meta.get_meta_data();
        assert!(data.total_runs == 3, "Should have 3 runs");
    }

    #[test]
    fn test_increment_daily_stars() {
        let player: ContractAddress = 'PLAYER'.try_into().unwrap();
        let mut meta = PlayerMetaTrait::new(player);

        meta.increment_daily_stars();
        meta.increment_daily_stars();
        let data = meta.get_meta_data();
        assert!(data.daily_stars == 2, "Should have 2 daily stars");
    }
    // Note: Cube balance tests removed - cube balance is now managed by ERC1155 CubeToken contract
}
