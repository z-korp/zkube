/// Level generation helpers
/// Generates deterministic level configurations based on seed
///
/// Key properties:
/// - Same seed + same level = same config
/// - Different seed = different config sequence
/// - Level 100+ caps at max difficulty (survival mode)
/// - Points derived from moves × ratio (0.8 → 2.5)
/// - Correlated variance keeps difficulty ratio constant

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};

/// Constants for level generation
mod LevelConstants {
    // Moves scaling (linear 35 → 85)
    pub const BASE_MOVES: u16 = 35;
    pub const MAX_MOVES: u16 = 85;

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
    /// Generate a complete level configuration from seed and level number
    fn generate(seed: felt252, level: u8) -> LevelConfig {
        // Derive a level-specific seed for deterministic variance
        let level_seed = Self::derive_level_seed(seed, level);

        // Cap level for calculations (survival mode after 100)
        let calc_level = if level > LevelConstants::LEVEL_CAP {
            LevelConstants::LEVEL_CAP
        } else {
            level
        };

        // 1. Calculate base moves (35 → 85)
        let base_moves = Self::calculate_base_moves(calc_level);

        // 2. Calculate ratio for this level (0.80 → 2.50)
        let ratio_x100 = Self::calculate_ratio(calc_level);

        // 3. Calculate base points from moves × ratio
        let base_points: u16 = ((base_moves.into() * ratio_x100.into()) / 100_u32)
            .try_into()
            .unwrap();

        // 4. Get variance percent based on level tier
        let variance_percent = Self::get_variance_percent(calc_level);

        // 5. Apply CORRELATED variance (same factor for both)
        let variance_factor = Self::calculate_variance_factor(level_seed, variance_percent);
        let points_required = Self::apply_factor(base_points, variance_factor);
        let max_moves = Self::apply_factor(base_moves, variance_factor);

        // Calculate cube thresholds
        let cube_3_threshold = max_moves * LevelConstants::CUBE_3_PERCENT / 100;
        let cube_2_threshold = max_moves * LevelConstants::CUBE_2_PERCENT / 100;

        // Get difficulty and constraint
        let difficulty = Self::get_difficulty_for_level(calc_level);
        let constraint = Self::generate_constraint(level_seed, calc_level);

        LevelConfig {
            level,
            points_required,
            max_moves,
            difficulty,
            constraint,
            cube_3_threshold,
            cube_2_threshold,
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
    /// Linear scaling: 35 at level 1, 85 at level 100
    #[inline(always)]
    fn calculate_base_moves(level: u8) -> u16 {
        if level <= 1 {
            return LevelConstants::BASE_MOVES;
        }

        let range = LevelConstants::MAX_MOVES - LevelConstants::BASE_MOVES; // 50
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        LevelConstants::BASE_MOVES + progress.try_into().unwrap()
    }

    /// Calculate ratio for this level (scaled by 100)
    /// Linear scaling: 80 (0.80) at level 1, 250 (2.50) at level 100
    #[inline(always)]
    fn calculate_ratio(level: u8) -> u16 {
        if level <= 1 {
            return LevelConstants::BASE_RATIO_X100;
        }

        let range = LevelConstants::MAX_RATIO_X100 - LevelConstants::BASE_RATIO_X100; // 170
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        LevelConstants::BASE_RATIO_X100 + progress.try_into().unwrap()
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

    const TEST_SEED: felt252 = 'TEST_SEED_12345';
    const DIFFERENT_SEED: felt252 = 'DIFFERENT_SEED';

    #[test]
    fn test_base_moves_scaling() {
        assert!(LevelGeneratorTrait::calculate_base_moves(1) == 35, "Level 1 should have 35 moves");
        assert!(
            LevelGeneratorTrait::calculate_base_moves(100) == 85,
            "Level 100 should have 85 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(50);
        assert!(mid >= 59 && mid <= 61, "Level 50 should be around 60 moves");
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
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25);
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 25);

        assert!(config1.points_required == config2.points_required, "Points should match");
        assert!(config1.max_moves == config2.max_moves, "Moves should match");
        assert!(config1.difficulty == config2.difficulty, "Difficulty should match");
    }

    #[test]
    fn test_correlated_variance() {
        // Test that variance is correlated (ratio stays approximately constant)
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50);

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
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25);

        // At least one of points or moves should differ (very high probability)
        let points_differ = config1.points_required != config2.points_required;
        let moves_differ = config1.max_moves != config2.max_moves;

        assert!(points_differ || moves_differ, "Different seeds should produce different configs");
    }

    #[test]
    fn test_level_100_cap() {
        // Level 100 and 150 should have same base difficulty (Master)
        let config100 = LevelGeneratorTrait::generate(TEST_SEED, 100);
        let config150 = LevelGeneratorTrait::generate(TEST_SEED, 150);

        assert!(config100.difficulty == Difficulty::Master, "Level 100 should be Master");
        assert!(config150.difficulty == Difficulty::Master, "Level 150 should be Master");
    }

    #[test]
    fn test_no_constraint_early_levels() {
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 1);
        let config4 = LevelGeneratorTrait::generate(TEST_SEED, 4);

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
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50);

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
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1);

        // Level 1: base_moves=35, ratio=0.80, base_points=28
        // With ±5% variance: moves 33-37, points 27-29
        assert!(config.level == 1, "Level should be 1");
        assert!(config.points_required >= 26 && config.points_required <= 30, "Points in range");
        assert!(config.max_moves >= 33 && config.max_moves <= 37, "Moves in range");
        assert!(config.difficulty == Difficulty::Easy, "Level 1 should be Easy");
    }

    #[test]
    fn test_generate_level_50() {
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50);

        // Level 50: base_moves~60, ratio~1.65, base_points~99
        // With ±10% variance: moves 54-66, points 89-109
        assert!(config.level == 50, "Level should be 50");
        assert!(config.points_required >= 85 && config.points_required <= 115, "Points in range");
        assert!(config.max_moves >= 52 && config.max_moves <= 68, "Moves in range");
        assert!(config.difficulty == Difficulty::Hard, "Level 50 should be Hard");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds ordered");
        assert!(config.cube_2_threshold < config.max_moves, "2-cube threshold < max");
    }

    #[test]
    fn test_generate_level_100() {
        let config = LevelGeneratorTrait::generate(TEST_SEED, 100);

        // Level 100: base_moves=85, ratio=2.50, base_points=212
        // With ±15% variance: moves 72-98, points 180-244
        assert!(config.level == 100, "Level should be 100");
        assert!(
            config.points_required >= 175 && config.points_required <= 250, "Points in range",
        );
        assert!(config.max_moves >= 70 && config.max_moves <= 100, "Moves in range");
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
}
