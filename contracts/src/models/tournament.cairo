use core::traits::TryInto;

// Core imports

use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

// External imports

use origami::random::deck::{Deck as OrigamiDeck, DeckTrait};

// Internal imports

use zkube::constants;
use zkube::models::index::Tournament;

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
impl TournamentImpl of TournamentTrait {
    #[inline(always)]
    fn compute_id(time: u64, duration: u64) -> u64 {
        time / duration
    }

    #[inline(always)]
    fn player(self: Tournament, rank: u8) -> felt252 {
        match rank {
            0 => 0,
            1 => self.top1_player_id,
            2 => self.top2_player_id,
            3 => self.top3_player_id,
            _ => 0,
        }
    }

    fn reward(self: Tournament, rank: u8) -> u256 {
        match rank {
            0 => 0_u256,
            1 => {
                // [Compute] Remove the other prize to avoid remaining dust due to rounding
                let second_prize = self.reward(2);
                let third_prize = self.reward(3);
                self.prize.into() - second_prize - third_prize
            },
            2 => {
                if self.top2_player_id == 0 {
                    return 0_u256;
                }
                let third_reward = self.reward(3);
                (self.prize.into() - third_reward) / 3_u256
            },
            3 => {
                if self.top3_player_id == 0 {
                    return 0_u256;
                }
                self.prize.into() / 6_u256
            },
            _ => 0_u256,
        }
    }

    #[inline(always)]
    fn score(ref self: Tournament, player_id: felt252, score: u32) {
        if score <= self.top3_score {
            return;
        }

        if score <= self.top2_score {
            self.top3_score = score;
            self.top3_player_id = player_id;
            return;
        }

        if score <= self.top1_score {
            self.top3_score = self.top2_score;
            self.top3_player_id = self.top2_player_id;
            self.top2_score = score;
            self.top2_player_id = player_id;
            return;
        }

        self.top3_score = self.top2_score;
        self.top3_player_id = self.top2_player_id;
        self.top2_score = self.top1_score;
        self.top2_player_id = self.top1_player_id;
        self.top1_score = score;
        self.top1_player_id = player_id;
    }

    #[inline(always)]
    fn buyin(ref self: Tournament, amount: felt252) {
        // [Check] Overflow
        let current: u256 = self.prize.into();
        let next: u256 = (self.prize + amount).into();
        assert(next >= current, errors::PRIZE_OVERFLOW);
        // [Effect] Payout
        self.prize += amount;
    }

    #[inline(always)]
    fn claim(ref self: Tournament, player_id: felt252, rank: u8, time: u64, duration: u64) -> u256 {
        // [Check] Tournament is over
        self.assert_is_over(time, duration);
        // [Check] Reward not already claimed
        self.assert_not_claimed(rank);
        // [Check] Player is caller
        let player = self.player(rank);
        assert(player == player_id, errors::INVALID_PLAYER);
        // [Check] Something to claim
        let reward = self.reward(rank);
        assert(reward != 0, errors::NOTHING_TO_CLAIM);
        // [Effect] Claim and return the corresponding reward
        if rank == 1 {
            self.top1_claimed = true;
        } else if rank == 2 {
            self.top2_claimed = true;
        } else if rank == 3 {
            self.top3_claimed = true;
        }
        reward
    }
}

#[generate_trait]
impl TournamentAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Tournament) {
        assert(self.is_non_zero(), errors::TOURNAMENT_NOT_FOUND);
    }

    #[inline(always)]
    fn assert_not_claimed(self: Tournament, rank: u8) {
        // assert(!self.claimed, errors::REWARD_ALREADY_CLAIMED);
        if rank == 1 {
            assert(!self.top1_claimed, errors::REWARD_ALREADY_CLAIMED);
        } else if rank == 2 {
            assert(!self.top2_claimed, errors::REWARD_ALREADY_CLAIMED);
        } else if rank == 3 {
            assert(!self.top3_claimed, errors::REWARD_ALREADY_CLAIMED);
        }
    }

    #[inline(always)]
    fn assert_is_over(self: Tournament, time: u64, duration: u64) {
        let id = TournamentImpl::compute_id(time, duration);
        assert(id > self.id, errors::TOURNAMENT_NOT_OVER);
    }
}

impl ZeroableTournament of Zeroable<Tournament> {
    #[inline(always)]
    fn zero() -> Tournament {
        Tournament {
            id: 0,
            prize: 0,
            top1_player_id: 0,
            top2_player_id: 0,
            top3_player_id: 0,
            top1_score: 0,
            top2_score: 0,
            top3_score: 0,
            top1_claimed: false,
            top2_claimed: false,
            top3_claimed: false,
        }
    }

    #[inline(always)]
    fn is_zero(self: Tournament) -> bool {
        self.prize == 0
    }

    #[inline(always)]
    fn is_non_zero(self: Tournament) -> bool {
        !self.is_zero()
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;
    use core::Default;

    // Local imports

    use super::{Tournament, TournamentImpl, constants};

    // Constants

    const TIME: u64 = 1710347593;

    // Implementations

    impl DefaultTournament of Default<Tournament> {
        #[inline(always)]
        fn default() -> Tournament {
            Tournament {
                id: 0,
                prize: 0,
                top1_player_id: 0,
                top2_player_id: 0,
                top3_player_id: 0,
                top1_score: 0,
                top2_score: 0,
                top3_score: 0,
                top1_claimed: false,
                top2_claimed: false,
                top3_claimed: false,
            }
        }
    }

    #[test]
    fn test_compute_id_zero() {
        let id = TournamentImpl::compute_id(0, constants::NORMAL_MODE_DURATION);
        assert(0 == id, 'Tournament: wrong id');
    }

    #[test]
    fn test_compute_id_today() {
        let time = 1710347593;
        let id = TournamentImpl::compute_id(time, constants::NORMAL_MODE_DURATION);
        assert(28 == id, 'Tournament: wrong id');
    }

    #[test]
    fn test_score() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 10);
        tournament.score(2, 20);
        tournament.score(3, 15);
        tournament.score(4, 5);
        tournament.score(5, 25);
        assert(5 == tournament.top1_player_id, 'Tournament: wrong top1 player');
        assert(2 == tournament.top2_player_id, 'Tournament: wrong top2 player');
        assert(3 == tournament.top3_player_id, 'Tournament: wrong top3 player');
        assert(25 == tournament.top1_score, 'Tournament: wrong top1 score');
        assert(20 == tournament.top2_score, 'Tournament: wrong top2 score');
        assert(15 == tournament.top3_score, 'Tournament: wrong top3 score');
    }

    #[test]
    fn test_claim_three_players() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(1, 10);
        tournament.score(2, 20);
        tournament.score(3, 15);

        // First claims the reward
        let reward = tournament.claim(2, 1, TIME, constants::NORMAL_MODE_DURATION);
        assert(56 == reward, 'Tournament: wrong reward');
        assert(tournament.top1_claimed, 'Tournament: not claimed');

        // Second claims the reward
        let reward = tournament.claim(3, 2, TIME, constants::NORMAL_MODE_DURATION);
        assert(28 == reward, 'Tournament: wrong reward');
        assert(tournament.top2_claimed, 'Tournament: not claimed');

        // Third claims the reward
        let reward = tournament.claim(1, 3, TIME, constants::NORMAL_MODE_DURATION);
        assert(16 == reward, 'Tournament: wrong reward');
        assert(tournament.top3_claimed, 'Tournament: not claimed');
    }

    #[test]
    fn test_claim_two_players() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(2, 20);
        tournament.score(3, 15);

        // First claims the reward
        let reward = tournament.claim(2, 1, TIME, constants::NORMAL_MODE_DURATION);
        assert(67 == reward, 'Tournament: wrong reward');
        assert(tournament.top1_claimed, 'Tournament: not claimed');

        // Second claims the reward
        let reward = tournament.claim(3, 2, TIME, constants::NORMAL_MODE_DURATION);
        assert(33 == reward, 'Tournament: wrong reward');
        assert(tournament.top2_claimed, 'Tournament: not claimed');
    }

    #[test]
    fn test_claim_one_player() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(2, 20);

        // First claims the reward
        let reward = tournament.claim(2, 1, TIME, constants::NORMAL_MODE_DURATION);
        assert(100 == reward, 'Tournament: wrong reward');
        assert(tournament.top1_claimed, 'Tournament: not claimed');
    }

    #[test]
    #[should_panic(expected: ('Tournament: invalid player',))]
    fn test_claim_revert_invalid_player() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(2, 20);
        tournament.score(3, 15);

        // First claims the reward
        tournament.claim(3, 1, TIME, constants::NORMAL_MODE_DURATION);
    }

    #[test]
    #[should_panic(expected: ('Tournament: not over',))]
    fn test_claim_revert_not_over() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(1, 10);
        tournament.score(2, 20);
        tournament.score(3, 15);

        // First claims the reward
        tournament.claim(1, 3, 0, constants::NORMAL_MODE_DURATION);
    }

    #[test]
    #[should_panic(expected: ('Tournament: already claimed',))]
    fn test_claim_revert_already_claimed() {
        let mut tournament: Tournament = Default::default();
        tournament.prize = 100;
        tournament.score(1, 10);
        tournament.score(2, 20);
        tournament.score(3, 15);

        // First claims the reward
        tournament.claim(1, 3, TIME, constants::NORMAL_MODE_DURATION);
        tournament.claim(1, 3, TIME, constants::NORMAL_MODE_DURATION);
    }
}

