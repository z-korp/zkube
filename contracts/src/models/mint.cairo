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
    const NO_MINT_REMAINING: felt252 = 'Mint: No mint remaining';
}

#[generate_trait]
impl MintImpl of MintTrait {
    fn new(id: felt252, number: u32) -> Mint {
        Mint { id, number }
    }

    fn mint(ref self: Mint) {
        self.assert_has_mint();
        self.number -= 1;
    }

    #[inline(always)]
    fn has_mint(self: Mint) -> bool {
        self.number > 0
    }
}

#[generate_trait]
impl MintAssert of AssertTrait {
    #[inline(always)]
    fn assert_has_mint(self: Mint) {
        assert(self.has_mint(), errors::NO_MINT_REMAINING);
    }
}

impl ZeroableMint of Zeroable<Mint> {
    #[inline(always)]
    fn zero() -> Mint {
        Mint { id: 0, number: 0 }
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
    use super::{Mint, MintImpl, MintAssert, ZeroableMint};

    // Core imports

    use core::Zeroable;

    // Helper function to create a Mint instance
    fn create_mint(id: felt252, number: u32) -> Mint {
        Mint { id, number }
    }

    #[test]
    fn test_assert_has_mint() {
        let mint = create_mint(1, 1);
        mint.assert_has_mint();
    }

    #[test]
    #[should_panic(expected: ('Mint: No mint remaining',))]
    fn test_assert_has_mint_fail() {
        let mint = create_mint(1, 0);
        mint.assert_has_mint();
    }

    #[test]
    fn test_zero_mint() {
        let zero_mint: Mint = Zeroable::zero();
        assert(zero_mint.id == 0, 'Zero mint id should be 0');
        assert(zero_mint.number == 0, 'Zero mint number should be 0');
    }

    #[test]
    fn test_is_zero() {
        let zero_mint: Mint = Zeroable::zero();
        assert(zero_mint.is_zero(), 'Zero mint should be zero');
        let non_zero_mint = create_mint(1, 1);
        assert(!non_zero_mint.is_zero(), 'Mint should not be zero');
    }

    #[test]
    fn test_is_non_zero() {
        let zero_mint: Mint = Zeroable::zero();
        assert(!zero_mint.is_non_zero(), 'Zero mint shouldnot be nonzero');
        let non_zero_mint = create_mint(1, 1);
        assert(non_zero_mint.is_non_zero(), 'Mint should be nonzero');
    }
}

