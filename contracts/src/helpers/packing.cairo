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
/// - 89-92: zone_id
/// - 93-100: mutator_mask

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

// Tests moved to contracts/src/tests/ - see test_packing.cairo for comprehensive packing tests
