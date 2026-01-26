/// Bit-packing helpers for efficient storage
/// 
/// run_data layout (70 bits used, 182 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Range    │ Description     │
/// ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
/// │ 0-6     │ current_level         │ 7    │ 1-127    │ Current level   │
/// │ 7-14    │ level_score           │ 8    │ 0-255    │ Score this level│
/// │ 15-21   │ level_moves           │ 7    │ 0-127    │ Moves this level│
/// │ 22-25   │ constraint_progress   │ 4    │ 0-15     │ Times achieved  │
/// │ 26      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
/// │ 27-35   │ total_cubes           │ 9    │ 0-511    │ Accumulated     │
/// │ 36-39   │ hammer_count          │ 4    │ 0-15     │ Inventory       │
/// │ 40-43   │ wave_count            │ 4    │ 0-15     │ Inventory       │
/// │ 44-47   │ totem_count           │ 4    │ 0-15     │ Inventory       │
/// │ 48-51   │ max_combo_run         │ 4    │ 0-15     │ Best combo      │
/// │ 52-67   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
/// │ 68      │ combo_5_achieved      │ 1    │ 0-1      │ First 5x combo  │
/// │ 69      │ combo_10_achieved     │ 1    │ 0-1      │ First 10x combo │
/// │ 70-251  │ reserved              │ 182  │ -        │ Future features │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked run data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    pub current_level: u8,
    pub level_score: u8,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub bonus_used_this_level: bool,
    pub total_cubes: u16,
    pub hammer_count: u8,
    pub wave_count: u8,
    pub totem_count: u8,
    pub max_combo_run: u8,
    pub total_score: u16, // Cumulative score across all levels
    // Combo achievement flags (one-time per run)
    pub combo_5_achieved: bool, // First time achieving 5+ lines combo
    pub combo_10_achieved: bool, // First time achieving 10+ lines combo
}

/// Bit positions and masks for run_data
mod RunDataBits {
    // Bit positions (starting bit for each field)
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 7;
    pub const LEVEL_MOVES_POS: u8 = 15;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 22;
    pub const BONUS_USED_POS: u8 = 26;
    pub const TOTAL_CUBES_POS: u8 = 27;
    pub const HAMMER_COUNT_POS: u8 = 36;
    pub const WAVE_COUNT_POS: u8 = 40;
    pub const TOTEM_COUNT_POS: u8 = 44;
    pub const MAX_COMBO_RUN_POS: u8 = 48;
    pub const TOTAL_SCORE_POS: u8 = 52;
    pub const COMBO_5_ACHIEVED_POS: u8 = 68;
    pub const COMBO_10_ACHIEVED_POS: u8 = 69;

    // Bit masks (after shifting to position 0)
    pub const CURRENT_LEVEL_MASK: u256 = 0x7F; // 7 bits
    pub const LEVEL_SCORE_MASK: u256 = 0xFF; // 8 bits
    pub const LEVEL_MOVES_MASK: u256 = 0x7F; // 7 bits
    pub const CONSTRAINT_PROGRESS_MASK: u256 = 0xF; // 4 bits
    pub const BONUS_USED_MASK: u256 = 0x1; // 1 bit
    pub const TOTAL_CUBES_MASK: u256 = 0x1FF; // 9 bits
    pub const HAMMER_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const WAVE_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const TOTEM_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const MAX_COMBO_RUN_MASK: u256 = 0xF; // 4 bits
    pub const TOTAL_SCORE_MASK: u256 = 0xFFFF; // 16 bits
    pub const COMBO_ACHIEVED_MASK: u256 = 0x1; // 1 bit
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1
    fn new() -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            bonus_used_this_level: false,
            total_cubes: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            max_combo_run: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
        }
    }

    /// Pack RunData into a felt252
    fn pack(self: RunData) -> felt252 {
        let mut packed: u256 = 0;

        // Pack each field at its bit position
        packed = packed | (self.current_level.into() & RunDataBits::CURRENT_LEVEL_MASK);
        packed = packed
            | ((self.level_score.into() & RunDataBits::LEVEL_SCORE_MASK)
                * pow2(RunDataBits::LEVEL_SCORE_POS));
        packed = packed
            | ((self.level_moves.into() & RunDataBits::LEVEL_MOVES_MASK)
                * pow2(RunDataBits::LEVEL_MOVES_POS));
        packed = packed
            | ((self.constraint_progress.into() & RunDataBits::CONSTRAINT_PROGRESS_MASK)
                * pow2(RunDataBits::CONSTRAINT_PROGRESS_POS));
        packed = packed
            | ((if self.bonus_used_this_level {
                1_u256
            } else {
                0_u256
            }) * pow2(RunDataBits::BONUS_USED_POS));
        packed = packed
            | ((self.total_cubes.into() & RunDataBits::TOTAL_CUBES_MASK)
                * pow2(RunDataBits::TOTAL_CUBES_POS));
        packed = packed
            | ((self.hammer_count.into() & RunDataBits::HAMMER_COUNT_MASK)
                * pow2(RunDataBits::HAMMER_COUNT_POS));
        packed = packed
            | ((self.wave_count.into() & RunDataBits::WAVE_COUNT_MASK)
                * pow2(RunDataBits::WAVE_COUNT_POS));
        packed = packed
            | ((self.totem_count.into() & RunDataBits::TOTEM_COUNT_MASK)
                * pow2(RunDataBits::TOTEM_COUNT_POS));
        packed = packed
            | ((self.max_combo_run.into() & RunDataBits::MAX_COMBO_RUN_MASK)
                * pow2(RunDataBits::MAX_COMBO_RUN_POS));
        packed = packed
            | ((self.total_score.into() & RunDataBits::TOTAL_SCORE_MASK)
                * pow2(RunDataBits::TOTAL_SCORE_POS));
        packed = packed
            | ((if self.combo_5_achieved {
                1_u256
            } else {
                0_u256
            }) * pow2(RunDataBits::COMBO_5_ACHIEVED_POS));
        packed = packed
            | ((if self.combo_10_achieved {
                1_u256
            } else {
                0_u256
            }) * pow2(RunDataBits::COMBO_10_ACHIEVED_POS));

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into RunData
    fn unpack(packed: felt252) -> RunData {
        let data: u256 = packed.into();

        RunData {
            current_level: ((data / pow2(RunDataBits::CURRENT_LEVEL_POS))
                & RunDataBits::CURRENT_LEVEL_MASK)
                .try_into()
                .unwrap(),
            level_score: ((data / pow2(RunDataBits::LEVEL_SCORE_POS))
                & RunDataBits::LEVEL_SCORE_MASK)
                .try_into()
                .unwrap(),
            level_moves: ((data / pow2(RunDataBits::LEVEL_MOVES_POS))
                & RunDataBits::LEVEL_MOVES_MASK)
                .try_into()
                .unwrap(),
            constraint_progress: ((data / pow2(RunDataBits::CONSTRAINT_PROGRESS_POS))
                & RunDataBits::CONSTRAINT_PROGRESS_MASK)
                .try_into()
                .unwrap(),
            bonus_used_this_level: ((data / pow2(RunDataBits::BONUS_USED_POS))
                & RunDataBits::BONUS_USED_MASK) == 1,
            total_cubes: ((data / pow2(RunDataBits::TOTAL_CUBES_POS))
                & RunDataBits::TOTAL_CUBES_MASK)
                .try_into()
                .unwrap(),
            hammer_count: ((data / pow2(RunDataBits::HAMMER_COUNT_POS))
                & RunDataBits::HAMMER_COUNT_MASK)
                .try_into()
                .unwrap(),
            wave_count: ((data / pow2(RunDataBits::WAVE_COUNT_POS)) & RunDataBits::WAVE_COUNT_MASK)
                .try_into()
                .unwrap(),
            totem_count: ((data / pow2(RunDataBits::TOTEM_COUNT_POS))
                & RunDataBits::TOTEM_COUNT_MASK)
                .try_into()
                .unwrap(),
            max_combo_run: ((data / pow2(RunDataBits::MAX_COMBO_RUN_POS))
                & RunDataBits::MAX_COMBO_RUN_MASK)
                .try_into()
                .unwrap(),
            total_score: ((data / pow2(RunDataBits::TOTAL_SCORE_POS))
                & RunDataBits::TOTAL_SCORE_MASK)
                .try_into()
                .unwrap(),
            combo_5_achieved: ((data / pow2(RunDataBits::COMBO_5_ACHIEVED_POS))
                & RunDataBits::COMBO_ACHIEVED_MASK) == 1,
            combo_10_achieved: ((data / pow2(RunDataBits::COMBO_10_ACHIEVED_POS))
                & RunDataBits::COMBO_ACHIEVED_MASK) == 1,
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (82 bits used, 170 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-1     │ starting_hammer       │ 2    │ Starting hammers (0-3)     │
/// │ 2-3     │ starting_wave         │ 2    │ Starting waves (0-3)       │
/// │ 4-5     │ starting_totem        │ 2    │ Starting totems (0-3)      │
/// │ 6-9     │ bag_hammer_level      │ 4    │ Hammer bag upgrades (0-15) │
/// │ 10-13   │ bag_wave_level        │ 4    │ Wave bag upgrades (0-15)   │
/// │ 14-17   │ bag_totem_level       │ 4    │ Totem bag upgrades (0-15)  │
/// │ 18-21   │ bridging_rank         │ 4    │ Cube bridging rank (0-15)  │
/// │ 22-37   │ total_runs            │ 16   │ Lifetime run count         │
/// │ 38-69   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 70-81   │ reserved_flags        │ 12   │ Future unlocks/features    │
/// │ 82-251  │ reserved              │ 170  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Starting bonus upgrades (0 = none, 1 = start with 1, 2 = start with 2, 3 = start with 3)
    pub starting_hammer: u8,
    pub starting_wave: u8,
    pub starting_totem: u8,
    // Bag size upgrades (0 = default size 3, each level adds +1 capacity)
    pub bag_hammer_level: u8,
    pub bag_wave_level: u8,
    pub bag_totem_level: u8,
    // Cube bridging rank (0 = can't bring, higher = more cubes allowed)
    pub bridging_rank: u8,
    // Stats
    pub total_runs: u16,
    pub total_cubes_earned: u32,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const STARTING_HAMMER_POS: u8 = 0;
    pub const STARTING_WAVE_POS: u8 = 2;
    pub const STARTING_TOTEM_POS: u8 = 4;
    pub const BAG_HAMMER_LEVEL_POS: u8 = 6;
    pub const BAG_WAVE_LEVEL_POS: u8 = 10;
    pub const BAG_TOTEM_LEVEL_POS: u8 = 14;
    pub const BRIDGING_RANK_POS: u8 = 18;
    pub const TOTAL_RUNS_POS: u8 = 22;
    pub const TOTAL_CUBES_EARNED_POS: u8 = 38;

    // Masks
    pub const STARTING_BONUS_MASK: u256 = 0x3; // 2 bits (0-3)
    pub const BAG_LEVEL_MASK: u256 = 0xF; // 4 bits (0-15)
    pub const BRIDGING_RANK_MASK: u256 = 0xF; // 4 bits (0-15)
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_CUBES_EARNED_MASK: u256 = 0xFFFFFFFF; // 32 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData {
            starting_hammer: 0,
            starting_wave: 0,
            starting_totem: 0,
            bag_hammer_level: 0,
            bag_wave_level: 0,
            bag_totem_level: 0,
            bridging_rank: 0,
            total_runs: 0,
            total_cubes_earned: 0,
        }
    }

    /// Pack MetaData into a felt252
    fn pack(self: MetaData) -> felt252 {
        let mut packed: u256 = 0;

        packed = packed
            | (self.starting_hammer.into() & MetaDataBits::STARTING_BONUS_MASK);
        packed = packed
            | ((self.starting_wave.into() & MetaDataBits::STARTING_BONUS_MASK)
                * pow2(MetaDataBits::STARTING_WAVE_POS));
        packed = packed
            | ((self.starting_totem.into() & MetaDataBits::STARTING_BONUS_MASK)
                * pow2(MetaDataBits::STARTING_TOTEM_POS));
        packed = packed
            | ((self.bag_hammer_level.into() & MetaDataBits::BAG_LEVEL_MASK)
                * pow2(MetaDataBits::BAG_HAMMER_LEVEL_POS));
        packed = packed
            | ((self.bag_wave_level.into() & MetaDataBits::BAG_LEVEL_MASK)
                * pow2(MetaDataBits::BAG_WAVE_LEVEL_POS));
        packed = packed
            | ((self.bag_totem_level.into() & MetaDataBits::BAG_LEVEL_MASK)
                * pow2(MetaDataBits::BAG_TOTEM_LEVEL_POS));
        packed = packed
            | ((self.bridging_rank.into() & MetaDataBits::BRIDGING_RANK_MASK)
                * pow2(MetaDataBits::BRIDGING_RANK_POS));
        packed = packed
            | ((self.total_runs.into() & MetaDataBits::TOTAL_RUNS_MASK)
                * pow2(MetaDataBits::TOTAL_RUNS_POS));
        packed = packed
            | ((self.total_cubes_earned.into() & MetaDataBits::TOTAL_CUBES_EARNED_MASK)
                * pow2(MetaDataBits::TOTAL_CUBES_EARNED_POS));

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into MetaData
    fn unpack(packed: felt252) -> MetaData {
        let data: u256 = packed.into();

        MetaData {
            starting_hammer: ((data / pow2(MetaDataBits::STARTING_HAMMER_POS))
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_wave: ((data / pow2(MetaDataBits::STARTING_WAVE_POS))
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            starting_totem: ((data / pow2(MetaDataBits::STARTING_TOTEM_POS))
                & MetaDataBits::STARTING_BONUS_MASK)
                .try_into()
                .unwrap(),
            bag_hammer_level: ((data / pow2(MetaDataBits::BAG_HAMMER_LEVEL_POS))
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_wave_level: ((data / pow2(MetaDataBits::BAG_WAVE_LEVEL_POS))
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bag_totem_level: ((data / pow2(MetaDataBits::BAG_TOTEM_LEVEL_POS))
                & MetaDataBits::BAG_LEVEL_MASK)
                .try_into()
                .unwrap(),
            bridging_rank: ((data / pow2(MetaDataBits::BRIDGING_RANK_POS))
                & MetaDataBits::BRIDGING_RANK_MASK)
                .try_into()
                .unwrap(),
            total_runs: ((data / pow2(MetaDataBits::TOTAL_RUNS_POS))
                & MetaDataBits::TOTAL_RUNS_MASK)
                .try_into()
                .unwrap(),
            total_cubes_earned: ((data / pow2(MetaDataBits::TOTAL_CUBES_EARNED_POS))
                & MetaDataBits::TOTAL_CUBES_EARNED_MASK)
                .try_into()
                .unwrap(),
        }
    }

    /// Get the bag size for a bonus type (default 3 + upgrade level)
    fn get_bag_size(self: MetaData, bonus_type: u8) -> u8 {
        let base_size: u8 = 3;
        match bonus_type {
            0 => base_size + self.bag_hammer_level, // Hammer
            1 => base_size + self.bag_wave_level,   // Wave
            2 => base_size + self.bag_totem_level,  // Totem
            _ => base_size,
        }
    }

    /// Get max cubes that can be brought into a run based on bridging rank
    /// Rank 0 = 0, Rank 1 = 5, Rank 2 = 10, Rank 3 = 20, etc. (5 * 2^(rank-1))
    fn get_max_cubes_to_bring(self: MetaData) -> u16 {
        if self.bridging_rank == 0 {
            0
        } else {
            let rank_minus_one: u16 = (self.bridging_rank - 1).into();
            5_u16 * pow2_u16(rank_minus_one.try_into().unwrap())
        }
    }
}

/// Helper: compute 2^n as u16
fn pow2_u16(n: u8) -> u16 {
    let mut result: u16 = 1;
    let mut i: u8 = 0;
    loop {
        if i >= n {
            break result;
        }
        result = result * 2;
        i += 1;
    }
}

// =============================================================================
// Helper functions
// =============================================================================

/// Compute 2^n as u256
#[inline(always)]
fn pow2(n: u8) -> u256 {
    let mut result: u256 = 1;
    let mut i: u8 = 0;
    loop {
        if i >= n {
            break result;
        }
        result = result * 2;
        i += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::{
        RunData, RunDataPacking, RunDataPackingTrait, MetaData, MetaDataPacking,
        MetaDataPackingTrait, pow2,
    };

    #[test]
    fn test_pow2() {
        assert!(pow2(0) == 1, "2^0 should be 1");
        assert!(pow2(1) == 2, "2^1 should be 2");
        assert!(pow2(7) == 128, "2^7 should be 128");
        assert!(pow2(8) == 256, "2^8 should be 256");
        assert!(pow2(16) == 65536, "2^16 should be 65536");
    }

    #[test]
    fn test_run_data_new() {
        let data = RunDataPackingTrait::new();
        assert!(data.current_level == 1, "Should start at level 1");
        assert!(data.level_score == 0, "Should start with 0 score");
        assert!(data.hammer_count == 0, "Should start with 0 hammers");
        assert!(data.total_score == 0, "Should start with 0 total score");
        assert!(data.combo_5_achieved == false, "Should start with combo_5 not achieved");
        assert!(data.combo_10_achieved == false, "Should start with combo_10 not achieved");
    }

    #[test]
    fn test_run_data_pack_unpack_roundtrip() {
        let original = RunData {
            current_level: 42,
            level_score: 150,
            level_moves: 25,
            constraint_progress: 3,
            bonus_used_this_level: true,
            total_cubes: 256,
            hammer_count: 5,
            wave_count: 3,
            totem_count: 2,
            max_combo_run: 7,
            total_score: 12345,
            combo_5_achieved: true,
            combo_10_achieved: false,
        };

        let packed = original.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked.current_level == original.current_level, "current_level mismatch");
        assert!(unpacked.level_score == original.level_score, "level_score mismatch");
        assert!(unpacked.level_moves == original.level_moves, "level_moves mismatch");
        assert!(
            unpacked.constraint_progress == original.constraint_progress,
            "constraint_progress mismatch",
        );
        assert!(
            unpacked.bonus_used_this_level == original.bonus_used_this_level,
            "bonus_used_this_level mismatch",
        );
        assert!(unpacked.total_cubes == original.total_cubes, "total_cubes mismatch");
        assert!(unpacked.hammer_count == original.hammer_count, "hammer_count mismatch");
        assert!(unpacked.wave_count == original.wave_count, "wave_count mismatch");
        assert!(unpacked.totem_count == original.totem_count, "totem_count mismatch");
        assert!(unpacked.max_combo_run == original.max_combo_run, "max_combo_run mismatch");
        assert!(unpacked.total_score == original.total_score, "total_score mismatch");
        assert!(
            unpacked.combo_5_achieved == original.combo_5_achieved, "combo_5_achieved mismatch",
        );
        assert!(
            unpacked.combo_10_achieved == original.combo_10_achieved, "combo_10_achieved mismatch",
        );
    }

    #[test]
    fn test_run_data_edge_values() {
        // Test maximum values for each field
        let max_values = RunData {
            current_level: 127, // 7 bits max
            level_score: 255, // 8 bits max
            level_moves: 127, // 7 bits max
            constraint_progress: 15, // 4 bits max
            bonus_used_this_level: true,
            total_cubes: 511, // 9 bits max
            hammer_count: 15, // 4 bits max
            wave_count: 15, // 4 bits max
            totem_count: 15, // 4 bits max
            max_combo_run: 15, // 4 bits max
            total_score: 65535, // 16 bits max
            combo_5_achieved: true,
            combo_10_achieved: true,
        };

        let packed = max_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == max_values, "Max values should roundtrip correctly");
    }

    #[test]
    fn test_run_data_zero_values() {
        let zero_values = RunData {
            current_level: 0,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            bonus_used_this_level: false,
            total_cubes: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            max_combo_run: 0,
            total_score: 0,
            combo_5_achieved: false,
            combo_10_achieved: false,
        };

        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");
    }

    #[test]
    fn test_meta_data_pack_unpack_roundtrip() {
        let original = MetaData {
            starting_hammer: 2,
            starting_wave: 1,
            starting_totem: 3,
            bag_hammer_level: 5,
            bag_wave_level: 3,
            bag_totem_level: 7,
            bridging_rank: 4,
            total_runs: 1000,
            total_cubes_earned: 50000,
        };

        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);

        assert!(unpacked.starting_hammer == original.starting_hammer, "starting_hammer mismatch");
        assert!(unpacked.starting_wave == original.starting_wave, "starting_wave mismatch");
        assert!(unpacked.starting_totem == original.starting_totem, "starting_totem mismatch");
        assert!(
            unpacked.bag_hammer_level == original.bag_hammer_level, "bag_hammer_level mismatch",
        );
        assert!(unpacked.bag_wave_level == original.bag_wave_level, "bag_wave_level mismatch");
        assert!(unpacked.bag_totem_level == original.bag_totem_level, "bag_totem_level mismatch");
        assert!(unpacked.bridging_rank == original.bridging_rank, "bridging_rank mismatch");
        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(
            unpacked.total_cubes_earned == original.total_cubes_earned,
            "total_cubes_earned mismatch",
        );
    }

    #[test]
    fn test_meta_data_new() {
        let data = MetaDataPackingTrait::new();
        assert!(data.starting_hammer == 0, "Should start with 0 starting hammers");
        assert!(data.bridging_rank == 0, "Should start with 0 bridging rank");
        assert!(data.total_runs == 0, "Should start with 0 runs");
        assert!(data.total_cubes_earned == 0, "Should start with 0 cubes earned");
    }

    #[test]
    fn test_meta_data_bag_size() {
        let mut data = MetaDataPackingTrait::new();
        // Default bag size is 3
        assert!(data.get_bag_size(0) == 3, "Default hammer bag should be 3");
        assert!(data.get_bag_size(1) == 3, "Default wave bag should be 3");
        assert!(data.get_bag_size(2) == 3, "Default totem bag should be 3");

        // Upgrade hammer bag
        data.bag_hammer_level = 2;
        assert!(data.get_bag_size(0) == 5, "Upgraded hammer bag should be 5");
        assert!(data.get_bag_size(1) == 3, "Wave bag should still be 3");
    }

    #[test]
    fn test_meta_data_max_cubes_to_bring() {
        let mut data = MetaDataPackingTrait::new();

        // Rank 0 = can't bring any
        assert!(data.get_max_cubes_to_bring() == 0, "Rank 0 should allow 0 cubes");

        // Rank 1 = 5 cubes
        data.bridging_rank = 1;
        assert!(data.get_max_cubes_to_bring() == 5, "Rank 1 should allow 5 cubes");

        // Rank 2 = 10 cubes
        data.bridging_rank = 2;
        assert!(data.get_max_cubes_to_bring() == 10, "Rank 2 should allow 10 cubes");

        // Rank 3 = 20 cubes
        data.bridging_rank = 3;
        assert!(data.get_max_cubes_to_bring() == 20, "Rank 3 should allow 20 cubes");

        // Rank 4 = 40 cubes
        data.bridging_rank = 4;
        assert!(data.get_max_cubes_to_bring() == 40, "Rank 4 should allow 40 cubes");
    }
}
