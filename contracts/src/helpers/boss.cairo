use zkube::helpers::level::LevelGeneratorTrait;
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

use zkube::types::constraint::{ConstraintType, LevelConstraint, LevelConstraintTrait};

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
            // Combo Master: ComboLines + ComboStreak + NoBonusUsed
            id: 1,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::ComboStreak,
            tertiary_type: ConstraintType::NoBonusUsed,
        },
        2 => BossIdentity {
            // Demolisher: BreakBlocks + ComboLines + KeepGridBelow
            id: 2,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ComboLines,
            tertiary_type: ConstraintType::KeepGridBelow,
        },
        3 => BossIdentity {
            // Daredevil: Fill + ComboStreak + ComboLines
            id: 3,
            primary_type: ConstraintType::FillAndClear,
            secondary_type: ConstraintType::ComboStreak,
            tertiary_type: ConstraintType::ComboLines,
        },
        4 => BossIdentity {
            // Purist: NoBonusUsed + ComboLines + ComboStreak
            id: 4,
            primary_type: ConstraintType::NoBonusUsed,
            secondary_type: ConstraintType::ComboLines,
            tertiary_type: ConstraintType::ComboStreak,
        },
        5 => BossIdentity {
            // Harvester: BreakBlocks + ComboStreak + Fill
            id: 5,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ComboStreak,
            tertiary_type: ConstraintType::FillAndClear,
        },
        6 => BossIdentity {
            // Tidal: KeepGridBelow + ComboLines + BreakBlocks
            id: 6,
            primary_type: ConstraintType::KeepGridBelow,
            secondary_type: ConstraintType::ComboLines,
            tertiary_type: ConstraintType::BreakBlocks,
        },
        7 => BossIdentity {
            // Stacker: Fill + ComboLines + BreakBlocks
            id: 7,
            primary_type: ConstraintType::FillAndClear,
            secondary_type: ConstraintType::ComboLines,
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
            // Ascetic: NoBonusUsed + ComboStreak + Fill
            id: 9,
            primary_type: ConstraintType::NoBonusUsed,
            secondary_type: ConstraintType::ComboStreak,
            tertiary_type: ConstraintType::FillAndClear,
        },
        10 => BossIdentity {
            // Perfectionist: ComboLines + Fill + ComboStreak
            id: 10,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::FillAndClear,
            tertiary_type: ConstraintType::ComboStreak,
        },
        _ => BossIdentity {
            // Fallback: same as boss 1
            id: 1,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::ComboStreak,
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

/// Get KeepGridBelow cap by boss level.
/// The constraint is "keep grid below N lines":
/// - level 10: below 8 lines
/// - levels 20/30: below 7 lines
/// - levels 40/50: below 6 lines
fn keep_grid_below_cap_for_boss_level(level: u8) -> u8 {
    if level < 20 {
        8
    } else if level < 40 {
        7
    } else {
        6
    }
}

/// Generate a boss constraint using the unified budget system from level.cairo.
/// Uses budget_max for the boss's difficulty to create challenging constraints.
/// NoBonusUsed is binary; KeepGridBelow uses level-scaled cap.
fn generate_boss_constraint(
    constraint_type: ConstraintType, budget_max: u8, seed: felt252, level: u8,
) -> LevelConstraint {
    match constraint_type {
        // Binary constraints: no budget needed
        ConstraintType::NoBonusUsed => LevelConstraintTrait::no_bonus(),
        ConstraintType::KeepGridBelow => {
            let cap = keep_grid_below_cap_for_boss_level(level);
            LevelConstraintTrait::keep_grid_below_with_cap(cap)
        },
        ConstraintType::None => LevelConstraintTrait::none(),
        // Budget-based constraints: use the same generation as regular levels
        _ => LevelGeneratorTrait::generate_constraint_from_budget(
            seed, budget_max, constraint_type,
        ),
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
        _ => 4 // Increasing defaults to Hard tier
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
    boss_id: u8, level: u8, seed: felt252, budget_max: u8,
) -> (LevelConstraint, LevelConstraint, LevelConstraint) {
    let identity = get_boss_identity(boss_id);

    let seed_u256: u256 = seed.into();

    // Generate primary constraint at budget_max
    let primary_seed: felt252 = seed;
    let c1 = generate_boss_constraint(identity.primary_type, budget_max, primary_seed, level);

    // Generate secondary constraint (different seed segment)
    let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
    let c2 = generate_boss_constraint(identity.secondary_type, budget_max, secondary_seed, level);

    // Tertiary (caller decides when to include it based on level)
    let tertiary_seed: felt252 = (seed_u256 / 100000000000000).try_into().unwrap();
    let c3 = generate_boss_constraint(identity.tertiary_type, budget_max, tertiary_seed, level);

    (c1, c2, c3)
}

#[cfg(test)]
mod tests {
    use zkube::types::constraint::ConstraintType;
    use zkube::types::difficulty::Difficulty;
    use super::{
        derive_boss_id, difficulty_to_tier, generate_boss_constraint, generate_boss_constraints,
        get_boss_identity,
    };

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
            assert!(
                identity.secondary_type != ConstraintType::None, "Secondary should not be None",
            );
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
        // Boss 1 (Combo Master): ComboLines + ComboStreak + NoBonusUsed
        // Budget_max = 24 (Hard difficulty)
        let (c1, c2, _c3) = generate_boss_constraints(1, 20, 'TEST_SEED', 24);

        assert!(
            c1.constraint_type == ConstraintType::ComboLines, "Boss 1 primary should be ComboLines",
        );
        assert!(
            c2.constraint_type == ConstraintType::ComboStreak,
            "Boss 1 secondary should be ComboStreak",
        );

        // Values should be reasonable for Hard difficulty at budget_max
        assert!(c1.value >= 2, "Lines should be at least 2");
        assert!(c1.required_count >= 1, "Times should be at least 1");
        assert!(c2.value >= 10, "Combo target should be at least 10");
    }

    #[test]
    fn test_generate_boss_constraints_triple() {
        // Boss 1 triple: ComboLines + ComboStreak + NoBonusUsed
        // Budget_max = 34 (Expert difficulty)
        let (c1, c2, c3) = generate_boss_constraints(1, 40, 'TEST_SEED', 34);

        assert!(c1.constraint_type == ConstraintType::ComboLines, "Boss 1 primary");
        assert!(c2.constraint_type == ConstraintType::ComboStreak, "Boss 1 secondary");
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
        let c = generate_boss_constraint(ConstraintType::None, 20, 'SEED', 20);
        assert!(c.constraint_type == ConstraintType::None, "Should be None");
    }

    #[test]
    fn test_generate_boss_constraint_no_bonus() {
        let c = generate_boss_constraint(ConstraintType::NoBonusUsed, 20, 'SEED', 20);
        assert!(c.constraint_type == ConstraintType::NoBonusUsed, "Should be NoBonusUsed");
        assert!(c.value == 0, "NoBonusUsed has no value");
    }

    #[test]
    fn test_generate_boss_constraint_keep_grid_below() {
        let c10 = generate_boss_constraint(ConstraintType::KeepGridBelow, 20, 'SEED', 10);
        assert!(c10.constraint_type == ConstraintType::KeepGridBelow, "Should be KeepGridBelow");
        assert!(c10.value == 8, "Level 10 cap should be below 8 lines");

        let c20 = generate_boss_constraint(ConstraintType::KeepGridBelow, 20, 'SEED', 20);
        assert!(c20.value == 7, "Level 20/30 cap should be below 7 lines");

        let c40 = generate_boss_constraint(ConstraintType::KeepGridBelow, 20, 'SEED', 40);
        assert!(c40.value == 6, "Level 40/50 cap should be below 6 lines");
    }

    #[test]
    fn test_all_bosses_generate_valid() {
        let mut i: u8 = 1;
        while i <= 10 {
            // Budget_max = 24 (Hard difficulty)
            let (c1, c2, c3) = generate_boss_constraints(i, 20, 'SEED', 24);
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
        // Boss 2 (Demolisher): BreakBlocks + ComboLines + KeepGridBelow
        let (c1, c2, c3) = generate_boss_constraints(2, 50, 'BUDGET_TEST', 80);

        assert!(
            c1.constraint_type == ConstraintType::BreakBlocks,
            "Boss 2 primary should be BreakBlocks",
        );
        assert!(
            c2.constraint_type == ConstraintType::ComboLines,
            "Boss 2 secondary should be ComboLines",
        );
        assert!(
            c3.constraint_type == ConstraintType::KeepGridBelow,
            "Boss 2 tertiary should be KeepGridBelow",
        );

        // BreakBlocks at budget 40 should have substantial count
        assert!(c1.value >= 1 && c1.value <= 4, "Block size should be 1-4");
        assert!(c1.required_count >= 4, "Block count should be at least 4 at budget 40");

        // ComboLines at budget 40 should be challenging
        assert!(c2.value >= 2, "Lines should be at least 2");
    }
}
