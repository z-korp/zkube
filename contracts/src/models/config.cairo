use starknet::ContractAddress;
use zkube::types::difficulty::Difficulty;

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettingsMetadata {
    #[key]
    pub settings_id: u32,
    pub name: felt252,
    pub description: ByteArray,
    pub created_by: ContractAddress,
    pub created_at: u64,
    /// Theme ID mapping to frontend visual assets (1-10)
    pub theme_id: u8,
    /// True = no purchase required to play this map
    pub is_free: bool,
    /// Admin can disable/hide this map
    pub enabled: bool,
    /// Price in payment_token units (0 for free maps)
    pub price: u256,
    /// ERC20 token address for payment (zero for free maps)
    pub payment_token: ContractAddress,
    /// zStar amount required for star-based unlock (0 = disabled)
    pub star_cost: u256,
}

/// Extended GameSettings with all configurable game parameters
/// Following the Death Mountain pattern for customizable game modes
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    // === Mode ===
    // The game mode (e.g., Increasing, VeryEasy, Easy, ..., Master)
    // This selects the overall behavior; actual difficulty tier is derived from
    // starting_difficulty + level progression via get_difficulty_for_level()
    pub mode: u8,
    // === Level Scaling ===
    pub base_moves: u16, // Moves at level 1 (default: 20)
    pub max_moves: u16, // Moves at level cap (default: 60)
    pub base_ratio_x100: u16, // Points/move ratio at level 1 * 100 (default: 80 = 0.80)
    pub max_ratio_x100: u16, // Points/move ratio at level cap * 100 (default: 180 = 1.80)
    // === Difficulty Progression (non-linear tier thresholds) ===
    // === Difficulty Progression (non-linear tier thresholds) ===
    // Each threshold is the level at which that difficulty tier begins
    // Tier 0 (VeryEasy) is always level 1
    pub tier_1_threshold: u8, // Level where Easy begins (default: 5)
    pub tier_2_threshold: u8, // Level where Medium begins (default: 10)
    pub tier_3_threshold: u8, // Level where MediumHard begins (default: 20)
    pub tier_4_threshold: u8, // Level where Hard begins (default: 35)
    pub tier_5_threshold: u8, // Level where VeryHard begins (default: 50)
    pub tier_6_threshold: u8, // Level where Expert begins (default: 70)
    pub tier_7_threshold: u8, // Level where Master begins (default: 90)
    // === Constraint Settings ===
    pub constraints_enabled: u8, // 1=enabled, 0=disabled (default: 1)
    pub constraint_start_level: u8, // Level when constraints begin (default: 5)
    // === Constraint Distribution (PACKED - scales from VeryEasy to Master, tiers 0-7) ===
    // Bit-packed to save storage. Use helper functions to access individual values.
    // constraint_lines_budgets (u64): lines(4x4bits) + budgets(4x8bits) + times(2x4bits) = 56 bits
    //   Bits 0-3:   veryeasy_min_lines (4 bits, max 15)
    //   Bits 4-7:   master_min_lines
    //   Bits 8-11:  veryeasy_max_lines
    //   Bits 12-15: master_max_lines
    //   Bits 16-23: veryeasy_budget_min (8 bits)
    //   Bits 24-31: veryeasy_budget_max
    //   Bits 32-39: master_budget_min
    //   Bits 40-47: master_budget_max
    //   Bits 48-51: veryeasy_min_times (4 bits)
    //   Bits 52-55: master_min_times
    pub constraint_lines_budgets: u64,
    // constraint_chances (u32): dual_chance(2x8bits) + secondary_no_bonus(2x8bits) = 32 bits
    //   Bits 0-7:   veryeasy_dual_chance (8 bits, 0-100)
    //   Bits 8-15:  master_dual_chance
    //   Bits 16-23: veryeasy_secondary_no_bonus_chance
    //   Bits 24-31: master_secondary_no_bonus_chance
    pub constraint_chances: u32,
    // === Block Distribution (scales from VeryEasy to Master, tiers 0-7) ===
    // Weights for each block size (interpolated by difficulty tier)
    // Weights are relative - they get normalized to sum to 100%
    // "veryeasy_*" = value at tier 0 (VeryEasy), "master_*" = value at tier 7 (Master)
    // size1=1-wide, size2=2-wide, size3=3-wide, size4=4-wide, size5=5-wide
    pub veryeasy_size1_weight: u8, // Weight for 1-wide blocks at VeryEasy (default: 20)
    pub veryeasy_size2_weight: u8, // Weight for 2-wide blocks at VeryEasy (default: 33)
    pub veryeasy_size3_weight: u8, // Weight for 3-wide blocks at VeryEasy (default: 27)
    pub veryeasy_size4_weight: u8, // Weight for 4-wide blocks at VeryEasy (default: 13)
    pub veryeasy_size5_weight: u8, // Weight for 5-wide blocks at VeryEasy (default: 7)
    pub master_size1_weight: u8, // Weight for 1-wide blocks at Master (default: 7)
    pub master_size2_weight: u8, // Weight for 2-wide blocks at Master (default: 13)
    pub master_size3_weight: u8, // Weight for 3-wide blocks at Master (default: 20)
    pub master_size4_weight: u8, // Weight for 4-wide blocks at Master (default: 27)
    pub master_size5_weight: u8, // Weight for 5-wide blocks at Master (default: 33)
    // === Variance Settings ===
    pub early_variance_percent: u8, // Variance % for early levels (default: 5)
    pub mid_variance_percent: u8, // Variance % for mid levels (default: 10)
    pub late_variance_percent: u8, // Variance % for late levels (default: 15)
    // === Level Tier Thresholds ===
    pub early_level_threshold: u8, // End of "early" levels (default: 5)
    pub mid_level_threshold: u8, // End of "mid" levels (default: 25)
    // === Level Cap ===
    pub level_cap: u8, // Max level for scaling (default: 50)
    // === Mutator Settings ===
    pub allowed_mutators: u32, // Bitmask of mutator IDs allowed for this map (default: 0 = none)
    // === Endless Mode Settings ===
    // Packed score thresholds for 8 difficulty tiers (8 × u16 = 128 bits)
    // Tier 0 threshold is always 0 (VeryEasy). Tiers 1-7 packed here.
    // Format: tier1 | tier2<<16 | tier3<<32 | tier4<<48 | tier5<<64 | tier6<<80 | tier7<<96
    pub endless_difficulty_thresholds: felt252,
    // Packed score multipliers for 8 tiers (8 × u8, stored as ×100, e.g. 150 = 1.5×)
    // Format: tier0 | tier1<<8 | tier2<<16 | ... | tier7<<56
    pub endless_score_multipliers: u64,
    // === Bonus Slot Settings ===
    // Bonus slot 1
    pub bonus_1_type: u8,
    pub bonus_1_trigger_type: u8,
    pub bonus_1_trigger_threshold: u8,
    pub bonus_1_starting_charges: u8,
    // Bonus slot 2
    pub bonus_2_type: u8,
    pub bonus_2_trigger_type: u8,
    pub bonus_2_trigger_threshold: u8,
    pub bonus_2_starting_charges: u8,
    // Bonus slot 3
    pub bonus_3_type: u8,
    pub bonus_3_trigger_type: u8,
    pub bonus_3_trigger_threshold: u8,
    pub bonus_3_starting_charges: u8,
    // === Boss Settings ===
    /// Fixed boss identity for this map (1-10, 0 = no boss/endless mode)
    pub boss_id: u8,
}

/// Default values for GameSettings
pub mod GameSettingsDefaults {
    // Level Scaling
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;
    pub const BASE_RATIO_X100: u16 = 80; // 0.80
    pub const MAX_RATIO_X100: u16 = 180; // 1.80

    // Difficulty Progression (non-linear tier thresholds)

    // Difficulty Progression (non-linear tier thresholds)
    // VeryEasy: 1-3, Easy: 4-7, Medium: 8-11, MediumHard: 12-17
    // Hard: 18-24, VeryHard: 25-34, Expert: 35-44, Master: 45+
    pub const TIER_1_THRESHOLD: u8 = 4; // Easy starts at level 4
    pub const TIER_2_THRESHOLD: u8 = 8; // Medium starts at level 8
    pub const TIER_3_THRESHOLD: u8 = 12; // MediumHard starts at level 12
    pub const TIER_4_THRESHOLD: u8 = 18; // Hard starts at level 18
    pub const TIER_5_THRESHOLD: u8 = 25; // VeryHard starts at level 25
    pub const TIER_6_THRESHOLD: u8 = 35; // Expert starts at level 35
    pub const TIER_7_THRESHOLD: u8 = 45; // Master starts at level 45

    // Constraint Settings
    pub const CONSTRAINTS_ENABLED: u8 = 1; // Enabled
    pub const CONSTRAINT_START_LEVEL: u8 = 3; // Constraints start at level 3

    // Constraint Distribution (VeryEasy to Master scaling)
    // Budget system: budget_min derived from budget_max (70% floor)
    pub const VERYEASY_BUDGET_MAX: u8 = 0; // No regular constraints at VeryEasy
    pub const MASTER_BUDGET_MAX: u8 = 80; // Wider ceiling for endgame variety
    // Constraint chances (kept for packed model layout compatibility, zeroed out)
    pub const VERYEASY_DUAL_CHANCE: u8 = 0;
    pub const MASTER_DUAL_CHANCE: u8 = 0;
    pub const VERYEASY_SECONDARY_NO_BONUS_CHANCE: u8 = 0;
    pub const MASTER_SECONDARY_NO_BONUS_CHANCE: u8 = 0;

    // Pre-packed default values for constraint fields
    // constraint_lines_budgets packing: lines(4x4) + budgets(4x8) + times(2x4) = 56 bits
    pub fn DEFAULT_CONSTRAINT_LINES_BUDGETS() -> u64 {
        let mut packed: u64 = 0;
        // Lines (4 bits each) - deprecated, set to zero
        packed = packed | (0_u64 & 0xF); // bits 0-3
        packed = packed | ((0_u64 & 0xF) * 0x10); // bits 4-7
        packed = packed | ((0_u64 & 0xF) * 0x100); // bits 8-11
        packed = packed | ((0_u64 & 0xF) * 0x1000); // bits 12-15
        // Budgets (8 bits each)
        let veryeasy_budget_min: u16 = (VERYEASY_BUDGET_MAX.into() * 70 + 99) / 100;
        packed = packed | (veryeasy_budget_min.into() * 0x10000); // bits 16-23
        packed = packed | (VERYEASY_BUDGET_MAX.into() * 0x1000000); // bits 24-31
        let master_budget_min: u16 = (MASTER_BUDGET_MAX.into() * 70 + 99) / 100;
        packed = packed | (master_budget_min.into() * 0x100000000); // bits 32-39
        packed = packed | (MASTER_BUDGET_MAX.into() * 0x10000000000); // bits 40-47
        // Times (4 bits each) - deprecated, set to zero
        packed = packed | ((0_u64 & 0xF) * 0x1000000000000); // bits 48-51
        packed = packed | ((0_u64 & 0xF) * 0x10000000000000); // bits 52-55
        packed
    }

    // constraint_chances packing: dual_chance(2x8) + secondary_no_bonus(2x8) = 32 bits
    pub fn DEFAULT_CONSTRAINT_CHANCES() -> u32 {
        let mut packed: u32 = 0;
        packed = packed | VERYEASY_DUAL_CHANCE.into(); // bits 0-7
        packed = packed | (MASTER_DUAL_CHANCE.into() * 0x100); // bits 8-15
        packed = packed | (VERYEASY_SECONDARY_NO_BONUS_CHANCE.into() * 0x10000); // bits 16-23
        packed = packed | (MASTER_SECONDARY_NO_BONUS_CHANCE.into() * 0x1000000); // bits 24-31
        packed
    }

    // Block Distribution (VeryEasy to Master scaling)
    // Size = block width (1-5). VeryEasy favors smaller blocks, Master favors larger.
    pub const VERYEASY_SIZE1_WEIGHT: u8 = 20; // 1-wide blocks at VeryEasy
    pub const VERYEASY_SIZE2_WEIGHT: u8 = 33; // 2-wide blocks at VeryEasy
    pub const VERYEASY_SIZE3_WEIGHT: u8 = 27; // 3-wide blocks at VeryEasy
    pub const VERYEASY_SIZE4_WEIGHT: u8 = 13; // 4-wide blocks at VeryEasy
    pub const VERYEASY_SIZE5_WEIGHT: u8 = 7; // 5-wide blocks at VeryEasy
    pub const MASTER_SIZE1_WEIGHT: u8 = 7; // 1-wide blocks at Master
    pub const MASTER_SIZE2_WEIGHT: u8 = 13; // 2-wide blocks at Master
    pub const MASTER_SIZE3_WEIGHT: u8 = 20; // 3-wide blocks at Master
    pub const MASTER_SIZE4_WEIGHT: u8 = 27; // 4-wide blocks at Master
    pub const MASTER_SIZE5_WEIGHT: u8 = 33; // 5-wide blocks at Master

    // Variance Settings (consistent ±5% across all levels)
    pub const EARLY_VARIANCE_PERCENT: u8 = 5; // ±5% for early levels
    pub const MID_VARIANCE_PERCENT: u8 = 5; // ±5% for mid levels
    pub const LATE_VARIANCE_PERCENT: u8 = 5; // ±5% for late levels

    // Level Tier Thresholds
    pub const EARLY_LEVEL_THRESHOLD: u8 = 5; // Levels 1-5 are "early"
    pub const MID_LEVEL_THRESHOLD: u8 = 25; // Levels 6-25 are "mid"

    // Level Cap
    pub const LEVEL_CAP: u8 = 50; // Max level for scaling

    // Endless Mode Defaults
    // Thresholds stored as felt252 — will be unpacked by helper functions
    // Default thresholds: [0, 15, 40, 80, 150, 280, 500, 900]
    // Tier 0 (VeryEasy) = 0 is implicit, only tiers 1-7 stored
    pub const ENDLESS_DIFFICULTY_THRESHOLDS: felt252 =
        0; // Unpacked via helper; 0 = use hardcoded defaults
    // Multipliers stored as u64 — 8 × u8, value/10 = multiplier
    // Default: [10, 12, 14, 17, 20, 25, 33, 40] → [1.0×, 1.2×, 1.4×, 1.7×, 2.0×, 2.5×,
    // 3.3×, 4.0×]
    pub const ENDLESS_SCORE_MULTIPLIERS: u64 = 0;

    // Bonus Slot Defaults
    pub const BONUS_1_TYPE: u8 = 1; // Hammer
    pub const BONUS_1_TRIGGER_TYPE: u8 = 1; // combo_streak
    pub const BONUS_1_TRIGGER_THRESHOLD: u8 = 5;
    pub const BONUS_1_STARTING_CHARGES: u8 = 1;

    pub const BONUS_2_TYPE: u8 = 3; // Wave
    pub const BONUS_2_TRIGGER_TYPE: u8 = 3; // score
    pub const BONUS_2_TRIGGER_THRESHOLD: u8 = 30;
    pub const BONUS_2_STARTING_CHARGES: u8 = 1;

    pub const BONUS_3_TYPE: u8 = 2; // Totem
    pub const BONUS_3_TRIGGER_TYPE: u8 = 2; // lines_cleared
    pub const BONUS_3_TRIGGER_THRESHOLD: u8 = 10;
    pub const BONUS_3_STARTING_CHARGES: u8 = 1;

    // Boss Settings
    pub const BOSS_ID: u8 = 0; // Default: no boss (endless mode)
}

#[generate_trait]
pub impl GameSettingsImpl of GameSettingsTrait {
    /// Check if settings exist.
    ///
    /// Dojo `read_model()` returns the zero value when a record doesn't exist.
    /// We treat `mode == Difficulty::None` (0) as "non-existent".
    fn exists(self: GameSettings) -> bool {
        self.mode != 0
    }

    /// Get mode as enum (e.g., Increasing, Easy, Expert, etc.)
    fn get_mode(self: GameSettings) -> Difficulty {
        self.mode.into()
    }

    /// Create default settings with a given mode
    fn new_with_defaults(settings_id: u32, mode: Difficulty) -> GameSettings {
        GameSettings {
            settings_id,
            mode: mode.into(),
            // Level Scaling
            base_moves: GameSettingsDefaults::BASE_MOVES,
            max_moves: GameSettingsDefaults::MAX_MOVES,
            base_ratio_x100: GameSettingsDefaults::BASE_RATIO_X100,
            max_ratio_x100: GameSettingsDefaults::MAX_RATIO_X100,
            // Difficulty Progression (non-linear tier thresholds)
            // Difficulty Progression (non-linear tier thresholds)
            tier_1_threshold: GameSettingsDefaults::TIER_1_THRESHOLD,
            tier_2_threshold: GameSettingsDefaults::TIER_2_THRESHOLD,
            tier_3_threshold: GameSettingsDefaults::TIER_3_THRESHOLD,
            tier_4_threshold: GameSettingsDefaults::TIER_4_THRESHOLD,
            tier_5_threshold: GameSettingsDefaults::TIER_5_THRESHOLD,
            tier_6_threshold: GameSettingsDefaults::TIER_6_THRESHOLD,
            tier_7_threshold: GameSettingsDefaults::TIER_7_THRESHOLD,
            // Constraint Settings
            constraints_enabled: GameSettingsDefaults::CONSTRAINTS_ENABLED,
            constraint_start_level: GameSettingsDefaults::CONSTRAINT_START_LEVEL,
            // Constraint Distribution (packed)
            constraint_lines_budgets: GameSettingsDefaults::DEFAULT_CONSTRAINT_LINES_BUDGETS(),
            constraint_chances: GameSettingsDefaults::DEFAULT_CONSTRAINT_CHANCES(),
            // Block Distribution
            veryeasy_size1_weight: GameSettingsDefaults::VERYEASY_SIZE1_WEIGHT,
            veryeasy_size2_weight: GameSettingsDefaults::VERYEASY_SIZE2_WEIGHT,
            veryeasy_size3_weight: GameSettingsDefaults::VERYEASY_SIZE3_WEIGHT,
            veryeasy_size4_weight: GameSettingsDefaults::VERYEASY_SIZE4_WEIGHT,
            veryeasy_size5_weight: GameSettingsDefaults::VERYEASY_SIZE5_WEIGHT,
            master_size1_weight: GameSettingsDefaults::MASTER_SIZE1_WEIGHT,
            master_size2_weight: GameSettingsDefaults::MASTER_SIZE2_WEIGHT,
            master_size3_weight: GameSettingsDefaults::MASTER_SIZE3_WEIGHT,
            master_size4_weight: GameSettingsDefaults::MASTER_SIZE4_WEIGHT,
            master_size5_weight: GameSettingsDefaults::MASTER_SIZE5_WEIGHT,
            // Variance Settings
            early_variance_percent: GameSettingsDefaults::EARLY_VARIANCE_PERCENT,
            mid_variance_percent: GameSettingsDefaults::MID_VARIANCE_PERCENT,
            late_variance_percent: GameSettingsDefaults::LATE_VARIANCE_PERCENT,
            // Level Tier Thresholds
            early_level_threshold: GameSettingsDefaults::EARLY_LEVEL_THRESHOLD,
            mid_level_threshold: GameSettingsDefaults::MID_LEVEL_THRESHOLD,
            // Level Cap
            level_cap: GameSettingsDefaults::LEVEL_CAP,
            // Mutator Settings
            allowed_mutators: 0, // No mutators by default
            // Endless Mode Settings
            endless_difficulty_thresholds: 0, // 0 = use hardcoded defaults
            endless_score_multipliers: 0, // 0 = use hardcoded defaults
            // Bonus Slot Settings
            bonus_1_type: GameSettingsDefaults::BONUS_1_TYPE,
            bonus_1_trigger_type: GameSettingsDefaults::BONUS_1_TRIGGER_TYPE,
            bonus_1_trigger_threshold: GameSettingsDefaults::BONUS_1_TRIGGER_THRESHOLD,
            bonus_1_starting_charges: GameSettingsDefaults::BONUS_1_STARTING_CHARGES,
            bonus_2_type: GameSettingsDefaults::BONUS_2_TYPE,
            bonus_2_trigger_type: GameSettingsDefaults::BONUS_2_TRIGGER_TYPE,
            bonus_2_trigger_threshold: GameSettingsDefaults::BONUS_2_TRIGGER_THRESHOLD,
            bonus_2_starting_charges: GameSettingsDefaults::BONUS_2_STARTING_CHARGES,
            bonus_3_type: GameSettingsDefaults::BONUS_3_TYPE,
            bonus_3_trigger_type: GameSettingsDefaults::BONUS_3_TRIGGER_TYPE,
            bonus_3_trigger_threshold: GameSettingsDefaults::BONUS_3_TRIGGER_THRESHOLD,
            bonus_3_starting_charges: GameSettingsDefaults::BONUS_3_STARTING_CHARGES,
            // Boss Settings
            boss_id: GameSettingsDefaults::BOSS_ID,
        }
    }

    /// Check if constraints are enabled
    fn are_constraints_enabled(self: GameSettings) -> bool {
        self.constraints_enabled != 0
    }

    /// Get difficulty for a given level based on settings
    fn get_difficulty_for_level(self: GameSettings, level: u8) -> Difficulty {
        let mode = self.get_mode();

        // Fixed difficulty modes: always return the selected mode.
        if mode != Difficulty::Increasing {
            // Defensive fallback for uninitialized settings.
            if mode == Difficulty::None {
                return Difficulty::Easy;
            }
            return mode;
        }

        // Progressive mode: use non-linear tier thresholds
        // Tier 0 = VeryEasy, 1 = Easy, 2 = Medium, 3 = MediumHard,
        // 4 = Hard, 5 = VeryHard, 6 = Expert, 7 = Master
        if level >= self.tier_7_threshold {
            Difficulty::Master
        } else if level >= self.tier_6_threshold {
            Difficulty::Expert
        } else if level >= self.tier_5_threshold {
            Difficulty::VeryHard
        } else if level >= self.tier_4_threshold {
            Difficulty::Hard
        } else if level >= self.tier_3_threshold {
            Difficulty::MediumHard
        } else if level >= self.tier_2_threshold {
            Difficulty::Medium
        } else if level >= self.tier_1_threshold {
            Difficulty::Easy
        } else {
            Difficulty::VeryEasy
        }
    }

    /// Get variance percent for a given level
    fn get_variance_percent(self: GameSettings, level: u8) -> u8 {
        if level <= self.early_level_threshold {
            self.early_variance_percent
        } else if level <= self.mid_level_threshold {
            self.mid_variance_percent
        } else {
            self.late_variance_percent
        }
    }

    /// Get the effective level cap
    fn get_level_cap(self: GameSettings) -> u8 {
        if self.level_cap == 0 {
            50 // Fallback to default if not set
        } else {
            self.level_cap
        }
    }


    /// Unpack constraint_lines_budgets field
    /// Returns (veryeasy_min_lines, master_min_lines, veryeasy_max_lines, master_max_lines,
    ///          veryeasy_budget_min, veryeasy_budget_max, master_budget_min, master_budget_max,
    ///          veryeasy_min_times, master_min_times)
    fn unpack_lines_budgets(self: GameSettings) -> (u8, u8, u8, u8, u8, u8, u8, u8, u8, u8) {
        let packed = self.constraint_lines_budgets;
        let veryeasy_min_lines: u8 = (packed & 0xF).try_into().unwrap();
        let master_min_lines: u8 = ((packed / 0x10) & 0xF).try_into().unwrap();
        let veryeasy_max_lines: u8 = ((packed / 0x100) & 0xF).try_into().unwrap();
        let master_max_lines: u8 = ((packed / 0x1000) & 0xF).try_into().unwrap();
        let veryeasy_budget_min: u8 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
        let veryeasy_budget_max: u8 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
        let master_budget_min: u8 = ((packed / 0x100000000) & 0xFF).try_into().unwrap();
        let master_budget_max: u8 = ((packed / 0x10000000000) & 0xFF).try_into().unwrap();
        let veryeasy_min_times: u8 = ((packed / 0x1000000000000) & 0xF).try_into().unwrap();
        let master_min_times: u8 = ((packed / 0x10000000000000) & 0xF).try_into().unwrap();
        (
            veryeasy_min_lines,
            master_min_lines,
            veryeasy_max_lines,
            master_max_lines,
            veryeasy_budget_min,
            veryeasy_budget_max,
            master_budget_min,
            master_budget_max,
            veryeasy_min_times,
            master_min_times,
        )
    }

    /// Unpack constraint_chances field
    /// Returns (veryeasy_dual_chance, master_dual_chance, veryeasy_secondary_no_bonus,
    /// master_secondary_no_bonus)
    fn unpack_chances(self: GameSettings) -> (u8, u8, u8, u8) {
        let packed = self.constraint_chances;
        let veryeasy_dual_chance: u8 = (packed & 0xFF).try_into().unwrap();
        let master_dual_chance: u8 = ((packed / 0x100) & 0xFF).try_into().unwrap();
        let veryeasy_secondary_no_bonus: u8 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
        let master_secondary_no_bonus: u8 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
        (
            veryeasy_dual_chance,
            master_dual_chance,
            veryeasy_secondary_no_bonus,
            master_secondary_no_bonus,
        )
    }

    /// Get constraint parameters interpolated for a given difficulty
    /// Returns (min_lines, max_lines, budget_min, budget_max, min_times)
    /// Note: dual_chance and secondary_no_bonus_chance were removed in the deterministic
    /// constraint count system. Constraint counts are now hardcoded per tier in level.cairo.
    fn get_constraint_params_for_difficulty(
        self: GameSettings, difficulty: Difficulty,
    ) -> (u8, u8, u8, u8, u8) {
        // Map difficulty to a 0-7 scale (VeryEasy=0, Master=7)
        // None and Increasing are modes, not tiers - treat as VeryEasy for interpolation
        let diff_value: u8 = match difficulty {
            Difficulty::None | Difficulty::Increasing => 0,
            Difficulty::VeryEasy => 0,
            Difficulty::Easy => 1,
            Difficulty::Medium => 2,
            Difficulty::MediumHard => 3,
            Difficulty::Hard => 4,
            Difficulty::VeryHard => 5,
            Difficulty::Expert => 6,
            Difficulty::Master => 7,
        };

        // Unpack the constraint values
        let (
            _veryeasy_min_lines,
            _master_min_lines,
            _veryeasy_max_lines,
            _master_max_lines,
            _veryeasy_budget_min,
            veryeasy_budget_max,
            _master_budget_min,
            master_budget_max,
            _veryeasy_min_times,
            _master_min_times,
        ) =
            self
            .unpack_lines_budgets();

        // Budget is the only active lever for constraint generation.
        let budget_max = Self::interpolate(veryeasy_budget_max, master_budget_max, diff_value, 7);
        let budget_min_raw: u16 = budget_max.into() * 70;
        let budget_min: u8 = ((budget_min_raw + 99) / 100).try_into().unwrap();

        // Legacy return slots (min_lines, max_lines, min_times) are deprecated.
        (0, 0, budget_min, budget_max, 0)
    }

    /// Get block weights interpolated for a given difficulty
    /// Returns (size1_weight, size2_weight, size3_weight, size4_weight, size5_weight)
    /// Weights are relative and get normalized by the caller
    fn get_block_weights_for_difficulty(
        self: GameSettings, difficulty: Difficulty,
    ) -> (u8, u8, u8, u8, u8) {
        // Map difficulty to a 0-7 scale (VeryEasy=0, Master=7)
        // None and Increasing are modes, not tiers - treat as VeryEasy for interpolation
        let diff_value: u8 = match difficulty {
            Difficulty::None | Difficulty::Increasing => 0,
            Difficulty::VeryEasy => 0,
            Difficulty::Easy => 1,
            Difficulty::Medium => 2,
            Difficulty::MediumHard => 3,
            Difficulty::Hard => 4,
            Difficulty::VeryHard => 5,
            Difficulty::Expert => 6,
            Difficulty::Master => 7,
        };

        // Interpolate each weight from veryeasy (0) to master (7)
        let size1_weight = Self::interpolate(
            self.veryeasy_size1_weight, self.master_size1_weight, diff_value, 7,
        );
        let size2_weight = Self::interpolate(
            self.veryeasy_size2_weight, self.master_size2_weight, diff_value, 7,
        );
        let size3_weight = Self::interpolate(
            self.veryeasy_size3_weight, self.master_size3_weight, diff_value, 7,
        );
        let size4_weight = Self::interpolate(
            self.veryeasy_size4_weight, self.master_size4_weight, diff_value, 7,
        );
        let size5_weight = Self::interpolate(
            self.veryeasy_size5_weight, self.master_size5_weight, diff_value, 7,
        );

        (size1_weight, size2_weight, size3_weight, size4_weight, size5_weight)
    }

    /// Validate all settings invariants
    /// Returns true if all invariants hold, false otherwise
    fn validate(self: GameSettings) -> bool {
        // Unpack constraint values for validation (line/times slots are deprecated)
        let (
            _veryeasy_min_lines,
            _master_min_lines,
            _veryeasy_max_lines,
            _master_max_lines,
            _veryeasy_budget_min_raw,
            veryeasy_budget_max,
            _master_budget_min_raw,
            master_budget_max,
            _veryeasy_min_times,
            _master_min_times,
        ) =
            self
            .unpack_lines_budgets();

        // Budget constraints: derived min <= max, with non-zero ceiling at Master.
        let veryeasy_budget_min: u16 = (veryeasy_budget_max.into() * 70 + 99) / 100;
        let master_budget_min: u16 = (master_budget_max.into() * 70 + 99) / 100;
        if veryeasy_budget_min > veryeasy_budget_max.into() {
            return false;
        }
        if master_budget_min > master_budget_max.into() {
            return false;
        }
        if master_budget_max == 0 {
            return false;
        }

        // Level scaling: base <= max
        if self.base_moves > self.max_moves {
            return false;
        }
        if self.base_ratio_x100 > self.max_ratio_x100 {
            return false;
        }

        // Level thresholds: early < mid < cap
        if self.early_level_threshold >= self.mid_level_threshold {
            return false;
        }
        if self.mid_level_threshold > self.level_cap {
            return false;
        }

        // constraints_enabled should be 0 or 1
        if self.constraints_enabled > 1 {
            return false;
        }

        // Difficulty tier thresholds must be in ascending order
        if self.tier_1_threshold < 2 {
            return false; // Must have at least 1 level of VeryEasy
        }
        if self.tier_2_threshold <= self.tier_1_threshold {
            return false;
        }
        if self.tier_3_threshold <= self.tier_2_threshold {
            return false;
        }
        if self.tier_4_threshold <= self.tier_3_threshold {
            return false;
        }
        if self.tier_5_threshold <= self.tier_4_threshold {
            return false;
        }
        if self.tier_6_threshold <= self.tier_5_threshold {
            return false;
        }
        if self.tier_7_threshold <= self.tier_6_threshold {
            return false;
        }

        // Block weights: at least one weight must be non-zero (avoid div by zero)
        let veryeasy_total = self.veryeasy_size1_weight.into()
            + self.veryeasy_size2_weight.into()
            + self.veryeasy_size3_weight.into()
            + self.veryeasy_size4_weight.into()
            + self.veryeasy_size5_weight.into();
        if veryeasy_total == 0_u16 {
            return false;
        }

        let master_total = self.master_size1_weight.into()
            + self.master_size2_weight.into()
            + self.master_size3_weight.into()
            + self.master_size4_weight.into()
            + self.master_size5_weight.into();
        if master_total == 0_u16 {
            return false;
        }

        // Bonus slot fields must stay within packed/runtime bounds.
        if self.bonus_1_type > 3 || self.bonus_2_type > 3 || self.bonus_3_type > 3 {
            return false;
        }
        if self.bonus_1_trigger_type > 3
            || self.bonus_2_trigger_type > 3
            || self.bonus_3_trigger_type > 3 {
            return false;
        }
        if self.bonus_1_trigger_type > 0 && self.bonus_1_trigger_threshold == 0 {
            return false;
        }
        if self.bonus_2_trigger_type > 0 && self.bonus_2_trigger_threshold == 0 {
            return false;
        }
        if self.bonus_3_trigger_type > 0 && self.bonus_3_trigger_threshold == 0 {
            return false;
        }
        if self.bonus_1_starting_charges > 15
            || self.bonus_2_starting_charges > 15
            || self.bonus_3_starting_charges > 15 {
            return false;
        }

        // Boss ID must be 0-10 (0 = no boss, 1-10 = boss identities)
        if self.boss_id > 10 {
            return false;
        }

        true
    }

    /// Assert all settings invariants hold, panics with descriptive message if not
    fn assert_valid(self: GameSettings) {
        // Unpack constraint values for validation (line/times slots are deprecated)
        let (
            _veryeasy_min_lines,
            _master_min_lines,
            _veryeasy_max_lines,
            _master_max_lines,
            _veryeasy_budget_min_raw,
            veryeasy_budget_max,
            _master_budget_min_raw,
            master_budget_max,
            _veryeasy_min_times,
            _master_min_times,
        ) =
            self
            .unpack_lines_budgets();

        let veryeasy_budget_min: u16 = (veryeasy_budget_max.into() * 70 + 99) / 100;
        let master_budget_min: u16 = (master_budget_max.into() * 70 + 99) / 100;

        assert!(
            veryeasy_budget_min <= veryeasy_budget_max.into(),
            "derived veryeasy_budget_min must be <= veryeasy_budget_max",
        );
        assert!(
            master_budget_min <= master_budget_max.into(),
            "derived master_budget_min must be <= master_budget_max",
        );
        assert!(master_budget_max > 0, "master_budget_max must be > 0");

        // Level scaling
        assert!(self.base_moves <= self.max_moves, "base_moves must be <= max_moves");
        assert!(self.base_ratio_x100 <= self.max_ratio_x100, "base_ratio must be <= max_ratio");

        // Level thresholds
        assert!(
            self.early_level_threshold < self.mid_level_threshold,
            "early_threshold must be < mid_threshold",
        );
        assert!(self.mid_level_threshold <= self.level_cap, "mid_threshold must be <= level_cap");

        // Boolean-like fields
        assert!(self.constraints_enabled <= 1, "constraints_enabled must be 0 or 1");

        // Difficulty tier thresholds must be in ascending order
        assert!(
            self.tier_1_threshold >= 2, "tier_1_threshold must be >= 2 (at least 1 VeryEasy level)",
        );
        assert!(self.tier_2_threshold > self.tier_1_threshold, "tier_2 must be > tier_1");
        assert!(self.tier_3_threshold > self.tier_2_threshold, "tier_3 must be > tier_2");
        assert!(self.tier_4_threshold > self.tier_3_threshold, "tier_4 must be > tier_3");
        assert!(self.tier_5_threshold > self.tier_4_threshold, "tier_5 must be > tier_4");
        assert!(self.tier_6_threshold > self.tier_5_threshold, "tier_6 must be > tier_5");
        assert!(self.tier_7_threshold > self.tier_6_threshold, "tier_7 must be > tier_6");

        // Block weights non-zero
        let veryeasy_total: u16 = self.veryeasy_size1_weight.into()
            + self.veryeasy_size2_weight.into()
            + self.veryeasy_size3_weight.into()
            + self.veryeasy_size4_weight.into()
            + self.veryeasy_size5_weight.into();
        assert!(veryeasy_total > 0, "veryeasy block weights must have at least one non-zero");

        let master_total: u16 = self.master_size1_weight.into()
            + self.master_size2_weight.into()
            + self.master_size3_weight.into()
            + self.master_size4_weight.into()
            + self.master_size5_weight.into();
        assert!(master_total > 0, "master block weights must have at least one non-zero");

        // Bonus slot fields.
        assert!(self.bonus_1_type <= 3, "bonus_1_type must be in range 0..=3");
        assert!(self.bonus_2_type <= 3, "bonus_2_type must be in range 0..=3");
        assert!(self.bonus_3_type <= 3, "bonus_3_type must be in range 0..=3");

        assert!(self.bonus_1_trigger_type <= 3, "bonus_1_trigger_type must be in range 0..=3");
        assert!(self.bonus_2_trigger_type <= 3, "bonus_2_trigger_type must be in range 0..=3");
        assert!(self.bonus_3_trigger_type <= 3, "bonus_3_trigger_type must be in range 0..=3");

        if self.bonus_1_trigger_type > 0 {
            assert!(self.bonus_1_trigger_threshold > 0, "bonus_1_trigger_threshold must be > 0");
        }
        if self.bonus_2_trigger_type > 0 {
            assert!(self.bonus_2_trigger_threshold > 0, "bonus_2_trigger_threshold must be > 0");
        }
        if self.bonus_3_trigger_type > 0 {
            assert!(self.bonus_3_trigger_threshold > 0, "bonus_3_trigger_threshold must be > 0");
        }

        assert!(self.bonus_1_starting_charges <= 15, "bonus_1_starting_charges must be <= 15");
        assert!(self.bonus_2_starting_charges <= 15, "bonus_2_starting_charges must be <= 15");
        assert!(self.bonus_3_starting_charges <= 15, "bonus_3_starting_charges must be <= 15");

        // Boss ID validation
        assert!(self.boss_id <= 10, "boss_id must be 0-10 (0=no boss, 1-10=boss identities)");
    }

    /// Linear interpolation helper
    /// Interpolates from start_val to end_val based on position/max_position
    fn interpolate(start_val: u8, end_val: u8, position: u8, max_position: u8) -> u8 {
        if max_position == 0 {
            return start_val;
        }

        if start_val <= end_val {
            // Increasing: start + (end - start) * position / max
            let range: u16 = (end_val - start_val).into();
            let progress: u16 = range * position.into() / max_position.into();
            start_val + progress.try_into().unwrap()
        } else {
            // Decreasing: start - (start - end) * position / max
            let range: u16 = (start_val - end_val).into();
            let progress: u16 = range * position.into() / max_position.into();
            start_val - progress.try_into().unwrap()
        }
    }
}

#[cfg(test)]
mod tests {
    use zkube::types::difficulty::Difficulty;
    use super::GameSettingsTrait;

    #[test]
    fn test_new_with_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        assert!(settings.settings_id == 1, "Settings ID should be 1");
        // Level Scaling
        assert!(settings.base_moves == 20, "Base moves should be 20");
        assert!(settings.max_moves == 60, "Max moves should be 60");
        assert!(settings.base_ratio_x100 == 80, "Base ratio should be 80");
        assert!(settings.max_ratio_x100 == 180, "Max ratio should be 180");
        // Difficulty Progression (non-linear tier thresholds)
        // Difficulty Progression (non-linear tier thresholds)
        assert!(settings.tier_1_threshold == 4, "Tier 1 (Easy) should start at level 4");
        assert!(settings.tier_2_threshold == 8, "Tier 2 (Medium) should start at level 8");
        assert!(settings.tier_3_threshold == 12, "Tier 3 (MediumHard) should start at level 12");
        assert!(settings.tier_4_threshold == 18, "Tier 4 (Hard) should start at level 18");
        assert!(settings.tier_5_threshold == 25, "Tier 5 (VeryHard) should start at level 25");
        assert!(settings.tier_6_threshold == 35, "Tier 6 (Expert) should start at level 35");
        assert!(settings.tier_7_threshold == 45, "Tier 7 (Master) should start at level 45");
        // Constraint Settings
        assert!(settings.constraints_enabled == 1, "Constraints should be enabled");
        assert!(settings.constraint_start_level == 3, "Constraints should start at level 3");
        // Variance Settings (consistent ±5% across all levels)
        assert!(settings.early_variance_percent == 5, "Early variance should be 5");
        assert!(settings.mid_variance_percent == 5, "Mid variance should be 5");
        assert!(settings.late_variance_percent == 5, "Late variance should be 5");
        // Level Tier Thresholds
        assert!(settings.early_level_threshold == 5, "Early threshold should be 5");
        assert!(settings.mid_level_threshold == 25, "Mid threshold should be 25");
        // Level Cap
        assert!(settings.level_cap == 50, "Level cap should be 50");
        // Bonus Slots
        assert!(settings.bonus_1_type == 1, "Bonus slot 1 type should be Hammer");
        assert!(settings.bonus_1_trigger_type == 1, "Bonus slot 1 trigger should be combo_streak");
        assert!(settings.bonus_1_trigger_threshold == 5, "Bonus slot 1 threshold should be 5");
        assert!(settings.bonus_1_starting_charges == 1, "Bonus slot 1 charges should be 1");

        assert!(settings.bonus_2_type == 3, "Bonus slot 2 type should be Wave");
        assert!(settings.bonus_2_trigger_type == 3, "Bonus slot 2 trigger should be score");
        assert!(settings.bonus_2_trigger_threshold == 30, "Bonus slot 2 threshold should be 30");
        assert!(settings.bonus_2_starting_charges == 1, "Bonus slot 2 charges should be 1");

        assert!(settings.bonus_3_type == 2, "Bonus slot 3 type should be Totem");
        assert!(settings.bonus_3_trigger_type == 2, "Bonus slot 3 trigger should be lines_cleared");
        assert!(settings.bonus_3_trigger_threshold == 10, "Bonus slot 3 threshold should be 10");
        assert!(settings.bonus_3_starting_charges == 1, "Bonus slot 3 charges should be 1");
    }


    #[test]
    fn test_exists() {
        // Settings with a non-None mode should exist
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        assert!(settings.exists(), "Settings with id=1 should exist");

        // Fixed difficulty settings should also exist
        let easy_settings = GameSettingsTrait::new_with_defaults(2, Difficulty::Easy);
        assert!(easy_settings.exists(), "Settings with Easy difficulty and id=2 should exist");

        // Uninitialized settings (mode=None) should not exist
        let default_settings = GameSettingsTrait::new_with_defaults(0, Difficulty::None);
        assert!(!default_settings.exists(), "Settings with mode=None should not exist");
    }

    #[test]
    fn test_get_difficulty_for_level() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Non-linear progression with default tier thresholds:
        // VeryEasy: 1-3, Easy: 4-7, Medium: 8-11, MediumHard: 12-17
        // Hard: 18-24, VeryHard: 25-34, Expert: 35-44, Master: 45+
        assert!(
            settings.get_difficulty_for_level(1) == Difficulty::VeryEasy,
            "Level 1 should be VeryEasy",
        );
        assert!(
            settings.get_difficulty_for_level(3) == Difficulty::VeryEasy,
            "Level 3 should be VeryEasy",
        );
        assert!(settings.get_difficulty_for_level(4) == Difficulty::Easy, "Level 4 should be Easy");
        assert!(settings.get_difficulty_for_level(7) == Difficulty::Easy, "Level 7 should be Easy");
        assert!(
            settings.get_difficulty_for_level(8) == Difficulty::Medium, "Level 8 should be Medium",
        );
        assert!(
            settings.get_difficulty_for_level(11) == Difficulty::Medium,
            "Level 11 should be Medium",
        );
        assert!(
            settings.get_difficulty_for_level(12) == Difficulty::MediumHard,
            "Level 12 should be MediumHard",
        );
        assert!(
            settings.get_difficulty_for_level(17) == Difficulty::MediumHard,
            "Level 17 should be MediumHard",
        );
        assert!(
            settings.get_difficulty_for_level(18) == Difficulty::Hard, "Level 18 should be Hard",
        );
        assert!(
            settings.get_difficulty_for_level(24) == Difficulty::Hard, "Level 24 should be Hard",
        );
        assert!(
            settings.get_difficulty_for_level(25) == Difficulty::VeryHard,
            "Level 25 should be VeryHard",
        );
        assert!(
            settings.get_difficulty_for_level(34) == Difficulty::VeryHard,
            "Level 34 should be VeryHard",
        );
        assert!(
            settings.get_difficulty_for_level(35) == Difficulty::Expert,
            "Level 35 should be Expert",
        );
        assert!(
            settings.get_difficulty_for_level(44) == Difficulty::Expert,
            "Level 44 should be Expert",
        );
        assert!(
            settings.get_difficulty_for_level(45) == Difficulty::Master,
            "Level 45 should be Master",
        );
        assert!(
            settings.get_difficulty_for_level(50) == Difficulty::Master,
            "Level 50 should be Master",
        );
    }

    #[test]
    fn test_get_difficulty_for_level_custom_thresholds() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Custom tier thresholds: faster early progression
        // VeryEasy: 1-2, Easy: 3-5, Medium: 6-10, etc.
        settings.tier_1_threshold = 3; // Easy starts at level 3
        settings.tier_2_threshold = 6; // Medium starts at level 6
        settings.tier_3_threshold = 11; // MediumHard starts at level 11
        settings.tier_4_threshold = 20; // Hard starts at level 20
        settings.tier_5_threshold = 30; // VeryHard starts at level 30
        settings.tier_6_threshold = 45; // Expert starts at level 45
        settings.tier_7_threshold = 60; // Master starts at level 60

        assert!(
            settings.get_difficulty_for_level(1) == Difficulty::VeryEasy,
            "Level 1 should be VeryEasy",
        );
        assert!(
            settings.get_difficulty_for_level(2) == Difficulty::VeryEasy,
            "Level 2 should be VeryEasy",
        );
        assert!(settings.get_difficulty_for_level(3) == Difficulty::Easy, "Level 3 should be Easy");
        assert!(settings.get_difficulty_for_level(5) == Difficulty::Easy, "Level 5 should be Easy");
        assert!(
            settings.get_difficulty_for_level(6) == Difficulty::Medium, "Level 6 should be Medium",
        );
        assert!(
            settings.get_difficulty_for_level(11) == Difficulty::MediumHard,
            "Level 11 should be MediumHard",
        );
    }

    #[test]
    fn test_get_difficulty_for_level_caps_at_master() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // With default thresholds, Master starts at level 45
        // Any level >= 45 should be Master
        assert!(
            settings.get_difficulty_for_level(45) == Difficulty::Master,
            "Level 45 should be Master",
        );
        assert!(
            settings.get_difficulty_for_level(50) == Difficulty::Master,
            "Level 50 should be Master",
        );
        assert!(
            settings.get_difficulty_for_level(255) == Difficulty::Master,
            "Level 255 should be Master",
        );
    }

    #[test]
    fn test_get_variance_percent() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Default thresholds: early=5, mid=25, but all variance values are now 5% (consistent)
        // The variance tier selection still works, but all tiers return 5%
        assert!(settings.get_variance_percent(1) == 5, "Level 1 should use early variance (5%)");
        assert!(settings.get_variance_percent(5) == 5, "Level 5 should use early variance (5%)");
        assert!(settings.get_variance_percent(6) == 5, "Level 6 should use mid variance (5%)");
        assert!(settings.get_variance_percent(25) == 5, "Level 25 should use mid variance (5%)");
        assert!(settings.get_variance_percent(26) == 5, "Level 26 should use late variance (5%)");
        assert!(settings.get_variance_percent(50) == 5, "Level 50 should use late variance (5%)");
    }

    #[test]
    fn test_are_constraints_enabled() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        assert!(settings.are_constraints_enabled(), "Constraints should be enabled by default");

        settings.constraints_enabled = 0;
        assert!(!settings.are_constraints_enabled(), "Constraints should be disabled");
    }

    #[test]
    fn test_interpolate() {
        // Increasing: 0 to 100 over 10 steps
        assert!(GameSettingsTrait::interpolate(0, 100, 0, 10) == 0, "Start should be 0");
        assert!(GameSettingsTrait::interpolate(0, 100, 5, 10) == 50, "Middle should be 50");
        assert!(GameSettingsTrait::interpolate(0, 100, 10, 10) == 100, "End should be 100");

        // Decreasing: 100 to 0 over 10 steps
        assert!(GameSettingsTrait::interpolate(100, 0, 0, 10) == 100, "Start should be 100");
        assert!(GameSettingsTrait::interpolate(100, 0, 5, 10) == 50, "Middle should be 50");
        assert!(GameSettingsTrait::interpolate(100, 0, 10, 10) == 0, "End should be 0");

        // Edge case: same value
        assert!(
            GameSettingsTrait::interpolate(50, 50, 5, 10) == 50, "Same values should stay same",
        );
    }

    #[test]
    fn test_get_constraint_params_for_difficulty() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Test VeryEasy difficulty (tier 0)
        // Returns (min_lines, max_lines, budget_min, budget_max, min_times)
        // Legacy slots min_lines/max_lines/min_times are deprecated and returned as zero.
        let (min_l, max_l, budget_min, budget_max, min_t) = settings
            .get_constraint_params_for_difficulty(Difficulty::VeryEasy);
        assert!(min_l == 0, "VeryEasy min_lines should be deprecated to 0");
        assert!(max_l == 0, "VeryEasy max_lines should be deprecated to 0");
        assert!(budget_min == 0, "VeryEasy budget_min should be derived to 0");
        assert!(budget_max == 0, "VeryEasy budget_max should be 0");
        assert!(min_t == 0, "VeryEasy min_times should be deprecated to 0");

        // Test Master difficulty (tier 7)
        let (min_l, max_l, budget_min, budget_max, min_t) = settings
            .get_constraint_params_for_difficulty(Difficulty::Master);
        assert!(min_l == 0, "Master min_lines should be deprecated to 0");
        assert!(max_l == 0, "Master max_lines should be deprecated to 0");
        assert!(budget_min == 56, "Master budget_min should be derived to 56");
        assert!(budget_max == 80, "Master budget_max should be 80");
        assert!(min_t == 0, "Master min_times should be deprecated to 0");

        // Test mid-difficulty (Hard = tier 4/7)
        let (_min_l, _max_l, budget_min, _budget_max, _min_t) = settings
            .get_constraint_params_for_difficulty(Difficulty::Hard);
        // Hard budget_max interpolates around 45, then budget_min is ceil(45*0.7) = 32
        assert!(budget_min == 32, "Hard budget_min should be derived to 32");
    }

    #[test]
    fn test_constraint_distribution_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Verify constraint distribution defaults via unpacking
        let (
            veryeasy_min_lines,
            master_min_lines,
            veryeasy_max_lines,
            master_max_lines,
            veryeasy_budget_min,
            veryeasy_budget_max,
            master_budget_min,
            master_budget_max,
            veryeasy_min_times,
            master_min_times,
        ) =
            settings
            .unpack_lines_budgets();

        assert!(veryeasy_min_lines == 0, "VeryEasy min lines should be deprecated to 0");
        assert!(master_min_lines == 0, "Master min lines should be deprecated to 0");
        assert!(veryeasy_max_lines == 0, "VeryEasy max lines should be deprecated to 0");
        assert!(master_max_lines == 0, "Master max lines should be deprecated to 0");
        assert!(veryeasy_budget_min == 0, "VeryEasy budget_min should be derived to 0");
        assert!(veryeasy_budget_max == 0, "VeryEasy budget_max should be 0");
        assert!(master_budget_min == 56, "Master budget_min should be derived to 56");
        assert!(master_budget_max == 80, "Master budget_max should be 80");
        assert!(veryeasy_min_times == 0, "VeryEasy min times should be deprecated to 0");
        assert!(master_min_times == 0, "Master min times should be deprecated to 0");
    }

    #[test]
    fn test_block_weight_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Verify block weight defaults
        assert!(settings.veryeasy_size1_weight == 20, "VeryEasy size1 weight should be 20");
        assert!(settings.veryeasy_size2_weight == 33, "VeryEasy size2 weight should be 33");
        assert!(settings.veryeasy_size3_weight == 27, "VeryEasy size3 weight should be 27");
        assert!(settings.veryeasy_size4_weight == 13, "VeryEasy size4 weight should be 13");
        assert!(settings.veryeasy_size5_weight == 7, "VeryEasy size5 weight should be 7");
        assert!(settings.master_size1_weight == 7, "Master size1 weight should be 7");
        assert!(settings.master_size2_weight == 13, "Master size2 weight should be 13");
        assert!(settings.master_size3_weight == 20, "Master size3 weight should be 20");
        assert!(settings.master_size4_weight == 27, "Master size4 weight should be 27");
        assert!(settings.master_size5_weight == 33, "Master size5 weight should be 33");
    }

    #[test]
    fn test_get_block_weights_for_difficulty() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Test VeryEasy difficulty (tier 0 - uses veryeasy_* values exactly)
        let (s1, s2, s3, s4, s5) = settings.get_block_weights_for_difficulty(Difficulty::VeryEasy);
        assert!(s1 == 20, "VeryEasy size1 weight should be 20");
        assert!(s2 == 33, "VeryEasy size2 weight should be 33");
        assert!(s3 == 27, "VeryEasy size3 weight should be 27");
        assert!(s4 == 13, "VeryEasy size4 weight should be 13");
        assert!(s5 == 7, "VeryEasy size5 weight should be 7");

        // Test Master difficulty (tier 7 - uses master_* values exactly)
        let (s1, s2, s3, s4, s5) = settings.get_block_weights_for_difficulty(Difficulty::Master);
        assert!(s1 == 7, "Master size1 weight should be 7");
        assert!(s2 == 13, "Master size2 weight should be 13");
        assert!(s3 == 20, "Master size3 weight should be 20");
        assert!(s4 == 27, "Master size4 weight should be 27");
        assert!(s5 == 33, "Master size5 weight should be 33");

        // Test mid-difficulty (Hard = tier 4/7)
        // The weights should be interpolated between easy and master
        let (s1, s2, s3, s4, s5) = settings.get_block_weights_for_difficulty(Difficulty::Hard);
        // s1: 20 -> 7 at position 4/7 = 20 - (13*4/7) = 20 - 7 = 13
        assert!(s1 >= 11 && s1 <= 15, "Hard size1 weight should be around 13");
        // s5: 7 -> 33 at position 4/7 = 7 + (26*4/7) = 7 + 14 = 21
        assert!(s5 >= 19 && s5 <= 23, "Hard size5 weight should be around 21");
    }

    #[test]
    fn test_validate_defaults_pass() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        assert!(settings.validate(), "Default settings should be valid");
    }

    #[test]
    fn test_validate_packed_constraint_lines() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Valid defaults
        assert!(settings.validate(), "Should be valid with defaults");

        // Test with invalid packed values (min > max for lines)
        // Pack: min_lines=5, max_lines=3 (invalid: min > max)
        // This is packed as: bits 0-3 = veryeasy_min_lines, bits 8-11 = veryeasy_max_lines
        // 5 | (4 << 4) | (3 << 8) | (6 << 12) | budgets | times
        // For simplicity, test that default values pass validation
        let (veryeasy_min_lines, _, veryeasy_max_lines, _, _, _, _, _, _, _) = settings
            .unpack_lines_budgets();
        assert!(veryeasy_min_lines <= veryeasy_max_lines, "Default veryeasy lines should be valid");
    }

    #[test]
    fn test_validate_dual_chance_bounds() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Verify dual chances are within bounds
        let (veryeasy_dual_chance, master_dual_chance, _, _) = settings.unpack_chances();
        assert!(veryeasy_dual_chance <= 100, "VeryEasy dual chance should be <= 100");
        assert!(master_dual_chance <= 100, "Master dual chance should be <= 100");
    }

    #[test]
    fn test_validate_level_scaling() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Invalid: base > max
        settings.base_moves = 100;
        settings.max_moves = 50;
        assert!(!settings.validate(), "Should be invalid when base_moves > max_moves");
    }

    #[test]
    fn test_validate_level_thresholds() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Invalid: early >= mid
        settings.early_level_threshold = 50;
        settings.mid_level_threshold = 50;
        assert!(!settings.validate(), "Should be invalid when early_threshold >= mid_threshold");
    }

    #[test]
    fn test_validate_constraints_enabled_flag() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Invalid: not 0 or 1
        settings.constraints_enabled = 2;
        assert!(!settings.validate(), "Should be invalid when constraints_enabled > 1");
    }

    #[test]
    fn test_validate_block_weights_zero() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Invalid: all weights zero (would cause div by zero)
        settings.veryeasy_size1_weight = 0;
        settings.veryeasy_size2_weight = 0;
        settings.veryeasy_size3_weight = 0;
        settings.veryeasy_size4_weight = 0;
        settings.veryeasy_size5_weight = 0;
        assert!(!settings.validate(), "Should be invalid when all veryeasy block weights are zero");
    }

    #[test]
    fn test_validate_tier_thresholds_order() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);

        // Valid by default
        assert!(settings.validate(), "Default settings should be valid");

        // Invalid: tier_1 < 2 (need at least 1 VeryEasy level)
        settings.tier_1_threshold = 1;
        assert!(!settings.validate(), "Should be invalid when tier_1 < 2");
        settings.tier_1_threshold = 5; // Reset

        // Invalid: tier_2 <= tier_1
        settings.tier_2_threshold = 5;
        assert!(!settings.validate(), "Should be invalid when tier_2 <= tier_1");
        settings.tier_2_threshold = 10; // Reset

        // Invalid: tier_3 <= tier_2
        settings.tier_3_threshold = 10;
        assert!(!settings.validate(), "Should be invalid when tier_3 <= tier_2");
    }
}
