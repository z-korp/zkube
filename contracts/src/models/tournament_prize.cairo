use core::traits::TryInto;

// Core imports

use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

// External imports

use origami_random::deck::{Deck as OrigamiDeck, DeckTrait};

// Internal imports

use zkube::constants;
use zkube::models::index::TournamentPrize;

// Errors

mod errors {
    const REWARD_ALREADY_CLAIMED: felt252 = 'Tournament: already claimed';
    const INVALID_PLAYER: felt252 = 'Tournament: invalid player';
    const TOURNAMENT_NOT_OVER: felt252 = 'Tournament: not over';
    const PRIZE_OVERFLOW: felt252 = 'Tournament: prize overflow';
    const TOURNAMENT_NOT_FOUND: felt252 = 'Tournament: not found';
    const NOTHING_TO_CLAIM: felt252 = 'Tournament: nothing to claim';
}

#[generate_trait]
impl TournamentPrizeImpl of TournamentPrizeTrait {
    #[inline(always)]
    fn pay_entry_fee(ref self: TournamentPrize, amount: u128) {
        // [Check] Overflow
        let current = self.prize;
        let next = self.prize + amount;
        assert(next >= current, errors::PRIZE_OVERFLOW);

        // [Effect] Payout
        self.prize += amount;
    }
}

#[generate_trait]
impl TournamentPrizeAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: TournamentPrize) {
        assert(self.is_non_zero(), errors::TOURNAMENT_NOT_FOUND);
    }
}

impl ZeroableTournamentPrize of Zeroable<TournamentPrize> {
    #[inline(always)]
    fn zero() -> TournamentPrize {
        TournamentPrize { id: 0, prize: 0, is_set: false, }
    }

    #[inline(always)]
    fn is_zero(self: TournamentPrize) -> bool {
        !self.is_set
    }

    #[inline(always)]
    fn is_non_zero(self: TournamentPrize) -> bool {
        !self.is_zero()
    }
}

