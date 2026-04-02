/// Constraint types for the level system
/// Constraints are level-specific objectives that must be met to complete a level
///
/// 5 constraint types (0-4):
/// - None: No constraint
/// - ComboLines: Clear X lines in a single move, Y times
/// - BreakBlocks: Destroy X blocks of a specific size, accumulating count
/// - ComboStreak: Reach a combo of X (one-shot: progress=1 once triggered)
/// - KeepGridBelow: Keep grid below X filled rows (boss-only, fail-on-breach)

#[derive(Copy, Drop, Serde, PartialEq, Introspect, Debug)]
pub enum ConstraintType {
    /// No constraint - just reach the point goal
    None,
    /// Must clear X lines in a single move, Y times
    /// value = lines to clear, required_count = how many times
    ComboLines,
    /// Must destroy blocks of a specific size, accumulating count
    /// value = block_size (1-4), required_count = total blocks to destroy
    BreakBlocks,
    /// Must achieve a combo of at least X lines in a single level
    /// value = combo_target, required_count = 1 (one-shot)
    ComboStreak,
    /// Must keep grid below X filled rows (boss-only, fail-on-breach)
    KeepGridBelow,
}

/// A level constraint with its parameters
#[derive(Copy, Drop, Serde, Introspect, Debug)]
pub struct LevelConstraint {
    /// The type of constraint
    pub constraint_type: ConstraintType,
    /// Meaning varies by type:
    /// - ComboLines: number of lines to clear in one move
    /// - BreakBlocks: block size to target (1-4)
    /// - ComboStreak: combo target to reach
    /// - None: 0
    /// - KeepGridBelow: exclusive filled-row cap (must stay below this many rows)
    pub value: u8,
    /// Meaning varies by type:
    /// - ComboLines: how many times to achieve it
    /// - BreakBlocks: total blocks to destroy
    /// - ComboStreak: 1 (always one-shot)
    /// - None: 0
    /// - KeepGridBelow: 1 (unused by evaluation, kept for consistency)
    pub required_count: u8,
}

/// Context gathered during a move/bonus for constraint evaluation.
/// Built by the caller (grid system), consumed by update_progress.
#[derive(Copy, Drop, Serde, Debug)]
pub struct ConstraintContext {
    /// Total lines cleared this action (across both assess_game passes)
    pub lines_cleared: u8,
    /// Current combo counter value AFTER this action
    pub combo_counter: u8,
    /// Highest occupied row index before this action (0 = bottom, 9 = top)
    pub highest_row_before: u8,
    /// Highest occupied row index after this action resolves (post-gravity, post-line-clear)
    pub highest_row_after: u8,
    /// Whether the grid is completely empty after this action (blocks == 0)
    pub grid_is_empty: bool,
    /// Number of blocks of the target size destroyed this action
    /// Only computed when a BreakBlocks constraint is active (gated)
    pub blocks_destroyed_of_target_size: u8,
}

#[generate_trait]
pub impl ConstraintContextImpl of ConstraintContextTrait {
    /// Create a default empty context
    #[inline(always)]
    fn empty() -> ConstraintContext {
        ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        }
    }
}

#[generate_trait]
pub impl LevelConstraintImpl of LevelConstraintTrait {
    /// Create a default (no constraint) constraint
    #[inline(always)]
    fn none() -> LevelConstraint {
        LevelConstraint { constraint_type: ConstraintType::None, value: 0, required_count: 0 }
    }

    /// Create a ComboLines constraint
    #[inline(always)]
    fn combo_lines(lines: u8, times: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::ComboLines, value: lines, required_count: times,
        }
    }

    /// Create a BreakBlocks constraint
    #[inline(always)]
    fn break_blocks(block_size: u8, count: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::BreakBlocks, value: block_size, required_count: count,
        }
    }

    /// Create a ComboStreak constraint
    #[inline(always)]
    fn combo_streak(combo_target: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::ComboStreak, value: combo_target, required_count: 1,
        }
    }

    /// Create a KeepGridBelow constraint with an exclusive filled-row cap.
    /// Example: max_rows_exclusive = 8 means the grid must stay below 8 filled rows.
    #[inline(always)]
    fn keep_grid_below_with_cap(max_rows_exclusive: u8) -> LevelConstraint {
        let cap = if max_rows_exclusive < 1 {
            1
        } else {
            max_rows_exclusive
        };
        LevelConstraint {
            constraint_type: ConstraintType::KeepGridBelow, value: cap, required_count: 1,
        }
    }

    /// Create a default KeepGridBelow constraint.
    /// Default cap is 8 filled rows (exclusive).
    #[inline(always)]
    fn keep_grid_below() -> LevelConstraint {
        Self::keep_grid_below_with_cap(8)
    }

    /// Check if constraint is satisfied
    /// - progress: current accumulated progress
    /// - bonus_used: whether any bonus was used this level
    #[inline(always)]
    fn is_satisfied(self: LevelConstraint, progress: u8, bonus_used: bool) -> bool {
        let _ = bonus_used;
        match self.constraint_type {
            ConstraintType::None => true,
            ConstraintType::ComboLines => progress >= self.required_count,
            ConstraintType::BreakBlocks => progress >= self.required_count,
            ConstraintType::ComboStreak => progress >= 1,
            ConstraintType::KeepGridBelow => progress == 0,
        }
    }

    /// Update progress after a move/bonus action using ConstraintContext.
    /// Returns the new progress value.
    #[inline(always)]
    fn update_progress(self: LevelConstraint, current_progress: u8, ctx: ConstraintContext) -> u8 {
        match self.constraint_type {
            ConstraintType::None => current_progress,
            ConstraintType::ComboLines => {
                if ctx.lines_cleared >= self.value {
                    // Clamp progress to required_count
                    let next: u16 = current_progress.into() + 1;
                    let max_needed: u16 = self.required_count.into();
                    if next > max_needed {
                        self.required_count
                    } else {
                        next.try_into().unwrap()
                    }
                } else {
                    current_progress
                }
            },
            ConstraintType::BreakBlocks => {
                if ctx.blocks_destroyed_of_target_size > 0 {
                    // Accumulate destroyed count, clamp to required_count
                    let next: u16 = current_progress.into()
                        + ctx.blocks_destroyed_of_target_size.into();
                    let max_needed: u16 = self.required_count.into();
                    if next > max_needed {
                        self.required_count
                    } else {
                        next.try_into().unwrap()
                    }
                } else {
                    current_progress
                }
            },
            ConstraintType::ComboStreak => {
                // One-shot: set to 1 once combo_counter reaches target
                if current_progress >= 1 {
                    1 // Already achieved
                } else if ctx.combo_counter >= self.value {
                    1
                } else {
                    0
                }
            },
            ConstraintType::KeepGridBelow => {
                // Violation flag mode for "keep grid below cap".
                // progress: 0 = still valid, 1 = breached at least once.
                // value stores the exclusive row cap (e.g. 8 means rows_filled_after must be <= 7).
                if current_progress >= 1 {
                    1
                } else {
                    let rows_filled_after: u8 = if ctx.grid_is_empty {
                        0
                    } else {
                        ctx.highest_row_after + 1
                    };
                    let max_rows_exclusive: u8 = if self.value == 0 {
                        1
                    } else {
                        self.value
                    };
                    if rows_filled_after >= max_rows_exclusive {
                        1
                    } else {
                        0
                    }
                }
            },
        }
    }

    /// Get a human-readable description (for debugging/events)
    fn get_description(self: LevelConstraint) -> felt252 {
        match self.constraint_type {
            ConstraintType::None => 'NO_CONSTRAINT',
            ConstraintType::ComboLines => 'COMBO_LINES',
            ConstraintType::BreakBlocks => 'BREAK_BLOCKS',
            ConstraintType::ComboStreak => 'COMBO_STREAK',
            ConstraintType::KeepGridBelow => 'KEEP_GRID_BELOW',
        }
    }

    /// Check if this constraint requires BreakBlocks tracking (expensive computation gate)
    #[inline(always)]
    fn needs_break_blocks_tracking(self: LevelConstraint) -> bool {
        self.constraint_type == ConstraintType::BreakBlocks
    }

    /// Check if this constraint is a boss-only type
    #[inline(always)]
    fn is_boss_only(self: LevelConstraint) -> bool {
        self.constraint_type == ConstraintType::KeepGridBelow
    }
}

/// Check if ANY of the given constraints require BreakBlocks tracking
pub fn any_needs_break_blocks(
    c1: LevelConstraint, c2: LevelConstraint, c3: LevelConstraint,
) -> bool {
    c1.needs_break_blocks_tracking()
        || c2.needs_break_blocks_tracking()
        || c3.needs_break_blocks_tracking()
}

/// Get the target block size for BreakBlocks from up to 3 constraints.
/// Returns 0 if no BreakBlocks constraint is active.
pub fn get_break_blocks_target_size(
    c1: LevelConstraint, c2: LevelConstraint, c3: LevelConstraint,
) -> u8 {
    if c1.needs_break_blocks_tracking() {
        c1.value
    } else if c2.needs_break_blocks_tracking() {
        c2.value
    } else if c3.needs_break_blocks_tracking() {
        c3.value
    } else {
        0
    }
}

// Conversion implementations
impl ConstraintTypeIntoU8 of Into<ConstraintType, u8> {
    #[inline(always)]
    fn into(self: ConstraintType) -> u8 {
        match self {
            ConstraintType::None => 0,
            ConstraintType::ComboLines => 1,
            ConstraintType::BreakBlocks => 2,
            ConstraintType::ComboStreak => 3,
            ConstraintType::KeepGridBelow => 4,
        }
    }
}

impl U8IntoConstraintType of Into<u8, ConstraintType> {
    #[inline(always)]
    fn into(self: u8) -> ConstraintType {
        match self {
            0 => ConstraintType::None,
            1 => ConstraintType::ComboLines,
            2 => ConstraintType::BreakBlocks,
            3 => ConstraintType::ComboStreak,
            4 => ConstraintType::KeepGridBelow,
            _ => ConstraintType::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ConstraintContext, ConstraintContextTrait, ConstraintType, LevelConstraintTrait};

    #[test]
    fn test_constraint_none() {
        let constraint = LevelConstraintTrait::none();
        assert!(constraint.is_satisfied(0, false), "None constraint should be satisfied");
        assert!(
            constraint.is_satisfied(0, true), "None constraint should be satisfied even with bonus",
        );
    }

    #[test]
    fn test_constraint_combo_lines() {
        // Clear 3 lines, 2 times
        let constraint = LevelConstraintTrait::combo_lines(3, 2);

        // Not satisfied with 0 progress
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied with 0 progress");

        // Not satisfied with 1 progress
        assert!(!constraint.is_satisfied(1, false), "Should not be satisfied with 1 progress");

        // Satisfied with 2 progress
        assert!(constraint.is_satisfied(2, false), "Should be satisfied with 2 progress");

        // Satisfied with more than required
        assert!(constraint.is_satisfied(3, false), "Should be satisfied with 3 progress");
    }

    #[test]
    fn test_constraint_combo_lines_progress() {
        let constraint = LevelConstraintTrait::combo_lines(3, 2);

        // Clearing 2 lines doesn't count (need 3)
        let ctx = ConstraintContext {
            lines_cleared: 2,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Clearing 2 lines shouldn't increment progress");

        // Clearing 3 lines counts
        let ctx = ConstraintContext {
            lines_cleared: 3,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 1, "Clearing 3 lines should increment progress");

        // Clearing 4 lines also counts
        let ctx = ConstraintContext {
            lines_cleared: 4,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress = constraint.update_progress(1, ctx);
        assert!(progress == 2, "Clearing 4 lines should increment progress");
    }

    #[test]
    fn test_constraint_break_blocks() {
        let constraint = LevelConstraintTrait::break_blocks(2, 10);

        // Not satisfied with 0
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied with 0");

        // Progress accumulates
        let ctx = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 3,
        };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 3, "Should accumulate 3 blocks");

        let ctx2 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 5,
        };
        let progress2 = constraint.update_progress(3, ctx2);
        assert!(progress2 == 8, "Should accumulate to 8");

        // Clamps at required_count
        let ctx3 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 5,
        };
        let progress3 = constraint.update_progress(8, ctx3);
        assert!(progress3 == 10, "Should clamp at 10");

        // Satisfied at 10
        assert!(constraint.is_satisfied(10, false), "Should be satisfied at 10");
    }

    #[test]
    fn test_constraint_combo_streak() {
        let constraint = LevelConstraintTrait::combo_streak(5);

        // Not satisfied at 0
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied at 0");

        // Combo 4 doesn't trigger
        let ctx = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 4,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Combo 4 shouldn't trigger");

        // Combo 5 triggers (one-shot)
        let ctx2 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 5,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress2 = constraint.update_progress(0, ctx2);
        assert!(progress2 == 1, "Combo 5 should trigger");

        // Stays at 1
        let ctx3 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 3,
            highest_row_before: 0,
            highest_row_after: 0,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress3 = constraint.update_progress(1, ctx3);
        assert!(progress3 == 1, "Should stay at 1 once achieved");

        assert!(constraint.is_satisfied(1, false), "Should be satisfied at 1");
    }

    #[test]
    fn test_constraint_keep_grid_below() {
        let constraint = LevelConstraintTrait::keep_grid_below_with_cap(8);

        // Satisfied initially (not breached yet)
        assert!(constraint.is_satisfied(0, false), "Should be satisfied before breach");

        // 7 filled rows (below cap) keeps it valid
        let ctx = ConstraintContext {
            lines_cleared: 5,
            combo_counter: 0,
            highest_row_before: 3,
            highest_row_after: 6,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Below-cap grid should keep constraint valid");

        // 8 filled rows (at cap) breaches the constraint
        let ctx2 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 7,
            highest_row_after: 7,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress2 = constraint.update_progress(0, ctx2);
        assert!(progress2 == 1, "At-cap grid should breach");

        // Once breached, it stays breached
        let ctx3 = ConstraintContext {
            lines_cleared: 0,
            combo_counter: 0,
            highest_row_before: 7,
            highest_row_after: 2,
            grid_is_empty: false,
            blocks_destroyed_of_target_size: 0,
        };
        let progress3 = constraint.update_progress(progress2, ctx3);
        assert!(progress3 == 1, "Breach should be sticky");

        assert!(!constraint.is_satisfied(1, false), "Breached keep-grid-below should fail");
    }

    #[test]
    fn test_constraint_type_conversion() {
        let none: u8 = ConstraintType::None.into();
        let clear: u8 = ConstraintType::ComboLines.into();
        let break_b: u8 = ConstraintType::BreakBlocks.into();
        let combo: u8 = ConstraintType::ComboStreak.into();
        let keep_grid_below: u8 = ConstraintType::KeepGridBelow.into();

        assert!(none == 0, "None should be 0");
        assert!(clear == 1, "ComboLines should be 1");
        assert!(break_b == 2, "BreakBlocks should be 2");
        assert!(combo == 3, "ComboStreak should be 3");
        assert!(keep_grid_below == 4, "KeepGridBelow should be 4");

        let none_back: ConstraintType = 0_u8.into();
        let clear_back: ConstraintType = 1_u8.into();
        let break_back: ConstraintType = 2_u8.into();
        let combo_back: ConstraintType = 3_u8.into();
        let keep_grid_below_back: ConstraintType = 4_u8.into();

        assert!(none_back == ConstraintType::None, "Should convert back to None");
        assert!(clear_back == ConstraintType::ComboLines, "Should convert back to ComboLines");
        assert!(break_back == ConstraintType::BreakBlocks, "Should convert back to BreakBlocks");
        assert!(combo_back == ConstraintType::ComboStreak, "Should convert back to ComboStreak");
        assert!(
            keep_grid_below_back == ConstraintType::KeepGridBelow,
            "Should convert back to KeepGridBelow",
        );
    }

    #[test]
    fn test_context_empty() {
        let ctx = ConstraintContextTrait::empty();
        assert!(ctx.lines_cleared == 0, "Should be 0");
        assert!(ctx.combo_counter == 0, "Should be 0");
        assert!(ctx.highest_row_before == 0, "Should be 0");
        assert!(ctx.highest_row_after == 0, "Should be 0");
        assert!(ctx.grid_is_empty == false, "Should be false");
        assert!(ctx.blocks_destroyed_of_target_size == 0, "Should be 0");
    }

    #[test]
    fn test_boss_only_check() {
        assert!(!LevelConstraintTrait::none().is_boss_only(), "None is not boss-only");
        assert!(
            !LevelConstraintTrait::combo_lines(3, 2).is_boss_only(), "ComboLines is not boss-only",
        );
        assert!(
            !LevelConstraintTrait::break_blocks(2, 5).is_boss_only(),
            "BreakBlocks is not boss-only",
        );
        assert!(
            !LevelConstraintTrait::combo_streak(5).is_boss_only(), "ComboStreak is not boss-only",
        );
        assert!(
            LevelConstraintTrait::keep_grid_below().is_boss_only(), "KeepGridBelow is boss-only",
        );
    }
}
