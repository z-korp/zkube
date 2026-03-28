use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage.
///
/// run_data layout (101 bits used, 151 reserved):
/// - 0-7: current_level
/// - 8-15: level_score
/// - 16-23: level_moves
/// - 24-31: constraint_progress
/// - 32-39: constraint_2_progress
/// - 40-47: max_combo_run
/// - 48-79: total_score (u32)
/// - 80: zone_cleared
/// - 81-88: endless_depth
/// - 89-92: zone_id (RESERVED — always zero, kept for storage compatibility)
/// - 93-100: mutator_mask (RESERVED — always zero, kept for storage compatibility)

/// Unpacked run data structure (zone-based runs + endless)
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    // Level progress
    pub current_level: u8,
    pub level_score: u8,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub constraint_2_progress: u8,
    pub max_combo_run: u8,
    pub total_score: u32,
    pub zone_cleared: bool,
    pub endless_depth: u8,
    pub zone_id: u8,
    pub mutator_mask: u8,
}

/// Bit positions and masks for run_data
mod RunDataBits {
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 8;
    pub const LEVEL_MOVES_POS: u8 = 16;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 24;
    pub const CONSTRAINT_2_PROGRESS_POS: u8 = 32;
    pub const MAX_COMBO_RUN_POS: u8 = 40;
    pub const TOTAL_SCORE_POS: u8 = 48;
    pub const ZONE_CLEARED_POS: u8 = 80;
    pub const ENDLESS_DEPTH_POS: u8 = 81;
    pub const ZONE_ID_POS: u8 = 89;
    pub const MUTATOR_MASK_POS: u8 = 93;

    pub const U8_MASK: u256 = 0xFF;
    pub const U32_MASK: u256 = 0xFFFFFFFF;
    pub const BOOL_MASK: u256 = 0x1;
    pub const FOUR_BITS_MASK: u256 = 0xF;
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1.
    fn new(zone_id: u8, mutator_mask: u8) -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            constraint_2_progress: 0,
            max_combo_run: 0,
            total_score: 0,
            zone_cleared: false,
            endless_depth: 0,
            zone_id: zone_id & 0xF,
            mutator_mask,
        }
    }

    /// Pack RunData into a felt252
    fn pack(self: RunData) -> felt252 {
        let mut packed: u256 = 0;

        packed = packed
            | BitShift::shl(
                self.current_level.into() & RunDataBits::U8_MASK,
                RunDataBits::CURRENT_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_score.into() & RunDataBits::U8_MASK, RunDataBits::LEVEL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_moves.into() & RunDataBits::U8_MASK, RunDataBits::LEVEL_MOVES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.constraint_progress.into() & RunDataBits::U8_MASK,
                RunDataBits::CONSTRAINT_PROGRESS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.constraint_2_progress.into() & RunDataBits::U8_MASK,
                RunDataBits::CONSTRAINT_2_PROGRESS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.max_combo_run.into() & RunDataBits::U8_MASK,
                RunDataBits::MAX_COMBO_RUN_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_score.into() & RunDataBits::U32_MASK,
                RunDataBits::TOTAL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.zone_cleared {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::ZONE_CLEARED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.endless_depth.into() & RunDataBits::U8_MASK,
                RunDataBits::ENDLESS_DEPTH_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.zone_id.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::ZONE_ID_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.mutator_mask.into() & RunDataBits::U8_MASK,
                RunDataBits::MUTATOR_MASK_POS.into(),
            );

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into RunData
    fn unpack(packed: felt252) -> RunData {
        let data: u256 = packed.into();

        RunData {
            current_level: (BitShift::shr(data, RunDataBits::CURRENT_LEVEL_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            level_score: (BitShift::shr(data, RunDataBits::LEVEL_SCORE_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            level_moves: (BitShift::shr(data, RunDataBits::LEVEL_MOVES_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            constraint_progress: (BitShift::shr(data, RunDataBits::CONSTRAINT_PROGRESS_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            constraint_2_progress: (BitShift::shr(
                data, RunDataBits::CONSTRAINT_2_PROGRESS_POS.into(),
            )
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            max_combo_run: (BitShift::shr(data, RunDataBits::MAX_COMBO_RUN_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            total_score: (BitShift::shr(data, RunDataBits::TOTAL_SCORE_POS.into())
                & RunDataBits::U32_MASK)
                .try_into()
                .unwrap(),
            zone_cleared: (BitShift::shr(data, RunDataBits::ZONE_CLEARED_POS.into())
                & RunDataBits::BOOL_MASK) == 1,
            endless_depth: (BitShift::shr(data, RunDataBits::ENDLESS_DEPTH_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            zone_id: (BitShift::shr(data, RunDataBits::ZONE_ID_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            mutator_mask: (BitShift::shr(data, RunDataBits::MUTATOR_MASK_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (64 bits used, 188 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-15    │ total_runs            │ 16   │ Lifetime run count         │
/// │ 16-47   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 48-63   │ daily_stars           │ 16   │ Lifetime daily stars       │
/// │ 64-251  │ reserved              │ 188  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Stats
    pub total_runs: u16,
    pub total_cubes_earned: u32,
    pub daily_stars: u16,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const TOTAL_RUNS_POS: u8 = 0;
    pub const TOTAL_CUBES_EARNED_POS: u8 = 16;
    pub const DAILY_STARS_POS: u8 = 48;

    // Masks
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_CUBES_EARNED_MASK: u256 = 0xFFFFFFFF; // 32 bits
    pub const DAILY_STARS_MASK: u256 = 0xFFFF; // 16 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData { total_runs: 0, total_cubes_earned: 0, daily_stars: 0 }
    }

    /// Pack MetaData into a felt252
    fn pack(self: MetaData) -> felt252 {
        let mut packed: u256 = 0;

        packed = packed
            | BitShift::shl(
                self.total_runs.into() & MetaDataBits::TOTAL_RUNS_MASK,
                MetaDataBits::TOTAL_RUNS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_cubes_earned.into() & MetaDataBits::TOTAL_CUBES_EARNED_MASK,
                MetaDataBits::TOTAL_CUBES_EARNED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.daily_stars.into() & MetaDataBits::DAILY_STARS_MASK,
                MetaDataBits::DAILY_STARS_POS.into(),
            );

        packed.try_into().unwrap()
    }

    /// Unpack a felt252 into MetaData
    fn unpack(packed: felt252) -> MetaData {
        let data: u256 = packed.into();

        MetaData {
            total_runs: (BitShift::shr(data, MetaDataBits::TOTAL_RUNS_POS.into())
                & MetaDataBits::TOTAL_RUNS_MASK)
                .try_into()
                .unwrap(),
            total_cubes_earned: (BitShift::shr(data, MetaDataBits::TOTAL_CUBES_EARNED_POS.into())
                & MetaDataBits::TOTAL_CUBES_EARNED_MASK)
                .try_into()
                .unwrap(),
            daily_stars: (BitShift::shr(data, MetaDataBits::DAILY_STARS_POS.into())
                & MetaDataBits::DAILY_STARS_MASK)
                .try_into()
                .unwrap(),
        }
    }
}

// Tests moved to contracts/src/tests/ - see test_packing.cairo for comprehensive packing tests
