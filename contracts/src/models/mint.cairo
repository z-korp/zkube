use core::traits::TryInto;

// Core imports

use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

// External imports

// Internal imports

use zkube::constants;
use zkube::models::index::Mint;

// Errors

mod errors {
    const NO_MINT_REMAINING_OR_EXPIRED: felt252 = 'Mint: No mint remain. or exp.';
    const EXPIRATION_MISMATCH: felt252 = 'Mint: Expiration mismatch';
    const EXPIRATION_PAST: felt252 = 'Mint: Expiration past';
}

#[generate_trait]
impl MintImpl of MintTrait {
    fn new(id: felt252, number: u32, expiration_timestamp: u64) -> Mint {
        Mint { id, number, expiration_timestamp }
    }

    fn mint(ref self: Mint, current_timestamp: u64) {
        self.assert_has_mint_not_expired(current_timestamp);
        self.number -= 1;
    }

    fn add_mint(ref self: Mint, number: u32, expiration_timestamp: u64, current_timestamp: u64) {
        assert(current_timestamp < expiration_timestamp, errors::EXPIRATION_PAST);

        // If no mint or expired mint, set the new mint
        if (self.number == 0 || self.expiration_timestamp < current_timestamp) {
            self.number = number;
            self.expiration_timestamp = expiration_timestamp;
        } else {
            assert(self.expiration_timestamp == expiration_timestamp, errors::EXPIRATION_MISMATCH);
            self.number += number;
        }
    }

    #[inline(always)]
    fn has_mint(self: Mint) -> bool {
        self.number > 0
    }

    #[inline(always)]
    fn has_mint_not_expired(self: Mint, current_timestamp: u64) -> bool {
        self.number > 0 && self.expiration_timestamp > current_timestamp
    }
}

#[generate_trait]
impl MintAssert of AssertTrait {
    #[inline(always)]
    fn assert_has_mint_not_expired(self: Mint, current_timestamp: u64) {
        assert(self.has_mint_not_expired(current_timestamp), errors::NO_MINT_REMAINING_OR_EXPIRED);
    }
}

impl ZeroableMint of Zeroable<Mint> {
    #[inline(always)]
    fn zero() -> Mint {
        Mint { id: 0, number: 0, expiration_timestamp: 0 }
    }

    #[inline(always)]
    fn is_zero(self: Mint) -> bool {
        self.number == 0
    }

    #[inline(always)]
    fn is_non_zero(self: Mint) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    use super::{Mint, MintTrait, MintAssert, ZeroableMint};

    // Core imports

    use core::Zeroable;

    // Helper function to create a Mint instance
    fn create_mint(id: felt252, number: u32, expiration_timestamp: u64) -> Mint {
        Mint { id, number, expiration_timestamp }
    }

    #[test]
    fn test_mint_zero_mint() {
        let zero_mint: Mint = Zeroable::zero();
        assert(zero_mint.id == 0, 'Zero mint id should be 0');
        assert(zero_mint.number == 0, 'Zero mint number should be 0');
        assert(zero_mint.expiration_timestamp == 0, 'Zero mint exp should be 0');
    }

    #[test]
    fn test_mint_is_zero() {
        let zero_mint: Mint = Zeroable::zero();
        assert(zero_mint.is_zero(), 'Zero mint should be zero');
        let non_zero_mint = create_mint(1, 1, 2000);
        assert(!non_zero_mint.is_zero(), 'Mint should not be zero');
    }

    #[test]
    fn test_mint_success() {
        let mut mint = MintTrait::new(1, 5, 2000);
        let current_timestamp = 1000;
        mint.mint(current_timestamp);
        assert(mint.number == 4, 'Mint nb should decrease by 1');
    }

    #[test]
    #[should_panic(expected: ('Mint: No mint remain. or exp.',))]
    fn test_mint_no_mint_remaining() {
        let mut mint = MintTrait::new(1, 0, 2000);
        let current_timestamp = 1000;
        mint.mint(current_timestamp);
    }

    #[test]
    #[should_panic(expected: ('Mint: No mint remain. or exp.',))]
    fn test_mint_expired() {
        let mut mint = MintTrait::new(1, 5, 1000);
        let current_timestamp = 2000;
        mint.mint(current_timestamp);
    }

    #[test]
    fn test_mint_add_mint_new() {
        let mut mint = Zeroable::zero();
        mint.add_mint(5, 2000, 1000);
        assert(mint.number == 5, 'Mint number should be updated');
        assert(mint.expiration_timestamp == 2000, 'Expiration should be updated');
    }

    #[test]
    fn test_mint_add_mint_existing_same_expiration() {
        let mut mint = MintTrait::new(1, 5, 2000);
        mint.add_mint(5, 2000, 1000);
        assert(mint.number == 10, 'Mint number should be increased');
    }

    #[test]
    #[should_panic(expected: ('Mint: Expiration mismatch',))]
    fn test_mint_add_mint_existing_different_expiration() {
        let mut mint = MintTrait::new(1, 5, 2000);
        mint.add_mint(5, 3000, 1000);
    }

    #[test]
    #[should_panic(expected: ('Mint: Expiration past',))]
    fn test_mint_add_mint_expired() {
        let mut mint = MintTrait::new(1, 5, 1000);
        mint.add_mint(5, 1000, 2000);
    }
}

