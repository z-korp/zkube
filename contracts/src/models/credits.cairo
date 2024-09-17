use core::traits::TryInto;

// Starknet imports

use starknet::info::{get_block_timestamp};

// Core imports

use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

// External imports

// Internal imports

use zkube::constants;
use zkube::models::index::Credits;

// Errors

mod errors {
    const NO_CREDITS_REMAINING: felt252 = 'Credits: No credits remaining';
}

#[generate_trait]
impl CreditsImpl of CreditsTrait {
    fn new(id: felt252, time: u64) -> Credits {
        let day_id = CreditsImpl::compute_id(time);

        Credits { id, day_id, remaining: constants::DAILY_CREDITS }
    }

    #[inline(always)]
    fn compute_id(time: u64) -> u64 {
        time / constants::SECONDS_PER_DAY
    }

    fn use_credit(ref self: Credits, time: u64) {
        let current_day_id = CreditsImpl::compute_id(time);

        if current_day_id != self.day_id {
            // New day, reinitialize credits
            self.day_id = current_day_id;
            self.remaining = constants::DAILY_CREDITS;
        }

        self.assert_has_credits(time);
        self.remaining -= 1;
    }

    #[inline(always)]
    fn has_credits(self: Credits, time: u64) -> bool {
        let current_day_id = CreditsImpl::compute_id(time);
        if current_day_id != self.day_id {
            // If it's a new day, they would have full credits
            true
        } else {
            self.remaining > 0
        }
    }
}

#[generate_trait]
impl CreditsAssert of AssertTrait {
    #[inline(always)]
    fn assert_has_credits(self: Credits, time: u64) {
        assert(self.has_credits(time), errors::NO_CREDITS_REMAINING);
    }
}

impl ZeroableCredits of Zeroable<Credits> {
    #[inline(always)]
    fn zero() -> Credits {
        Credits { id: 0, day_id: 0, remaining: 0 }
    }

    #[inline(always)]
    fn is_zero(self: Credits) -> bool {
        self.id == 0
    }

    #[inline(always)]
    fn is_non_zero(self: Credits) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    use super::{Credits, CreditsImpl, CreditsAssert, ZeroableCredits};

    // Core imports

    use core::Zeroable;

    // Internal imports

    use zkube::constants;


    // Helper function to create a Credits instance
    fn create_credits(id: felt252, day_id: u64, remaining: u8) -> Credits {
        Credits { id, day_id, remaining }
    }

    #[test]
    fn test_compute_id() {
        assert(CreditsImpl::compute_id(0) == 0, 'compute_id failed for 0');
        assert(CreditsImpl::compute_id(86399) == 0, 'compute_id failed for 86399');
        assert(CreditsImpl::compute_id(86400) == 1, 'compute_id failed for 86400');
        assert(CreditsImpl::compute_id(172800) == 2, 'compute_id failed for 172800');
    }

    #[test]
    fn test_use_credit_same_day() {
        let mut credits = create_credits(1, 1, 3);
        credits.use_credit(86400); // 1 day in seconds
        assert(credits.day_id == 1, 'ID should not change');
        assert(credits.remaining == 2, 'Remaining should decrease');
    }

    #[test]
    fn test_use_credit_new_day() {
        let mut credits = create_credits(1, 1, 1);
        credits.use_credit(172800); // 2 days in seconds
        assert(credits.day_id == 2, 'ID should update');
        assert(credits.remaining == constants::DAILY_CREDITS - 1, 'Remain should reset & -1');
    }

    #[test]
    #[should_panic(expected: ('Credits: No credits remaining',))]
    fn test_use_credit_no_remaining() {
        let mut credits = create_credits(1, 1, 0);
        credits.use_credit(86400);
    }

    #[test]
    fn test_has_credits_same_day() {
        let credits = create_credits(1, 1, 1);
        assert(credits.has_credits(86400), 'Should have credits');
    }

    #[test]
    fn test_has_credits_new_day() {
        let credits = create_credits(1, 1, 0);
        assert(credits.has_credits(172800), 'Should have credits on new day');
    }

    #[test]
    fn test_has_credits_no_remaining() {
        let credits = create_credits(1, 1, 0);
        assert(!credits.has_credits(86400), 'Should not have credits');
    }

    #[test]
    fn test_assert_has_credits() {
        let time = 86400;
        let credits = create_credits(1, 1, 1);
        credits.assert_has_credits(time);
    }

    #[test]
    #[should_panic(expected: ('Credits: No credits remaining',))]
    fn test_assert_has_credits_fail() {
        let time = 86400;
        let credits = create_credits(1, 1, 0);
        credits.assert_has_credits(time);
    }

    #[test]
    fn test_zero_credits() {
        let zero_credits: Credits = Zeroable::zero();
        assert(zero_credits.id == 0, 'Zero credits id should be 0');
        assert(zero_credits.day_id == 0, 'Zero cred day_id should be 0');
        assert(zero_credits.remaining == 0, 'Zero cred remaining should be 0');
    }

    #[test]
    fn test_is_zero() {
        let zero_credits: Credits = Zeroable::zero();
        assert(zero_credits.is_zero(), 'Zero cred should be zero');
        let non_zero_credits = create_credits(1, 1, 1);
        assert(!non_zero_credits.is_zero(), 'Cred should not be zero');
    }

    #[test]
    fn test_is_non_zero() {
        let zero_credits: Credits = Zeroable::zero();
        assert(!zero_credits.is_non_zero(), 'Zero cred shouldnot be nonzero');
        let non_zero_credits = create_credits(1, 1, 1);
        assert(non_zero_credits.is_non_zero(), 'Cred should be nonzero');
    }
}

