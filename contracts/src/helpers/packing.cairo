use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage.
///
/// run_data layout (115 bits used, 137 reserved):
/// - 0-7: current_level (u8)
/// - 8-23: level_score (u16)
/// - 24-31: level_moves (u8)
/// - 32-39: constraint_progress (u8)
/// - 40-47: constraint_2_progress (u8)
/// - 48-55: max_combo_run (u8)
/// - 56-87: total_score (u32)
/// - 88: zone_cleared (bool)
/// - 89-92: current_difficulty (4 bits, 0-9 for Difficulty enum)
/// - 93-96: zone_id (4 bits, 0-15)
/// - 97-101: active_mutator_id (5 bits, 0-31)
/// - 102: run_type (0=Zone, 1=Endless)
/// - 103-104: bonus_type (0=None, 1=Hammer, 2=Totem, 3=Wave)
/// - 105-108: bonus_charges (4 bits, 0-15)
/// - 109-112: level_lines_cleared (4 bits, 0-15)
/// - 113-114: bonus_slot (2 bits, 0-2)

/// Unpacked run data structure (zone-based runs + endless)
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    // Level progress
    pub current_level: u8,
    pub level_score: u16,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub constraint_2_progress: u8,
    pub max_combo_run: u8,
    pub total_score: u32,
    pub zone_cleared: bool,
    pub current_difficulty: u8,
    pub zone_id: u8,
    pub active_mutator_id: u8,
    pub run_type: u8,
    pub bonus_type: u8,
    pub bonus_charges: u8,
    pub level_lines_cleared: u8,
    pub bonus_slot: u8,
}

/// Bit positions and masks for run_data
mod RunDataBits {
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 8;
    pub const LEVEL_MOVES_POS: u8 = 24;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 32;
    pub const CONSTRAINT_2_PROGRESS_POS: u8 = 40;
    pub const MAX_COMBO_RUN_POS: u8 = 48;
    pub const TOTAL_SCORE_POS: u8 = 56;
    pub const ZONE_CLEARED_POS: u8 = 88;
    pub const CURRENT_DIFFICULTY_POS: u8 = 89;
    pub const ZONE_ID_POS: u8 = 93;
    pub const ACTIVE_MUTATOR_ID_POS: u8 = 97;
    pub const RUN_TYPE_POS: u8 = 102;
    pub const BONUS_TYPE_POS: u8 = 103;
    pub const BONUS_CHARGES_POS: u8 = 105;
    pub const LEVEL_LINES_CLEARED_POS: u8 = 109;
    pub const BONUS_SLOT_POS: u8 = 113;

    pub const U8_MASK: u256 = 0xFF;
    pub const U16_MASK: u256 = 0xFFFF;
    pub const U32_MASK: u256 = 0xFFFFFFFF;
    pub const BOOL_MASK: u256 = 0x1;
    pub const TWO_BITS_MASK: u256 = 0x3;
    pub const FOUR_BITS_MASK: u256 = 0xF;
    pub const FIVE_BITS_MASK: u256 = 0x1F;
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1.
    fn new(zone_id: u8, active_mutator_id: u8, run_type: u8) -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            constraint_2_progress: 0,
            max_combo_run: 0,
            total_score: 0,
            zone_cleared: false,
            current_difficulty: 0,
            zone_id: zone_id & 0xF,
            active_mutator_id: active_mutator_id & 0x1F,
            run_type: run_type & 0x1,
            bonus_type: 0,
            bonus_charges: 0,
            level_lines_cleared: 0,
            bonus_slot: 0,
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
                self.level_score.into() & RunDataBits::U16_MASK,
                RunDataBits::LEVEL_SCORE_POS.into(),
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
                self.current_difficulty.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::CURRENT_DIFFICULTY_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.zone_id.into() & RunDataBits::FOUR_BITS_MASK, RunDataBits::ZONE_ID_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.active_mutator_id.into() & RunDataBits::FIVE_BITS_MASK,
                RunDataBits::ACTIVE_MUTATOR_ID_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.run_type.into() & RunDataBits::BOOL_MASK, RunDataBits::RUN_TYPE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_type.into() & RunDataBits::TWO_BITS_MASK,
                RunDataBits::BONUS_TYPE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_charges.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::BONUS_CHARGES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_lines_cleared.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::LEVEL_LINES_CLEARED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.bonus_slot.into() & RunDataBits::TWO_BITS_MASK,
                RunDataBits::BONUS_SLOT_POS.into(),
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
                & RunDataBits::U16_MASK)
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
            current_difficulty: (BitShift::shr(data, RunDataBits::CURRENT_DIFFICULTY_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            zone_id: (BitShift::shr(data, RunDataBits::ZONE_ID_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            active_mutator_id: (BitShift::shr(data, RunDataBits::ACTIVE_MUTATOR_ID_POS.into())
                & RunDataBits::FIVE_BITS_MASK)
                .try_into()
                .unwrap(),
            run_type: (BitShift::shr(data, RunDataBits::RUN_TYPE_POS.into())
                & RunDataBits::BOOL_MASK)
                .try_into()
                .unwrap(),
            bonus_type: (BitShift::shr(data, RunDataBits::BONUS_TYPE_POS.into())
                & RunDataBits::TWO_BITS_MASK)
                .try_into()
                .unwrap(),
            bonus_charges: (BitShift::shr(data, RunDataBits::BONUS_CHARGES_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            level_lines_cleared: (BitShift::shr(data, RunDataBits::LEVEL_LINES_CLEARED_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            bonus_slot: (BitShift::shr(data, RunDataBits::BONUS_SLOT_POS.into())
                & RunDataBits::TWO_BITS_MASK)
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
/// │ 16-31   │ daily_stars           │ 16   │ Lifetime daily stars       │
/// │ 32-63   │ lifetime_xp           │ 32   │ Lifetime XP                │
/// │ 64-251  │ reserved              │ 188  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Stats
    pub total_runs: u16,
    pub daily_stars: u16,
    pub lifetime_xp: u32,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const TOTAL_RUNS_POS: u8 = 0;
    pub const DAILY_STARS_POS: u8 = 16;
    pub const LIFETIME_XP_POS: u8 = 32;

    // Masks
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const DAILY_STARS_MASK: u256 = 0xFFFF; // 16 bits
    pub const LIFETIME_XP_MASK: u256 = 0xFFFFFFFF; // 32 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData { total_runs: 0, daily_stars: 0, lifetime_xp: 0 }
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
                self.daily_stars.into() & MetaDataBits::DAILY_STARS_MASK,
                MetaDataBits::DAILY_STARS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.lifetime_xp.into() & MetaDataBits::LIFETIME_XP_MASK,
                MetaDataBits::LIFETIME_XP_POS.into(),
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
            daily_stars: (BitShift::shr(data, MetaDataBits::DAILY_STARS_POS.into())
                & MetaDataBits::DAILY_STARS_MASK)
                .try_into()
                .unwrap(),
            lifetime_xp: (BitShift::shr(data, MetaDataBits::LIFETIME_XP_POS.into())
                & MetaDataBits::LIFETIME_XP_MASK)
                .try_into()
                .unwrap(),
        }
    }
}
// Tests moved to contracts/src/tests/ - see test_packing.cairo for comprehensive packing tests


