use zkube::types::difficulty::Difficulty;
use starknet::ContractAddress;

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettingsMetadata {
    #[key]
    pub settings_id: u32,
    pub name: felt252,
    pub description: ByteArray,
    pub created_by: ContractAddress,
    pub created_at: u64,
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
    pub base_moves: u16,        // Moves at level 1 (default: 20)
    pub max_moves: u16,         // Moves at level 100 (default: 60)
    pub base_ratio_x100: u16,   // Points/move ratio at level 1 * 100 (default: 80 = 0.80)
    pub max_ratio_x100: u16,    // Points/move ratio at level 100 * 100 (default: 250 = 2.50)
    
    // === Cube Thresholds ===
    pub cube_3_percent: u8,     // 3 cubes if moves <= X% of max (default: 40)
    pub cube_2_percent: u8,     // 2 cubes if moves <= X% of max (default: 70)
    
    // === Consumable Costs ===
    pub hammer_cost: u8,        // Cost in cubes (default: 5)
    pub wave_cost: u8,          // Cost in cubes (default: 5)
    pub totem_cost: u8,         // Cost in cubes (default: 5)
    pub extra_moves_cost: u8,   // Cost in cubes (default: 10)
    
    // === Reward Multiplier ===
    pub cube_multiplier_x100: u16, // Cube reward multiplier * 100 (default: 100 = 1.0x)
    
    // === Difficulty Progression ===
    pub starting_difficulty: u8,     // Which difficulty to start with (0-7, default: 0 = Easy)
    pub difficulty_step_levels: u8,  // Levels per difficulty tier (default: 15)
    
    // === Constraint Settings ===
    pub constraints_enabled: u8,     // 1=enabled, 0=disabled (default: 1)
    pub constraint_start_level: u8,  // Level when constraints begin (default: 5)
    
    // === Constraint Distribution (scales from VeryEasy to Master, tiers 0-7) ===
    // Probability settings (0-100, interpolated by difficulty tier)
    // "easy_*" = value at tier 0 (VeryEasy), "master_*" = value at tier 7 (Master)
    pub easy_none_chance: u8,        // % chance of no constraint at VeryEasy (default: 30)
    pub master_none_chance: u8,      // % chance of no constraint at Master (default: 0)
    pub easy_no_bonus_chance: u8,    // % chance of NoBonusUsed at VeryEasy (default: 0)
    pub master_no_bonus_chance: u8,  // % chance of NoBonusUsed at Master (default: 25)
    // ClearLines parameters (min/max lines and times, interpolated by difficulty)
    pub easy_min_lines: u8,          // Min lines to clear at Easy (default: 2)
    pub master_min_lines: u8,        // Min lines to clear at Master (default: 5)
    pub easy_max_lines: u8,          // Max lines to clear at Easy (default: 3)
    pub master_max_lines: u8,        // Max lines to clear at Master (default: 7)
    pub easy_min_times: u8,          // Min times required at Easy (default: 1)
    pub master_min_times: u8,        // Min times required at Master (default: 4)
    pub easy_max_times: u8,          // Max times required at Easy (default: 2)
    pub master_max_times: u8,        // Max times required at Master (default: 10)
    // Dual constraint chance (interpolated by difficulty)
    pub easy_dual_chance: u8,        // % chance of dual constraint at Easy (default: 0)
    pub master_dual_chance: u8,      // % chance of dual constraint at Master (default: 50)
    
    // === Block Distribution (scales from VeryEasy to Master, tiers 0-7) ===
    // Weights for each block size (interpolated by difficulty tier)
    // Weights are relative - they get normalized to sum to 100%
    // "easy_*" = value at tier 0 (VeryEasy), "master_*" = value at tier 7 (Master)
    // size1=1-wide, size2=2-wide, size3=3-wide, size4=4-wide, size5=5-wide
    pub easy_size1_weight: u8,    // Weight for 1-wide blocks at VeryEasy (default: 20)
    pub easy_size2_weight: u8,    // Weight for 2-wide blocks at VeryEasy (default: 33)
    pub easy_size3_weight: u8,    // Weight for 3-wide blocks at VeryEasy (default: 27)
    pub easy_size4_weight: u8,    // Weight for 4-wide blocks at VeryEasy (default: 13)
    pub easy_size5_weight: u8,    // Weight for 5-wide blocks at VeryEasy (default: 7)
    pub master_size1_weight: u8,  // Weight for 1-wide blocks at Master (default: 7)
    pub master_size2_weight: u8,  // Weight for 2-wide blocks at Master (default: 13)
    pub master_size3_weight: u8,  // Weight for 3-wide blocks at Master (default: 20)
    pub master_size4_weight: u8,  // Weight for 4-wide blocks at Master (default: 27)
    pub master_size5_weight: u8,  // Weight for 5-wide blocks at Master (default: 33)
    
    // === Variance Settings ===
    pub early_variance_percent: u8,  // Variance % for early levels (default: 5)
    pub mid_variance_percent: u8,    // Variance % for mid levels (default: 10)
    pub late_variance_percent: u8,   // Variance % for late levels (default: 15)
    
    // === Level Tier Thresholds ===
    pub early_level_threshold: u8,   // End of "early" levels (default: 10)
    pub mid_level_threshold: u8,     // End of "mid" levels (default: 50)
    
    // === Level Cap ===
    pub level_cap: u8,               // Max level for scaling (default: 100)
}

/// Default values for GameSettings
pub mod GameSettingsDefaults {
    // Level Scaling
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;
    pub const BASE_RATIO_X100: u16 = 80;   // 0.80
    pub const MAX_RATIO_X100: u16 = 250;   // 2.50
    
    // Cube Thresholds
    pub const CUBE_3_PERCENT: u8 = 40;
    pub const CUBE_2_PERCENT: u8 = 70;
    
    // Consumable Costs
    pub const HAMMER_COST: u8 = 5;
    pub const WAVE_COST: u8 = 5;
    pub const TOTEM_COST: u8 = 5;
    pub const EXTRA_MOVES_COST: u8 = 10;
    
    // Reward Multiplier
    pub const CUBE_MULTIPLIER_X100: u16 = 100; // 1.0x
    
    // Difficulty Progression
    pub const STARTING_DIFFICULTY: u8 = 0;     // Easy
    pub const DIFFICULTY_STEP_LEVELS: u8 = 15; // 15 levels per tier
    
    // Constraint Settings
    pub const CONSTRAINTS_ENABLED: u8 = 1;     // Enabled
    pub const CONSTRAINT_START_LEVEL: u8 = 5;  // Constraints start at level 5
    
    // Constraint Distribution (Easy to Master scaling)
    pub const EASY_NONE_CHANCE: u8 = 30;       // 30% no constraint at Easy
    pub const MASTER_NONE_CHANCE: u8 = 0;      // 0% no constraint at Master
    pub const EASY_NO_BONUS_CHANCE: u8 = 0;    // 0% NoBonusUsed at Easy
    pub const MASTER_NO_BONUS_CHANCE: u8 = 25; // 25% NoBonusUsed at Master
    pub const EASY_MIN_LINES: u8 = 2;          // Clear 2+ lines at Easy
    pub const MASTER_MIN_LINES: u8 = 5;        // Clear 5+ lines at Master
    pub const EASY_MAX_LINES: u8 = 3;          // Up to 3 lines at Easy
    pub const MASTER_MAX_LINES: u8 = 7;        // Up to 7 lines at Master
    pub const EASY_MIN_TIMES: u8 = 1;          // 1 time min at Easy
    pub const MASTER_MIN_TIMES: u8 = 4;        // 4 times min at Master
    pub const EASY_MAX_TIMES: u8 = 2;          // 2 times max at Easy
    pub const MASTER_MAX_TIMES: u8 = 10;       // 10 times max at Master
    pub const EASY_DUAL_CHANCE: u8 = 0;        // 0% dual constraint at Easy
    pub const MASTER_DUAL_CHANCE: u8 = 50;     // 50% dual constraint at Master
    
    // Block Distribution (VeryEasy to Master scaling)
    // Size = block width (1-5). Easy favors smaller blocks, Master favors larger.
    pub const EASY_SIZE1_WEIGHT: u8 = 20;    // 1-wide blocks at VeryEasy
    pub const EASY_SIZE2_WEIGHT: u8 = 33;    // 2-wide blocks at VeryEasy
    pub const EASY_SIZE3_WEIGHT: u8 = 27;    // 3-wide blocks at VeryEasy
    pub const EASY_SIZE4_WEIGHT: u8 = 13;    // 4-wide blocks at VeryEasy
    pub const EASY_SIZE5_WEIGHT: u8 = 7;     // 5-wide blocks at VeryEasy
    pub const MASTER_SIZE1_WEIGHT: u8 = 7;   // 1-wide blocks at Master
    pub const MASTER_SIZE2_WEIGHT: u8 = 13;  // 2-wide blocks at Master
    pub const MASTER_SIZE3_WEIGHT: u8 = 20;  // 3-wide blocks at Master
    pub const MASTER_SIZE4_WEIGHT: u8 = 27;  // 4-wide blocks at Master
    pub const MASTER_SIZE5_WEIGHT: u8 = 33;  // 5-wide blocks at Master
    
    // Variance Settings
    pub const EARLY_VARIANCE_PERCENT: u8 = 5;  // ±5% for early levels
    pub const MID_VARIANCE_PERCENT: u8 = 10;   // ±10% for mid levels
    pub const LATE_VARIANCE_PERCENT: u8 = 15;  // ±15% for late levels
    
    // Level Tier Thresholds
    pub const EARLY_LEVEL_THRESHOLD: u8 = 10;  // Levels 1-10 are "early"
    pub const MID_LEVEL_THRESHOLD: u8 = 50;    // Levels 11-50 are "mid"
    
    // Level Cap
    pub const LEVEL_CAP: u8 = 100;             // Max level for scaling
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
            // Cube Thresholds
            cube_3_percent: GameSettingsDefaults::CUBE_3_PERCENT,
            cube_2_percent: GameSettingsDefaults::CUBE_2_PERCENT,
            // Consumable Costs
            hammer_cost: GameSettingsDefaults::HAMMER_COST,
            wave_cost: GameSettingsDefaults::WAVE_COST,
            totem_cost: GameSettingsDefaults::TOTEM_COST,
            extra_moves_cost: GameSettingsDefaults::EXTRA_MOVES_COST,
            // Reward Multiplier
            cube_multiplier_x100: GameSettingsDefaults::CUBE_MULTIPLIER_X100,
            // Difficulty Progression
            starting_difficulty: GameSettingsDefaults::STARTING_DIFFICULTY,
            difficulty_step_levels: GameSettingsDefaults::DIFFICULTY_STEP_LEVELS,
            // Constraint Settings
            constraints_enabled: GameSettingsDefaults::CONSTRAINTS_ENABLED,
            constraint_start_level: GameSettingsDefaults::CONSTRAINT_START_LEVEL,
            // Constraint Distribution
            easy_none_chance: GameSettingsDefaults::EASY_NONE_CHANCE,
            master_none_chance: GameSettingsDefaults::MASTER_NONE_CHANCE,
            easy_no_bonus_chance: GameSettingsDefaults::EASY_NO_BONUS_CHANCE,
            master_no_bonus_chance: GameSettingsDefaults::MASTER_NO_BONUS_CHANCE,
            easy_min_lines: GameSettingsDefaults::EASY_MIN_LINES,
            master_min_lines: GameSettingsDefaults::MASTER_MIN_LINES,
            easy_max_lines: GameSettingsDefaults::EASY_MAX_LINES,
            master_max_lines: GameSettingsDefaults::MASTER_MAX_LINES,
            easy_min_times: GameSettingsDefaults::EASY_MIN_TIMES,
            master_min_times: GameSettingsDefaults::MASTER_MIN_TIMES,
            easy_max_times: GameSettingsDefaults::EASY_MAX_TIMES,
            master_max_times: GameSettingsDefaults::MASTER_MAX_TIMES,
            easy_dual_chance: GameSettingsDefaults::EASY_DUAL_CHANCE,
            master_dual_chance: GameSettingsDefaults::MASTER_DUAL_CHANCE,
            // Block Distribution
            easy_size1_weight: GameSettingsDefaults::EASY_SIZE1_WEIGHT,
            easy_size2_weight: GameSettingsDefaults::EASY_SIZE2_WEIGHT,
            easy_size3_weight: GameSettingsDefaults::EASY_SIZE3_WEIGHT,
            easy_size4_weight: GameSettingsDefaults::EASY_SIZE4_WEIGHT,
            easy_size5_weight: GameSettingsDefaults::EASY_SIZE5_WEIGHT,
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

        // Progressive mode: `starting_difficulty` is a tier offset starting at Easy.
        // tier 0 = Easy, 1 = Medium, 2 = MediumHard, 3 = Hard, 4 = VeryHard, 5 = Expert, 6 = Master.
        let start_tier: u8 = if self.starting_difficulty > 6 {
            6
        } else {
            self.starting_difficulty
        };

        if self.difficulty_step_levels == 0 {
            return (start_tier + 3).into();
        }

        // Calculate which tier we're in.
        let tier_increase: u8 = if level <= 1 {
            0
        } else {
            (level - 1) / self.difficulty_step_levels
        };

        let tier = start_tier + tier_increase;
        let tier_capped: u8 = if tier > 6 { 6 } else { tier };
        (tier_capped + 3).into()
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
            100 // Fallback to default if not set
        } else {
            self.level_cap
        }
    }
    
    /// Get consumable cost by type (0=Hammer, 1=Wave, 2=Totem, 3=ExtraMoves)
    fn get_consumable_cost(self: GameSettings, consumable_type: u8) -> u8 {
        match consumable_type {
            0 => self.hammer_cost,
            1 => self.wave_cost,
            2 => self.totem_cost,
            3 => self.extra_moves_cost,
            _ => 0,
        }
    }
    
    /// Apply cube multiplier to a cube amount
    /// Clamps result to u16::MAX (65535) to avoid overflow panics
    fn apply_cube_multiplier(self: GameSettings, cubes: u16) -> u16 {
        let result: u32 = cubes.into() * self.cube_multiplier_x100.into() / 100;
        // Clamp to u16::MAX instead of panicking on overflow
        if result > 65535 {
            65535_u16
        } else {
            result.try_into().unwrap()
        }
    }
    
    /// Get constraint parameters interpolated for a given difficulty
    /// Returns (none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times, dual_chance)
    fn get_constraint_params_for_difficulty(self: GameSettings, difficulty: Difficulty) -> (u8, u8, u8, u8, u8, u8, u8) {
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
        
        // Interpolate each parameter from easy (0) to master (7)
        let none_chance = Self::interpolate(self.easy_none_chance, self.master_none_chance, diff_value, 7);
        let no_bonus_chance = Self::interpolate(self.easy_no_bonus_chance, self.master_no_bonus_chance, diff_value, 7);
        let min_lines = Self::interpolate(self.easy_min_lines, self.master_min_lines, diff_value, 7);
        let max_lines = Self::interpolate(self.easy_max_lines, self.master_max_lines, diff_value, 7);
        let min_times = Self::interpolate(self.easy_min_times, self.master_min_times, diff_value, 7);
        let max_times = Self::interpolate(self.easy_max_times, self.master_max_times, diff_value, 7);
        let dual_chance = Self::interpolate(self.easy_dual_chance, self.master_dual_chance, diff_value, 7);
        
        (none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times, dual_chance)
    }
    
    /// Get block weights interpolated for a given difficulty
    /// Returns (size1_weight, size2_weight, size3_weight, size4_weight, size5_weight)
    /// Weights are relative and get normalized by the caller
    fn get_block_weights_for_difficulty(self: GameSettings, difficulty: Difficulty) -> (u8, u8, u8, u8, u8) {
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
        
        // Interpolate each weight from easy (0) to master (7)
        let size1_weight = Self::interpolate(self.easy_size1_weight, self.master_size1_weight, diff_value, 7);
        let size2_weight = Self::interpolate(self.easy_size2_weight, self.master_size2_weight, diff_value, 7);
        let size3_weight = Self::interpolate(self.easy_size3_weight, self.master_size3_weight, diff_value, 7);
        let size4_weight = Self::interpolate(self.easy_size4_weight, self.master_size4_weight, diff_value, 7);
        let size5_weight = Self::interpolate(self.easy_size5_weight, self.master_size5_weight, diff_value, 7);
        
        (size1_weight, size2_weight, size3_weight, size4_weight, size5_weight)
    }
    
    /// Validate all settings invariants
    /// Returns true if all invariants hold, false otherwise
    fn validate(self: GameSettings) -> bool {
        // Constraint probability invariants: none + no_bonus <= 100
        if self.easy_none_chance + self.easy_no_bonus_chance > 100 {
            return false;
        }
        if self.master_none_chance + self.master_no_bonus_chance > 100 {
            return false;
        }
        
        // Lines constraints: min <= max
        if self.easy_min_lines > self.easy_max_lines {
            return false;
        }
        if self.master_min_lines > self.master_max_lines {
            return false;
        }
        
        // Times constraints: min <= max  
        if self.easy_min_times > self.easy_max_times {
            return false;
        }
        if self.master_min_times > self.master_max_times {
            return false;
        }
        
        // Level scaling: base <= max
        if self.base_moves > self.max_moves {
            return false;
        }
        if self.base_ratio_x100 > self.max_ratio_x100 {
            return false;
        }
        
        // Cube thresholds: 3-star should be harder than 2-star (lower %)
        if self.cube_3_percent > self.cube_2_percent {
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
        
        // Difficulty progression: starting difficulty should be valid (0-7)
        if self.starting_difficulty > 7 {
            return false;
        }
        
        // Block weights: at least one weight must be non-zero (avoid div by zero)
        let easy_total = self.easy_size1_weight.into() 
            + self.easy_size2_weight.into() 
            + self.easy_size3_weight.into() 
            + self.easy_size4_weight.into() 
            + self.easy_size5_weight.into();
        if easy_total == 0_u16 {
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
        
        true
    }
    
    /// Assert all settings invariants hold, panics with descriptive message if not
    fn assert_valid(self: GameSettings) {
        // Constraint probability invariants
        assert!(
            self.easy_none_chance + self.easy_no_bonus_chance <= 100, 
            "easy_none_chance + easy_no_bonus_chance must be <= 100"
        );
        assert!(
            self.master_none_chance + self.master_no_bonus_chance <= 100, 
            "master_none_chance + master_no_bonus_chance must be <= 100"
        );
        
        // Lines constraints
        assert!(self.easy_min_lines <= self.easy_max_lines, "easy_min_lines must be <= easy_max_lines");
        assert!(self.master_min_lines <= self.master_max_lines, "master_min_lines must be <= master_max_lines");
        
        // Times constraints
        assert!(self.easy_min_times <= self.easy_max_times, "easy_min_times must be <= easy_max_times");
        assert!(self.master_min_times <= self.master_max_times, "master_min_times must be <= master_max_times");
        
        // Level scaling
        assert!(self.base_moves <= self.max_moves, "base_moves must be <= max_moves");
        assert!(self.base_ratio_x100 <= self.max_ratio_x100, "base_ratio must be <= max_ratio");
        
        // Cube thresholds
        assert!(self.cube_3_percent <= self.cube_2_percent, "cube_3_percent must be <= cube_2_percent");
        
        // Level thresholds
        assert!(self.early_level_threshold < self.mid_level_threshold, "early_threshold must be < mid_threshold");
        assert!(self.mid_level_threshold <= self.level_cap, "mid_threshold must be <= level_cap");
        
        // Boolean-like fields
        assert!(self.constraints_enabled <= 1, "constraints_enabled must be 0 or 1");
        
        // Difficulty bounds
        assert!(self.starting_difficulty <= 7, "starting_difficulty must be 0-7");
        
        // Block weights non-zero
        let easy_total: u16 = self.easy_size1_weight.into() 
            + self.easy_size2_weight.into() 
            + self.easy_size3_weight.into() 
            + self.easy_size4_weight.into() 
            + self.easy_size5_weight.into();
        assert!(easy_total > 0, "easy block weights must have at least one non-zero");
        
        let master_total: u16 = self.master_size1_weight.into() 
            + self.master_size2_weight.into() 
            + self.master_size3_weight.into() 
            + self.master_size4_weight.into() 
            + self.master_size5_weight.into();
        assert!(master_total > 0, "master block weights must have at least one non-zero");
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
    use super::{GameSettings, GameSettingsTrait, GameSettingsDefaults};
    use zkube::types::difficulty::Difficulty;
    
    #[test]
    fn test_new_with_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        assert!(settings.settings_id == 1, "Settings ID should be 1");
        // Level Scaling
        assert!(settings.base_moves == 20, "Base moves should be 20");
        assert!(settings.max_moves == 60, "Max moves should be 60");
        assert!(settings.base_ratio_x100 == 80, "Base ratio should be 80");
        assert!(settings.max_ratio_x100 == 250, "Max ratio should be 250");
        // Cube Thresholds
        assert!(settings.cube_3_percent == 40, "Cube 3 percent should be 40");
        assert!(settings.cube_2_percent == 70, "Cube 2 percent should be 70");
        // Consumable Costs
        assert!(settings.hammer_cost == 5, "Hammer cost should be 5");
        assert!(settings.wave_cost == 5, "Wave cost should be 5");
        assert!(settings.totem_cost == 5, "Totem cost should be 5");
        assert!(settings.extra_moves_cost == 10, "Extra moves cost should be 10");
        // Reward Multiplier
        assert!(settings.cube_multiplier_x100 == 100, "Multiplier should be 100");
        // Difficulty Progression
        assert!(settings.starting_difficulty == 0, "Starting difficulty should be 0 (Easy)");
        assert!(settings.difficulty_step_levels == 15, "Difficulty step should be 15");
        // Constraint Settings
        assert!(settings.constraints_enabled == 1, "Constraints should be enabled");
        assert!(settings.constraint_start_level == 5, "Constraints should start at level 5");
        // Variance Settings
        assert!(settings.early_variance_percent == 5, "Early variance should be 5");
        assert!(settings.mid_variance_percent == 10, "Mid variance should be 10");
        assert!(settings.late_variance_percent == 15, "Late variance should be 15");
        // Level Tier Thresholds
        assert!(settings.early_level_threshold == 10, "Early threshold should be 10");
        assert!(settings.mid_level_threshold == 50, "Mid threshold should be 50");
        // Level Cap
        assert!(settings.level_cap == 100, "Level cap should be 100");
    }
    
    #[test]
    fn test_get_consumable_cost() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        assert!(settings.get_consumable_cost(0) == 5, "Hammer should cost 5");
        assert!(settings.get_consumable_cost(1) == 5, "Wave should cost 5");
        assert!(settings.get_consumable_cost(2) == 5, "Totem should cost 5");
        assert!(settings.get_consumable_cost(3) == 10, "ExtraMoves should cost 10");
    }
    
    #[test]
    fn test_apply_cube_multiplier() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // 1.0x multiplier
        assert!(settings.apply_cube_multiplier(10) == 10, "10 * 1.0 = 10");
        
        // 2.0x multiplier
        settings.cube_multiplier_x100 = 200;
        assert!(settings.apply_cube_multiplier(10) == 20, "10 * 2.0 = 20");
        
        // 0.5x multiplier
        settings.cube_multiplier_x100 = 50;
        assert!(settings.apply_cube_multiplier(10) == 5, "10 * 0.5 = 5");
        
        // Test overflow clamping: 60000 * 2.0 = 120000 > 65535, should clamp
        settings.cube_multiplier_x100 = 200;
        assert!(settings.apply_cube_multiplier(60000) == 65535, "Should clamp to u16::MAX on overflow");
        
        // Test edge case: exactly at max
        settings.cube_multiplier_x100 = 100;
        assert!(settings.apply_cube_multiplier(65535) == 65535, "Max cubes with 1x should stay max");
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
        
        // Default: starting_difficulty=0 (Easy), step=15
        // Levels 1-15: Easy (0)
        // Levels 16-30: Medium (1)
        // etc.
        assert!(settings.get_difficulty_for_level(1) == Difficulty::Easy, "Level 1 should be Easy");
        assert!(settings.get_difficulty_for_level(15) == Difficulty::Easy, "Level 15 should be Easy");
        assert!(settings.get_difficulty_for_level(16) == Difficulty::Medium, "Level 16 should be Medium");
        assert!(settings.get_difficulty_for_level(30) == Difficulty::Medium, "Level 30 should be Medium");
        assert!(settings.get_difficulty_for_level(31) == Difficulty::MediumHard, "Level 31 should be MediumHard");
    }
    
    #[test]
    fn test_get_difficulty_for_level_custom() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Start at Medium (1), step every 10 levels
        settings.starting_difficulty = 1; // Medium
        settings.difficulty_step_levels = 10;
        
        assert!(settings.get_difficulty_for_level(1) == Difficulty::Medium, "Level 1 should be Medium");
        assert!(settings.get_difficulty_for_level(10) == Difficulty::Medium, "Level 10 should be Medium");
        assert!(settings.get_difficulty_for_level(11) == Difficulty::MediumHard, "Level 11 should be MediumHard");
        assert!(settings.get_difficulty_for_level(21) == Difficulty::Hard, "Level 21 should be Hard");
    }
    
    #[test]
    fn test_get_difficulty_for_level_caps_at_master() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Start at Hard (4), should cap at Master (7)
        settings.starting_difficulty = 4; // Hard
        settings.difficulty_step_levels = 5;
        
        // Hard -> VeryHard -> Expert -> Master -> Master (capped)
        assert!(settings.get_difficulty_for_level(100) == Difficulty::Master, "High level should cap at Master");
    }
    
    #[test]
    fn test_get_variance_percent() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Default thresholds: early=10, mid=50
        assert!(settings.get_variance_percent(1) == 5, "Level 1 should use early variance");
        assert!(settings.get_variance_percent(10) == 5, "Level 10 should use early variance");
        assert!(settings.get_variance_percent(11) == 10, "Level 11 should use mid variance");
        assert!(settings.get_variance_percent(50) == 10, "Level 50 should use mid variance");
        assert!(settings.get_variance_percent(51) == 15, "Level 51 should use late variance");
        assert!(settings.get_variance_percent(100) == 15, "Level 100 should use late variance");
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
        assert!(GameSettingsTrait::interpolate(50, 50, 5, 10) == 50, "Same values should stay same");
    }
    
    #[test]
    fn test_get_constraint_params_for_difficulty() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Test VeryEasy difficulty (tier 0 - uses easy_* values exactly)
        let (none, no_bonus, min_l, max_l, min_t, max_t, dual) = settings.get_constraint_params_for_difficulty(Difficulty::VeryEasy);
        assert!(none == 30, "VeryEasy none_chance should be 30");
        assert!(no_bonus == 0, "VeryEasy no_bonus_chance should be 0");
        assert!(min_l == 2, "VeryEasy min_lines should be 2");
        assert!(max_l == 3, "VeryEasy max_lines should be 3");
        assert!(min_t == 1, "VeryEasy min_times should be 1");
        assert!(max_t == 2, "VeryEasy max_times should be 2");
        assert!(dual == 0, "VeryEasy dual_chance should be 0");
        
        // Test Master difficulty (tier 7 - uses master_* values exactly)
        let (none, no_bonus, min_l, max_l, min_t, max_t, dual) = settings.get_constraint_params_for_difficulty(Difficulty::Master);
        assert!(none == 0, "Master none_chance should be 0");
        assert!(no_bonus == 25, "Master no_bonus_chance should be 25");
        assert!(min_l == 5, "Master min_lines should be 5");
        assert!(max_l == 7, "Master max_lines should be 7");
        assert!(min_t == 4, "Master min_times should be 4");
        assert!(max_t == 10, "Master max_times should be 10");
        assert!(dual == 50, "Master dual_chance should be 50");
        
        // Test mid-difficulty (Hard = tier 4/7)
        let (none, no_bonus, min_l, max_l, min_t, max_t, dual) = settings.get_constraint_params_for_difficulty(Difficulty::Hard);
        // none: 30 -> 0 at position 4/7 = 30 - (30*4/7) = 30 - 17 = 13
        assert!(none >= 10 && none <= 16, "Hard none_chance should be around 13");
        // dual: 0 -> 50 at position 4/7 = 0 + (50*4/7) = 28
        assert!(dual >= 25 && dual <= 31, "Hard dual_chance should be around 28");
    }
    
    #[test]
    fn test_constraint_distribution_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Verify constraint distribution defaults
        assert!(settings.easy_none_chance == 30, "Easy none chance should be 30");
        assert!(settings.master_none_chance == 0, "Master none chance should be 0");
        assert!(settings.easy_no_bonus_chance == 0, "Easy no bonus chance should be 0");
        assert!(settings.master_no_bonus_chance == 25, "Master no bonus chance should be 25");
        assert!(settings.easy_min_lines == 2, "Easy min lines should be 2");
        assert!(settings.master_min_lines == 5, "Master min lines should be 5");
        assert!(settings.easy_max_lines == 3, "Easy max lines should be 3");
        assert!(settings.master_max_lines == 7, "Master max lines should be 7");
        assert!(settings.easy_min_times == 1, "Easy min times should be 1");
        assert!(settings.master_min_times == 4, "Master min times should be 4");
        assert!(settings.easy_max_times == 2, "Easy max times should be 2");
        assert!(settings.master_max_times == 10, "Master max times should be 10");
        assert!(settings.easy_dual_chance == 0, "Easy dual chance should be 0");
        assert!(settings.master_dual_chance == 50, "Master dual chance should be 50");
    }
    
    #[test]
    fn test_block_weight_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Verify block weight defaults
        assert!(settings.easy_size1_weight == 20, "Easy size1 weight should be 20");
        assert!(settings.easy_size2_weight == 33, "Easy size2 weight should be 33");
        assert!(settings.easy_size3_weight == 27, "Easy size3 weight should be 27");
        assert!(settings.easy_size4_weight == 13, "Easy size4 weight should be 13");
        assert!(settings.easy_size5_weight == 7, "Easy size5 weight should be 7");
        assert!(settings.master_size1_weight == 7, "Master size1 weight should be 7");
        assert!(settings.master_size2_weight == 13, "Master size2 weight should be 13");
        assert!(settings.master_size3_weight == 20, "Master size3 weight should be 20");
        assert!(settings.master_size4_weight == 27, "Master size4 weight should be 27");
        assert!(settings.master_size5_weight == 33, "Master size5 weight should be 33");
    }
    
    #[test]
    fn test_get_block_weights_for_difficulty() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Test VeryEasy difficulty (tier 0 - uses easy_* values exactly)
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
    fn test_validate_constraint_probability_overflow() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Valid: 30 + 0 = 30 <= 100
        assert!(settings.validate(), "Should be valid with defaults");
        
        // Invalid: 60 + 50 = 110 > 100
        settings.easy_none_chance = 60;
        settings.easy_no_bonus_chance = 50;
        assert!(!settings.validate(), "Should be invalid when easy probabilities > 100");
    }
    
    #[test]
    fn test_validate_lines_min_max() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Invalid: min > max
        settings.easy_min_lines = 5;
        settings.easy_max_lines = 3;
        assert!(!settings.validate(), "Should be invalid when easy_min_lines > easy_max_lines");
    }
    
    #[test]
    fn test_validate_times_min_max() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Invalid: min > max
        settings.master_min_times = 10;
        settings.master_max_times = 5;
        assert!(!settings.validate(), "Should be invalid when master_min_times > master_max_times");
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
    fn test_validate_cube_thresholds() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Invalid: 3-star threshold > 2-star (should be harder to get 3 stars)
        settings.cube_3_percent = 80;
        settings.cube_2_percent = 50;
        assert!(!settings.validate(), "Should be invalid when cube_3_percent > cube_2_percent");
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
        settings.easy_size1_weight = 0;
        settings.easy_size2_weight = 0;
        settings.easy_size3_weight = 0;
        settings.easy_size4_weight = 0;
        settings.easy_size5_weight = 0;
        assert!(!settings.validate(), "Should be invalid when all easy block weights are zero");
    }
    
    #[test]
    fn test_validate_starting_difficulty_bounds() {
        let mut settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        // Invalid: starting_difficulty > 7
        settings.starting_difficulty = 8;
        assert!(!settings.validate(), "Should be invalid when starting_difficulty > 7");
    }
}
