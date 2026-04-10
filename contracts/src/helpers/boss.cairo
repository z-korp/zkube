use zkube::helpers::level::LevelGeneratorTrait;
/// Boss Identity System
///
/// 10 themed bosses, each with fixed constraint combinations.
/// Boss identities define WHICH constraint types, and the unified budget system
/// (from level.cairo) at max budget determines the VALUES.
///
/// Boss selection is deterministic: derived from seed and theme (boss_id = seed % 10 + 1).
///
/// Zone mode has a single boss at level 10 (dual constraints).

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
}

/// Get boss identity by ID (1-10)
/// Returns the boss's fixed constraint type combination
pub fn get_boss_identity(boss_id: u8) -> BossIdentity {
    match boss_id {
        1 => BossIdentity {
            // Combo Master: ComboLines + ComboStreak
            id: 1,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::ComboStreak,
        },
        2 => BossIdentity {
            // Demolisher: BreakBlocks + ComboLines
            id: 2,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ComboLines,
        },
        3 => BossIdentity {
            // Daredevil: ComboStreak + ComboLines
            id: 3,
            primary_type: ConstraintType::ComboStreak,
            secondary_type: ConstraintType::ComboLines,
        },
        4 => BossIdentity {
            // Purist: ComboLines + ComboStreak
            id: 4,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::ComboStreak,
        },
        5 => BossIdentity {
            // Harvester: BreakBlocks + ComboStreak
            id: 5,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ComboStreak,
        },
        6 => BossIdentity {
            // Tidal: ComboLines + BreakBlocks
            id: 6,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::BreakBlocks,
        },
        7 => BossIdentity {
            // Stacker: ComboStreak + BreakBlocks
            id: 7,
            primary_type: ConstraintType::ComboStreak,
            secondary_type: ConstraintType::BreakBlocks,
        },
        8 => BossIdentity {
            // Surgeon: BreakBlocks + ComboStreak
            id: 8,
            primary_type: ConstraintType::BreakBlocks,
            secondary_type: ConstraintType::ComboStreak,
        },
        9 => BossIdentity {
            // Ascetic: ComboStreak + BreakBlocks
            id: 9,
            primary_type: ConstraintType::ComboStreak,
            secondary_type: ConstraintType::BreakBlocks,
        },
        10 => BossIdentity {
            // Perfectionist: ComboLines + BreakBlocks
            id: 10,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::BreakBlocks,
        },
        _ => BossIdentity {
            // Fallback: same as boss 1
            id: 1,
            primary_type: ConstraintType::ComboLines,
            secondary_type: ConstraintType::ComboStreak,
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
fn generate_boss_constraint(
    constraint_type: ConstraintType, budget_max: u8, seed: felt252,
) -> LevelConstraint {
    match constraint_type {
        ConstraintType::None => LevelConstraintTrait::none(),
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
/// Returns (constraint_1, constraint_2)
pub fn generate_boss_constraints(
    boss_id: u8, seed: felt252, budget_max: u8,
) -> (LevelConstraint, LevelConstraint) {
    let identity = get_boss_identity(boss_id);

    let seed_u256: u256 = seed.into();

    // Generate primary constraint at budget_max
    let primary_seed: felt252 = seed;
    let c1 = generate_boss_constraint(identity.primary_type, budget_max, primary_seed);

    // Generate secondary constraint (different seed segment)
    let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
    let c2 = generate_boss_constraint(identity.secondary_type, budget_max, secondary_seed);

    (c1, c2)
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
        // Boss 1 (Combo Master): ComboLines + ComboStreak
        // Budget_max = 24 (Hard difficulty)
        let (c1, c2) = generate_boss_constraints(1, 'TEST_SEED', 24);

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
    fn test_difficulty_to_tier() {
        assert!(difficulty_to_tier(Difficulty::VeryEasy) == 0, "VeryEasy = 0");
        assert!(difficulty_to_tier(Difficulty::Easy) == 1, "Easy = 1");
        assert!(difficulty_to_tier(Difficulty::Medium) == 2, "Medium = 2");
        assert!(difficulty_to_tier(Difficulty::Master) == 7, "Master = 7");
    }

    #[test]
    fn test_generate_boss_constraint_none() {
        let c = generate_boss_constraint(ConstraintType::None, 20, 'SEED');
        assert!(c.constraint_type == ConstraintType::None, "Should be None");
    }

    #[test]
    fn test_all_bosses_generate_valid() {
        let mut i: u8 = 1;
        while i <= 10 {
            let (c1, c2) = generate_boss_constraints(i, 'SEED', 24);
            assert!(c1.constraint_type != ConstraintType::None, "Primary should not be None");
            assert!(c2.constraint_type != ConstraintType::None, "Secondary should not be None");
            i += 1;
        };
    }

    #[test]
    fn test_boss_budget_integration() {
        // Verify that budget-based generation produces reasonable values
        // Boss 2 (Demolisher): BreakBlocks + ComboLines
        let (c1, c2) = generate_boss_constraints(2, 'BUDGET_TEST', 80);

        assert!(
            c1.constraint_type == ConstraintType::BreakBlocks,
            "Boss 2 primary should be BreakBlocks",
        );
        assert!(
            c2.constraint_type == ConstraintType::ComboLines,
            "Boss 2 secondary should be ComboLines",
        );

        // BreakBlocks at budget 40 should have substantial count
        assert!(c1.value >= 1 && c1.value <= 4, "Block size should be 1-4");
        assert!(c1.required_count >= 4, "Block count should be at least 4 at budget 40");

        // ComboLines at budget 40 should be challenging
        assert!(c2.value >= 2, "Lines should be at least 2");
    }
}
