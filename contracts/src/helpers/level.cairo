/// Level generation helpers
/// Generates deterministic level configurations based on seed
///
/// Key properties:
/// - Same seed + same level = same config
/// - Different seed = different config sequence
/// - Level 100+ caps at max difficulty (survival mode)

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};

/// Constants for level generation
mod LevelConstants {
    // Base values at level 1
    pub const BASE_POINTS: u16 = 20;
    pub const BASE_MOVES: u16 = 30;

    // Max values at level 100
    pub const MAX_POINTS: u16 = 200;
    pub const MAX_MOVES: u16 = 100;

    // Variance bounds (as percentage of base, roughly ±15%)
    pub const POINTS_VARIANCE: u16 = 30; // ±15 points variance range
    pub const MOVES_VARIANCE: u16 = 20; // ±10 moves variance range

    // Star thresholds (percentage of max_moves)
    pub const STAR_3_PERCENT: u16 = 40; // 3 stars if moves <= 40% of max
    pub const STAR_2_PERCENT: u16 = 70; // 2 stars if moves <= 70% of max

    // Level cap for scaling (survival mode after this)
    pub const LEVEL_CAP: u8 = 100;

    // Constraint none threshold
    pub const CONSTRAINT_NONE_THRESHOLD: u8 = 5;
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

        // Calculate base values with linear scaling
        let base_points = Self::calculate_base_points(calc_level);
        let base_moves = Self::calculate_base_moves(calc_level);

        // Apply seed-based variance (use different parts of seed for different values)
        let level_seed_u256: u256 = level_seed.into();
        let points_seed: felt252 = level_seed;
        let moves_seed: felt252 = (level_seed_u256 / 1000).try_into().unwrap();
        
        let points_required = Self::apply_variance(
            base_points, points_seed, LevelConstants::POINTS_VARIANCE, 15, 255,
        );
        let max_moves = Self::apply_variance(
            base_moves, moves_seed, LevelConstants::MOVES_VARIANCE, 20, 127,
        );

        // Calculate star thresholds
        let star_3_threshold = max_moves * LevelConstants::STAR_3_PERCENT / 100;
        let star_2_threshold = max_moves * LevelConstants::STAR_2_PERCENT / 100;

        // Get difficulty and constraint
        let difficulty = Self::get_difficulty_for_level(calc_level);
        let constraint = Self::generate_constraint(level_seed, calc_level);

        LevelConfig {
            level,
            points_required,
            max_moves,
            difficulty,
            constraint,
            star_3_threshold,
            star_2_threshold,
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

    /// Calculate base points for a level (before variance)
    /// Linear scaling: 20 at level 1, 200 at level 100
    #[inline(always)]
    fn calculate_base_points(level: u8) -> u16 {
        if level <= 1 {
            return LevelConstants::BASE_POINTS;
        }

        let range = LevelConstants::MAX_POINTS - LevelConstants::BASE_POINTS; // 180
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        LevelConstants::BASE_POINTS + progress.try_into().unwrap()
    }

    /// Calculate base moves for a level (before variance)
    /// Linear scaling: 30 at level 1, 100 at level 100
    #[inline(always)]
    fn calculate_base_moves(level: u8) -> u16 {
        if level <= 1 {
            return LevelConstants::BASE_MOVES;
        }

        let range = LevelConstants::MAX_MOVES - LevelConstants::BASE_MOVES; // 70
        let progress: u32 = (level.into() - 1) * range.into() / 99;
        LevelConstants::BASE_MOVES + progress.try_into().unwrap()
    }

    /// Apply seed-based variance to a base value
    /// Returns a value in range [min_val, max_val]
    fn apply_variance(
        base: u16, seed: felt252, variance_range: u16, min_val: u16, max_val: u16,
    ) -> u16 {
        let seed_u256: u256 = seed.into();
        let variance_u256: u256 = seed_u256 % variance_range.into();
        let variance: u16 = variance_u256.try_into().unwrap();

        // Center variance around base (subtract half the range)
        let half_range = variance_range / 2;
        let result = if variance >= half_range {
            let add = variance - half_range;
            if base + add > max_val {
                max_val
            } else {
                base + add
            }
        } else {
            let sub = half_range - variance;
            if base < sub + min_val {
                min_val
            } else {
                base - sub
            }
        };

        result
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
        // No constraint for first few levels
        if level <= LevelConstants::CONSTRAINT_NONE_THRESHOLD {
            return LevelConstraintTrait::none();
        }

        let seed_u256: u256 = level_seed.into();

        // Determine constraint type and parameters based on level range
        if level <= 20 {
            // Levels 6-20: Clear 2 lines, 1 time
            LevelConstraintTrait::clear_lines(2, 1)
        } else if level <= 40 {
            // Levels 21-40: Clear 2-3 lines, 1-2 times
            let lines_var: u8 = (seed_u256 % 2).try_into().unwrap();
            let times_var: u8 = ((seed_u256 / 100) % 2).try_into().unwrap();
            LevelConstraintTrait::clear_lines(2 + lines_var, 1 + times_var)
        } else if level <= 60 {
            // Levels 41-60: ClearLines(3-4, 2-3) or NoBonusUsed (20% chance)
            let is_no_bonus = (seed_u256 % 5) == 0;
            if is_no_bonus {
                LevelConstraintTrait::no_bonus()
            } else {
                let lines_var: u8 = (seed_u256 % 2).try_into().unwrap();
                let times_var: u8 = ((seed_u256 / 100) % 2).try_into().unwrap();
                LevelConstraintTrait::clear_lines(3 + lines_var, 2 + times_var)
            }
        } else if level <= 80 {
            // Levels 61-80: Clear 4 lines, 3-4 times
            let times_var: u8 = (seed_u256 % 2).try_into().unwrap();
            LevelConstraintTrait::clear_lines(4, 3 + times_var)
        } else {
            // Levels 81+: Clear 4-5 lines, 4-6 times
            let lines_var: u8 = (seed_u256 % 2).try_into().unwrap();
            let times_var: u8 = ((seed_u256 / 100) % 3).try_into().unwrap();
            let lines = 4 + lines_var;
            let times = 4 + times_var;
            // Cap lines at 5 and times at 6
            let capped_lines = if lines > 5 {
                5
            } else {
                lines
            };
            let capped_times = if times > 6 {
                6
            } else {
                times
            };
            LevelConstraintTrait::clear_lines(capped_lines, capped_times)
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
    fn test_base_points_scaling() {
        assert!(
            LevelGeneratorTrait::calculate_base_points(1) == 20, "Level 1 should have 20 points",
        );
        assert!(
            LevelGeneratorTrait::calculate_base_points(100) == 200,
            "Level 100 should have 200 points",
        );

        // Check intermediate values are in range
        let mid = LevelGeneratorTrait::calculate_base_points(50);
        assert!(mid > 100 && mid < 120, "Level 50 should be around 110");
    }

    #[test]
    fn test_base_moves_scaling() {
        assert!(LevelGeneratorTrait::calculate_base_moves(1) == 30, "Level 1 should have 30 moves");
        assert!(
            LevelGeneratorTrait::calculate_base_moves(100) == 100,
            "Level 100 should have 100 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(50);
        assert!(mid > 60 && mid < 70, "Level 50 should be around 65");
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
    fn test_different_seeds_different_configs() {
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25);

        // At least one of points or moves should differ (very high probability)
        // Note: In rare cases they could be the same by chance
        let points_differ = config1.points_required != config2.points_required;
        let moves_differ = config1.max_moves != config2.max_moves;

        // We check that something is different - this test might very rarely fail
        // but the probability is extremely low
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
        let config5 = LevelGeneratorTrait::generate(TEST_SEED, 5);

        assert!(
            config1.constraint.constraint_type == ConstraintType::None,
            "Level 1 should have no constraint",
        );
        assert!(
            config5.constraint.constraint_type == ConstraintType::None,
            "Level 5 should have no constraint",
        );
    }

    #[test]
    fn test_constraint_after_threshold() {
        let config6 = LevelGeneratorTrait::generate(TEST_SEED, 6);
        let config20 = LevelGeneratorTrait::generate(TEST_SEED, 20);

        // Level 6-20 should have ClearLines constraint
        assert!(
            config6.constraint.constraint_type == ConstraintType::ClearLines,
            "Level 6 should have ClearLines",
        );
        assert!(
            config20.constraint.constraint_type == ConstraintType::ClearLines,
            "Level 20 should have ClearLines",
        );
        assert!(config6.constraint.value == 2, "Level 6 should require clearing 2 lines");
        assert!(config6.constraint.required_count == 1, "Level 6 should require 1 time");
    }

    #[test]
    fn test_star_thresholds() {
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50);

        // Star thresholds should be percentages of max_moves
        let expected_3_star = config.max_moves * 40 / 100;
        let expected_2_star = config.max_moves * 70 / 100;

        assert!(
            config.star_3_threshold == expected_3_star, "3-star threshold should be 40% of max",
        );
        assert!(
            config.star_2_threshold == expected_2_star, "2-star threshold should be 70% of max",
        );
    }

    #[test]
    fn test_generate_full_config() {
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50);

        // Verify all fields are reasonable
        assert!(config.level == 50, "Level should be 50");
        assert!(config.points_required >= 80 && config.points_required <= 140, "Points in range");
        assert!(config.max_moves >= 50 && config.max_moves <= 80, "Moves in range");
        assert!(config.difficulty == Difficulty::Hard, "Level 50 should be Hard");
        assert!(config.star_3_threshold < config.star_2_threshold, "Star thresholds ordered");
        assert!(config.star_2_threshold < config.max_moves, "2-star threshold < max");
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
