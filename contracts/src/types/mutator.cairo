use zkube::helpers::mutator::MutatorEffectsTrait;
use zkube::models::mutator::MutatorDef;
use zkube::types::level::LevelConfig;

/// No mutator active
pub const MUTATOR_NONE: u8 = 0;

/// Trait for mutator effects
#[generate_trait]
pub impl MutatorImpl of MutatorTrait {
    /// Check if a mutator ID is valid (non-zero and within range)
    fn is_valid(mutator_id: u8) -> bool {
        mutator_id > 0 && mutator_id <= 32
    }

    /// Check if a mutator is allowed by a given bitmask
    fn is_allowed(mutator_id: u8, allowed_mask: u32) -> bool {
        if mutator_id == 0 {
            return true; // No mutator is always allowed
        }
        if mutator_id > 32 {
            return false;
        }
        let mut bit: u32 = 1;
        let mut exp = mutator_id - 1;
        loop {
            if exp == 0 {
                break;
            }
            bit *= 2;
            exp -= 1;
        }
        (allowed_mask & bit) != 0
    }

    /// Apply level modifiers from a MutatorDef payload.
    fn modify_level_config(mutator_def: @MutatorDef, ref config: LevelConfig) {
        MutatorEffectsTrait::apply_mutator_to_level(mutator_def, ref config);
    }

    /// Apply score modifiers from a MutatorDef payload.
    fn modify_score(mutator_def: @MutatorDef, base_score: u16) -> u16 {
        MutatorEffectsTrait::apply_mutator_to_score(mutator_def, base_score)
    }
}

#[cfg(test)]
mod tests {
    use super::{MUTATOR_NONE, MutatorTrait};

    #[test]
    fn test_mutator_none_always_valid() {
        assert!(MutatorTrait::is_allowed(0, 0), "Mutator NONE should always be allowed");
        assert!(MutatorTrait::is_allowed(0, 0xFFFFFFFF), "Mutator NONE should always be allowed");
    }

    #[test]
    fn test_mutator_allowed_by_mask() {
        let mask: u32 = 0b111; // Mutators 1, 2, 3 allowed
        assert!(MutatorTrait::is_allowed(1, mask), "Mutator 1 should be allowed");
        assert!(MutatorTrait::is_allowed(2, mask), "Mutator 2 should be allowed");
        assert!(MutatorTrait::is_allowed(3, mask), "Mutator 3 should be allowed");
        assert!(!MutatorTrait::is_allowed(4, mask), "Mutator 4 should NOT be allowed");
    }
}
