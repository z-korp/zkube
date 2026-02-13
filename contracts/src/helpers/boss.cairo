/// Boss Identity System
/// 
/// 10 themed bosses, each with fixed constraint combinations.
/// Boss identities define WHICH constraint types, and the unified budget system
/// (from level.cairo) at max budget determines the VALUES.
///
/// Boss selection is deterministic: derived from seed and theme (boss_id = seed % 10 + 1).
///
/// Constraint progression:
/// - Levels 1-9: Single constraint only (no boss)
/// - Level 10 (Boss): Dual constraints (core pair)
/// - Levels 11-19: Single or dual (chance based on difficulty)
/// - Levels 20-30 (Boss): Dual constraints
/// - Level 40 (Boss): Triple constraints (core pair + third)
/// - Level 50 (Boss): Triple constraints (core pair + third)
///
/// Boss constraints use budget_max from the level's difficulty settings,
/// generating via the same budget engine as regular levels.

use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait, ConstraintType};
use zkube::helpers::level::LevelGeneratorTrait;

/// Boss identity definition: which constraint types this boss uses
#[derive(Copy, Drop)]
pub struct BossIdentity {
    /// Boss ID (1-10)
    pub id: u8,
    /// Primary constraint type (always active)
    pub primary_type: ConstraintType,
    /// Secondary constraint type (always active on boss levels)
    pub secondary_type: ConstraintType,
    /// Tertiary constraint type (only on levels 40/50)
    pub tertiary_type: ConstraintType,
}

/// Get boss identity by ID (1-10)
/// Returns the boss's fixed constraint type combination
pub fn get_boss_identity(boss_id: u8) -> BossIdentity {
    match boss_id {
        1 => BossIdentity {
            // Combo Master: ClearLines + AchieveCombo + NoBonusUsed
            id: 1,
            primary_type: ConstraintType::ClearLines,
            secondary_type: ConstraintType::AchieveCombo,
            tertiary_type: ConstraintType::NoBonusUsed,
        },
        2 => BossIdentity {
            // Demolisher: BreakBlocks + ClearLines + ClearGrid
            id: 2,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ClearLines,
            tertiary_type: ConstraintType::ClearGrid,
        },
        3 => BossIdentity {
            // Daredevil: Fill + AchieveCombo + ClearLines
            id: 3,
            primary_type: ConstraintType::FillAndClear,
            secondary_type: ConstraintType::AchieveCombo,
            tertiary_type: ConstraintType::ClearLines,
        },
        4 => BossIdentity {
            // Purist: NoBonusUsed + ClearLines + AchieveCombo
            id: 4,
            primary_type: ConstraintType::NoBonusUsed,
            secondary_type: ConstraintType::ClearLines,
            tertiary_type: ConstraintType::AchieveCombo,
        },
        5 => BossIdentity {
            // Harvester: BreakBlocks + AchieveCombo + Fill
            id: 5,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::AchieveCombo,
            tertiary_type: ConstraintType::FillAndClear,
        },
        6 => BossIdentity {
            // Tidal: ClearGrid + ClearLines + BreakBlocks
            id: 6,
            primary_type: ConstraintType::ClearGrid,
            secondary_type: ConstraintType::ClearLines,
            tertiary_type: ConstraintType::BreakBlocks,
        },
        7 => BossIdentity {
            // Stacker: Fill + ClearLines + BreakBlocks
            id: 7,
            primary_type: ConstraintType::FillAndClear,
            secondary_type: ConstraintType::ClearLines,
            tertiary_type: ConstraintType::BreakBlocks,
        },
        8 => BossIdentity {
            // Surgeon: BreakBlocks + Fill + NoBonusUsed
            id: 8,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::FillAndClear,
            tertiary_type: ConstraintType::NoBonusUsed,
        },
        9 => BossIdentity {
            // Ascetic: NoBonusUsed + AchieveCombo + Fill
            id: 9,
            primary_type: ConstraintType::NoBonusUsed,
            secondary_type: ConstraintType::AchieveCombo,
            tertiary_type: ConstraintType::FillAndClear,
        },
        10 => BossIdentity {
            // Perfectionist: ClearLines + Fill + AchieveCombo
            id: 10,
            primary_type: ConstraintType::ClearLines,
            secondary_type: ConstraintType::FillAndClear,
            tertiary_type: ConstraintType::AchieveCombo,
        },
        _ => BossIdentity {
            // Fallback: same as boss 1
            id: 1,
            primary_type: ConstraintType::ClearLines,
            secondary_type: ConstraintType::AchieveCombo,
            tertiary_type: ConstraintType::NoBonusUsed,
        },
    }
}

/// Derive boss ID from seed (1-10, deterministic)
pub fn derive_boss_id(seed: felt252) -> u8 {
    let seed_u256: u256 = seed.into();
    let id: u8 = ((seed_u256 % 10) + 1).try_into().unwrap();
    id
}

/// Generate a boss constraint using the unified budget system from level.cairo.
/// Uses budget_max for the boss's difficulty to create challenging constraints.
/// NoBonusUsed and ClearGrid are binary — they don't use budget.
fn generate_boss_constraint(
    constraint_type: ConstraintType,
    budget_max: u8,
    tier: u8,
    seed: felt252,
) -> LevelConstraint {
    match constraint_type {
        // Binary constraints: no budget needed
        ConstraintType::NoBonusUsed => LevelConstraintTrait::no_bonus(),
        ConstraintType::ClearGrid => LevelConstraintTrait::clear_grid(),
        ConstraintType::None => LevelConstraintTrait::none(),
        // Budget-based constraints: use the same generation as regular levels
        _ => LevelGeneratorTrait::generate_constraint_from_budget(seed, budget_max, constraint_type, tier),
    }
}

/// Convert Difficulty enum to tier number (0-7) for scaling
pub fn difficulty_to_tier(difficulty: zkube::types::difficulty::Difficulty) -> u8 {
    match difficulty {
        zkube::types::difficulty::Difficulty::VeryEasy => 0,
        zkube::types::difficulty::Difficulty::Easy => 1,
        zkube::types::difficulty::Difficulty::Medium => 2,
        zkube::types::difficulty::Difficulty::MediumHard => 3,
        zkube::types::difficulty::Difficulty::Hard => 4,
        zkube::types::difficulty::Difficulty::VeryHard => 5,
        zkube::types::difficulty::Difficulty::Expert => 6,
        zkube::types::difficulty::Difficulty::Master => 7,
        _ => 4, // Increasing defaults to Hard tier
    }
}

/// Generate boss constraints for a specific boss level using the unified budget system.
/// 
/// Boss identity determines WHICH types. Budget_max determines the VALUES.
/// Uses the same budget-based generation engine as regular levels, but at budget_max
/// to ensure boss constraints are challenging.
///
/// - Levels 10/20/30: Dual constraints (primary + secondary)
/// - Levels 40/50: Triple constraints (primary + secondary + tertiary)
///
/// Returns (constraint_1, constraint_2, constraint_3)
pub fn generate_boss_constraints(
    boss_id: u8,
    difficulty: zkube::types::difficulty::Difficulty,
    seed: felt252,
    budget_max: u8,
) -> (LevelConstraint, LevelConstraint, LevelConstraint) {
    let identity = get_boss_identity(boss_id);
    let tier = difficulty_to_tier(difficulty);
    
    let seed_u256: u256 = seed.into();
    
    // Generate primary constraint at budget_max
    let primary_seed: felt252 = seed;
    let c1 = generate_boss_constraint(identity.primary_type, budget_max, tier, primary_seed);
    
    // Generate secondary constraint (different seed segment)
    let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
    let c2 = generate_boss_constraint(identity.secondary_type, budget_max, tier, secondary_seed);
    
    // Tertiary (caller decides when to include it based on level)
    let tertiary_seed: felt252 = (seed_u256 / 100000000000000).try_into().unwrap();
    let c3 = generate_boss_constraint(identity.tertiary_type, budget_max, tier, tertiary_seed);
    
    (c1, c2, c3)
}

#[cfg(test)]
mod tests {
    use super::{get_boss_identity, derive_boss_id, generate_boss_constraints, generate_boss_constraint, difficulty_to_tier};
    use zkube::types::constraint::{ConstraintType, LevelConstraintTrait};
    use zkube::types::difficulty::Difficulty;

    #[test]
    fn test_boss_identity_coverage() {
        // All 10 bosses should have valid identities
        let mut i: u8 = 1;
        while i <= 10 {
            let identity = get_boss_identity(i);
            assert!(identity.id == i, "Boss ID mismatch");
            // Primary should never be None
            assert!(identity.primary_type != ConstraintType::None, "Primary should not be None");
            // Secondary should never be None
            assert!(identity.secondary_type != ConstraintType::None, "Secondary should not be None");
            // Tertiary should never be None
            assert!(identity.tertiary_type != ConstraintType::None, "Tertiary should not be None");
            i += 1;
        };
    }

    #[test]
    fn test_derive_boss_id_range() {
        // Test various seeds produce valid boss IDs (1-10)
        let id1 = derive_boss_id('SEED_1');
        let id2 = derive_boss_id('SEED_2');
        let id3 = derive_boss_id('SEED_3');
        
        assert!(id1 >= 1 && id1 <= 10, "Boss ID should be 1-10");
        assert!(id2 >= 1 && id2 <= 10, "Boss ID should be 1-10");
        assert!(id3 >= 1 && id3 <= 10, "Boss ID should be 1-10");
    }

    #[test]
    fn test_derive_boss_deterministic() {
        let id1 = derive_boss_id('SAME_SEED');
        let id2 = derive_boss_id('SAME_SEED');
        assert!(id1 == id2, "Same seed should produce same boss");
    }

    #[test]
    fn test_generate_boss_constraints_dual() {
        // Boss 1 (Combo Master): ClearLines + AchieveCombo + NoBonusUsed
        // Budget_max = 24 (Hard difficulty)
        let (c1, c2, _c3) = generate_boss_constraints(1, Difficulty::Hard, 'TEST_SEED', 24);
        
        assert!(c1.constraint_type == ConstraintType::ClearLines, "Boss 1 primary should be ClearLines");
        assert!(c2.constraint_type == ConstraintType::AchieveCombo, "Boss 1 secondary should be AchieveCombo");
        
        // Values should be reasonable for Hard difficulty at budget_max
        assert!(c1.value >= 2, "Lines should be at least 2");
        assert!(c1.required_count >= 1, "Times should be at least 1");
        assert!(c2.value >= 3, "Combo target should be at least 3");
    }

    #[test]
    fn test_generate_boss_constraints_triple() {
        // Boss 1 triple: ClearLines + AchieveCombo + NoBonusUsed
        // Budget_max = 34 (Expert difficulty)
        let (c1, c2, c3) = generate_boss_constraints(1, Difficulty::Expert, 'TEST_SEED', 34);
        
        assert!(c1.constraint_type == ConstraintType::ClearLines, "Boss 1 primary");
        assert!(c2.constraint_type == ConstraintType::AchieveCombo, "Boss 1 secondary");
        assert!(c3.constraint_type == ConstraintType::NoBonusUsed, "Boss 1 tertiary");
    }

    #[test]
    fn test_difficulty_to_tier() {
        assert!(difficulty_to_tier(Difficulty::VeryEasy) == 0, "VeryEasy = 0");
        assert!(difficulty_to_tier(Difficulty::Easy) == 1, "Easy = 1");
        assert!(difficulty_to_tier(Difficulty::Medium) == 2, "Medium = 2");
        assert!(difficulty_to_tier(Difficulty::Master) == 7, "Master = 7");
    }

    #[test]
    fn test_generate_boss_constraint_none() {
        let c = generate_boss_constraint(ConstraintType::None, 20, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::None, "Should be None");
    }

    #[test]
    fn test_generate_boss_constraint_no_bonus() {
        let c = generate_boss_constraint(ConstraintType::NoBonusUsed, 20, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::NoBonusUsed, "Should be NoBonusUsed");
        assert!(c.value == 0, "NoBonusUsed has no value");
    }

    #[test]
    fn test_generate_boss_constraint_clear_grid() {
        let c = generate_boss_constraint(ConstraintType::ClearGrid, 20, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::ClearGrid, "Should be ClearGrid");
        assert!(c.required_count == 1, "ClearGrid requires 1");
    }

    #[test]
    fn test_all_bosses_generate_valid() {
        let mut i: u8 = 1;
        while i <= 10 {
            // Budget_max = 24 (Hard difficulty)
            let (c1, c2, c3) = generate_boss_constraints(i, Difficulty::Hard, 'SEED', 24);
            // All constraints should be valid (non-None for bosses)
            assert!(c1.constraint_type != ConstraintType::None, "Primary should not be None");
            assert!(c2.constraint_type != ConstraintType::None, "Secondary should not be None");
            assert!(c3.constraint_type != ConstraintType::None, "Tertiary should not be None");
            i += 1;
        };
    }
    
    #[test]
    fn test_boss_budget_integration() {
        // Verify that budget-based generation produces reasonable values
        // Boss 2 (Demolisher): BreakBlocks + ClearLines + ClearGrid
        let (c1, c2, c3) = generate_boss_constraints(2, Difficulty::Master, 'BUDGET_TEST', 40);
        
        assert!(c1.constraint_type == ConstraintType::BreakBlocks, "Boss 2 primary should be BreakBlocks");
        assert!(c2.constraint_type == ConstraintType::ClearLines, "Boss 2 secondary should be ClearLines");
        assert!(c3.constraint_type == ConstraintType::ClearGrid, "Boss 2 tertiary should be ClearGrid");
        
        // BreakBlocks at budget 40 should have substantial count
        assert!(c1.value >= 1 && c1.value <= 4, "Block size should be 1-4");
        assert!(c1.required_count >= 4, "Block count should be at least 4 at budget 40");
        
        // ClearLines at budget 40 should be challenging
        assert!(c2.value >= 2, "Lines should be at least 2");
    }
}
