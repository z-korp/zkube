/// Boss Identity System
/// 
/// 10 themed bosses, each with fixed constraint combinations that scale with difficulty.
/// Boss identities are constants — same boss always has the same constraint types,
/// but the values/counts scale based on the level's difficulty.
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

use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait, ConstraintType};

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

/// Scale a constraint type into a concrete LevelConstraint based on difficulty tier.
/// 
/// Difficulty tiers (for scaling):
/// - VeryEasy/Easy: tier 0-1 (easiest values)
/// - Medium/MediumHard: tier 2-3
/// - Hard/VeryHard: tier 4-5
/// - Expert/Master: tier 6-7 (hardest values)
///
/// The seed provides randomness within the valid range for each tier.
pub fn scale_constraint(
    constraint_type: ConstraintType,
    difficulty_tier: u8,
    seed: felt252,
) -> LevelConstraint {
    let seed_u256: u256 = seed.into();
    
    match constraint_type {
        ConstraintType::None => LevelConstraintTrait::none(),
        ConstraintType::ClearLines => {
            // Scale: lines 2-5, times 1-6 based on tier
            let (min_lines, max_lines, min_times, max_times) = get_clear_lines_scaling(difficulty_tier);
            let lines_range: u8 = if max_lines > min_lines { max_lines - min_lines + 1 } else { 1 };
            let lines: u8 = min_lines + ((seed_u256 % lines_range.into()).try_into().unwrap());
            let times_range: u8 = if max_times > min_times { max_times - min_times + 1 } else { 1 };
            let times: u8 = min_times + (((seed_u256 / 100) % times_range.into()).try_into().unwrap());
            LevelConstraintTrait::clear_lines(lines, times)
        },
        ConstraintType::BreakBlocks => {
            // Scale: block_size 1-4, count 3-20 based on tier
            let (min_size, max_size, min_count, max_count) = get_break_blocks_scaling(difficulty_tier);
            let size_range: u8 = if max_size > min_size { max_size - min_size + 1 } else { 1 };
            let block_size: u8 = min_size + ((seed_u256 % size_range.into()).try_into().unwrap());
            let count_range: u8 = if max_count > min_count { max_count - min_count + 1 } else { 1 };
            let count: u8 = min_count + (((seed_u256 / 100) % count_range.into()).try_into().unwrap());
            LevelConstraintTrait::break_blocks(block_size, count)
        },
        ConstraintType::AchieveCombo => {
            // Scale: combo target 3-8 based on tier
            let (min_combo, max_combo) = get_achieve_combo_scaling(difficulty_tier);
            let combo_range: u8 = if max_combo > min_combo { max_combo - min_combo + 1 } else { 1 };
            let combo: u8 = min_combo + ((seed_u256 % combo_range.into()).try_into().unwrap());
            LevelConstraintTrait::achieve_combo(combo)
        },
        ConstraintType::FillAndClear => {
            // Scale: row_height 5-8, times 1-4 based on tier
            let (min_row, max_row, min_times, max_times) = get_fill_and_clear_scaling(difficulty_tier);
            let row_range: u8 = if max_row > min_row { max_row - min_row + 1 } else { 1 };
            let row: u8 = min_row + ((seed_u256 % row_range.into()).try_into().unwrap());
            let times_range: u8 = if max_times > min_times { max_times - min_times + 1 } else { 1 };
            let times: u8 = min_times + (((seed_u256 / 100) % times_range.into()).try_into().unwrap());
            LevelConstraintTrait::fill_and_clear(row, times)
        },
        ConstraintType::NoBonusUsed => LevelConstraintTrait::no_bonus(),
        ConstraintType::ClearGrid => LevelConstraintTrait::clear_grid(),
    }
}

/// Get ClearLines scaling parameters for a difficulty tier
/// Returns (min_lines, max_lines, min_times, max_times)
fn get_clear_lines_scaling(tier: u8) -> (u8, u8, u8, u8) {
    if tier <= 1 {
        (2, 3, 1, 2)  // Easy: 2-3 lines, 1-2 times
    } else if tier <= 3 {
        (2, 4, 1, 3)  // Medium: 2-4 lines, 1-3 times
    } else if tier <= 5 {
        (3, 5, 2, 4)  // Hard: 3-5 lines, 2-4 times
    } else {
        (3, 6, 2, 5)  // Expert+: 3-6 lines, 2-5 times
    }
}

/// Get BreakBlocks scaling parameters for a difficulty tier
/// Returns (min_size, max_size, min_count, max_count)
fn get_break_blocks_scaling(tier: u8) -> (u8, u8, u8, u8) {
    if tier <= 1 {
        (1, 3, 3, 8)   // Easy: size 1-3, 3-8 blocks
    } else if tier <= 3 {
        (1, 4, 5, 12)  // Medium: size 1-4, 5-12 blocks
    } else if tier <= 5 {
        (2, 4, 8, 16)  // Hard: size 2-4, 8-16 blocks
    } else {
        (2, 4, 10, 20) // Expert+: size 2-4, 10-20 blocks
    }
}

/// Get AchieveCombo scaling parameters for a difficulty tier
/// Returns (min_combo, max_combo)
fn get_achieve_combo_scaling(tier: u8) -> (u8, u8) {
    if tier <= 1 {
        (3, 4)  // Easy: combo 3-4
    } else if tier <= 3 {
        (3, 5)  // Medium: combo 3-5
    } else if tier <= 5 {
        (4, 6)  // Hard: combo 4-6
    } else {
        (5, 8)  // Expert+: combo 5-8
    }
}

/// Get Fill scaling parameters for a difficulty tier
/// Returns (min_row, max_row, min_times, max_times)
fn get_fill_and_clear_scaling(tier: u8) -> (u8, u8, u8, u8) {
    if tier <= 1 {
        (5, 6, 1, 1)  // Easy: rows 5-6, 1 time
    } else if tier <= 3 {
        (5, 7, 1, 2)  // Medium: rows 5-7, 1-2 times
    } else if tier <= 5 {
        (6, 8, 1, 3)  // Hard: rows 6-8, 1-3 times
    } else {
        (7, 8, 2, 4)  // Expert+: rows 7-8, 2-4 times
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

/// Generate boss constraints for a specific boss level.
/// 
/// - Levels 10/20/30: Dual constraints (primary + secondary)
/// - Levels 40/50: Triple constraints (primary + secondary + tertiary)
///
/// Returns (constraint_1, constraint_2, constraint_3)
pub fn generate_boss_constraints(
    boss_id: u8,
    difficulty: zkube::types::difficulty::Difficulty,
    seed: felt252,
) -> (LevelConstraint, LevelConstraint, LevelConstraint) {
    let identity = get_boss_identity(boss_id);
    let tier = difficulty_to_tier(difficulty);
    
    let seed_u256: u256 = seed.into();
    
    // Generate primary constraint
    let primary_seed: felt252 = seed;
    let c1 = scale_constraint(identity.primary_type, tier, primary_seed);
    
    // Generate secondary constraint (different seed segment)
    let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
    let c2 = scale_constraint(identity.secondary_type, tier, secondary_seed);
    
    // Tertiary (caller decides when to include it based on level)
    let tertiary_seed: felt252 = (seed_u256 / 100000000000000).try_into().unwrap();
    let c3 = scale_constraint(identity.tertiary_type, tier, tertiary_seed);
    
    (c1, c2, c3)
}

#[cfg(test)]
mod tests {
    use super::{get_boss_identity, derive_boss_id, generate_boss_constraints, scale_constraint, difficulty_to_tier};
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
        let (c1, c2, _c3) = generate_boss_constraints(1, Difficulty::Hard, 'TEST_SEED');
        
        // Boss 1 (Combo Master): ClearLines + AchieveCombo
        assert!(c1.constraint_type == ConstraintType::ClearLines, "Boss 1 primary should be ClearLines");
        assert!(c2.constraint_type == ConstraintType::AchieveCombo, "Boss 1 secondary should be AchieveCombo");
        
        // Values should be reasonable for Hard difficulty
        assert!(c1.value >= 2, "Lines should be at least 2");
        assert!(c1.required_count >= 1, "Times should be at least 1");
        assert!(c2.value >= 3, "Combo target should be at least 3");
    }

    #[test]
    fn test_generate_boss_constraints_triple() {
        let (c1, c2, c3) = generate_boss_constraints(1, Difficulty::Expert, 'TEST_SEED');
        
        // Boss 1 triple: ClearLines + AchieveCombo + NoBonusUsed
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
    fn test_scale_constraint_none() {
        let c = scale_constraint(ConstraintType::None, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::None, "Should be None");
    }

    #[test]
    fn test_scale_constraint_no_bonus() {
        let c = scale_constraint(ConstraintType::NoBonusUsed, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::NoBonusUsed, "Should be NoBonusUsed");
        assert!(c.value == 0, "NoBonusUsed has no value");
    }

    #[test]
    fn test_scale_constraint_clear_grid() {
        let c = scale_constraint(ConstraintType::ClearGrid, 5, 'SEED');
        assert!(c.constraint_type == ConstraintType::ClearGrid, "Should be ClearGrid");
        assert!(c.required_count == 1, "ClearGrid requires 1");
    }

    #[test]
    fn test_all_bosses_generate_valid() {
        let mut i: u8 = 1;
        while i <= 10 {
            let (c1, c2, c3) = generate_boss_constraints(i, Difficulty::Hard, 'SEED');
            // All constraints should be valid (non-None for bosses)
            assert!(c1.constraint_type != ConstraintType::None, "Primary should not be None");
            assert!(c2.constraint_type != ConstraintType::None, "Secondary should not be None");
            assert!(c3.constraint_type != ConstraintType::None, "Tertiary should not be None");
            i += 1;
        };
    }
}
