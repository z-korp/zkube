/// Constraint types for the level system
/// Constraints are level-specific objectives that must be met to complete a level
///
/// 7 constraint types (0-6):
/// - None: No constraint
/// - ClearLines: Clear X lines in a single move, Y times
/// - BreakBlocks: Destroy X blocks of a specific size, accumulating count
/// - AchieveCombo: Reach a combo of X (one-shot: progress=1 once triggered)
/// - Fill: Fill X rows Y times (tracked via highest_row_after — grid height after resolve)
/// - NoBonusUsed: Complete level without using any bonus (boss-only)
/// - ClearGrid: Clear the entire grid (boss-only, one-shot)

#[derive(Copy, Drop, Serde, PartialEq, Introspect, Debug)]
pub enum ConstraintType {
    /// No constraint - just reach the point goal
    None,
    /// Must clear X lines in a single move, Y times
    /// value = lines to clear, required_count = how many times
    ClearLines,
    /// Must destroy blocks of a specific size, accumulating count
    /// value = block_size (1-4), required_count = total blocks to destroy
    BreakBlocks,
    /// Must achieve a combo of at least X lines in a single level
    /// value = combo_target, required_count = 1 (one-shot)
    AchieveCombo,
    /// Must fill X rows Y times (grid fills to row X height, then clears lines)
    /// value = rows_to_fill (row height target), required_count = how many times
    FillAndClear,
    /// Must complete level without using any bonus (boss-only)
    NoBonusUsed,
    /// Must clear the entire grid to 0 blocks (boss-only, one-shot)
    ClearGrid,
}

/// A level constraint with its parameters
#[derive(Copy, Drop, Serde, Introspect, Debug)]
pub struct LevelConstraint {
    /// The type of constraint
    pub constraint_type: ConstraintType,
    /// Meaning varies by type:
    /// - ClearLines: number of lines to clear in one move
    /// - BreakBlocks: block size to target (1-4)
    /// - AchieveCombo: combo target to reach
    /// - FillAndClear: rows to fill (row height target)
    /// - NoBonusUsed/ClearGrid/None: 0
    pub value: u8,
    /// Meaning varies by type:
    /// - ClearLines: how many times to achieve it
    /// - BreakBlocks: total blocks to destroy
    /// - AchieveCombo: 1 (always one-shot)
    /// - FillAndClear: how many times
    /// - NoBonusUsed/ClearGrid/None: 0
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

    /// Create a ClearLines constraint
    #[inline(always)]
    fn clear_lines(lines: u8, times: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::ClearLines, value: lines, required_count: times,
        }
    }

    /// Create a BreakBlocks constraint
    #[inline(always)]
    fn break_blocks(block_size: u8, count: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::BreakBlocks, value: block_size, required_count: count,
        }
    }

    /// Create an AchieveCombo constraint
    #[inline(always)]
    fn achieve_combo(combo_target: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::AchieveCombo, value: combo_target, required_count: 1,
        }
    }

    /// Create a Fill constraint (fill X rows Y times)
    #[inline(always)]
    fn fill_and_clear(row_height: u8, times: u8) -> LevelConstraint {
        LevelConstraint {
            constraint_type: ConstraintType::FillAndClear, value: row_height, required_count: times,
        }
    }

    /// Create a NoBonusUsed constraint
    #[inline(always)]
    fn no_bonus() -> LevelConstraint {
        LevelConstraint { constraint_type: ConstraintType::NoBonusUsed, value: 0, required_count: 0 }
    }

    /// Create a ClearGrid constraint
    #[inline(always)]
    fn clear_grid() -> LevelConstraint {
        LevelConstraint { constraint_type: ConstraintType::ClearGrid, value: 0, required_count: 1 }
    }

    /// Check if constraint is satisfied
    /// - progress: current accumulated progress
    /// - bonus_used: whether any bonus was used this level
    #[inline(always)]
    fn is_satisfied(self: LevelConstraint, progress: u8, bonus_used: bool) -> bool {
        match self.constraint_type {
            ConstraintType::None => true,
            ConstraintType::ClearLines => progress >= self.required_count,
            ConstraintType::BreakBlocks => progress >= self.required_count,
            ConstraintType::AchieveCombo => progress >= 1,
            ConstraintType::FillAndClear => progress >= self.required_count,
            ConstraintType::NoBonusUsed => !bonus_used,
            ConstraintType::ClearGrid => progress >= 1,
        }
    }

    /// Update progress after a move/bonus action using ConstraintContext.
    /// Returns the new progress value.
    #[inline(always)]
    fn update_progress(self: LevelConstraint, current_progress: u8, ctx: ConstraintContext) -> u8 {
        match self.constraint_type {
            ConstraintType::None => current_progress,
            ConstraintType::ClearLines => {
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
                    let next: u16 = current_progress.into() + ctx.blocks_destroyed_of_target_size.into();
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
            ConstraintType::AchieveCombo => {
                // One-shot: set to 1 once combo_counter reaches target
                if current_progress >= 1 {
                    1 // Already achieved
                } else if ctx.combo_counter >= self.value {
                    1
                } else {
                    0
                }
            },
            ConstraintType::FillAndClear => {
                // Fill constraint: grid reaches target row height after move resolves
                // highest_row_after is 0-indexed (0 = bottom row only, 9 = top)
                // value is the row height target (e.g., 7 means row index 7 occupied after resolve)
                // Triggers when the grid height after everything resolves (gravity + line clears)
                // meets or exceeds the target
                if ctx.highest_row_after >= self.value {
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
            ConstraintType::NoBonusUsed => current_progress, // Tracked via bonus_used flag
            ConstraintType::ClearGrid => {
                // One-shot: set to 1 when grid is completely empty
                if current_progress >= 1 {
                    1
                } else if ctx.grid_is_empty {
                    1
                } else {
                    0
                }
            },
        }
    }

    /// Get a human-readable description (for debugging/events)
    fn get_description(self: LevelConstraint) -> felt252 {
        match self.constraint_type {
            ConstraintType::None => 'NO_CONSTRAINT',
            ConstraintType::ClearLines => 'CLEAR_LINES',
            ConstraintType::BreakBlocks => 'BREAK_BLOCKS',
            ConstraintType::AchieveCombo => 'ACHIEVE_COMBO',
            ConstraintType::FillAndClear => 'FILL',
            ConstraintType::NoBonusUsed => 'NO_BONUS',
            ConstraintType::ClearGrid => 'CLEAR_GRID',
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
        self.constraint_type == ConstraintType::NoBonusUsed
            || self.constraint_type == ConstraintType::ClearGrid
    }
}

/// Check if ANY of the given constraints require BreakBlocks tracking
pub fn any_needs_break_blocks(c1: LevelConstraint, c2: LevelConstraint, c3: LevelConstraint) -> bool {
    c1.needs_break_blocks_tracking()
        || c2.needs_break_blocks_tracking()
        || c3.needs_break_blocks_tracking()
}

/// Get the target block size for BreakBlocks from up to 3 constraints.
/// Returns 0 if no BreakBlocks constraint is active.
pub fn get_break_blocks_target_size(c1: LevelConstraint, c2: LevelConstraint, c3: LevelConstraint) -> u8 {
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
            ConstraintType::ClearLines => 1,
            ConstraintType::BreakBlocks => 2,
            ConstraintType::AchieveCombo => 3,
            ConstraintType::FillAndClear => 4,
            ConstraintType::NoBonusUsed => 5,
            ConstraintType::ClearGrid => 6,
        }
    }
}

impl U8IntoConstraintType of Into<u8, ConstraintType> {
    #[inline(always)]
    fn into(self: u8) -> ConstraintType {
        match self {
            0 => ConstraintType::None,
            1 => ConstraintType::ClearLines,
            2 => ConstraintType::BreakBlocks,
            3 => ConstraintType::AchieveCombo,
            4 => ConstraintType::FillAndClear,
            5 => ConstraintType::NoBonusUsed,
            6 => ConstraintType::ClearGrid,
            _ => ConstraintType::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{
        ConstraintType, LevelConstraint, LevelConstraintTrait,
        ConstraintContext, ConstraintContextTrait,
    };

    #[test]
    fn test_constraint_none() {
        let constraint = LevelConstraintTrait::none();
        assert!(constraint.is_satisfied(0, false), "None constraint should be satisfied");
        assert!(constraint.is_satisfied(0, true), "None constraint should be satisfied even with bonus");
    }

    #[test]
    fn test_constraint_clear_lines() {
        // Clear 3 lines, 2 times
        let constraint = LevelConstraintTrait::clear_lines(3, 2);
        
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
    fn test_constraint_clear_lines_progress() {
        let constraint = LevelConstraintTrait::clear_lines(3, 2);
        
        // Clearing 2 lines doesn't count (need 3)
        let ctx = ConstraintContext { lines_cleared: 2, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Clearing 2 lines shouldn't increment progress");
        
        // Clearing 3 lines counts
        let ctx = ConstraintContext { lines_cleared: 3, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 1, "Clearing 3 lines should increment progress");
        
        // Clearing 4 lines also counts
        let ctx = ConstraintContext { lines_cleared: 4, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(1, ctx);
        assert!(progress == 2, "Clearing 4 lines should increment progress");
    }

    #[test]
    fn test_constraint_break_blocks() {
        let constraint = LevelConstraintTrait::break_blocks(2, 10);
        
        // Not satisfied with 0
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied with 0");
        
        // Progress accumulates
        let ctx = ConstraintContext { lines_cleared: 0, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 3 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 3, "Should accumulate 3 blocks");
        
        let ctx2 = ConstraintContext { lines_cleared: 0, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 5 };
        let progress2 = constraint.update_progress(3, ctx2);
        assert!(progress2 == 8, "Should accumulate to 8");
        
        // Clamps at required_count
        let ctx3 = ConstraintContext { lines_cleared: 0, combo_counter: 0, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 5 };
        let progress3 = constraint.update_progress(8, ctx3);
        assert!(progress3 == 10, "Should clamp at 10");
        
        // Satisfied at 10
        assert!(constraint.is_satisfied(10, false), "Should be satisfied at 10");
    }

    #[test]
    fn test_constraint_achieve_combo() {
        let constraint = LevelConstraintTrait::achieve_combo(5);
        
        // Not satisfied at 0
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied at 0");
        
        // Combo 4 doesn't trigger
        let ctx = ConstraintContext { lines_cleared: 0, combo_counter: 4, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Combo 4 shouldn't trigger");
        
        // Combo 5 triggers (one-shot)
        let ctx2 = ConstraintContext { lines_cleared: 0, combo_counter: 5, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress2 = constraint.update_progress(0, ctx2);
        assert!(progress2 == 1, "Combo 5 should trigger");
        
        // Stays at 1
        let ctx3 = ConstraintContext { lines_cleared: 0, combo_counter: 3, highest_row_before: 0, highest_row_after: 0, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress3 = constraint.update_progress(1, ctx3);
        assert!(progress3 == 1, "Should stay at 1 once achieved");
        
        assert!(constraint.is_satisfied(1, false), "Should be satisfied at 1");
    }

    #[test]
    fn test_constraint_fill() {
        // Fill 7 rows, 2 times
        let constraint = LevelConstraintTrait::fill_and_clear(7, 2);
        
        // Grid not high enough after resolve
        let ctx = ConstraintContext { lines_cleared: 2, combo_counter: 0, highest_row_before: 5, highest_row_after: 4, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Row 4 after resolve too low for target 7");
        
        // Grid height meets target after resolve
        let ctx2 = ConstraintContext { lines_cleared: 3, combo_counter: 0, highest_row_before: 9, highest_row_after: 7, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress2 = constraint.update_progress(0, ctx2);
        assert!(progress2 == 1, "Row 7 after resolve meets target");
        
        // Grid height below target after resolve (even if before was high)
        let ctx3 = ConstraintContext { lines_cleared: 3, combo_counter: 0, highest_row_before: 8, highest_row_after: 5, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress3 = constraint.update_progress(1, ctx3);
        assert!(progress3 == 1, "Row 5 after resolve doesn't meet target 7");
        
        // Grid empty (row_after=0) doesn't count
        let ctx4 = ConstraintContext { lines_cleared: 5, combo_counter: 0, highest_row_before: 9, highest_row_after: 0, grid_is_empty: true, blocks_destroyed_of_target_size: 0 };
        let progress4 = constraint.update_progress(1, ctx4);
        assert!(progress4 == 1, "Empty grid shouldn't increment fill");
        
        // Second fill
        let ctx5 = ConstraintContext { lines_cleared: 1, combo_counter: 0, highest_row_before: 8, highest_row_after: 8, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress5 = constraint.update_progress(1, ctx5);
        assert!(progress5 == 2, "Row 8 after resolve meets target 7, second time");
        
        // Satisfied at 2
        assert!(constraint.is_satisfied(2, false), "Should be satisfied at 2");
    }

    #[test]
    fn test_constraint_no_bonus() {
        let constraint = LevelConstraintTrait::no_bonus();
        
        // Satisfied if no bonus used
        assert!(constraint.is_satisfied(0, false), "Should be satisfied without bonus");
        
        // Not satisfied if bonus used
        assert!(!constraint.is_satisfied(0, true), "Should not be satisfied with bonus");
    }

    #[test]
    fn test_constraint_clear_grid() {
        let constraint = LevelConstraintTrait::clear_grid();
        
        // Not satisfied at 0
        assert!(!constraint.is_satisfied(0, false), "Should not be satisfied at 0");
        
        // Grid not empty
        let ctx = ConstraintContext { lines_cleared: 5, combo_counter: 0, highest_row_before: 3, highest_row_after: 1, grid_is_empty: false, blocks_destroyed_of_target_size: 0 };
        let progress = constraint.update_progress(0, ctx);
        assert!(progress == 0, "Grid not empty, no progress");
        
        // Grid empty
        let ctx2 = ConstraintContext { lines_cleared: 5, combo_counter: 0, highest_row_before: 3, highest_row_after: 0, grid_is_empty: true, blocks_destroyed_of_target_size: 0 };
        let progress2 = constraint.update_progress(0, ctx2);
        assert!(progress2 == 1, "Grid empty should trigger");
        
        assert!(constraint.is_satisfied(1, false), "Should be satisfied at 1");
    }

    #[test]
    fn test_constraint_type_conversion() {
        let none: u8 = ConstraintType::None.into();
        let clear: u8 = ConstraintType::ClearLines.into();
        let break_b: u8 = ConstraintType::BreakBlocks.into();
        let combo: u8 = ConstraintType::AchieveCombo.into();
        let fill: u8 = ConstraintType::FillAndClear.into();
        let no_bonus: u8 = ConstraintType::NoBonusUsed.into();
        let clear_grid: u8 = ConstraintType::ClearGrid.into();
        
        assert!(none == 0, "None should be 0");
        assert!(clear == 1, "ClearLines should be 1");
        assert!(break_b == 2, "BreakBlocks should be 2");
        assert!(combo == 3, "AchieveCombo should be 3");
        assert!(fill == 4, "FillAndClear should be 4");
        assert!(no_bonus == 5, "NoBonusUsed should be 5");
        assert!(clear_grid == 6, "ClearGrid should be 6");
        
        let none_back: ConstraintType = 0_u8.into();
        let clear_back: ConstraintType = 1_u8.into();
        let break_back: ConstraintType = 2_u8.into();
        let combo_back: ConstraintType = 3_u8.into();
        let fill_back: ConstraintType = 4_u8.into();
        let no_bonus_back: ConstraintType = 5_u8.into();
        let clear_grid_back: ConstraintType = 6_u8.into();
        
        assert!(none_back == ConstraintType::None, "Should convert back to None");
        assert!(clear_back == ConstraintType::ClearLines, "Should convert back to ClearLines");
        assert!(break_back == ConstraintType::BreakBlocks, "Should convert back to BreakBlocks");
        assert!(combo_back == ConstraintType::AchieveCombo, "Should convert back to AchieveCombo");
        assert!(fill_back == ConstraintType::FillAndClear, "Should convert back to FillAndClear");
        assert!(no_bonus_back == ConstraintType::NoBonusUsed, "Should convert back to NoBonusUsed");
        assert!(clear_grid_back == ConstraintType::ClearGrid, "Should convert back to ClearGrid");
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
        assert!(!LevelConstraintTrait::clear_lines(3, 2).is_boss_only(), "ClearLines is not boss-only");
        assert!(!LevelConstraintTrait::break_blocks(2, 5).is_boss_only(), "BreakBlocks is not boss-only");
        assert!(!LevelConstraintTrait::achieve_combo(5).is_boss_only(), "AchieveCombo is not boss-only");
        assert!(!LevelConstraintTrait::fill_and_clear(7, 2).is_boss_only(), "Fill is not boss-only");
        assert!(LevelConstraintTrait::no_bonus().is_boss_only(), "NoBonusUsed is boss-only");
        assert!(LevelConstraintTrait::clear_grid().is_boss_only(), "ClearGrid is boss-only");
    }
}
