/// Level configuration types for the level system
/// Each level has a unique configuration based on the run seed

use zkube::types::difficulty::Difficulty;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};

/// Configuration for a single level
#[derive(Copy, Drop, Serde, Introspect)]
pub struct LevelConfig {
    /// Level number (1-255)
    pub level: u8,
    /// Points required to complete this level
    pub points_required: u16,
    /// Maximum moves allowed
    pub max_moves: u16,
    /// Block generation difficulty
    pub difficulty: Difficulty,
    /// Level constraint (objective)
    pub constraint: LevelConstraint,
    /// Moves threshold for 3 cubes (must complete in <= this many moves)
    pub cube_3_threshold: u16,
    /// Moves threshold for 2 cubes (must complete in <= this many moves)
    pub cube_2_threshold: u16,
}

#[generate_trait]
pub impl LevelConfigImpl of LevelConfigTrait {
    /// Calculate cubes earned based on moves used
    /// 3 cubes: moves <= cube_3_threshold
    /// 2 cubes: moves <= cube_2_threshold
    /// 1 cube: completed
    #[inline(always)]
    fn calculate_cubes(self: LevelConfig, moves_used: u16) -> u8 {
        if moves_used <= self.cube_3_threshold {
            3
        } else if moves_used <= self.cube_2_threshold {
            2
        } else {
            1
        }
    }

    /// Get bonus count earned based on cubes
    /// 3 cubes: 2 random bonuses
    /// 2 cubes: 1 random bonus
    /// 1 cube: no bonus
    #[inline(always)]
    fn get_bonus_reward(cubes: u8) -> u8 {
        match cubes {
            3 => 2,
            2 => 1,
            _ => 0,
        }
    }

    /// Check if level is complete (score reached AND constraints satisfied)
    #[inline(always)]
    fn is_complete(
        self: LevelConfig, current_score: u16, constraint_progress: u8, bonus_used: bool,
    ) -> bool {
        current_score >= self.points_required
            && self.constraint.is_satisfied(constraint_progress, bonus_used)
    }

    /// Check if level failed (exceeded move limit without completing)
    #[inline(always)]
    fn is_failed(
        self: LevelConfig,
        current_score: u16,
        current_moves: u16,
        constraint_progress: u8,
        bonus_used: bool,
    ) -> bool {
        current_moves >= self.max_moves
            && !self.is_complete(current_score, constraint_progress, bonus_used)
    }

    /// Get remaining moves
    #[inline(always)]
    fn remaining_moves(self: LevelConfig, current_moves: u16) -> u16 {
        if current_moves >= self.max_moves {
            0
        } else {
            self.max_moves - current_moves
        }
    }

    /// Get progress percentage (0-100)
    #[inline(always)]
    fn score_progress_percent(self: LevelConfig, current_score: u16) -> u8 {
        if current_score >= self.points_required {
            100
        } else {
            let progress: u32 = (current_score.into() * 100) / self.points_required.into();
            progress.try_into().unwrap()
        }
    }

    /// Get current potential cubes (based on current move count)
    #[inline(always)]
    fn potential_cubes(self: LevelConfig, current_moves: u16) -> u8 {
        if current_moves <= self.cube_3_threshold {
            3
        } else if current_moves <= self.cube_2_threshold {
            2
        } else {
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{LevelConfig, LevelConfigTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::constraint::LevelConstraintTrait;

    fn create_test_config() -> LevelConfig {
        LevelConfig {
            level: 10,
            points_required: 50,
            max_moves: 30,
            difficulty: Difficulty::Medium,
            constraint: LevelConstraintTrait::clear_lines(2, 1),
            cube_3_threshold: 12, // 40% of 30
            cube_2_threshold: 21, // 70% of 30
        }
    }

    #[test]
    fn test_calculate_cubes() {
        let config = create_test_config();

        // 3 cubes: <= 12 moves
        assert!(config.calculate_cubes(10) == 3, "10 moves should be 3 cubes");
        assert!(config.calculate_cubes(12) == 3, "12 moves should be 3 cubes");

        // 2 cubes: 13-21 moves
        assert!(config.calculate_cubes(13) == 2, "13 moves should be 2 cubes");
        assert!(config.calculate_cubes(21) == 2, "21 moves should be 2 cubes");

        // 1 cube: > 21 moves
        assert!(config.calculate_cubes(22) == 1, "22 moves should be 1 cube");
        assert!(config.calculate_cubes(30) == 1, "30 moves should be 1 cube");
    }

    #[test]
    fn test_bonus_reward() {
        assert!(LevelConfigTrait::get_bonus_reward(3) == 2, "3 cubes should give 2 bonuses");
        assert!(LevelConfigTrait::get_bonus_reward(2) == 1, "2 cubes should give 1 bonus");
        assert!(LevelConfigTrait::get_bonus_reward(1) == 0, "1 cube should give 0 bonuses");
        assert!(LevelConfigTrait::get_bonus_reward(0) == 0, "0 cubes should give 0 bonuses");
    }

    #[test]
    fn test_is_complete() {
        let config = create_test_config();

        // Not complete: score too low
        assert!(!config.is_complete(40, 1, false), "Should not be complete with low score");

        // Not complete: constraint not met
        assert!(!config.is_complete(50, 0, false), "Should not be complete without constraint");

        // Complete: score met and constraint met
        assert!(config.is_complete(50, 1, false), "Should be complete");
        assert!(config.is_complete(60, 2, false), "Should be complete with higher score");
    }

    #[test]
    fn test_is_failed() {
        let config = create_test_config();

        // Not failed: still have moves
        assert!(!config.is_failed(40, 25, 0, false), "Should not be failed with moves left");

        // Not failed: completed even at move limit
        assert!(!config.is_failed(50, 30, 1, false), "Should not be failed if completed");

        // Failed: move limit reached without completing
        assert!(config.is_failed(40, 30, 0, false), "Should be failed at move limit");
        assert!(config.is_failed(50, 30, 0, false), "Should be failed - constraint not met");
    }

    #[test]
    fn test_remaining_moves() {
        let config = create_test_config();

        assert!(config.remaining_moves(0) == 30, "Should have 30 remaining at start");
        assert!(config.remaining_moves(15) == 15, "Should have 15 remaining at halfway");
        assert!(config.remaining_moves(30) == 0, "Should have 0 remaining at limit");
        assert!(config.remaining_moves(35) == 0, "Should have 0 remaining past limit");
    }

    #[test]
    fn test_score_progress_percent() {
        let config = create_test_config();

        assert!(config.score_progress_percent(0) == 0, "0 score should be 0%");
        assert!(config.score_progress_percent(25) == 50, "25/50 should be 50%");
        assert!(config.score_progress_percent(50) == 100, "50/50 should be 100%");
        assert!(config.score_progress_percent(60) == 100, "Over goal should be 100%");
    }

    #[test]
    fn test_potential_cubes() {
        let config = create_test_config();

        assert!(config.potential_cubes(5) == 3, "5 moves should allow 3 cubes");
        assert!(config.potential_cubes(12) == 3, "12 moves should allow 3 cubes");
        assert!(config.potential_cubes(13) == 2, "13 moves should allow 2 cubes");
        assert!(config.potential_cubes(21) == 2, "21 moves should allow 2 cubes");
        assert!(config.potential_cubes(22) == 1, "22 moves should allow 1 cube");
    }
}
