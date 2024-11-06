use core::traits::TryInto;
use core::traits::Into;
use starknet::info::get_block_timestamp;
use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

use zkube::models::index::{Participation, m_Participation};
use zkube::models::index::Chest;
use zkube::constants::PRECISION_FACTOR;

mod errors {
    const PARTICIPATION_NOT_EXIST: felt252 = 'Parti.: Does not exist';
    const PARTICIPATION_ALREADY_EXIST: felt252 = 'Parti.: Already exist';
}

#[generate_trait]
impl ParticipationImpl of ParticipationTrait {
    fn new(chest_id: u32, player_id: felt252) -> Participation {
        Participation { chest_id, player_id, points: 0, claimed: false, is_set: true }
    }

    fn add_points(ref self: Participation, points: u32) {
        self.points += points;
    }

    fn claim(ref self: Participation, total_points: u32, total_prize: u128) -> u128 {
        assert(!self.claimed, 'Participation already claimed');

        // Calculate the reward using fixed-point arithmetic
        let scaled_player_points: u256 = self.points.into() * PRECISION_FACTOR.into();
        let reward: u256 = (scaled_player_points / total_points.into())
            * total_prize.into()
            / PRECISION_FACTOR.into();

        // Update participation to mark as claimed
        self.claimed = true;

        reward.try_into().unwrap()
    }
}

#[generate_trait]
impl ParticipationAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Participation) {
        assert(self.is_non_zero(), errors::PARTICIPATION_NOT_EXIST);
    }

    #[inline(always)]
    fn assert_not_exists(self: Participation) {
        assert(self.is_zero(), errors::PARTICIPATION_ALREADY_EXIST);
    }
}

impl ZeroableParticipation of Zeroable<Participation> {
    fn zero() -> Participation {
        Participation { chest_id: 0, player_id: 0, is_set: false, points: 0, claimed: false }
    }

    fn is_zero(self: Participation) -> bool {
        !self.is_set
    }

    fn is_non_zero(self: Participation) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    use super::{Participation, ParticipationImpl, ZeroableParticipation};
    use core::Zeroable;

    #[test]
    fn test_participation_new() {
        let participation = ParticipationImpl::new(1, 123);
        assert(participation.chest_id == 1, 'Chest id should be 1');
        assert(participation.player_id == 123, 'Player id should be 123');
        assert(participation.points == 0, 'Initial score should be 0');
        assert(!participation.claimed, 'Should not be claimed initially');
    }

    #[test]
    fn test_participation_add_points() {
        let mut participation = ParticipationImpl::new(1, 123);
        participation.add_points(50);
        assert(participation.points == 50, 'Score should be 50');
        participation.add_points(30);
        assert(participation.points == 80, 'Score should be 80');
    }

    #[test]
    fn test_participation_claim() {
        let mut participation = ParticipationImpl::new(1, 123);
        participation.claim(100, 1000);
        assert(participation.claimed, 'Participation should be claimed');
    }

    #[test]
    #[should_panic(expected: ('Participation already claimed',))]
    fn test_participation_claim_twice() {
        let mut participation = ParticipationImpl::new(1, 123);
        participation.claim(100, 1000);
        participation.claim(100, 1000); // This should panic
    }

    #[test]
    fn test_zero_participation() {
        let zero_participation: Participation = Zeroable::zero();
        assert(zero_participation.chest_id == 0, 'Zero part chest_id should be 0');
        assert(zero_participation.player_id == 0, 'Zero part player_id should be 0');
        assert(zero_participation.points == 0, 'Zero part score should be 0');
        assert(!zero_participation.claimed, 'Zero part should not be claimed');
    }
}
