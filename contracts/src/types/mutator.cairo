use zkube::helpers::mutator::MutatorEffectsTrait;
use zkube::models::mutator::MutatorDef;
use zkube::types::level::LevelConfig;

/// Mutator eligibility for different game modes
#[derive(Copy, Drop, Serde, PartialEq, Debug)]
pub enum MutatorEligibility {
    Universal, // Available in both Map and Endless modes
    MapOnly, // Only available in Map mode
    EndlessOnly // Only available in Endless mode
}

/// Context passed to mutator scoring hooks
#[derive(Copy, Drop, Serde, Debug)]
pub struct MutatorContext {
    pub lines_cleared: u8,
    pub combo_counter: u8,
    pub current_difficulty: u8,
    pub total_score: u32,
}

/// No mutator active
pub const MUTATOR_NONE: u8 = 0;

/// Full mutator pool mask (all bits set for 32 mutators)
pub const FULL_MUTATOR_MASK: u32 = 0xFFFFFFFF;

/// Trait for mutator effects — currently no-op, effects added incrementally
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
        let bit: u32 = 1_u32 * pow2((mutator_id - 1).into());
        (allowed_mask & bit) != 0
    }

    /// Roll a mutator from the allowed pool using a seed
    /// Returns MUTATOR_NONE if no mutators are allowed
    fn roll_mutator(seed: felt252, allowed_mask: u32) -> u8 {
        if allowed_mask == 0 {
            return MUTATOR_NONE;
        }

        // Count set bits to know pool size
        let pool_size = count_set_bits(allowed_mask);
        if pool_size == 0 {
            return MUTATOR_NONE;
        }

        // Use seed to pick an index
        let seed_u256: u256 = seed.into();
        let index: u32 = (seed_u256 % pool_size.into()).try_into().unwrap();

        // Find the nth set bit
        nth_set_bit(allowed_mask, index)
    }

    /// Apply level modifiers from a MutatorDef payload.
    fn modify_level_config(mutator_def: @MutatorDef, ref config: LevelConfig) {
        MutatorEffectsTrait::apply_mutator_to_level(mutator_def, ref config);
    }

    /// Apply score modifiers from a MutatorDef payload.
    fn modify_score(mutator_def: @MutatorDef, base_score: u16, _ctx: MutatorContext) -> u16 {
        MutatorEffectsTrait::apply_mutator_to_score(mutator_def, base_score)
    }
}

/// Count number of set bits in a u32
fn count_set_bits(mut value: u32) -> u32 {
    let mut count: u32 = 0;
    loop {
        if value == 0 {
            break count;
        }
        count += value & 1;
        value = value / 2;
    }
}

/// Find the nth set bit (0-indexed) and return its position + 1 (mutator ID)
fn nth_set_bit(value: u32, mut target: u32) -> u8 {
    let mut pos: u8 = 0;
    let mut v = value;
    loop {
        if v == 0 {
            break MUTATOR_NONE; // Should not happen if target < count_set_bits
        }
        if (v & 1) != 0 {
            if target == 0 {
                break pos + 1; // Mutator IDs are 1-indexed
            }
            target -= 1;
        }
        pos += 1;
        v = v / 2;
    }
}

/// Power of 2 helper (2^exp for small exponents)
fn pow2(mut exp: u32) -> u32 {
    let mut result: u32 = 1;
    loop {
        if exp == 0 {
            break result;
        }
        result *= 2;
        exp -= 1;
    }
}

#[cfg(test)]
mod tests {
    use super::{MUTATOR_NONE, MutatorTrait, count_set_bits, nth_set_bit};

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

    #[test]
    fn test_count_set_bits() {
        assert!(count_set_bits(0) == 0, "0 has 0 bits");
        assert!(count_set_bits(0b111) == 3, "0b111 has 3 bits");
        assert!(count_set_bits(0b101010) == 3, "0b101010 has 3 bits");
        assert!(count_set_bits(0xFFFFFFFF) == 32, "all bits set = 32");
    }

    #[test]
    fn test_nth_set_bit() {
        let mask: u32 = 0b10101; // Bits 0, 2, 4 set → mutators 1, 3, 5
        assert!(nth_set_bit(mask, 0) == 1, "0th set bit should be mutator 1");
        assert!(nth_set_bit(mask, 1) == 3, "1st set bit should be mutator 3");
        assert!(nth_set_bit(mask, 2) == 5, "2nd set bit should be mutator 5");
    }

    #[test]
    fn test_roll_mutator_empty_pool() {
        let result = MutatorTrait::roll_mutator('test_seed', 0);
        assert!(result == MUTATOR_NONE, "Empty pool should return NONE");
    }

    #[test]
    fn test_roll_mutator_single_option() {
        // Only mutator 3 allowed (bit 2)
        let mask: u32 = 0b100;
        let result = MutatorTrait::roll_mutator('any_seed', mask);
        assert!(result == 3, "Single option should always return mutator 3");
    }

    #[test]
    fn test_roll_mutator_deterministic() {
        let mask: u32 = 0b111; // Mutators 1, 2, 3
        let r1 = MutatorTrait::roll_mutator('seed_a', mask);
        let r2 = MutatorTrait::roll_mutator('seed_a', mask);
        assert!(r1 == r2, "Same seed should produce same mutator");

        // Different seed may produce different mutator
        let r3 = MutatorTrait::roll_mutator('seed_b', mask);
        // Can't assert r3 != r1 (might collide), but both should be valid
        assert!(r3 >= 1 && r3 <= 3, "Should be a valid mutator from pool");
    }
}
