use starknet::ContractAddress;
use zkube::helpers::packing::{MetaData, MetaDataPacking, MetaDataPackingTrait};

/// PlayerMeta stores persistent player data across all runs
/// This is used for meta-progression (unlocks, stats, etc.)
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
        PlayerMeta { player, data: MetaDataPackingTrait::new().pack(), best_level: 0, }
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

    /// Add stars to lifetime total
    fn add_stars(ref self: PlayerMeta, stars: u16) {
        let mut meta = self.get_meta_data();
        let new_total = meta.total_stars + stars;
        // Cap at max u16
        meta.total_stars = if new_total > 65535 {
            65535
        } else {
            new_total
        };
        self.set_meta_data(meta);
    }

    /// Check if player exists (has played at least once)
    fn exists(self: PlayerMeta) -> bool {
        self.best_level > 0 || self.data != 0
    }
}

#[cfg(test)]
mod tests {
    use super::{PlayerMeta, PlayerMetaTrait};
    use starknet::contract_address_const;

    #[test]
    fn test_player_meta_new() {
        let player = contract_address_const::<'PLAYER'>();
        let meta = PlayerMetaTrait::new(player);

        assert!(meta.player == player, "Player should match");
        assert!(meta.best_level == 0, "Best level should be 0");

        let data = meta.get_meta_data();
        assert!(data.unlocked_start_level == 1, "Should start unlocked at level 1");
        assert!(data.total_runs == 0, "Should have 0 runs");
    }

    #[test]
    fn test_update_best_level() {
        let player = contract_address_const::<'PLAYER'>();
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
        let player = contract_address_const::<'PLAYER'>();
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
    fn test_add_stars() {
        let player = contract_address_const::<'PLAYER'>();
        let mut meta = PlayerMetaTrait::new(player);

        meta.add_stars(15);
        let data = meta.get_meta_data();
        assert!(data.total_stars == 15, "Should have 15 stars");

        meta.add_stars(100);
        let data = meta.get_meta_data();
        assert!(data.total_stars == 115, "Should have 115 stars");
    }
}
