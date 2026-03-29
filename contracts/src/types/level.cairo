use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};
/// Level configuration types for the level system
/// Each level has a unique configuration based on the run seed

use zkube::types::difficulty::Difficulty;

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
    /// Primary constraint (objective)
    pub constraint: LevelConstraint,
    /// Secondary constraint (can be None for single constraint levels)
    pub constraint_2: LevelConstraint,
    /// Tertiary constraint (can be None; only used on triple-constraint boss levels 40/50)
    pub constraint_3: LevelConstraint,
}

#[generate_trait]
pub impl LevelConfigImpl of LevelConfigTrait {
    // V3.0: get_bonus_reward removed - bonuses are only bought in shops

    /// Check if level is complete (score reached AND all constraints satisfied)
    #[inline(always)]
    fn is_complete(
        self: LevelConfig,
        current_score: u16,
        constraint_progress: u8,
        constraint_2_progress: u8,
        constraint_3_progress: u8,
        bonus_used: bool,
    ) -> bool {
        current_score >= self.points_required
            && self.constraint.is_satisfied(constraint_progress, bonus_used)
            && self.constraint_2.is_satisfied(constraint_2_progress, bonus_used)
            && self.constraint_3.is_satisfied(constraint_3_progress, bonus_used)
    }

    /// Check if level failed (exceeded move limit without completing)
    #[inline(always)]
    fn is_failed(
        self: LevelConfig,
        current_score: u16,
        current_moves: u16,
        constraint_progress: u8,
        constraint_2_progress: u8,
        constraint_3_progress: u8,
        bonus_used: bool,
    ) -> bool {
        current_moves >= self.max_moves
            && !self
                .is_complete(
                    current_score,
                    constraint_progress,
                    constraint_2_progress,
                    constraint_3_progress,
                    bonus_used,
                )
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

}

#[cfg(test)]
mod tests {
    use zkube::types::constraint::LevelConstraintTrait;
    use zkube::types::difficulty::Difficulty;
    use super::{LevelConfig, LevelConfigTrait};

    fn create_test_config() -> LevelConfig {
        LevelConfig {
            level: 10,
            points_required: 50,
            max_moves: 30,
            difficulty: Difficulty::Medium,
            constraint: LevelConstraintTrait::combo_lines(2, 1),
            constraint_2: LevelConstraintTrait::none(), // No secondary constraint
            constraint_3: LevelConstraintTrait::none(), // No tertiary constraint
        }
    }

    // V3.0: test_bonus_reward removed - get_bonus_reward was removed

    #[test]
    fn test_is_complete() {
        let config = create_test_config();

        // Not complete: score too low (constraint_2/3_progress=0 since they are None)
        assert!(!config.is_complete(40, 1, 0, 0, false), "Should not be complete with low score");

        // Not complete: constraint not met
        assert!(
            !config.is_complete(50, 0, 0, 0, false), "Should not be complete without constraint",
        );

        // Complete: score met and constraint met
        assert!(config.is_complete(50, 1, 0, 0, false), "Should be complete");
        assert!(config.is_complete(60, 2, 0, 0, false), "Should be complete with higher score");
    }

    #[test]
    fn test_is_failed() {
        let config = create_test_config();

        // Not failed: still have moves
        assert!(!config.is_failed(40, 25, 0, 0, 0, false), "Should not be failed with moves left");

        // Not failed: completed even at move limit
        assert!(!config.is_failed(50, 30, 1, 0, 0, false), "Should not be failed if completed");

        // Failed: move limit reached without completing
        assert!(config.is_failed(40, 30, 0, 0, 0, false), "Should be failed at move limit");
        assert!(config.is_failed(50, 30, 0, 0, 0, false), "Should be failed - constraint not met");
    }

    #[test]
    fn test_dual_constraints() {
        // Create config with both constraints
        let config = LevelConfig {
            level: 20,
            points_required: 60,
            max_moves: 35,
            difficulty: Difficulty::Hard,
            constraint: LevelConstraintTrait::combo_lines(3, 2), // Clear 3+ lines, 2 times
            constraint_2: LevelConstraintTrait::combo_lines(2, 3), // Clear 2+ lines, 3 times
            constraint_3: LevelConstraintTrait::none(),
        };

        // Not complete: first constraint not met
        assert!(
            !config.is_complete(60, 1, 3, 0, false), "Should not complete - constraint 1 not met",
        );

        // Not complete: second constraint not met
        assert!(
            !config.is_complete(60, 2, 2, 0, false), "Should not complete - constraint 2 not met",
        );

        // Complete: both constraints met
        assert!(config.is_complete(60, 2, 3, 0, false), "Should complete with both constraints");
    }

    #[test]
    fn test_mixed_constraints() {
        // ComboLines + KeepGridBelow
        let config = LevelConfig {
            level: 25,
            points_required: 70,
            max_moves: 40,
            difficulty: Difficulty::Hard,
            constraint: LevelConstraintTrait::combo_lines(3, 2),
            constraint_2: LevelConstraintTrait::keep_grid_below(),
            constraint_3: LevelConstraintTrait::none(),
        };

        // Not complete: KeepGridBelow breached
        assert!(!config.is_complete(70, 2, 1, 0, false), "Should not complete - grid cap breached");

        // Complete: both constraints met (ComboLines satisfied, keep-grid-below not breached)
        assert!(config.is_complete(70, 2, 0, 0, false), "Should complete with both constraints");
    }

    #[test]
    fn test_triple_constraints() {
        // ComboLines + ComboStreak + KeepGridBelow (boss level 40/50)
        let config = LevelConfig {
            level: 40,
            points_required: 80,
            max_moves: 50,
            difficulty: Difficulty::Expert,
            constraint: LevelConstraintTrait::combo_lines(3, 3),
            constraint_2: LevelConstraintTrait::combo_streak(5),
            constraint_3: LevelConstraintTrait::keep_grid_below(),
        };

        // Not complete: third constraint (KeepGridBelow) failed
        assert!(!config.is_complete(80, 3, 1, 1, false), "Should not complete - grid cap breached");

        // Not complete: second constraint not met
        assert!(
            !config.is_complete(80, 3, 0, 0, false), "Should not complete - combo not achieved",
        );

        // Complete: all three constraints met
        assert!(config.is_complete(80, 3, 1, 0, false), "Should complete with triple constraints");
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

}
