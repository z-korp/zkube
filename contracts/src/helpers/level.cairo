/// Level generation helpers
/// Generates deterministic level configurations based on seed and GameSettings
///
/// Key properties:
/// - Same seed + same level = same config
/// - Different seed = different config sequence
/// - Level 50+ caps at max difficulty (survival mode)
/// - Points derived from moves × ratio (0.8 → 2.5), base moves 20→60
/// - Correlated variance keeps difficulty ratio constant
/// - All generation uses GameSettings for configurable game balance

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait, ConstraintType};
use zkube::models::config::{GameSettings, GameSettingsTrait};

/// Constants for level generation
mod LevelConstants {
    // Moves scaling (linear 20 → 60)
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;

    // Ratio scaling ×100 for integer math (0.80 → 2.50)
    pub const BASE_RATIO_X100: u16 = 80;   // 0.80 points per move at level 1
    pub const MAX_RATIO_X100: u16 = 250;   // 2.50 points per move at level 50

    // Correlated variance by level tier (percentage)
    pub const EARLY_VARIANCE_PERCENT: u16 = 5;   // ±5% for levels 1-5
    pub const MID_VARIANCE_PERCENT: u16 = 10;    // ±10% for levels 6-25
    pub const LATE_VARIANCE_PERCENT: u16 = 15;   // ±15% for levels 26-50

    // Cube thresholds (percentage of max_moves)
    pub const CUBE_3_PERCENT: u16 = 40; // 3 cubes if moves <= 40% of max
    pub const CUBE_2_PERCENT: u16 = 70; // 2 cubes if moves <= 70% of max

    // Level cap for scaling (survival mode after this)
    pub const LEVEL_CAP: u8 = 50;

    // Constraint none threshold (constraints start from level 5)
    pub const CONSTRAINT_NONE_THRESHOLD: u8 = 4;
}

/// Boss level constants and helpers
/// Boss levels occur at 10, 20, 30, 40, 50 with seeded dual constraints at max budget
pub mod BossLevel {
    /// Check if a level is a boss level
    pub fn is_boss_level(level: u8) -> bool {
        level == 10 || level == 20 || level == 30 || level == 40 || level == 50
    }
    
    /// Get boss tier (1-5) for a boss level
    /// Returns 0 if not a boss level
    pub fn get_boss_tier(level: u8) -> u8 {
        match level {
            10 => 1,
            20 => 2,
            30 => 3,
            40 => 4,
            50 => 5,
            _ => 0,
        }
    }
    
    /// Get boss cube bonus for completing a boss level
    /// Boss I (L10) = +10, Boss II (L20) = +20, etc.
    pub fn get_boss_cube_bonus(level: u8) -> u16 {
        match level {
            10 => 10,
            20 => 20,
            30 => 30,
            40 => 40,
            50 => 50,
            _ => 0,
        }
    }
}

#[generate_trait]
pub impl LevelGenerator of LevelGeneratorTrait {
    /// Generate a complete level configuration from seed, level number, and GameSettings
    /// Uses configurable game balance parameters from settings
    fn generate(seed: felt252, level: u8, settings: GameSettings) -> LevelConfig {
        // Derive a level-specific seed for deterministic variance
        let level_seed = Self::derive_level_seed(seed, level);

        // Get level cap from settings (or use default if 0)
        let level_cap = settings.get_level_cap();
        
        // Cap level for calculations (survival mode after cap)
        let calc_level = if level > level_cap {
            level_cap
        } else {
            level
        };

        // 1. Calculate base moves using settings
        let base_moves = Self::calculate_base_moves_with_settings(
            calc_level, settings.base_moves, settings.max_moves
        );

        // 2. Calculate ratio for this level using settings
        let ratio_x100 = Self::calculate_ratio_with_settings(
            calc_level, settings.base_ratio_x100, settings.max_ratio_x100
        );

        // 3. Calculate base points from moves × ratio
        let base_points: u16 = ((base_moves.into() * ratio_x100.into()) / 100_u32)
            .try_into()
            .unwrap();

        // 4. Get variance percent based on level tier (using settings)
        let variance_percent = settings.get_variance_percent(calc_level);

        // 5. Apply CORRELATED variance (same factor for both)
        let variance_factor = Self::calculate_variance_factor(level_seed, variance_percent.into());
        let points_required = Self::apply_factor(base_points, variance_factor);
        let max_moves = Self::apply_factor(base_moves, variance_factor);

        // Calculate cube thresholds using settings
        let cube_3_threshold = max_moves * settings.cube_3_percent.into() / 100;
        let cube_2_threshold = max_moves * settings.cube_2_percent.into() / 100;

        // Get difficulty from settings
        let difficulty = settings.get_difficulty_for_level(calc_level);
        
        // Generate constraints: use seeded boss constraints for boss levels, otherwise normal generation
        // Respect constraints_enabled setting for both boss and regular levels
        let (constraint, constraint_2) = if !settings.are_constraints_enabled() {
            (LevelConstraintTrait::none(), LevelConstraintTrait::none())
        } else if BossLevel::is_boss_level(level) {
            Self::generate_boss_constraints_seeded(level_seed, difficulty, settings)
        } else {
            Self::generate_constraints_with_settings(level_seed, level, difficulty, settings)
        };

        LevelConfig {
            level,
            points_required,
            max_moves,
            difficulty,
            constraint,
            constraint_2,
            cube_3_threshold,
            cube_2_threshold,
        }
    }
    
    /// Generate seeded boss constraints with max budget for the difficulty
    /// Boss levels always have dual constraints, randomly seeded
    /// 
    /// - Primary: ClearLines with max budget for the level's difficulty
    /// - Secondary: Either ClearLines (max budget) or NoBonusUsed based on difficulty's chance
    fn generate_boss_constraints_seeded(
        level_seed: felt252,
        difficulty: Difficulty,
        settings: GameSettings
    ) -> (LevelConstraint, LevelConstraint) {
        // Get constraint params for the difficulty
        let (min_lines, max_lines, _budget_min, budget_max, min_times, _dual_chance, secondary_no_bonus_chance) = 
            settings.get_constraint_params_for_difficulty(difficulty);
        
        // Primary: Always ClearLines with MAX budget (no rolling)
        let primary = Self::generate_clear_lines_constraint_max_budget(
            level_seed, min_lines, max_lines, budget_max, min_times
        );
        
        // Secondary: Always generated (forced dual), but may be NoBonusUsed
        let secondary = Self::generate_boss_secondary_constraint(
            level_seed, min_lines, max_lines, budget_max, min_times, secondary_no_bonus_chance
        );
        
        (primary, secondary)
    }
    
    /// Generate a ClearLines constraint using MAX budget (for bosses)
    /// Same algorithm as generate_clear_lines_constraint but uses budget_max directly
    fn generate_clear_lines_constraint_max_budget(
        seed: felt252,
        min_lines: u8,
        max_lines: u8,
        budget_max: u8,
        min_times: u8,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Use max budget directly (no rolling)
        let budget: u8 = budget_max;
        
        // Roll lines within [min_lines, max_lines]
        let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
        let mut lines: u8 = min_lines + (((seed_u256 / 100) % lines_range.into()).try_into().unwrap());
        
        // Compute times_cap = budget / line_cost(lines)
        let mut cost: u8 = Self::line_cost(lines);
        let mut times_cap: u8 = if cost > 0 { budget / cost } else { 1 };
        
        // Feasibility repair - reduce lines until times_cap >= min_times
        let mut repair_count: u8 = 0;
        while times_cap < min_times && lines > 2 && repair_count < 5 {
            lines = lines - 1;
            cost = Self::line_cost(lines);
            times_cap = if cost > 0 { budget / cost } else { 1 };
            repair_count = repair_count + 1;
        };
        
        // If still infeasible, reduce min_times requirement to times_cap
        let effective_min_times: u8 = if times_cap < min_times { 
            if times_cap >= 1 { times_cap } else { 1 }
        } else { 
            min_times 
        };
        
        // Roll times with skew-high distribution (max of two rolls)
        let times: u8 = if times_cap <= 1 {
            1
        } else {
            let t1: u8 = 1 + (((seed_u256 / 1000) % times_cap.into()).try_into().unwrap());
            let t2: u8 = 1 + (((seed_u256 / 10000) % times_cap.into()).try_into().unwrap());
            let max_t = if t1 > t2 { t1 } else { t2 };
            if max_t < effective_min_times { effective_min_times } else { max_t }
        };
        
        LevelConstraintTrait::clear_lines(lines, times)
    }
    
    /// Generate boss secondary constraint (always generated, but may be NoBonusUsed)
    /// Skips the dual_chance roll since bosses always have dual constraints
    fn generate_boss_secondary_constraint(
        seed: felt252,
        min_lines: u8,
        max_lines: u8,
        budget_max: u8,
        min_times: u8,
        secondary_no_bonus_chance: u8,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Roll to see if secondary is NoBonusUsed or ClearLines
        let no_bonus_roll: u8 = ((seed_u256 / 1000000) % 100).try_into().unwrap();
        if no_bonus_roll < secondary_no_bonus_chance {
            return LevelConstraintTrait::no_bonus();
        }
        
        // Generate another ClearLines constraint with shifted seed and max budget
        let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
        Self::generate_clear_lines_constraint_max_budget(
            secondary_seed, min_lines, max_lines, budget_max, min_times
        )
    }

    /// Generate constraints based on seed, level, difficulty, and settings
    /// Returns (primary_constraint, secondary_constraint)
    /// Primary is always ClearLines (from level 3+), secondary depends on dual_chance
    fn generate_constraints_with_settings(
        level_seed: felt252, level: u8, difficulty: Difficulty, settings: GameSettings
    ) -> (LevelConstraint, LevelConstraint) {
        // Check if constraints are enabled
        if !settings.are_constraints_enabled() {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        // No constraint before the start level (levels 1-2 have no constraints)
        if level < settings.constraint_start_level {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        // Get interpolated constraint parameters for this difficulty
        let (min_lines, max_lines, budget_min, budget_max, min_times, dual_chance, secondary_no_bonus_chance) = 
            settings.get_constraint_params_for_difficulty(difficulty);
        
        // Generate primary constraint (always ClearLines)
        let primary = Self::generate_clear_lines_constraint(
            level_seed, min_lines, max_lines, budget_min, budget_max, min_times
        );
        
        // Check if we should have a secondary constraint
        let secondary = Self::maybe_generate_secondary_constraint(
            level_seed, min_lines, max_lines, budget_min, budget_max, min_times, 
            dual_chance, secondary_no_bonus_chance
        );
        
        (primary, secondary)
    }
    
    /// Returns the weighted difficulty cost for clearing N lines at once.
    /// Higher line counts are exponentially harder to achieve in practice.
    /// Line costs: 2->2, 3->4, 4->6, 5->10, 6->15, 7+->20
    /// 
    /// Used by constraint generation to determine how many "times" a constraint requires.
    /// Formula: times = budget / line_cost(lines)
    /// 
    /// Examples at Master (budget 25-40):
    /// - 4 lines (cost 6): times = 4-6
    /// - 5 lines (cost 10): times = 2-4
    /// - 6 lines (cost 15): times = 1-2
    fn line_cost(lines: u8) -> u8 {
        match lines {
            0 | 1 => 1,
            2 => 2,
            3 => 4,
            4 => 6,
            5 => 10,
            6 => 15,
            _ => 20,  // 7+ (exceptional)
        }
    }
    
    /// Generate a ClearLines constraint using the weighted budget system
    /// Algorithm:
    /// 1. Roll budget within [budget_min, budget_max]
    /// 2. Roll lines within [min_lines, max_lines]
    /// 3. Compute times_cap = budget / line_cost(lines)
    /// 4. Feasibility repair: reduce lines if times_cap < min_times
    /// 5. Roll times with skew-high distribution (max of two rolls)
    fn generate_clear_lines_constraint(
        seed: felt252,
        min_lines: u8,
        max_lines: u8,
        budget_min: u8,
        budget_max: u8,
        min_times: u8,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Step 1: Roll budget within [budget_min, budget_max]
        let budget_range: u8 = if budget_max > budget_min { budget_max - budget_min + 1 } else { 1 };
        let budget: u8 = budget_min + ((seed_u256 % budget_range.into()).try_into().unwrap());
        
        // Step 2: Roll lines within [min_lines, max_lines]
        let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
        let mut lines: u8 = min_lines + (((seed_u256 / 100) % lines_range.into()).try_into().unwrap());
        
        // Step 3: Compute times_cap = budget / line_cost(lines)
        let mut cost: u8 = Self::line_cost(lines);
        let mut times_cap: u8 = if cost > 0 { budget / cost } else { 1 };
        
        // Step 4: Feasibility repair - reduce lines until times_cap >= min_times
        // This ensures we never generate impossible constraints
        let mut repair_count: u8 = 0;
        while times_cap < min_times && lines > 2 && repair_count < 5 {
            lines = lines - 1;
            cost = Self::line_cost(lines);
            times_cap = if cost > 0 { budget / cost } else { 1 };
            repair_count = repair_count + 1;
        };
        
        // If still infeasible, reduce min_times requirement to times_cap
        let effective_min_times: u8 = if times_cap < min_times { 
            if times_cap >= 1 { times_cap } else { 1 }
        } else { 
            min_times 
        };
        
        // Step 5: Roll times with skew-high distribution (max of two rolls)
        // This makes higher values more likely while preserving variety
        let times: u8 = if times_cap <= 1 {
            1
        } else {
            let t1: u8 = 1 + (((seed_u256 / 1000) % times_cap.into()).try_into().unwrap());
            let t2: u8 = 1 + (((seed_u256 / 10000) % times_cap.into()).try_into().unwrap());
            let max_t = if t1 > t2 { t1 } else { t2 };
            // Enforce minimum times floor
            if max_t < effective_min_times { effective_min_times } else { max_t }
        };
        
        LevelConstraintTrait::clear_lines(lines, times)
    }
    
    /// Maybe generate a secondary constraint
    /// Secondary can be either NoBonusUsed or another ClearLines
    fn maybe_generate_secondary_constraint(
        seed: felt252,
        min_lines: u8,
        max_lines: u8,
        budget_min: u8,
        budget_max: u8,
        min_times: u8,
        dual_chance: u8,
        secondary_no_bonus_chance: u8,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Roll to see if we get a secondary constraint at all
        let dual_roll: u8 = ((seed_u256 / 100000) % 100).try_into().unwrap();
        if dual_roll >= dual_chance {
            return LevelConstraintTrait::none();
        }
        
        // Roll to see if secondary is NoBonusUsed or ClearLines
        let no_bonus_roll: u8 = ((seed_u256 / 1000000) % 100).try_into().unwrap();
        if no_bonus_roll < secondary_no_bonus_chance {
            return LevelConstraintTrait::no_bonus();
        }
        
        // Generate another ClearLines constraint with shifted seed
        let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
        Self::generate_clear_lines_constraint(
            secondary_seed, min_lines, max_lines, budget_min, budget_max, min_times
        )
    }
    
    /// Derive a deterministic seed for a specific level
    fn derive_level_seed(seed: felt252, level: u8) -> felt252 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(seed);
        let state = state.update(level.into());
        let state = state.update('LEVEL_CONFIG');
        state.finalize()
    }

    /// Calculate base moves for a level (before variance)
    /// Linear scaling: 20 at level 1, 60 at level 50 (using defaults)
    #[inline(always)]
    fn calculate_base_moves(level: u8) -> u16 {
        Self::calculate_base_moves_with_settings(
            level, LevelConstants::BASE_MOVES, LevelConstants::MAX_MOVES
        )
    }
    
    /// Calculate base moves with custom settings
    /// Linear scaling from base_moves at level 1 to max_moves at level 50
    #[inline(always)]
    fn calculate_base_moves_with_settings(level: u8, base_moves: u16, max_moves: u16) -> u16 {
        if level <= 1 {
            return base_moves;
        }

        let range = max_moves - base_moves;
        let progress: u32 = (level.into() - 1) * range.into() / 49;
        base_moves + progress.try_into().unwrap()
    }

    /// Calculate ratio for this level (scaled by 100)
    /// Linear scaling: 80 (0.80) at level 1, 250 (2.50) at level 50 (using defaults)
    #[inline(always)]
    fn calculate_ratio(level: u8) -> u16 {
        Self::calculate_ratio_with_settings(
            level, LevelConstants::BASE_RATIO_X100, LevelConstants::MAX_RATIO_X100
        )
    }
    
    /// Calculate ratio with custom settings
    /// Linear scaling from base_ratio at level 1 to max_ratio at level 50
    #[inline(always)]
    fn calculate_ratio_with_settings(level: u8, base_ratio_x100: u16, max_ratio_x100: u16) -> u16 {
        if level <= 1 {
            return base_ratio_x100;
        }

        let range = max_ratio_x100 - base_ratio_x100;
        let progress: u32 = (level.into() - 1) * range.into() / 49;
        base_ratio_x100 + progress.try_into().unwrap()
    }

    /// Get variance percentage based on level tier
    #[inline(always)]
    fn get_variance_percent(level: u8) -> u16 {
        if level <= 5 {
            LevelConstants::EARLY_VARIANCE_PERCENT
        } else if level <= 25 {
            LevelConstants::MID_VARIANCE_PERCENT
        } else {
            LevelConstants::LATE_VARIANCE_PERCENT
        }
    }

    /// Calculate correlated variance factor
    /// Returns a value like 95-105 for ±5%, or 85-115 for ±15%
    fn calculate_variance_factor(seed: felt252, variance_percent: u16) -> u16 {
        let seed_u256: u256 = seed.into();
        let variance_range = variance_percent * 2 + 1; // e.g., 11 for ±5% (95-105)
        let roll: u16 = (seed_u256 % variance_range.into()).try_into().unwrap();
        // Center around 100: (100 - variance) + roll
        100 - variance_percent + roll
    }

    /// Apply factor to base value
    #[inline(always)]
    fn apply_factor(base: u16, factor: u16) -> u16 {
        let result: u32 = base.into() * factor.into() / 100;
        result.try_into().unwrap()
    }

    /// Generate random bonus type based on seed
    /// Returns: 0 = Hammer, 1 = Wave, 2 = Totem
    fn get_random_bonus_type(seed: felt252, index: u8) -> u8 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(seed);
        let state = state.update(index.into());
        let state = state.update('BONUS');
        let hash = state.finalize();

        let hash_u256: u256 = hash.into();
        (hash_u256 % 3).try_into().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::{LevelGenerator, LevelGeneratorTrait, LevelConstants};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::constraint::ConstraintType;
    use zkube::models::config::{GameSettings, GameSettingsTrait};

    const TEST_SEED: felt252 = 'TEST_SEED_12345';
    const DIFFERENT_SEED: felt252 = 'DIFFERENT_SEED';

    #[test]
    fn test_base_moves_scaling() {
        assert!(LevelGeneratorTrait::calculate_base_moves(1) == 20, "Level 1 should have 20 moves");
        assert!(
            LevelGeneratorTrait::calculate_base_moves(50) == 60,
            "Level 50 should have 60 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(25);
        assert!(mid >= 39 && mid <= 41, "Level 25 should be around 40 moves");
    }

    #[test]
    fn test_ratio_scaling() {
        assert!(LevelGeneratorTrait::calculate_ratio(1) == 80, "Level 1 should have ratio 80");
        assert!(
            LevelGeneratorTrait::calculate_ratio(50) == 250, "Level 50 should have ratio 250",
        );

        let mid = LevelGeneratorTrait::calculate_ratio(25);
        assert!(mid >= 160 && mid <= 170, "Level 25 should have ratio around 165");
    }

    #[test]
    fn test_variance_percent_tiers() {
        assert!(LevelGeneratorTrait::get_variance_percent(1) == 5, "Level 1 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(5) == 5, "Level 5 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(6) == 10, "Level 6 should be 10%");
        assert!(LevelGeneratorTrait::get_variance_percent(25) == 10, "Level 25 should be 10%");
        assert!(LevelGeneratorTrait::get_variance_percent(26) == 15, "Level 26 should be 15%");
        assert!(LevelGeneratorTrait::get_variance_percent(50) == 15, "Level 50 should be 15%");
    }

    #[test]
    fn test_seed_determinism() {
        // Same seed + same level should produce same config
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);

        assert!(config1.points_required == config2.points_required, "Points should match");
        assert!(config1.max_moves == config2.max_moves, "Moves should match");
        assert!(config1.difficulty == config2.difficulty, "Difficulty should match");
    }

    #[test]
    fn test_correlated_variance() {
        // Test that variance is correlated (ratio stays approximately constant)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Base at level 50: moves = 60, ratio_x100 = 250, points = 60 × 2.50 = 150
        // With variance (±15%), both should scale together maintaining the ratio
        // Ratio should be approximately: points_required * 100 / max_moves
        let actual_ratio = config.points_required.into() * 100_u32 / config.max_moves.into();
        
        // The ratio should be close to the base ratio for level 50 (~250)
        // Allow for rounding errors
        assert!(actual_ratio >= 230 && actual_ratio <= 270, "Ratio should be approximately 250");
    }

    #[test]
    fn test_different_seeds_different_configs() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25, settings);

        // At least one of points or moves should differ (very high probability)
        let points_differ = config1.points_required != config2.points_required;
        let moves_differ = config1.max_moves != config2.max_moves;

        assert!(points_differ || moves_differ, "Different seeds should produce different configs");
    }

    #[test]
    fn test_level_50_cap() {
        // Level 50 and 100 should have same base difficulty (Master)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        let config100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);

        assert!(config50.difficulty == Difficulty::Master, "Level 50 should be Master");
        assert!(config100.difficulty == Difficulty::Master, "Level 100 should be Master (capped)");
    }

    #[test]
    fn test_no_constraint_early_levels() {
        // Default constraint_start_level is 3, so levels 1-2 have no constraints
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings);

        assert!(
            config1.constraint.constraint_type == ConstraintType::None,
            "Level 1 should have no constraint",
        );
        assert!(
            config2.constraint.constraint_type == ConstraintType::None,
            "Level 2 should have no constraint",
        );
    }

    #[test]
    fn test_cube_thresholds() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Cube thresholds should be percentages of max_moves
        let expected_3_cube = config.max_moves * 40 / 100;
        let expected_2_cube = config.max_moves * 70 / 100;

        assert!(
            config.cube_3_threshold == expected_3_cube, "3-cube threshold should be 40% of max",
        );
        assert!(
            config.cube_2_threshold == expected_2_cube, "2-cube threshold should be 70% of max",
        );
    }

    #[test]
    fn test_generate_level_1() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);

        // Level 1: base_moves=20, ratio=0.80, base_points=16
        // With ±5% variance: moves 19-21, points 15-17
        // With non-linear progression: Level 1 is VeryEasy (tier 0)
        assert!(config.level == 1, "Level should be 1");
        assert!(config.points_required >= 14 && config.points_required <= 18, "Points in range");
        assert!(config.max_moves >= 18 && config.max_moves <= 22, "Moves in range");
        assert!(config.difficulty == Difficulty::VeryEasy, "Level 1 should be VeryEasy");
    }

    #[test]
    fn test_generate_level_25() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);

        // Level 25: base_moves~40, ratio~1.65, base_points~66
        // With ±10% variance: moves 36-44, points 59-73
        // With non-linear progression: Level 25 is VeryHard (tier 5, starts at level 25)
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required >= 56 && config.points_required <= 76, "Points in range");
        assert!(config.max_moves >= 34 && config.max_moves <= 46, "Moves in range");
        assert!(config.difficulty == Difficulty::VeryHard, "Level 25 should be VeryHard");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds ordered");
        assert!(config.cube_2_threshold < config.max_moves, "2-cube threshold < max");
    }

    #[test]
    fn test_generate_level_50() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Level 50 (max): base_moves=60, ratio=2.50, base_points=150
        // With ±15% variance: moves 51-69, points 127-173
        assert!(config.level == 50, "Level should be 50");
        assert!(
            config.points_required >= 124 && config.points_required <= 176, "Points in range",
        );
        assert!(config.max_moves >= 49 && config.max_moves <= 71, "Moves in range");
        assert!(config.difficulty == Difficulty::Master, "Level 50 should be Master");
    }

    #[test]
    fn test_random_bonus_distribution() {
        // Test that we get different bonus types
        let bonus1 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 0);
        let bonus2 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 1);
        let bonus3 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 2);

        // All should be valid bonus types (0, 1, or 2)
        assert!(bonus1 <= 2, "Bonus type should be 0-2");
        assert!(bonus2 <= 2, "Bonus type should be 0-2");
        assert!(bonus3 <= 2, "Bonus type should be 0-2");
    }
    
    #[test]
    fn test_generate_default_settings() {
        // Test generate with default settings
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        
        // Verify it produces reasonable values
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required > 0, "Points should be positive");
        assert!(config.max_moves > 0, "Moves should be positive");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds should be ordered");
    }
    
    #[test]
    fn test_generate_custom_moves() {
        // Create custom settings with different parameters
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.base_moves = 30;  // Higher than default 20
        settings.max_moves = 80;   // Higher than default 60
        settings.cube_3_percent = 30;  // Stricter than default 40
        settings.cube_2_percent = 60;  // Stricter than default 70
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        
        // At level 1, should use base_moves (with variance)
        // With ±5% variance: 30 -> 28-32
        assert!(config.max_moves >= 27 && config.max_moves <= 33, "Custom moves should be around 30");
        
        // Cube thresholds should use custom percentages
        let expected_3_cube = config.max_moves * 30 / 100;
        let expected_2_cube = config.max_moves * 60 / 100;
        assert!(config.cube_3_threshold == expected_3_cube, "Custom 3-cube threshold");
        assert!(config.cube_2_threshold == expected_2_cube, "Custom 2-cube threshold");
    }
    
    #[test]
    fn test_generate_tournament_mode() {
        // Tournament mode: harder thresholds, same base moves
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.cube_3_percent = 25;  // Much stricter
        settings.cube_2_percent = 50;  // Much stricter
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        
        // Cube thresholds should be much stricter
        let expected_3_cube = config.max_moves * 25 / 100;
        let expected_2_cube = config.max_moves * 50 / 100;
        assert!(config.cube_3_threshold == expected_3_cube, "Tournament 3-cube threshold");
        assert!(config.cube_2_threshold == expected_2_cube, "Tournament 2-cube threshold");
    }
    
    #[test]
    fn test_generate_constraints_disabled() {
        // Disable constraints entirely
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraints_enabled = 0;
        
        // Even at high levels, should have no constraint
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        assert!(
            config.constraint.constraint_type == ConstraintType::None,
            "Should have no constraint when disabled"
        );
        
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        assert!(
            config_50.constraint.constraint_type == ConstraintType::None,
            "Level 50 should have no constraint when disabled"
        );
    }
    
    #[test]
    fn test_generate_custom_constraint_start() {
        // Start constraints at level 20 instead of 5
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraint_start_level = 20;
        
        // Level 15 should have no constraint
        let config_15 = LevelGeneratorTrait::generate(TEST_SEED, 15, settings);
        assert!(
            config_15.constraint.constraint_type == ConstraintType::None,
            "Level 15 should have no constraint"
        );
        
        // Level 20 might have a constraint (depending on RNG)
        let _config_20 = LevelGeneratorTrait::generate(TEST_SEED, 20, settings);
        // We can't assert the specific type since it's random, but it should use generate_constraint
    }
    
    #[test]
    fn test_generate_custom_difficulty_progression() {
        // Custom tier thresholds for faster early progression
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.tier_1_threshold = 2;   // Easy starts at level 2
        settings.tier_2_threshold = 5;   // Medium starts at level 5
        settings.tier_3_threshold = 10;  // MediumHard starts at level 10
        settings.tier_4_threshold = 15;  // Hard starts at level 15
        settings.tier_5_threshold = 25;  // VeryHard starts at level 25
        settings.tier_6_threshold = 40;  // Expert starts at level 40
        settings.tier_7_threshold = 60;  // Master starts at level 60
        
        let config_1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        assert!(config_1.difficulty == Difficulty::VeryEasy, "Level 1 should be VeryEasy");
        
        let config_2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings);
        assert!(config_2.difficulty == Difficulty::Easy, "Level 2 should be Easy");
        
        let config_5 = LevelGeneratorTrait::generate(TEST_SEED, 5, settings);
        assert!(config_5.difficulty == Difficulty::Medium, "Level 5 should be Medium");
        
        let config_10 = LevelGeneratorTrait::generate(TEST_SEED, 10, settings);
        assert!(config_10.difficulty == Difficulty::MediumHard, "Level 10 should be MediumHard");
    }
    
    #[test]
    fn test_generate_custom_variance() {
        // Use zero variance for completely deterministic levels
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.early_variance_percent = 0;
        settings.mid_variance_percent = 0;
        settings.late_variance_percent = 0;
        
        // With zero variance, multiple generations with same seed should be identical
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25, settings);
        
        // Points should be exactly base calculation (no variance)
        // Level 25: base_moves ~28.5, ratio ~125, points ~35
        // Without variance, both seeds should give same result
        assert!(config1.points_required == config2.points_required, "Zero variance should give same points");
        assert!(config1.max_moves == config2.max_moves, "Zero variance should give same moves");
    }
    
    #[test]
    fn test_generate_custom_level_cap() {
        // Lower level cap to 30 (below default of 50)
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.level_cap = 30;
        
        // Level 30 and 50 should have same scaling (both at cap)
        let config_30 = LevelGeneratorTrait::generate(TEST_SEED, 30, settings);
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        
        // Both should use level 30 for calculations
        // Note: We can't directly compare due to different level seeds, but we can verify
        // the level field is different while the base calculation is capped
        assert!(config_30.level == 30, "Level should be 30");
        assert!(config_50.level == 50, "Level should be 50");
    }
    
    #[test]
    fn test_generate_easy_mode() {
        // "Easy mode": more moves, lower ratios, generous thresholds
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.base_moves = 30;       // More moves at start
        settings.max_moves = 100;       // Way more moves at high levels
        settings.base_ratio_x100 = 50;  // Lower points/move ratio (easier)
        settings.max_ratio_x100 = 150;  // Still easier at high levels
        settings.cube_3_percent = 50;   // More generous 3-cube threshold
        settings.cube_2_percent = 80;   // More generous 2-cube threshold
        settings.constraints_enabled = 0; // No constraints
        // Slow difficulty progression - stay VeryEasy longer
        settings.tier_1_threshold = 20;  // Easy starts at level 20
        settings.tier_2_threshold = 40;  // Medium starts at level 40
        settings.tier_3_threshold = 60;  // MediumHard starts at level 60
        settings.tier_4_threshold = 75;  // Hard starts at level 75
        settings.tier_5_threshold = 85;  // VeryHard starts at level 85
        settings.tier_6_threshold = 95;  // Expert starts at level 95
        settings.tier_7_threshold = 100; // Master starts at level 100
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        
        // Should have easier parameters
        assert!(config.max_moves >= 27, "Should have more moves"); // ~30 with variance
        assert!(config.difficulty == Difficulty::VeryEasy, "Should be VeryEasy difficulty");
        assert!(config.constraint.constraint_type == ConstraintType::None, "Should have no constraint");
    }
}
