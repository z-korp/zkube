use alexandria_math::BitShift;

/// Bit-packing helpers for efficient storage.
///
/// run_data layout (134 bits used, 118 reserved):
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
/// - 128: level_transition_pending
/// - 129: slot_1_branch
/// - 130: slot_2_branch
/// - 131: slot_3_branch
/// - 132: gambit_triggered_this_level
/// - 133: combo_surge_flow_active

/// Unpacked run data structure (vNext, 3-slot loadout with branch tracking)
#[derive(Copy, Drop, Serde, Debug, PartialEq)]
pub struct RunData {
    // Level progress
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
    // Runtime loadout (3 slots max — active or passive skills)
    pub active_slot_count: u8,
    // Slot 1-3: skill_id (4 bits), level (4 bits), charges (2 bits), branch (1 bit)
    pub slot_1_skill: u8,
    pub slot_1_level: u8,
    pub slot_2_skill: u8,
    pub slot_2_level: u8,
    pub slot_3_skill: u8,
    pub slot_3_level: u8,
    pub slot_1_charges: u8,
    pub slot_2_charges: u8,
    pub slot_3_charges: u8,
    // Level transition state
    pub level_transition_pending: bool,
    // Per-slot branch choice (0=A, 1=B)
    pub slot_1_branch: u8,
    pub slot_2_branch: u8,
    pub slot_3_branch: u8,
    // Per-level flags (reset on level advance)
    pub gambit_triggered_this_level: bool,
    pub combo_surge_flow_active: bool,
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
    pub const LEVEL_TRANSITION_PENDING_POS: u8 = 128;
    pub const SLOT_1_BRANCH_POS: u8 = 129;
    pub const SLOT_2_BRANCH_POS: u8 = 130;
    pub const SLOT_3_BRANCH_POS: u8 = 131;
    pub const GAMBIT_TRIGGERED_POS: u8 = 132;
    pub const COMBO_SURGE_FLOW_POS: u8 = 133;

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
            level_transition_pending: false,
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
            slot_1_branch: 0,
            slot_2_branch: 0,
            slot_3_branch: 0,
            gambit_triggered_this_level: false,
            combo_surge_flow_active: false,
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
        packed = packed
            | BitShift::shl(
                if self.level_transition_pending {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::LEVEL_TRANSITION_PENDING_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_1_branch.into() & RunDataBits::BOOL_MASK,
                RunDataBits::SLOT_1_BRANCH_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_2_branch.into() & RunDataBits::BOOL_MASK,
                RunDataBits::SLOT_2_BRANCH_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                self.slot_3_branch.into() & RunDataBits::BOOL_MASK,
                RunDataBits::SLOT_3_BRANCH_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.gambit_triggered_this_level {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::GAMBIT_TRIGGERED_POS.into(),
            );
        packed = packed
            | BitShift::shl(
                if self.combo_surge_flow_active {
                    1_u256
                } else {
                    0_u256
                },
                RunDataBits::COMBO_SURGE_FLOW_POS.into(),
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
            level_transition_pending: (BitShift::shr(
                data, RunDataBits::LEVEL_TRANSITION_PENDING_POS.into(),
            )
                & RunDataBits::BOOL_MASK) == 1,
            slot_1_branch: (BitShift::shr(data, RunDataBits::SLOT_1_BRANCH_POS.into())
                & RunDataBits::BOOL_MASK)
                .try_into()
                .unwrap(),
            slot_2_branch: (BitShift::shr(data, RunDataBits::SLOT_2_BRANCH_POS.into())
                & RunDataBits::BOOL_MASK)
                .try_into()
                .unwrap(),
            slot_3_branch: (BitShift::shr(data, RunDataBits::SLOT_3_BRANCH_POS.into())
                & RunDataBits::BOOL_MASK)
                .try_into()
                .unwrap(),
            gambit_triggered_this_level: (BitShift::shr(
                data, RunDataBits::GAMBIT_TRIGGERED_POS.into(),
            )
                & RunDataBits::BOOL_MASK) == 1,
            combo_surge_flow_active: (BitShift::shr(
                data, RunDataBits::COMBO_SURGE_FLOW_POS.into(),
            )
                & RunDataBits::BOOL_MASK) == 1,
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

    /// Get branch choice for a slot (0-indexed: 0-2). 0=A, 1=B.
    fn get_slot_branch(self: @RunData, slot: u8) -> u8 {
        match slot {
            0 => *self.slot_1_branch,
            1 => *self.slot_2_branch,
            2 => *self.slot_3_branch,
            _ => 0,
        }
    }

    /// Set charges for a slot.
    /// Runtime charge cap is 3.
    fn set_slot_charges(ref self: RunData, slot: u8, count: u8) {
        let clamped = if count > 3 {
            3
        } else {
            count
        };
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

    /// Set branch choice for a slot. 0=A, 1=B.
    fn set_slot_branch(ref self: RunData, slot: u8, branch_id: u8) {
        let clamped = if branch_id > 1 {
            1
        } else {
            branch_id
        };
        match slot {
            0 => self.slot_1_branch = clamped,
            1 => self.slot_2_branch = clamped,
            2 => self.slot_3_branch = clamped,
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
        }
        255
    }

    /// Check if a skill is in any slot.
    #[inline(always)]
    fn has_skill(self: @RunData, skill_id: u8) -> bool {
        self.find_skill_slot(skill_id) != 255
    }

    /// Add a skill to the next empty runtime slot. Returns slot index (0-2), or 255 if full.
    fn add_skill(ref self: RunData, skill_id: u8, level: u8, branch_id: u8) -> u8 {
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 {
                break;
            }
            if self.get_slot_skill(slot) == 0 {
                self.set_slot_skill(slot, skill_id);
                self.set_slot_level(slot, level);
                self.set_slot_charges(slot, 0);
                self.set_slot_branch(slot, branch_id);
                if self.active_slot_count < 3 {
                    self.active_slot_count += 1;
                }
                return slot;
            }
            slot += 1;
        }
        255
    }

    /// Get charges for an active skill (skill_id 1-4). Finds slot automatically.
    fn get_active_charges(self: @RunData, skill_id: u8) -> u8 {
        let slot = self.find_skill_slot(skill_id);
        if slot == 255 {
            0
        } else {
            self.get_slot_charges(slot)
        }
    }

    /// Use one charge of an active skill. Finds slot and decrements. Panics if no charges.
    fn use_active_charge(ref self: RunData, skill_id: u8) {
        let slot = self.find_skill_slot(skill_id);
        assert!(slot != 255, "Active skill not found");
        let charges = self.get_slot_charges(slot);
        assert!(charges > 0, "No active charges available");
        self.set_slot_charges(slot, charges - 1);
    }

    /// Add one charge to an active skill's slot. Finds slot automatically.
    fn add_active_charge(ref self: RunData, skill_id: u8) {
        let slot = self.find_skill_slot(skill_id);
        assert!(slot != 255, "Active skill not found");
        let charges = self.get_slot_charges(slot);
        if charges < 3 {
            self.set_slot_charges(slot, charges + 1);
        }
    }

    /// Add charges to all active-type skills (skill ids 1-4), respecting cap=3.
    fn award_all_active_charges(ref self: RunData, amount: u8) {
        if amount == 0 {
            return;
        }

        let mut slot: u8 = 0;
        loop {
            if slot >= 3 || slot >= self.active_slot_count {
                break;
            }

            let sid = self.get_slot_skill(slot);
            if sid >= 1 && sid <= 4 {
                let charges = self.get_slot_charges(slot);
                self.set_slot_charges(slot, charges + amount);
            }

            slot += 1;
        };
    }

    /// Get run level for an active skill. Returns 0 if not found.
    fn get_active_level(self: @RunData, skill_id: u8) -> u8 {
        let slot = self.find_skill_slot(skill_id);
        if slot == 255 {
            0
        } else {
            self.get_slot_level(slot)
        }
    }

    /// Get branch choice for a skill in the loadout. Returns 0 if not found.
    fn get_active_branch(self: @RunData, skill_id: u8) -> u8 {
        let slot = self.find_skill_slot(skill_id);
        if slot == 255 {
            0
        } else {
            self.get_slot_branch(slot)
        }
    }

    /// Check if a skill_id is an active skill (1-4).
    #[inline(always)]
    fn is_active_skill_id(skill_id: u8) -> bool {
        skill_id >= 1 && skill_id <= 4
    }

    /// Check if a skill_id is a passive skill (5-12).
    #[inline(always)]
    fn is_passive_skill_id(skill_id: u8) -> bool {
        skill_id >= 5 && skill_id <= 12
    }

    /// Award one charge to a random active-type skill.
    /// Uses deterministic seed to select which active gets the charge.
    /// No-op if player has no active-type skills in loadout.
    fn award_random_active_charge(ref self: RunData, seed: felt252) {
        let mut active_slots: Array<u8> = array![];
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 {
                break;
            }

            let skill_id = self.get_slot_skill(slot);
            if skill_id >= 1 && skill_id <= 4 {
                active_slots.append(slot);
            }
            slot += 1;
        }

        let count = active_slots.len();
        if count == 0 {
            return;
        }

        let seed_u256: u256 = seed.into();
        let index: u32 = (seed_u256 % count.into()).try_into().unwrap();
        let target_slot = *active_slots.at(index);

        let charges = self.get_slot_charges(target_slot);
        if charges < 3 {
            self.set_slot_charges(target_slot, charges + 1);
        }
    }
}

// =============================================================================
// PlayerMeta packing
// =============================================================================

/// PlayerMeta.data layout (48 bits used, 204 reserved):
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │ Bits    │ Field                 │ Size │ Description                │
/// ├─────────┼───────────────────────┼──────┼────────────────────────────┤
/// │ 0-15    │ total_runs            │ 16   │ Lifetime run count         │
/// │ 16-47   │ total_cubes_earned    │ 32   │ Lifetime cubes earned      │
/// │ 48-251  │ reserved              │ 204  │ Future features            │
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
/// 12 skills: IDs 1-4 active, IDs 5-12 passive. Index 0 is unused/reserved.
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
}

mod SkillTreeBits {
    pub const BITS_PER_SKILL: u8 = 6;
    pub const LEVEL_MASK: u256 = 0xF;
    pub const BRANCH_CHOSEN_MASK: u256 = 0x1;
    pub const BRANCH_ID_MASK: u256 = 0x1;
    pub const SKILL_MASK: u256 = 0x3F;
    pub const TOTAL_SKILLS: u8 = 12;
    pub const MAX_TREE_LEVEL: u8 = 5;
    pub const BRANCH_POINT: u8 = 3;
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
            _ => { assert!(false, "Invalid skill_id"); },
        }
    }
}

fn pack_skill(packed: u256, skill: SkillInfo, bit_pos: u8) -> u256 {
    let skill_bits: u256 = (skill.level.into() & SkillTreeBits::LEVEL_MASK)
        | BitShift::shl(if skill.branch_chosen {
            1_u256
        } else {
            0_u256
        }, 4)
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
    /// Cost to upgrade from current_level to current_level + 1.
    /// Levels: 0→1 = 100, 1→2 = 500, 2→3 = 1000, 3→4 = 5000, 4→5 = 10000.
    fn skill_upgrade_cost(current_level: u8) -> u16 {
        match current_level {
            0 => 100,
            1 => 500,
            2 => 1000,
            3 => 5000,
            4 => 10000,
            _ => 0,
        }
    }

    /// Cost to respec a branch. 50% of total CUBE invested in that skill.
    /// Only possible at level >= 3 (branch point).
    fn branch_respec_cost(current_level: u8) -> u16 {
        if current_level < 3 {
            return 0;
        }

        let mut total: u16 = 0;
        let mut lvl: u8 = 0;
        loop {
            if lvl >= current_level {
                break;
            }
            total += Self::skill_upgrade_cost(lvl);
            lvl += 1;
        }

        (total + 1) / 2
    }

    /// Check if a skill_id is an active skill (1-4).
    fn is_active_skill(skill_id: u8) -> bool {
        skill_id >= 1 && skill_id <= 4
    }

    /// Check if a skill_id is a passive skill (5-12).
    fn is_passive_skill(skill_id: u8) -> bool {
        skill_id >= 5 && skill_id <= 12
    }
}

#[cfg(test)]
mod tests {
    use super::{
        MetaData, MetaDataPacking, MetaDataPackingTrait, RunData, RunDataPacking,
        RunDataHelpers, RunDataHelpersTrait, RunDataPackingTrait, SkillInfo,
        SkillTreeDataPacking, SkillTreeDataPackingTrait, SkillTreeHelpers,
    };

    #[test]
    fn test_run_data_lifecycle() {
        // --- new defaults ---
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
        assert!(data.slot_1_branch == 0, "Slot 1 branch should start at 0");
        assert!(data.slot_2_branch == 0, "Slot 2 branch should start at 0");
        assert!(data.slot_3_branch == 0, "Slot 3 branch should start at 0");
        assert!(!data.gambit_triggered_this_level, "Gambit should start false");
        assert!(!data.combo_surge_flow_active, "Combo surge flow should start false");

        // --- pack/unpack roundtrip ---
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
            level_transition_pending: true,
            slot_1_branch: 0,
            slot_2_branch: 1,
            slot_3_branch: 0,
            gambit_triggered_this_level: true,
            combo_surge_flow_active: false,
        };
        let packed = original.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);
        assert!(unpacked == original, "RunData roundtrip mismatch");

        // --- edge (max) values ---
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
            level_transition_pending: true,
            slot_1_branch: 1,
            slot_2_branch: 1,
            slot_3_branch: 1,
            gambit_triggered_this_level: true,
            combo_surge_flow_active: true,
        };
        let packed = max_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);
        assert!(unpacked == max_values, "Max values should roundtrip correctly");

        // --- zero values ---
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
            level_transition_pending: false,
            slot_1_branch: 0,
            slot_2_branch: 0,
            slot_3_branch: 0,
            gambit_triggered_this_level: false,
            combo_surge_flow_active: false,
        };
        let packed = zero_values.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);
        assert!(unpacked == zero_values, "Zero values should roundtrip correctly");

        // --- new fields (branch, gambit, flow) ---
        let mut data = RunDataPackingTrait::new();
        data.slot_1_branch = 1;
        data.slot_2_branch = 0;
        data.slot_3_branch = 1;
        data.gambit_triggered_this_level = true;
        data.combo_surge_flow_active = true;
        let packed = data.pack();
        let unpacked = RunDataPackingTrait::unpack(packed);
        assert!(unpacked.slot_1_branch == 1, "Slot 1 branch mismatch");
        assert!(unpacked.slot_2_branch == 0, "Slot 2 branch mismatch");
        assert!(unpacked.slot_3_branch == 1, "Slot 3 branch mismatch");
        assert!(unpacked.gambit_triggered_this_level, "Gambit flag mismatch");
        assert!(unpacked.combo_surge_flow_active, "Combo surge flow flag mismatch");
    }

    #[test]
    fn test_meta_data() {
        // --- new defaults ---
        let data = MetaDataPackingTrait::new();
        assert!(data.total_runs == 0, "Should start with 0 runs");
        assert!(data.total_cubes_earned == 0, "Should start with 0 cubes earned");

        // --- pack/unpack roundtrip ---
        let original = MetaData { total_runs: 1000, total_cubes_earned: 50000 };
        let packed = original.pack();
        let unpacked = MetaDataPackingTrait::unpack(packed);
        assert!(unpacked.total_runs == original.total_runs, "total_runs mismatch");
        assert!(
            unpacked.total_cubes_earned == original.total_cubes_earned,
            "total_cubes_earned mismatch",
        );
    }

    #[test]
    fn test_skill_tree_data() {
        // --- pack/unpack roundtrip ---
        let mut data = SkillTreeDataPackingTrait::new();
        data.set_skill(0, SkillInfo { level: 4, branch_chosen: false, branch_id: 0 });
        data.set_skill(3, SkillInfo { level: 5, branch_chosen: true, branch_id: 1 });
        data.set_skill(7, SkillInfo { level: 3, branch_chosen: true, branch_id: 0 });
        data.set_skill(11, SkillInfo { level: 2, branch_chosen: false, branch_id: 0 });
        data.set_skill(12, SkillInfo { level: 5, branch_chosen: true, branch_id: 0 });
        let packed = data.pack();
        let unpacked = SkillTreeDataPackingTrait::unpack(packed);
        assert!(unpacked == data, "Skill tree data should roundtrip correctly");
        assert!(unpacked.get_skill(3).branch_chosen, "Skill 3 should have branch chosen");
        assert!(unpacked.get_skill(7).level == 3, "Skill 7 level mismatch");

        // --- add_skill with branch ---
        let mut data = RunDataPackingTrait::new();
        let slot = data.add_skill(1, 3, 0);
        assert!(slot == 0, "First skill should go to slot 0");
        assert!(data.slot_1_skill == 1, "Slot 1 skill should be 1");
        assert!(data.slot_1_level == 3, "Slot 1 level should be 3");
        assert!(data.slot_1_branch == 0, "Slot 1 branch should be A (0)");
        let slot2 = data.add_skill(7, 5, 1);
        assert!(slot2 == 1, "Second skill should go to slot 1");
        assert!(data.slot_2_skill == 7, "Slot 2 skill should be 7");
        assert!(data.slot_2_branch == 1, "Slot 2 branch should be B (1)");
        assert!(data.active_slot_count == 2, "Should have 2 active slots");
    }

    #[test]
    fn test_skill_economics() {
        // --- upgrade costs ---
        assert!(SkillTreeHelpers::skill_upgrade_cost(0) == 100, "L0->L1 should cost 100");
        assert!(SkillTreeHelpers::skill_upgrade_cost(1) == 500, "L1->L2 should cost 500");
        assert!(SkillTreeHelpers::skill_upgrade_cost(2) == 1000, "L2->L3 should cost 1000");
        assert!(SkillTreeHelpers::skill_upgrade_cost(3) == 5000, "L3->L4 should cost 5000");
        assert!(SkillTreeHelpers::skill_upgrade_cost(4) == 10000, "L4->L5 should cost 10000");
        assert!(SkillTreeHelpers::skill_upgrade_cost(5) == 0, "L5+ should cost 0 (maxed)");

        // --- branch respec costs ---
        assert!(SkillTreeHelpers::branch_respec_cost(0) == 0, "L0 respec should be 0");
        assert!(SkillTreeHelpers::branch_respec_cost(1) == 0, "L1 respec should be 0");
        assert!(SkillTreeHelpers::branch_respec_cost(2) == 0, "L2 respec should be 0");
        assert!(SkillTreeHelpers::branch_respec_cost(3) == 800, "L3 respec should be 800");
        assert!(SkillTreeHelpers::branch_respec_cost(4) == 3300, "L4 respec should be 3300");
        assert!(SkillTreeHelpers::branch_respec_cost(5) == 8300, "L5 respec should be 8300");

        // --- categorization ---
        assert!(SkillTreeHelpers::is_active_skill(1), "ID 1 should be active");
        assert!(SkillTreeHelpers::is_active_skill(4), "ID 4 should be active");
        assert!(!SkillTreeHelpers::is_active_skill(0), "ID 0 should not be active");
        assert!(!SkillTreeHelpers::is_active_skill(5), "ID 5 should not be active");
        assert!(SkillTreeHelpers::is_passive_skill(5), "ID 5 should be passive");
        assert!(SkillTreeHelpers::is_passive_skill(12), "ID 12 should be passive");
        assert!(!SkillTreeHelpers::is_passive_skill(4), "ID 4 should not be passive");
        assert!(!SkillTreeHelpers::is_passive_skill(13), "ID 13 should not be passive");
    }
}
