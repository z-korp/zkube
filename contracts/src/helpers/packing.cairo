use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage.
///
/// run_data layout (128 bits used, 124 reserved):
/// - 0-7: current_level
/// - 8-15: level_score
/// - 16-23: level_moves
/// - 24-31: constraint_progress
/// - 32-39: constraint_2_progress
/// - 40-47: constraint_3_progress
/// - 48: bonus_used_this_level
/// - 49-56: max_combo_run
/// - 57-72: total_cubes
/// - 73-88: total_score
/// - 89: run_completed
/// - 90-93: free_moves
/// - 94: no_bonus_constraint
/// - 95-97: active_slot_count
/// - 98-101: slot_1_skill
/// - 102-105: slot_1_level
/// - 106-109: slot_2_skill
/// - 110-113: slot_2_level
/// - 114-117: slot_3_skill
/// - 118-121: slot_3_level
/// - 122-123: slot_1_charges
/// - 124-125: slot_2_charges
/// - 126-127: slot_3_charges

/// Unpacked run data structure (V6, 3-slot only runtime/storage)
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    // Level progress (unchanged)
    pub current_level: u8,
    pub level_score: u8,
    pub level_moves: u8,
    pub constraint_progress: u8,
    pub constraint_2_progress: u8,
    pub constraint_3_progress: u8,
    pub bonus_used_this_level: bool,
    pub max_combo_run: u8,
    pub total_cubes: u16,
    pub total_score: u16,
    pub run_completed: bool,
    pub free_moves: u8,
    pub no_bonus_constraint: bool,
    // Runtime loadout (3 active slots max)
    pub active_slot_count: u8,
    // Slot 1-3: skill_id (4 bits), level (4 bits), charges (2 bits)
    pub slot_1_skill: u8,
    pub slot_1_level: u8,
    pub slot_2_skill: u8,
    pub slot_2_level: u8,
    pub slot_3_skill: u8,
    pub slot_3_level: u8,
    pub slot_1_charges: u8,
    pub slot_2_charges: u8,
    pub slot_3_charges: u8,
}

/// Bit positions and masks for run_data
mod RunDataBits {
    pub const CURRENT_LEVEL_POS: u8 = 0;
    pub const LEVEL_SCORE_POS: u8 = 8;
    pub const LEVEL_MOVES_POS: u8 = 16;
    pub const CONSTRAINT_PROGRESS_POS: u8 = 24;
    pub const CONSTRAINT_2_PROGRESS_POS: u8 = 32;
    pub const CONSTRAINT_3_PROGRESS_POS: u8 = 40;
    pub const BONUS_USED_POS: u8 = 48;
    pub const MAX_COMBO_RUN_POS: u8 = 49;
    pub const TOTAL_CUBES_POS: u8 = 57;
    pub const TOTAL_SCORE_POS: u8 = 73;
    pub const RUN_COMPLETED_POS: u8 = 89;
    pub const FREE_MOVES_POS: u8 = 90;
    pub const NO_BONUS_CONSTRAINT_POS: u8 = 94;
    pub const ACTIVE_SLOT_COUNT_POS: u8 = 95;
    pub const SLOT_1_SKILL_POS: u8 = 98;
    pub const SLOT_1_LEVEL_POS: u8 = 102;
    pub const SLOT_2_SKILL_POS: u8 = 106;
    pub const SLOT_2_LEVEL_POS: u8 = 110;
    pub const SLOT_3_SKILL_POS: u8 = 114;
    pub const SLOT_3_LEVEL_POS: u8 = 118;
    pub const SLOT_1_CHARGES_POS: u8 = 122;
    pub const SLOT_2_CHARGES_POS: u8 = 124;
    pub const SLOT_3_CHARGES_POS: u8 = 126;

    pub const U8_MASK: u256 = 0xFF;
    pub const U16_MASK: u256 = 0xFFFF;
    pub const BOOL_MASK: u256 = 0x1;
    pub const TWO_BITS_MASK: u256 = 0x3;
    pub const FOUR_BITS_MASK: u256 = 0xF;
    pub const THREE_BITS_MASK: u256 = 0x7;
}

#[generate_trait]
pub impl RunDataPacking of RunDataPackingTrait {
    /// Create a new RunData with initial values for level 1.
    fn new() -> RunData {
        RunData {
            current_level: 1,
            level_score: 0,
            level_moves: 0,
            constraint_progress: 0,
            constraint_2_progress: 0,
            constraint_3_progress: 0,
            bonus_used_this_level: false,
            max_combo_run: 0,
            total_cubes: 0,
            total_score: 0,
            run_completed: false,
            free_moves: 0,
            no_bonus_constraint: false,
            active_slot_count: 0,
            slot_1_skill: 0,
            slot_1_level: 0,
            slot_2_skill: 0,
            slot_2_level: 0,
            slot_3_skill: 0,
            slot_3_level: 0,
            slot_1_charges: 0,
            slot_2_charges: 0,
            slot_3_charges: 0,
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
                self.level_score.into() & RunDataBits::U8_MASK,
                RunDataBits::LEVEL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.level_moves.into() & RunDataBits::U8_MASK,
                RunDataBits::LEVEL_MOVES_POS.into(),
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
                self.constraint_3_progress.into() & RunDataBits::U8_MASK,
                RunDataBits::CONSTRAINT_3_PROGRESS_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.bonus_used_this_level {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::BONUS_USED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.max_combo_run.into() & RunDataBits::U8_MASK,
                RunDataBits::MAX_COMBO_RUN_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_cubes.into() & RunDataBits::U16_MASK,
                RunDataBits::TOTAL_CUBES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.total_score.into() & RunDataBits::U16_MASK,
                RunDataBits::TOTAL_SCORE_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.run_completed {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::RUN_COMPLETED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.free_moves.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::FREE_MOVES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.no_bonus_constraint {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::NO_BONUS_CONSTRAINT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.active_slot_count.into() & RunDataBits::THREE_BITS_MASK,
                RunDataBits::ACTIVE_SLOT_COUNT_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_1_skill.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_1_SKILL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_1_level.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_1_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_2_skill.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_2_SKILL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_2_level.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_2_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_3_skill.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_3_SKILL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_3_level.into() & RunDataBits::FOUR_BITS_MASK,
                RunDataBits::SLOT_3_LEVEL_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_1_charges.into() & RunDataBits::TWO_BITS_MASK,
                RunDataBits::SLOT_1_CHARGES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_2_charges.into() & RunDataBits::TWO_BITS_MASK,
                RunDataBits::SLOT_2_CHARGES_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_3_charges.into() & RunDataBits::TWO_BITS_MASK,
                RunDataBits::SLOT_3_CHARGES_POS.into(),
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
            constraint_3_progress: (BitShift::shr(
                data, RunDataBits::CONSTRAINT_3_PROGRESS_POS.into(),
            )
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            bonus_used_this_level: (BitShift::shr(data, RunDataBits::BONUS_USED_POS.into())
                & RunDataBits::BOOL_MASK) == 1,
            max_combo_run: (BitShift::shr(data, RunDataBits::MAX_COMBO_RUN_POS.into())
                & RunDataBits::U8_MASK)
                .try_into()
                .unwrap(),
            total_cubes: (BitShift::shr(data, RunDataBits::TOTAL_CUBES_POS.into())
                & RunDataBits::U16_MASK)
                .try_into()
                .unwrap(),
            total_score: (BitShift::shr(data, RunDataBits::TOTAL_SCORE_POS.into())
                & RunDataBits::U16_MASK)
                .try_into()
                .unwrap(),
            run_completed: (BitShift::shr(data, RunDataBits::RUN_COMPLETED_POS.into())
                & RunDataBits::BOOL_MASK) == 1,
            free_moves: (BitShift::shr(data, RunDataBits::FREE_MOVES_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            no_bonus_constraint: (BitShift::shr(data, RunDataBits::NO_BONUS_CONSTRAINT_POS.into())
                & RunDataBits::BOOL_MASK) == 1,
            active_slot_count: (BitShift::shr(data, RunDataBits::ACTIVE_SLOT_COUNT_POS.into())
                & RunDataBits::THREE_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_1_skill: (BitShift::shr(data, RunDataBits::SLOT_1_SKILL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_1_level: (BitShift::shr(data, RunDataBits::SLOT_1_LEVEL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_2_skill: (BitShift::shr(data, RunDataBits::SLOT_2_SKILL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_2_level: (BitShift::shr(data, RunDataBits::SLOT_2_LEVEL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_3_skill: (BitShift::shr(data, RunDataBits::SLOT_3_SKILL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_3_level: (BitShift::shr(data, RunDataBits::SLOT_3_LEVEL_POS.into())
                & RunDataBits::FOUR_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_1_charges: (BitShift::shr(data, RunDataBits::SLOT_1_CHARGES_POS.into())
                & RunDataBits::TWO_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_2_charges: (BitShift::shr(data, RunDataBits::SLOT_2_CHARGES_POS.into())
                & RunDataBits::TWO_BITS_MASK)
                .try_into()
                .unwrap(),
            slot_3_charges: (BitShift::shr(data, RunDataBits::SLOT_3_CHARGES_POS.into())
                & RunDataBits::TWO_BITS_MASK)
                .try_into()
                .unwrap(),
        }
    }
}

// =============================================================================
// RunData helper methods
// =============================================================================

/// Helper methods for RunData slot/skill operations.
#[generate_trait]
pub impl RunDataHelpers of RunDataHelpersTrait {
    /// Get skill_id for a slot (0-indexed: 0-2).
    fn get_slot_skill(self: @RunData, slot: u8) -> u8 {
        match slot {
            0 => *self.slot_1_skill,
            1 => *self.slot_2_skill,
            2 => *self.slot_3_skill,
            _ => 0,
        }
    }

    /// Get run level for a slot (0-indexed: 0-2).
    fn get_slot_level(self: @RunData, slot: u8) -> u8 {
        match slot {
            0 => *self.slot_1_level,
            1 => *self.slot_2_level,
            2 => *self.slot_3_level,
            _ => 0,
        }
    }

    /// Get charges for a slot (0-indexed: 0-2).
    fn get_slot_charges(self: @RunData, slot: u8) -> u8 {
        match slot {
            0 => *self.slot_1_charges,
            1 => *self.slot_2_charges,
            2 => *self.slot_3_charges,
            _ => 0,
        }
    }

    /// Set charges for a slot.
    /// Runtime charge cap is 3.
    fn set_slot_charges(ref self: RunData, slot: u8, count: u8) {
        let clamped = if count > 3 { 3 } else { count };
        match slot {
            0 => self.slot_1_charges = clamped,
            1 => self.slot_2_charges = clamped,
            2 => self.slot_3_charges = clamped,
            _ => {},
        }
    }

    /// Set skill_id for a slot.
    fn set_slot_skill(ref self: RunData, slot: u8, skill_id: u8) {
        match slot {
            0 => self.slot_1_skill = skill_id,
            1 => self.slot_2_skill = skill_id,
            2 => self.slot_3_skill = skill_id,
            _ => {},
        }
    }

    /// Set level for a slot.
    fn set_slot_level(ref self: RunData, slot: u8, level: u8) {
        match slot {
            0 => self.slot_1_level = level,
            1 => self.slot_2_level = level,
            2 => self.slot_3_level = level,
            _ => {},
        }
    }

    /// Find which slot (0-2) has a given skill_id. Returns 255 if not found.
    fn find_skill_slot(self: @RunData, skill_id: u8) -> u8 {
        if skill_id == 0 {
            return 255;
        }
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 {
                break;
            }
            if self.get_slot_skill(slot) == skill_id {
                return slot;
            }
            slot += 1;
        };
        255
    }

    /// Check if a skill is in any slot.
    #[inline(always)]
    fn has_skill(self: @RunData, skill_id: u8) -> bool {
        self.find_skill_slot(skill_id) != 255
    }

    /// Add a skill to the next empty runtime slot. Returns slot index (0-2), or 255 if full.
    fn add_skill(ref self: RunData, skill_id: u8, level: u8) -> u8 {
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 {
                break;
            }
            if self.get_slot_skill(slot) == 0 {
                self.set_slot_skill(slot, skill_id);
                self.set_slot_level(slot, level);
                self.set_slot_charges(slot, 0);
                if self.active_slot_count < 3 {
                    self.active_slot_count += 1;
                }
                return slot;
            }
            slot += 1;
        };
        255
    }

    /// Get charges for a bonus-type skill (skill_id 1-5). Finds slot automatically.
    fn get_bonus_charges(self: @RunData, bonus_skill_id: u8) -> u8 {
        let slot = self.find_skill_slot(bonus_skill_id);
        if slot == 255 {
            0
        } else {
            self.get_slot_charges(slot)
        }
    }

    /// Use one charge of a bonus skill. Finds slot and decrements. Panics if no charges.
    fn use_bonus_charge(ref self: RunData, bonus_skill_id: u8) {
        let slot = self.find_skill_slot(bonus_skill_id);
        assert!(slot != 255, "Bonus skill not found");
        let charges = self.get_slot_charges(slot);
        assert!(charges > 0, "No bonus charges available");
        self.set_slot_charges(slot, charges - 1);
    }

    /// Add one charge to a bonus skill's slot. Finds slot automatically.
    fn add_bonus_charge(ref self: RunData, bonus_skill_id: u8) {
        let slot = self.find_skill_slot(bonus_skill_id);
        assert!(slot != 255, "Bonus skill not found");
        let charges = self.get_slot_charges(slot);
        if charges < 3 {
            self.set_slot_charges(slot, charges + 1);
        }
    }

    /// Add charges to all active bonus skills (skill ids 1-5), respecting cap=3.
    fn award_all_active_bonus_charges(ref self: RunData, amount: u8) {
        if amount == 0 {
            return;
        }

        let mut slot: u8 = 0;
        loop {
            if slot >= 3 || slot >= self.active_slot_count {
                break;
            }

            let sid = self.get_slot_skill(slot);
            if sid >= 1 && sid <= 5 {
                let charges = self.get_slot_charges(slot);
                self.set_slot_charges(slot, charges + amount);
            }

            slot += 1;
        };
    }

    /// Get run level for a bonus-type skill. Returns 0 if not found.
    fn get_bonus_level(self: @RunData, bonus_skill_id: u8) -> u8 {
        let slot = self.find_skill_slot(bonus_skill_id);
        if slot == 255 {
            0
        } else {
            self.get_slot_level(slot)
        }
    }

    /// Check if a skill_id is a bonus skill (1-5).
    #[inline(always)]
    fn is_bonus_skill_id(skill_id: u8) -> bool {
        skill_id >= 1 && skill_id <= 5
    }

    /// Check if a skill_id is a world skill (6-15).
    #[inline(always)]
    fn is_world_skill_id(skill_id: u8) -> bool {
        skill_id >= 6 && skill_id <= 15
    }

    /// Award one charge to a random active bonus skill.
    /// Uses deterministic seed to select which bonus gets the charge.
    /// No-op if player has no active bonus skills.
    fn award_random_bonus_charge(ref self: RunData, seed: felt252) {
        let mut bonus_slots: Array<u8> = array![];
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 {
                break;
            }

            let skill_id = self.get_slot_skill(slot);
            if skill_id >= 1 && skill_id <= 5 {
                bonus_slots.append(slot);
            }
            slot += 1;
        };

        let count = bonus_slots.len();
        if count == 0 {
            return;
        }

        let seed_u256: u256 = seed.into();
        let index: u32 = (seed_u256 % count.into()).try_into().unwrap();
        let target_slot = *bonus_slots.at(index);

        let charges = self.get_slot_charges(target_slot);
        if charges < 3 {
            self.set_slot_charges(target_slot, charges + 1);
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (86 bits used, 166 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-1     │ starting_combo        │ 2    │ Starting combos (0-3)      │
/// │ 2-3     │ starting_score        │ 2    │ Starting scores (0-3)      │
/// │ 4-5     │ starting_harvest      │ 2    │ Starting harvests (0-3)    │
/// │ 6-7     │ starting_wave         │ 2    │ Starting waves (0-3)       │
/// │ 8-9     │ starting_supply       │ 2    │ Starting supplies (0-3)    │
/// │ 10-13   │ bag_combo_level       │ 4    │ Combo bag upgrades (0-15)  │
/// │ 14-17   │ bag_score_level       │ 4    │ Score bag upgrades (0-15)  │
/// │ 18-21   │ bag_harvest_level     │ 4    │ Harvest bag upgrades (0-15)│
/// │ 22-25   │ bag_wave_level        │ 4    │ Wave bag upgrades (0-15)   │
/// │ 26-29   │ bag_supply_level      │ 4    │ Supply bag upgrades (0-15) │
/// │ 30-33   │ bridging_rank         │ 4    │ Cube bridging rank (0-15)  │
/// │ 34      │ wave_unlocked         │ 1    │ Wave bonus unlocked        │
/// │ 35      │ supply_unlocked       │ 1    │ Supply bonus unlocked      │
/// │ 36-51   │ total_runs            │ 16   │ Lifetime run count         │
/// │ 52-83   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 84-85   │ reserved_flags        │ 2    │ Future unlocks/features    │
/// │ 86-251  │ reserved              │ 166  │ Future features            │
/// └─────────────────────────────────────────────────────────────────────┘

/// Unpacked player meta data structure
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct MetaData {
    // Stats
    pub total_runs: u16,
    pub total_cubes_earned: u32,
}

/// Bit positions and masks for meta_data
mod MetaDataBits {
    // Bit positions
    pub const TOTAL_RUNS_POS: u8 = 0;
    pub const TOTAL_CUBES_EARNED_POS: u8 = 16;

    // Masks
    pub const TOTAL_RUNS_MASK: u256 = 0xFFFF; // 16 bits
    pub const TOTAL_CUBES_EARNED_MASK: u256 = 0xFFFFFFFF; // 32 bits
}

#[generate_trait]
pub impl MetaDataPacking of MetaDataPackingTrait {
    /// Create a new MetaData with initial values
    fn new() -> MetaData {
        MetaData { total_runs: 0, total_cubes_earned: 0 }
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
        }
    }
}

// =============================================================================
// SkillTreeData packing
// =============================================================================

/// Unpacked skill tree data for a single skill.
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct SkillInfo {
    pub level: u8,
    pub branch_chosen: bool,
    pub branch_id: u8,
}

/// Full skill tree data (unpacked from felt252).
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct SkillTreeData {
    pub skill_0: SkillInfo,
    pub skill_1: SkillInfo,
    pub skill_2: SkillInfo,
    pub skill_3: SkillInfo,
    pub skill_4: SkillInfo,
    pub skill_5: SkillInfo,
    pub skill_6: SkillInfo,
    pub skill_7: SkillInfo,
    pub skill_8: SkillInfo,
    pub skill_9: SkillInfo,
    pub skill_10: SkillInfo,
    pub skill_11: SkillInfo,
    pub skill_12: SkillInfo,
    pub skill_13: SkillInfo,
    pub skill_14: SkillInfo,
}

mod SkillTreeBits {
    pub const BITS_PER_SKILL: u8 = 6;
    pub const LEVEL_MASK: u256 = 0xF;
    pub const BRANCH_CHOSEN_MASK: u256 = 0x1;
    pub const BRANCH_ID_MASK: u256 = 0x1;
    pub const SKILL_MASK: u256 = 0x3F;
    pub const TOTAL_SKILLS: u8 = 15;
    pub const MAX_TREE_LEVEL: u8 = 9;
    pub const BRANCH_POINT: u8 = 5;
}

#[generate_trait]
pub impl SkillTreeDataPacking of SkillTreeDataPackingTrait {
    fn new() -> SkillTreeData {
        let default_skill = SkillInfo { level: 0, branch_chosen: false, branch_id: 0 };
        SkillTreeData {
            skill_0: default_skill,
            skill_1: default_skill,
            skill_2: default_skill,
            skill_3: default_skill,
            skill_4: default_skill,
            skill_5: default_skill,
            skill_6: default_skill,
            skill_7: default_skill,
            skill_8: default_skill,
            skill_9: default_skill,
            skill_10: default_skill,
            skill_11: default_skill,
            skill_12: default_skill,
            skill_13: default_skill,
            skill_14: default_skill,
        }
    }

    fn pack(self: SkillTreeData) -> felt252 {
        let mut packed: u256 = 0;
        packed = pack_skill(packed, self.skill_0, 0);
        packed = pack_skill(packed, self.skill_1, 6);
        packed = pack_skill(packed, self.skill_2, 12);
        packed = pack_skill(packed, self.skill_3, 18);
        packed = pack_skill(packed, self.skill_4, 24);
        packed = pack_skill(packed, self.skill_5, 30);
        packed = pack_skill(packed, self.skill_6, 36);
        packed = pack_skill(packed, self.skill_7, 42);
        packed = pack_skill(packed, self.skill_8, 48);
        packed = pack_skill(packed, self.skill_9, 54);
        packed = pack_skill(packed, self.skill_10, 60);
        packed = pack_skill(packed, self.skill_11, 66);
        packed = pack_skill(packed, self.skill_12, 72);
        packed = pack_skill(packed, self.skill_13, 78);
        packed = pack_skill(packed, self.skill_14, 84);
        packed.try_into().unwrap()
    }

    fn unpack(packed: felt252) -> SkillTreeData {
        let data: u256 = packed.into();
        SkillTreeData {
            skill_0: unpack_skill(data, 0),
            skill_1: unpack_skill(data, 6),
            skill_2: unpack_skill(data, 12),
            skill_3: unpack_skill(data, 18),
            skill_4: unpack_skill(data, 24),
            skill_5: unpack_skill(data, 30),
            skill_6: unpack_skill(data, 36),
            skill_7: unpack_skill(data, 42),
            skill_8: unpack_skill(data, 48),
            skill_9: unpack_skill(data, 54),
            skill_10: unpack_skill(data, 60),
            skill_11: unpack_skill(data, 66),
            skill_12: unpack_skill(data, 72),
            skill_13: unpack_skill(data, 78),
            skill_14: unpack_skill(data, 84),
        }
    }

    fn get_skill(self: @SkillTreeData, skill_id: u8) -> SkillInfo {
        match skill_id {
            0 => *self.skill_0,
            1 => *self.skill_1,
            2 => *self.skill_2,
            3 => *self.skill_3,
            4 => *self.skill_4,
            5 => *self.skill_5,
            6 => *self.skill_6,
            7 => *self.skill_7,
            8 => *self.skill_8,
            9 => *self.skill_9,
            10 => *self.skill_10,
            11 => *self.skill_11,
            12 => *self.skill_12,
            13 => *self.skill_13,
            14 => *self.skill_14,
            _ => {
                assert!(false, "Invalid skill_id");
                SkillInfo { level: 0, branch_chosen: false, branch_id: 0 }
            },
        }
    }

    fn set_skill(ref self: SkillTreeData, skill_id: u8, info: SkillInfo) {
        match skill_id {
            0 => self.skill_0 = info,
            1 => self.skill_1 = info,
            2 => self.skill_2 = info,
            3 => self.skill_3 = info,
            4 => self.skill_4 = info,
            5 => self.skill_5 = info,
            6 => self.skill_6 = info,
            7 => self.skill_7 = info,
            8 => self.skill_8 = info,
            9 => self.skill_9 = info,
            10 => self.skill_10 = info,
            11 => self.skill_11 = info,
            12 => self.skill_12 = info,
            13 => self.skill_13 = info,
            14 => self.skill_14 = info,
            _ => {
                assert!(false, "Invalid skill_id");
            },
        }
    }
}

fn pack_skill(packed: u256, skill: SkillInfo, bit_pos: u8) -> u256 {
    let skill_bits: u256 = (skill.level.into() & SkillTreeBits::LEVEL_MASK)
        | BitShift::shl(if skill.branch_chosen { 1_u256 } else { 0_u256 }, 4)
        | BitShift::shl(skill.branch_id.into() & SkillTreeBits::BRANCH_ID_MASK, 5);
    packed | BitShift::shl(skill_bits, bit_pos.into())
}

fn unpack_skill(data: u256, bit_pos: u8) -> SkillInfo {
    let skill_bits = BitShift::shr(data, bit_pos.into()) & SkillTreeBits::SKILL_MASK;
    SkillInfo {
        level: (skill_bits & SkillTreeBits::LEVEL_MASK).try_into().unwrap(),
        branch_chosen: (BitShift::shr(skill_bits, 4) & SkillTreeBits::BRANCH_CHOSEN_MASK) == 1,
        branch_id: (BitShift::shr(skill_bits, 5) & SkillTreeBits::BRANCH_ID_MASK)
            .try_into()
            .unwrap(),
    }
}

#[generate_trait]
pub impl SkillTreeHelpers of SkillTreeHelpersTrait {
    fn skill_upgrade_cost(current_level: u8) -> u16 {
        match current_level {
            0 => 50,
            1 => 100,
            2 => 250,
            3 => 500,
            4 => 1000,
            5 => 2000,
            6 => 4000,
            7 => 8000,
            8 => 10000,
            _ => 0,
        }
    }

    fn branch_respec_cost(current_level: u8) -> u16 {
        if current_level <= 4 {
            return 0;
        }

        let mut total: u16 = 0;
        let mut lvl: u8 = 4;
        loop {
            if lvl >= current_level {
                break;
            }
            total += Self::skill_upgrade_cost(lvl);
            lvl += 1;
        };

        (total + 1) / 2
    }

    fn is_bonus_skill(skill_id: u8) -> bool {
        skill_id >= 1 && skill_id <= 5
    }

    fn is_world_skill(skill_id: u8) -> bool {
        skill_id >= 6 && skill_id <= 15
    }
}

#[cfg(test)]
mod tests {
    use super::{
        MetaData, MetaDataPacking, MetaDataPackingTrait, RunData, RunDataPacking,
        RunDataPackingTrait, SkillInfo, SkillTreeData, SkillTreeDataPacking, SkillTreeDataPackingTrait,
    };

    #[test]
    fn test_run_data_new() {
        let data = RunDataPackingTrait::new();
        assert!(data.current_level == 1, "Should start at level 1");
        assert!(data.level_score == 0, "Should start with 0 level score");
        assert!(data.level_moves == 0, "Should start with 0 level moves");
        assert!(data.constraint_progress == 0, "Should start with 0 primary constraint progress");
        assert!(
            data.constraint_2_progress == 0, "Should start with 0 secondary constraint progress",
        );
        assert!(
            data.constraint_3_progress == 0, "Should start with 0 tertiary constraint progress",
        );
        assert!(data.active_slot_count == 0, "Should start with 0 active slots");
        assert!(data.slot_1_skill == 0, "Slot 1 skill should start empty");
        assert!(data.slot_2_skill == 0, "Slot 2 skill should start empty");
        assert!(data.slot_3_skill == 0, "Slot 3 skill should start empty");
        assert!(data.slot_1_level == 0, "Slot 1 level should start at 0");
        assert!(data.slot_2_level == 0, "Slot 2 level should start at 0");
        assert!(data.slot_3_level == 0, "Slot 3 level should start at 0");
        assert!(data.slot_1_charges == 0, "Slot 1 charges should start at 0");
        assert!(data.slot_2_charges == 0, "Slot 2 charges should start at 0");
        assert!(data.slot_3_charges == 0, "Slot 3 charges should start at 0");
    }

    #[test]
    fn test_run_data_pack_unpack_roundtrip() {
        let original = RunData {
            current_level: 42,
            level_score: 150,
            level_moves: 25,
            constraint_progress: 3,
            constraint_2_progress: 7,
            constraint_3_progress: 12,
            bonus_used_this_level: true,
            max_combo_run: 7,
            total_cubes: 256,
            total_score: 12345,
            run_completed: false,
            free_moves: 3,
            no_bonus_constraint: true,
            active_slot_count: 3,
            slot_1_skill: 1,
            slot_1_level: 2,
            slot_2_skill: 4,
            slot_2_level: 1,
            slot_3_skill: 7,
            slot_3_level: 3,
            slot_1_charges: 2,
            slot_2_charges: 3,
            slot_3_charges: 1,
        };

        let packed = original.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == original, "RunData roundtrip mismatch");
    }

    #[test]
    fn test_run_data_edge_values() {
        let max_values = RunData {
            current_level: 255,
            level_score: 255,
            level_moves: 255,
            constraint_progress: 255,
            constraint_2_progress: 255,
            constraint_3_progress: 255,
            bonus_used_this_level: true,
            max_combo_run: 255,
            total_cubes: 65535,
            total_score: 65535,
            run_completed: true,
            free_moves: 15,
            no_bonus_constraint: true,
            active_slot_count: 3,
            slot_1_skill: 15,
            slot_1_level: 15,
            slot_2_skill: 15,
            slot_2_level: 15,
            slot_3_skill: 15,
            slot_3_level: 15,
            slot_1_charges: 3,
            slot_2_charges: 3,
            slot_3_charges: 3,
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
            constraint_2_progress: 0,
            constraint_3_progress: 0,
            bonus_used_this_level: false,
            max_combo_run: 0,
            total_cubes: 0,
            total_score: 0,
            run_completed: false,
            free_moves: 0,
            no_bonus_constraint: false,
            active_slot_count: 0,
            slot_1_skill: 0,
            slot_1_level: 0,
            slot_2_skill: 0,
            slot_2_level: 0,
            slot_3_skill: 0,
            slot_3_level: 0,
            slot_1_charges: 0,
            slot_2_charges: 0,
            slot_3_charges: 0,
        };

        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);

        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");
    }

    #[test]
    fn test_meta_data_pack_unpack_roundtrip() {
        let original = MetaData {
            total_runs: 1000,
            total_cubes_earned: 50000,
        };

        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);

        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(
            unpacked.total_cubes_earned == original.total_cubes_earned,
            "total_cubes_earned mismatch",
        );
    }

    #[test]
    fn test_skill_tree_data_pack_unpack_roundtrip() {
        let mut data = SkillTreeDataPackingTrait::new();
        data
            .set_skill(0, SkillInfo { level: 4, branch_chosen: false, branch_id: 0 });
        data
            .set_skill(3, SkillInfo { level: 5, branch_chosen: true, branch_id: 1 });
        data
            .set_skill(7, SkillInfo { level: 9, branch_chosen: true, branch_id: 0 });
        data
            .set_skill(14, SkillInfo { level: 2, branch_chosen: false, branch_id: 0 });

        let packed = data.pack();
        let unpacked = SkillTreeDataPackingTrait::unpack(packed);

        assert!(unpacked == data, "Skill tree data should roundtrip correctly");
        assert!(unpacked.get_skill(3).branch_chosen, "Skill 3 should have branch chosen");
        assert!(unpacked.get_skill(7).level == 9, "Skill 7 level mismatch");
    }


    #[test]
    fn test_meta_data_new() {
        let data = MetaDataPackingTrait::new();
        assert!(data.total_runs == 0, "Should start with 0 runs");
        assert!(data.total_cubes_earned == 0, "Should start with 0 cubes earned");
    }
}
