/// Bit-packing helpers for efficient storage
/// 
/// run_data layout (68 bits used, 184 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Range    │ Description     │
/// ├─────────┼───────────────────────┼──────┼──────────┼─────────────────┤
/// │ 0-6     │ current_level         │ 7    │ 1-127    │ Current level   │
/// │ 7-14    │ level_score           │ 8    │ 0-255    │ Score this level│
/// │ 15-21   │ level_moves           │ 7    │ 0-127    │ Moves this level│
/// │ 22-25   │ constraint_progress   │ 4    │ 0-15     │ Times achieved  │
/// │ 26      │ bonus_used_this_level │ 1    │ 0-1      │ For NoBonusUsed │
/// │ 27-35   │ total_stars           │ 9    │ 0-511    │ Accumulated     │
/// │ 36-39   │ hammer_count          │ 4    │ 0-15     │ Inventory       │
/// │ 40-43   │ wave_count            │ 4    │ 0-15     │ Inventory       │
/// │ 44-47   │ totem_count           │ 4    │ 0-15     │ Inventory       │
/// │ 48-51   │ max_combo_run         │ 4    │ 0-15     │ Best combo      │
/// │ 52-67   │ total_score           │ 16   │ 0-65535  │ Cumulative score│
/// │ 68-251  │ reserved              │ 184  │ -        │ Future features │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked run data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    pub current_level: u8,
    pub level_score: u8,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub bonus_used_this_level: bool,
    pub total_stars: u16,
    pub hammer_count: u8,
    pub wave_count: u8,
    pub totem_count: u8,
    pub max_combo_run: u8,
    pub total_score: u16, // Cumulative score across all levels
}

/// Bit positions and masks for run_data
mod RunDataBits {
    // Bit positions (starting bit for each field)
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 7;
    pub const LEVEL_MOVES_POS: u8 = 15;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 22;
    pub const BONUS_USED_POS: u8 = 26;
    pub const TOTAL_STARS_POS: u8 = 27;
    pub const HAMMER_COUNT_POS: u8 = 36;
    pub const WAVE_COUNT_POS: u8 = 40;
    pub const TOTEM_COUNT_POS: u8 = 44;
    pub const MAX_COMBO_RUN_POS: u8 = 48;
    pub const TOTAL_SCORE_POS: u8 = 52;

    // Bit masks (after shifting to position 0)
    pub const CURRENT_LEVEL_MASK: u256 = 0x7F; // 7 bits
    pub const LEVEL_SCORE_MASK: u256 = 0xFF; // 8 bits
    pub const LEVEL_MOVES_MASK: u256 = 0x7F; // 7 bits
    pub const CONSTRAINT_PROGRESS_MASK: u256 = 0xF; // 4 bits
    pub const BONUS_USED_MASK: u256 = 0x1; // 1 bit
    pub const TOTAL_STARS_MASK: u256 = 0x1FF; // 9 bits
    pub const HAMMER_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const WAVE_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const TOTEM_COUNT_MASK: u256 = 0xF; // 4 bits
    pub const MAX_COMBO_RUN_MASK: u256 = 0xF; // 4 bits
    pub const TOTAL_SCORE_MASK: u256 = 0xFFFF; // 16 bits
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
            total_stars: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            max_combo_run: 0,
            total_score: 0,
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
            | ((self.total_stars.into() & RunDataBits::TOTAL_STARS_MASK)
                * pow2(RunDataBits::TOTAL_STARS_POS));
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
            total_stars: ((data / pow2(RunDataBits::TOTAL_STARS_POS))
                & RunDataBits::TOTAL_STARS_MASK)
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
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (52 bits used, 200 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-7     │ unlocked_start_level  │ 8    │ Highest unlocked start     │
/// │ 8-11    │ loadout_unlocks       │ 4    │ Bit flags for loadouts     │
/// │ 12-19   │ cosmetic_unlocks      │ 8    │ Bit flags for cosmetics    │
/// │ 20-35   │ total_runs            │ 16   │ Lifetime run count         │
/// │ 36-51   │ total_stars           │ 16   │ Lifetime stars earned      │
/// │ 52-251  │ reserved              │ 200  │ Future unlocks/features    │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    pub unlocked_start_level: u8,
    pub loadout_unlocks: u8,
    pub cosmetic_unlocks: u8,
    pub total_runs: u16,
    pub total_stars: u16,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    pub const UNLOCKED_START_LEVEL_POS: u8 = 0;
    pub const LOADOUT_UNLOCKS_POS: u8 = 8;
    pub const COSMETIC_UNLOCKS_POS: u8 = 12;
    pub const TOTAL_RUNS_POS: u8 = 20;
    pub const TOTAL_STARS_POS: u8 = 36;

    pub const UNLOCKED_START_LEVEL_MASK: u256 = 0xFF; // 8 bits
    pub const LOADOUT_UNLOCKS_MASK: u256 = 0xF; // 4 bits
    pub const COSMETIC_UNLOCKS_MASK: u256 = 0xFF; // 8 bits
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_STARS_MASK: u256 = 0xFFFF; // 16 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData {
            unlocked_start_level: 1, // Everyone starts at level 1
            loadout_unlocks: 0,
            cosmetic_unlocks: 0,
            total_runs: 0,
            total_stars: 0,
        }
    }

    /// Pack MetaData into a felt252
    fn pack(self: MetaData) -> felt252 {
        let mut packed: u256 = 0;

        packed = packed
            | (self.unlocked_start_level.into() & MetaDataBits::UNLOCKED_START_LEVEL_MASK);
        packed = packed
            | ((self.loadout_unlocks.into() & MetaDataBits::LOADOUT_UNLOCKS_MASK)
                * pow2(MetaDataBits::LOADOUT_UNLOCKS_POS));
        packed = packed
            | ((self.cosmetic_unlocks.into() & MetaDataBits::COSMETIC_UNLOCKS_MASK)
                * pow2(MetaDataBits::COSMETIC_UNLOCKS_POS));
        packed = packed
            | ((self.total_runs.into() & MetaDataBits::TOTAL_RUNS_MASK)
                * pow2(MetaDataBits::TOTAL_RUNS_POS));
        packed = packed
            | ((self.total_stars.into() & MetaDataBits::TOTAL_STARS_MASK)
                * pow2(MetaDataBits::TOTAL_STARS_POS));

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into MetaData
    fn unpack(packed: felt252) -> MetaData {
        let data: u256 = packed.into();

        MetaData {
            unlocked_start_level: ((data / pow2(MetaDataBits::UNLOCKED_START_LEVEL_POS))
                & MetaDataBits::UNLOCKED_START_LEVEL_MASK)
                .try_into()
                .unwrap(),
            loadout_unlocks: ((data / pow2(MetaDataBits::LOADOUT_UNLOCKS_POS))
                & MetaDataBits::LOADOUT_UNLOCKS_MASK)
                .try_into()
                .unwrap(),
            cosmetic_unlocks: ((data / pow2(MetaDataBits::COSMETIC_UNLOCKS_POS))
                & MetaDataBits::COSMETIC_UNLOCKS_MASK)
                .try_into()
                .unwrap(),
            total_runs: ((data / pow2(MetaDataBits::TOTAL_RUNS_POS))
                & MetaDataBits::TOTAL_RUNS_MASK)
                .try_into()
                .unwrap(),
            total_stars: ((data / pow2(MetaDataBits::TOTAL_STARS_POS))
                & MetaDataBits::TOTAL_STARS_MASK)
                .try_into()
                .unwrap(),
        }
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
    }

    #[test]
    fn test_run_data_pack_unpack_roundtrip() {
        let original = RunData {
            current_level: 42,
            level_score: 150,
            level_moves: 25,
            constraint_progress: 3,
            bonus_used_this_level: true,
            total_stars: 256,
            hammer_count: 5,
            wave_count: 3,
            totem_count: 2,
            max_combo_run: 7,
            total_score: 12345,
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
        assert!(unpacked.total_stars == original.total_stars, "total_stars mismatch");
        assert!(unpacked.hammer_count == original.hammer_count, "hammer_count mismatch");
        assert!(unpacked.wave_count == original.wave_count, "wave_count mismatch");
        assert!(unpacked.totem_count == original.totem_count, "totem_count mismatch");
        assert!(unpacked.max_combo_run == original.max_combo_run, "max_combo_run mismatch");
        assert!(unpacked.total_score == original.total_score, "total_score mismatch");
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
            total_stars: 511, // 9 bits max
            hammer_count: 15, // 4 bits max
            wave_count: 15, // 4 bits max
            totem_count: 15, // 4 bits max
            max_combo_run: 15, // 4 bits max
            total_score: 65535, // 16 bits max
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
            total_stars: 0,
            hammer_count: 0,
            wave_count: 0,
            totem_count: 0,
            max_combo_run: 0,
            total_score: 0,
        };

        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");
    }

    #[test]
    fn test_meta_data_pack_unpack_roundtrip() {
        let original = MetaData {
            unlocked_start_level: 50,
            loadout_unlocks: 7,
            cosmetic_unlocks: 15,
            total_runs: 1000,
            total_stars: 5000,
        };

        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);

        assert!(
            unpacked.unlocked_start_level == original.unlocked_start_level,
            "unlocked_start_level mismatch",
        );
        assert!(unpacked.loadout_unlocks == original.loadout_unlocks, "loadout_unlocks mismatch");
        assert!(
            unpacked.cosmetic_unlocks == original.cosmetic_unlocks, "cosmetic_unlocks mismatch",
        );
        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(unpacked.total_stars == original.total_stars, "total_stars mismatch");
    }

    #[test]
    fn test_meta_data_new() {
        let data = MetaDataPackingTrait::new();
        assert!(data.unlocked_start_level == 1, "Should start unlocked at level 1");
        assert!(data.loadout_unlocks == 0, "Should start with no loadouts");
        assert!(data.total_runs == 0, "Should start with 0 runs");
    }
}
