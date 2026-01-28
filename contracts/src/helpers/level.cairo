/// Level generation helpers
/// Generates deterministic level configurations based on seed and GameSettings
///
/// Key properties:
/// - Same seed + same level = same config
/// - Different seed = different config sequence
/// - Level 100+ caps at max difficulty (survival mode)
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
    pub const MAX_RATIO_X100: u16 = 250;   // 2.50 points per move at level 100

    // Correlated variance by level tier (percentage)
    pub const EARLY_VARIANCE_PERCENT: u16 = 5;   // ±5% for levels 1-10
    pub const MID_VARIANCE_PERCENT: u16 = 10;    // ±10% for levels 11-50
    pub const LATE_VARIANCE_PERCENT: u16 = 15;   // ±15% for levels 51-100

    // Cube thresholds (percentage of max_moves)
    pub const CUBE_3_PERCENT: u16 = 40; // 3 cubes if moves <= 40% of max
    pub const CUBE_2_PERCENT: u16 = 70; // 2 cubes if moves <= 70% of max

    // Level cap for scaling (survival mode after this)
    pub const LEVEL_CAP: u8 = 100;

    // Constraint none threshold (constraints start from level 5)
    pub const CONSTRAINT_NONE_THRESHOLD: u8 = 4;
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
        
        // Generate constraints based on difficulty (supports dual constraints)
        let (constraint, constraint_2) = Self::generate_constraints_with_settings(
            level_seed, level, difficulty, settings
        );

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

    /// Generate constraints based on seed, level, difficulty, and settings
    /// Returns (primary_constraint, secondary_constraint)
    /// Uses the configurable constraint distribution parameters from settings
    fn generate_constraints_with_settings(
        level_seed: felt252, level: u8, difficulty: Difficulty, settings: GameSettings
    ) -> (LevelConstraint, LevelConstraint) {
        // Check if constraints are enabled
        if !settings.are_constraints_enabled() {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        // No constraint before the start level
        if level < settings.constraint_start_level {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        // Get interpolated constraint parameters for this difficulty
        let (none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times, dual_chance) = 
            settings.get_constraint_params_for_difficulty(difficulty);
        
        // Generate primary constraint using interpolated parameters
        let primary = Self::generate_constraint_from_params(
            level_seed, none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times
        );
        
        // Check if we should have a secondary constraint
        let secondary = Self::maybe_generate_secondary_from_params(
            level_seed, primary, none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times, dual_chance
        );
        
        (primary, secondary)
    }
    
    /// Generate a constraint using the provided distribution parameters
    fn generate_constraint_from_params(
        seed: felt252,
        none_chance: u8,
        no_bonus_chance: u8,
        min_lines: u8,
        max_lines: u8,
        min_times: u8,
        max_times: u8,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        let roll: u8 = (seed_u256 % 100).try_into().unwrap();
        
        // Determine constraint type based on probabilities
        if roll < none_chance {
            // No constraint
            LevelConstraintTrait::none()
        } else if roll < none_chance + no_bonus_chance {
            // NoBonusUsed constraint
            LevelConstraintTrait::no_bonus()
        } else {
            // ClearLines constraint - calculate lines and times from ranges
            let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
            let times_range: u8 = if max_times > min_times { max_times - min_times + 1 } else { 1 };
            
            let lines: u8 = min_lines + ((seed_u256 / 100) % lines_range.into()).try_into().unwrap();
            let times: u8 = min_times + ((seed_u256 / 1000) % times_range.into()).try_into().unwrap();
            
            LevelConstraintTrait::clear_lines(lines, times)
        }
    }
    
    /// Maybe generate a secondary constraint using provided parameters
    fn maybe_generate_secondary_from_params(
        seed: felt252,
        primary: LevelConstraint,
        none_chance: u8,
        no_bonus_chance: u8,
        min_lines: u8,
        max_lines: u8,
        min_times: u8,
        max_times: u8,
        dual_chance: u8,
    ) -> LevelConstraint {
        // Use different bits from seed for secondary roll
        let seed_u256: u256 = seed.into();
        let roll: u8 = ((seed_u256 / 10000) % 100).try_into().unwrap();
        
        if roll >= dual_chance {
            return LevelConstraintTrait::none();
        }
        
        // Generate a different secondary constraint
        // Use shifted seed for different randomness
        let secondary_seed: felt252 = (seed_u256 / 100000).try_into().unwrap();
        let secondary = Self::generate_constraint_from_params(
            secondary_seed, none_chance, no_bonus_chance, min_lines, max_lines, min_times, max_times
        );
        
        // If secondary is the same type as primary, try alternate
        if secondary.constraint_type == primary.constraint_type {
            // If primary is already NoBonusUsed, try a ClearLines
            if primary.constraint_type == ConstraintType::NoBonusUsed {
                let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
                let times_range: u8 = if max_times > min_times { max_times - min_times + 1 } else { 1 };
                let lines: u8 = min_lines + ((seed_u256 / 1000000) % lines_range.into()).try_into().unwrap();
                let times: u8 = min_times + ((seed_u256 / 10000000) % times_range.into()).try_into().unwrap();
                LevelConstraintTrait::clear_lines(lines, times)
            } else {
                // Add NoBonusUsed as secondary if no_bonus_chance > 0, otherwise use different ClearLines
                if no_bonus_chance > 0 {
                    LevelConstraintTrait::no_bonus()
                } else {
                    // Generate different ClearLines parameters
                    let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
                    let times_range: u8 = if max_times > min_times { max_times - min_times + 1 } else { 1 };
                    let lines: u8 = min_lines + ((seed_u256 / 1000000) % lines_range.into()).try_into().unwrap();
                    let times: u8 = min_times + ((seed_u256 / 10000000) % times_range.into()).try_into().unwrap();
                    LevelConstraintTrait::clear_lines(lines, times)
                }
            }
        } else {
            secondary
        }
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
    /// Linear scaling: 20 at level 1, 60 at level 100 (using defaults)
    #[inline(always)]
    fn calculate_base_moves(level: u8) -> u16 {
        Self::calculate_base_moves_with_settings(
            level, LevelConstants::BASE_MOVES, LevelConstants::MAX_MOVES
        )
    }
    
    /// Calculate base moves with custom settings
    /// Linear scaling from base_moves at level 1 to max_moves at level 100
    #[inline(always)]
    fn calculate_base_moves_with_settings(level: u8, base_moves: u16, max_moves: u16) -> u16 {
        if level <= 1 {
            return base_moves;
        }

        let range = max_moves - base_moves;
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        base_moves + progress.try_into().unwrap()
    }

    /// Calculate ratio for this level (scaled by 100)
    /// Linear scaling: 80 (0.80) at level 1, 250 (2.50) at level 100 (using defaults)
    #[inline(always)]
    fn calculate_ratio(level: u8) -> u16 {
        Self::calculate_ratio_with_settings(
            level, LevelConstants::BASE_RATIO_X100, LevelConstants::MAX_RATIO_X100
        )
    }
    
    /// Calculate ratio with custom settings
    /// Linear scaling from base_ratio at level 1 to max_ratio at level 100
    #[inline(always)]
    fn calculate_ratio_with_settings(level: u8, base_ratio_x100: u16, max_ratio_x100: u16) -> u16 {
        if level <= 1 {
            return base_ratio_x100;
        }

        let range = max_ratio_x100 - base_ratio_x100;
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        base_ratio_x100 + progress.try_into().unwrap()
    }

    /// Get variance percentage based on level tier
    #[inline(always)]
    fn get_variance_percent(level: u8) -> u16 {
        if level <= 10 {
            LevelConstants::EARLY_VARIANCE_PERCENT
        } else if level <= 50 {
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

    /// Get difficulty based on level number
    fn get_difficulty_for_level(level: u8) -> Difficulty {
        if level <= 10 {
            Difficulty::Easy
        } else if level <= 25 {
            Difficulty::Medium
        } else if level <= 45 {
            Difficulty::MediumHard
        } else if level <= 65 {
            Difficulty::Hard
        } else if level <= 85 {
            Difficulty::VeryHard
        } else if level <= 95 {
            Difficulty::Expert
        } else {
            Difficulty::Master
        }
    }

    /// Generate a constraint based on seed and level
    fn generate_constraint(level_seed: felt252, level: u8) -> LevelConstraint {
        // No constraint for first few levels (levels 1-4)
        if level <= LevelConstants::CONSTRAINT_NONE_THRESHOLD {
            return LevelConstraintTrait::none();
        }

        let seed_u256: u256 = level_seed.into();
        let roll: u8 = (seed_u256 % 100).try_into().unwrap(); // 0-99 for precise percentages

        if level <= 20 {
            // Levels 5-20
            if roll < 5 {
                // 5% No Bonus Used
                LevelConstraintTrait::no_bonus()
            } else if roll < 15 {
                // 10% No Constraint
                LevelConstraintTrait::none()
            } else if roll < 65 {
                // 50% Clear 2+ lines, 1-4 times
                let times: u8 = 1 + ((seed_u256 / 100) % 4).try_into().unwrap();
                LevelConstraintTrait::clear_lines(2, times)
            } else if roll < 95 {
                // 30% Clear 3+ lines, 1-2 times
                let times: u8 = 1 + ((seed_u256 / 100) % 2).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3, times)
            } else {
                // 5% Clear 4+ lines, 1 time
                LevelConstraintTrait::clear_lines(4, 1)
            }
        } else if level <= 40 {
            // Levels 21-40
            if roll < 3 {
                // 3% No Bonus Used
                LevelConstraintTrait::no_bonus()
            } else if roll < 5 {
                // 2% No Constraint
                LevelConstraintTrait::none()
            } else if roll < 55 {
                // 50% Clear 2+ lines, 2-6 times
                let times: u8 = 2 + ((seed_u256 / 100) % 5).try_into().unwrap();
                LevelConstraintTrait::clear_lines(2, times)
            } else if roll < 85 {
                // 30% Clear 3+ lines, 2-4 times
                let times: u8 = 2 + ((seed_u256 / 100) % 3).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3, times)
            } else if roll < 95 {
                // 10% Clear 4+ lines, 1-2 times
                let times: u8 = 1 + ((seed_u256 / 100) % 2).try_into().unwrap();
                LevelConstraintTrait::clear_lines(4, times)
            } else {
                // 5% Clear 5+ lines, 1 time
                LevelConstraintTrait::clear_lines(5, 1)
            }
        } else if level <= 60 {
            // Levels 41-60
            if roll < 3 {
                // 3% No Bonus Used
                LevelConstraintTrait::no_bonus()
            } else if roll < 5 {
                // 2% No Constraint
                LevelConstraintTrait::none()
            } else if roll < 45 {
                // 40% Clear 2+ lines, 3-8 times
                let times: u8 = 3 + ((seed_u256 / 100) % 6).try_into().unwrap();
                LevelConstraintTrait::clear_lines(2, times)
            } else if roll < 75 {
                // 30% Clear 3+ lines, 3-6 times
                let times: u8 = 3 + ((seed_u256 / 100) % 4).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3, times)
            } else if roll < 95 {
                // 20% Clear 4+ lines, 2-4 times
                let times: u8 = 2 + ((seed_u256 / 100) % 3).try_into().unwrap();
                LevelConstraintTrait::clear_lines(4, times)
            } else {
                // 5% Clear 5+ lines, 1-2 times
                let times: u8 = 1 + ((seed_u256 / 100) % 2).try_into().unwrap();
                LevelConstraintTrait::clear_lines(5, times)
            }
        } else if level <= 80 {
            // Levels 61-80
            if roll < 3 {
                // 3% No Bonus Used
                LevelConstraintTrait::no_bonus()
            } else if roll < 5 {
                // 2% No Constraint
                LevelConstraintTrait::none()
            } else if roll < 35 {
                // 30% Clear 2+ lines, 4-10 times
                let times: u8 = 4 + ((seed_u256 / 100) % 7).try_into().unwrap();
                LevelConstraintTrait::clear_lines(2, times)
            } else if roll < 70 {
                // 35% Clear 3+ lines, 4-8 times
                let times: u8 = 4 + ((seed_u256 / 100) % 5).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3, times)
            } else if roll < 90 {
                // 20% Clear 4+ lines, 3-6 times
                let times: u8 = 3 + ((seed_u256 / 100) % 4).try_into().unwrap();
                LevelConstraintTrait::clear_lines(4, times)
            } else if roll < 95 {
                // 5% Clear 5+ lines, 2-4 times
                let times: u8 = 2 + ((seed_u256 / 100) % 3).try_into().unwrap();
                LevelConstraintTrait::clear_lines(5, times)
            } else {
                // 5% Clear 6+ lines, 1 time
                LevelConstraintTrait::clear_lines(6, 1)
            }
        } else {
            // Levels 81+
            if roll < 3 {
                // 3% No Bonus Used
                LevelConstraintTrait::no_bonus()
            } else if roll < 5 {
                // 2% No Constraint
                LevelConstraintTrait::none()
            } else if roll < 35 {
                // 30% Clear 2+ lines, 5-12 times
                let times: u8 = 5 + ((seed_u256 / 100) % 8).try_into().unwrap();
                LevelConstraintTrait::clear_lines(2, times)
            } else if roll < 65 {
                // 30% Clear 3+ lines, 5-10 times
                let times: u8 = 5 + ((seed_u256 / 100) % 6).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3, times)
            } else if roll < 85 {
                // 20% Clear 4+ lines, 4-8 times
                let times: u8 = 4 + ((seed_u256 / 100) % 5).try_into().unwrap();
                LevelConstraintTrait::clear_lines(4, times)
            } else if roll < 90 {
                // 5% Clear 5+ lines, 3-6 times
                let times: u8 = 3 + ((seed_u256 / 100) % 4).try_into().unwrap();
                LevelConstraintTrait::clear_lines(5, times)
            } else if roll < 95 {
                // 5% Clear 6+ lines, 1-2 times
                let times: u8 = 1 + ((seed_u256 / 100) % 2).try_into().unwrap();
                LevelConstraintTrait::clear_lines(6, times)
            } else {
                // 5% Clear 7+ lines, 1 time
                LevelConstraintTrait::clear_lines(7, 1)
            }
        }
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
            LevelGeneratorTrait::calculate_base_moves(100) == 60,
            "Level 100 should have 60 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(50);
        assert!(mid >= 39 && mid <= 41, "Level 50 should be around 40 moves");
    }

    #[test]
    fn test_ratio_scaling() {
        assert!(LevelGeneratorTrait::calculate_ratio(1) == 80, "Level 1 should have ratio 80");
        assert!(
            LevelGeneratorTrait::calculate_ratio(100) == 250, "Level 100 should have ratio 250",
        );

        let mid = LevelGeneratorTrait::calculate_ratio(50);
        assert!(mid >= 160 && mid <= 170, "Level 50 should have ratio around 165");
    }

    #[test]
    fn test_variance_percent_tiers() {
        assert!(LevelGeneratorTrait::get_variance_percent(1) == 5, "Level 1 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(10) == 5, "Level 10 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(11) == 10, "Level 11 should be 10%");
        assert!(LevelGeneratorTrait::get_variance_percent(50) == 10, "Level 50 should be 10%");
        assert!(LevelGeneratorTrait::get_variance_percent(51) == 15, "Level 51 should be 15%");
        assert!(LevelGeneratorTrait::get_variance_percent(100) == 15, "Level 100 should be 15%");
    }

    #[test]
    fn test_difficulty_progression() {
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(1) == Difficulty::Easy,
            "Level 1 should be Easy",
        );
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(10) == Difficulty::Easy,
            "Level 10 should be Easy",
        );
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(11) == Difficulty::Medium,
            "Level 11 should be Medium",
        );
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(25) == Difficulty::Medium,
            "Level 25 should be Medium",
        );
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(96) == Difficulty::Master,
            "Level 96 should be Master",
        );
        assert!(
            LevelGeneratorTrait::get_difficulty_for_level(100) == Difficulty::Master,
            "Level 100 should be Master",
        );
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

        // Base at level 50: moves ~60, ratio ~165, points ~99
        // With variance, both should scale together
        // Ratio should be approximately: points_required * 100 / max_moves
        let actual_ratio = config.points_required.into() * 100_u32 / config.max_moves.into();
        
        // The ratio should be close to the base ratio for level 50 (~165)
        // Allow for some rounding errors
        assert!(actual_ratio >= 150 && actual_ratio <= 180, "Ratio should be approximately 165");
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
    fn test_level_100_cap() {
        // Level 100 and 150 should have same base difficulty (Master)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);
        let config150 = LevelGeneratorTrait::generate(TEST_SEED, 150, settings);

        assert!(config100.difficulty == Difficulty::Master, "Level 100 should be Master");
        assert!(config150.difficulty == Difficulty::Master, "Level 150 should be Master");
    }

    #[test]
    fn test_no_constraint_early_levels() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        let config4 = LevelGeneratorTrait::generate(TEST_SEED, 4, settings);

        assert!(
            config1.constraint.constraint_type == ConstraintType::None,
            "Level 1 should have no constraint",
        );
        assert!(
            config4.constraint.constraint_type == ConstraintType::None,
            "Level 4 should have no constraint",
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
    fn test_generate_level_50() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Level 50: base_moves~40, ratio~1.65, base_points~66
        // With ±10% variance: moves 36-44, points 59-73
        // With non-linear progression: Level 50 is VeryHard (tier 5, starts at level 50)
        assert!(config.level == 50, "Level should be 50");
        assert!(config.points_required >= 56 && config.points_required <= 76, "Points in range");
        assert!(config.max_moves >= 34 && config.max_moves <= 46, "Moves in range");
        assert!(config.difficulty == Difficulty::VeryHard, "Level 50 should be VeryHard");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds ordered");
        assert!(config.cube_2_threshold < config.max_moves, "2-cube threshold < max");
    }

    #[test]
    fn test_generate_level_100() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);

        // Level 100: base_moves=60, ratio=2.50, base_points=150
        // With ±15% variance: moves 51-69, points 127-173
        assert!(config.level == 100, "Level should be 100");
        assert!(
            config.points_required >= 124 && config.points_required <= 176, "Points in range",
        );
        assert!(config.max_moves >= 49 && config.max_moves <= 71, "Moves in range");
        assert!(config.difficulty == Difficulty::Master, "Level 100 should be Master");
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
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        assert!(
            config.constraint.constraint_type == ConstraintType::None,
            "Should have no constraint when disabled"
        );
        
        let config_100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);
        assert!(
            config_100.constraint.constraint_type == ConstraintType::None,
            "Level 100 should have no constraint when disabled"
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
        // Lower level cap to 50
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.level_cap = 50;
        
        // Level 50 and 100 should have same scaling (both at cap)
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        let config_100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);
        
        // Both should use level 50 for calculations
        // Note: We can't directly compare due to different level seeds, but we can verify
        // the level field is different while the base calculation is capped
        assert!(config_50.level == 50, "Level should be 50");
        assert!(config_100.level == 100, "Level should be 100");
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
