use starknet::ContractAddress;
use zkube::helpers::packing::{MetaData, MetaDataPacking, MetaDataPackingTrait};

/// PlayerMeta stores persistent player data across all runs
/// This is used for meta-progression (unlocks, stats, cube economy)
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct PlayerMeta {
    #[key]
    pub player: ContractAddress,
    /// Bit-packed meta-progression data (unlocks, lifetime stats)
    pub data: felt252,
    /// Highest level ever reached (any run) - used for unlocks
    pub best_level: u8,
    /// Current cube balance (spendable currency)
    pub cube_balance: u64,
}

#[generate_trait]
pub impl PlayerMetaImpl of PlayerMetaTrait {
    /// Create a new PlayerMeta with default values
    fn new(player: ContractAddress) -> PlayerMeta {
        PlayerMeta {
            player,
            data: MetaDataPackingTrait::new().pack(),
            best_level: 0,
            cube_balance: 0,
        }
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

    /// Add cubes to lifetime total (stat tracking)
    fn add_cubes_earned(ref self: PlayerMeta, cubes: u32) {
        let mut meta = self.get_meta_data();
        // Cap at max u32
        let new_total: u64 = meta.total_cubes_earned.into() + cubes.into();
        meta.total_cubes_earned = if new_total > 0xFFFFFFFF {
            0xFFFFFFFF
        } else {
            new_total.try_into().unwrap()
        };
        self.set_meta_data(meta);
    }

    /// Add cubes to spendable balance
    fn add_cube_balance(ref self: PlayerMeta, amount: u64) {
        self.cube_balance += amount;
    }

    /// Spend cubes from balance (returns false if insufficient)
    fn spend_cubes(ref self: PlayerMeta, amount: u64) -> bool {
        if self.cube_balance >= amount {
            self.cube_balance -= amount;
            true
        } else {
            false
        }
    }

    /// Get the bag size for a specific bonus type
    fn get_bag_size(self: PlayerMeta, bonus_type: u8) -> u8 {
        self.get_meta_data().get_bag_size(bonus_type)
    }

    /// Get max cubes that can be brought into a run
    fn get_max_cubes_to_bring(self: PlayerMeta) -> u16 {
        self.get_meta_data().get_max_cubes_to_bring()
    }

    /// Get starting bonus count for a specific type
    fn get_starting_bonus(self: PlayerMeta, bonus_type: u8) -> u8 {
        let meta = self.get_meta_data();
        match bonus_type {
            0 => meta.starting_hammer,
            1 => meta.starting_wave,
            2 => meta.starting_totem,
            _ => 0,
        }
    }

    /// Check if player exists (has played at least once)
    fn exists(self: PlayerMeta) -> bool {
        self.best_level > 0 || self.data != 0 || self.cube_balance > 0
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
        assert!(meta.cube_balance == 0, "Should start with 0 cubes");

        let data = meta.get_meta_data();
        assert!(data.total_runs == 0, "Should have 0 runs");
        assert!(data.starting_hammer == 0, "Should have 0 starting hammers");
        assert!(data.bridging_rank == 0, "Should have 0 bridging rank");
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
    fn test_cube_balance() {
        let player = contract_address_const::<'PLAYER'>();
        let mut meta = PlayerMetaTrait::new(player);

        meta.add_cube_balance(15);
        assert!(meta.cube_balance == 15, "Should have 15 cubes");

        meta.add_cube_balance(100);
        assert!(meta.cube_balance == 115, "Should have 115 cubes");

        // Test spending
        let success = meta.spend_cubes(50);
        assert!(success, "Should succeed spending 50 cubes");
        assert!(meta.cube_balance == 65, "Should have 65 cubes left");

        // Test insufficient balance
        let fail = meta.spend_cubes(100);
        assert!(!fail, "Should fail spending 100 cubes (only 65)");
        assert!(meta.cube_balance == 65, "Balance should remain 65");
    }
}
