/// Constraint types for the level system
/// Constraints are level-specific objectives that must be met to complete a level

#[derive(Copy, Drop, Serde, PartialEq, Introspect, Debug)]
pub enum ConstraintType {
    /// No constraint - just reach the point goal
    None,
    /// Must clear X lines in a single move, Y times
    /// value = lines to clear, required_count = how many times
    ClearLines,
    /// Must complete level without using any bonus
    NoBonusUsed,
}

/// A level constraint with its parameters
#[derive(Copy, Drop, Serde, Introspect, Debug)]
pub struct LevelConstraint {
    /// The type of constraint
    pub constraint_type: ConstraintType,
    /// For ClearLines: number of lines to clear in one move
    pub value: u8,
    /// For ClearLines: how many times to achieve it
    pub required_count: u8,
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

    /// Create a NoBonusUsed constraint
    #[inline(always)]
    fn no_bonus() -> LevelConstraint {
        LevelConstraint { constraint_type: ConstraintType::NoBonusUsed, value: 0, required_count: 0 }
    }

    /// Check if constraint is satisfied
    /// - progress: current count of times constraint was achieved (for ClearLines)
    /// - bonus_used: whether any bonus was used this level
    #[inline(always)]
    fn is_satisfied(self: LevelConstraint, progress: u8, bonus_used: bool) -> bool {
        match self.constraint_type {
            ConstraintType::None => true,
            ConstraintType::ClearLines => progress >= self.required_count,
            ConstraintType::NoBonusUsed => !bonus_used,
        }
    }

    /// Update progress after a move
    /// Returns the new progress value
    #[inline(always)]
    fn update_progress(self: LevelConstraint, current_progress: u8, lines_cleared: u8) -> u8 {
        match self.constraint_type {
            ConstraintType::None => current_progress,
            ConstraintType::ClearLines => {
                if lines_cleared >= self.value {
                    // Clamp progress to required_count to avoid overflow and keep semantics stable.
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
        }
    }

    /// Get a human-readable description (for debugging/events)
    fn get_description(self: LevelConstraint) -> felt252 {
        match self.constraint_type {
            ConstraintType::None => 'NO_CONSTRAINT',
            ConstraintType::ClearLines => 'CLEAR_LINES',
            ConstraintType::NoBonusUsed => 'NO_BONUS',
        }
    }
}

// Conversion implementations
impl ConstraintTypeIntoU8 of Into<ConstraintType, u8> {
    #[inline(always)]
    fn into(self: ConstraintType) -> u8 {
        match self {
            ConstraintType::None => 0,
            ConstraintType::ClearLines => 1,
            ConstraintType::NoBonusUsed => 2,
        }
    }
}

impl U8IntoConstraintType of Into<u8, ConstraintType> {
    #[inline(always)]
    fn into(self: u8) -> ConstraintType {
        match self {
            0 => ConstraintType::None,
            1 => ConstraintType::ClearLines,
            2 => ConstraintType::NoBonusUsed,
            _ => ConstraintType::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ConstraintType, LevelConstraint, LevelConstraintTrait};

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
        let progress = constraint.update_progress(0, 2);
        assert!(progress == 0, "Clearing 2 lines shouldn't increment progress");
        
        // Clearing 3 lines counts
        let progress = constraint.update_progress(0, 3);
        assert!(progress == 1, "Clearing 3 lines should increment progress");
        
        // Clearing 4 lines also counts
        let progress = constraint.update_progress(1, 4);
        assert!(progress == 2, "Clearing 4 lines should increment progress");
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
    fn test_constraint_type_conversion() {
        let none: u8 = ConstraintType::None.into();
        let clear: u8 = ConstraintType::ClearLines.into();
        let no_bonus: u8 = ConstraintType::NoBonusUsed.into();
        
        assert!(none == 0, "None should be 0");
        assert!(clear == 1, "ClearLines should be 1");
        assert!(no_bonus == 2, "NoBonusUsed should be 2");
        
        let none_back: ConstraintType = 0_u8.into();
        let clear_back: ConstraintType = 1_u8.into();
        let no_bonus_back: ConstraintType = 2_u8.into();
        
        assert!(none_back == ConstraintType::None, "Should convert back to None");
        assert!(clear_back == ConstraintType::ClearLines, "Should convert back to ClearLines");
        assert!(no_bonus_back == ConstraintType::NoBonusUsed, "Should convert back to NoBonusUsed");
    }
}
