use core::traits::TryInto;

// Core imports

use core::debug::PrintTrait;
use core::Default;
use core::Zeroable;

// External imports

use origami_random::deck::{Deck as OrigamiDeck, DeckTrait};

// Internal imports

use zkube::constants;
use zkube::models::index::{Tournament, m_Tournament};

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

    fn reward(self: Tournament, rank: u8) -> u128 {
        match rank {
            0 => 0_u128,
            1 => {
                // [Compute] Remove the other prize to avoid remaining dust due to rounding
                let second_prize = self.reward(2);
                let third_prize = self.reward(3);
                self.prize - second_prize - third_prize
            },
            2 => {
                if self.top2_player_id == 0 {
                    return 0_u128;
                }
                let third_reward = self.reward(3);
                (self.prize - third_reward) / 3_u128
            },
            3 => {
                if self.top3_player_id == 0 {
                    return 0_u128;
                }
                self.prize / 6_u128
            },
            _ => 0_u128,
        }
    }

    #[inline(always)]
    fn score(ref self: Tournament, player_id: felt252, game_id: u32, score: u32) {
        // Remove the game if it is already in the top rankings
        if self.top1_game_id == game_id {
            // Since scores can only increase, update the score directly
            self.top1_score = score;
            return;
        } else if self.top2_game_id == game_id {
            // Remove from top2
            self.top2_score = self.top3_score;
            self.top2_player_id = self.top3_player_id;
            self.top2_game_id = self.top3_game_id;
            self.top3_score = 0;
            self.top3_player_id = 0;
            self.top3_game_id = 0;
        } else if self.top3_game_id == game_id {
            // Remove from top3
            self.top3_score = 0;
            self.top3_player_id = 0;
            self.top3_game_id = 0;
        }

        // Insert the new score if the position is empty or the score is high enough
        if self.top3_player_id == 0 || score > self.top3_score {
            // Determine where to insert the new score
            if self.top2_player_id == 0 || score > self.top2_score {
                // Shift down top2 to top3
                self.top3_score = self.top2_score;
                self.top3_player_id = self.top2_player_id;
                self.top3_game_id = self.top2_game_id;

                if self.top1_player_id == 0 || score > self.top1_score {
                    // Shift down top1 to top2
                    self.top2_score = self.top1_score;
                    self.top2_player_id = self.top1_player_id;
                    self.top2_game_id = self.top1_game_id;

                    // Update top1
                    self.top1_score = score;
                    self.top1_player_id = player_id;
                    self.top1_game_id = game_id;
                } else {
                    // Insert into top2
                    self.top2_score = score;
                    self.top2_player_id = player_id;
                    self.top2_game_id = game_id;
                }
            } else {
                // Insert into top3
                self.top3_score = score;
                self.top3_player_id = player_id;
                self.top3_game_id = game_id;
            }
        } else {
            // The score is not high enough to be in the top 3
            return;
        }
    }

    #[inline(always)]
    fn pay_entry_fee(ref self: Tournament, amount: u128) {
        // [Check] Overflow
        let current = self.prize;
        let next = self.prize + amount;
        assert(next >= current, errors::PRIZE_OVERFLOW);

        // [Effect] Payout
        self.prize += amount;
    }

    #[inline(always)]
    fn claim(ref self: Tournament, player_id: felt252, rank: u8, time: u64, duration: u64) -> u128 {
        // [Check] Tournament is over
        self.assert_is_over(time, duration);
        // [Check] Reward not already claimed
        self.assert_not_claimed(rank);
        // [Check] Player is caller (player_id arg comes from the caller)
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
            is_set: false,
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
            top1_game_id: 0,
            top2_game_id: 0,
            top3_game_id: 0,
        }
    }

    #[inline(always)]
    fn is_zero(self: Tournament) -> bool {
        !self.is_set
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
                is_set: false,
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
                top1_game_id: 0,
                top2_game_id: 0,
                top3_game_id: 0,
            }
        }
    }

    #[test]
    fn test_compute_id_zero() {
        let id = TournamentImpl::compute_id(0, constants::NORMAL_MODE_DURATION);
        assert(id == 0, 'Tournament: wrong id');
    }

    #[test]
    fn test_compute_id_today() {
        let time = 1710347593;
        let id = TournamentImpl::compute_id(time, 604800);
        assert(id == 2827, 'Tournament: wrong id');
    }

    #[test]
    fn test_insert_into_empty_leaderboard() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 10); // Player 1, Game 101, Score 10

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 101);
        assert_eq!(tournament.top1_score, 10);
        assert_eq!(tournament.top2_player_id, 0);
        assert_eq!(tournament.top3_player_id, 0);
    }

    #[test]
    fn test_insert_zero_score() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 0); // Player 1, Game 101, Score 0

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 101);
        assert_eq!(tournament.top1_score, 0);
    }

    #[test]
    fn test_update_existing_game_score() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 10); // Initial score
        tournament.score(1, 101, 20); // Updated score

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 101);
        assert_eq!(tournament.top1_score, 20);
        assert_eq!(tournament.top2_player_id, 0);
    }

    #[test]
    fn test_insert_score_equal_to_existing() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 20);
        tournament.score(2, 102, 20);

        // Since scores are equal, the first inserted should stay higher
        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 20);
        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_score, 20);
    }

    #[test]
    fn test_insert_lower_score() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 30);
        tournament.score(2, 102, 20);

        // Try to insert a lower score that shouldn't affect the leaderboard
        tournament.score(3, 103, 10);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 30);
        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_score, 20);
        assert_eq!(tournament.top3_player_id, 3);
        assert_eq!(tournament.top3_score, 10);
    }

    #[test]
    fn test_same_player_multiple_games() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 10);
        tournament.score(1, 102, 20);
        tournament.score(1, 103, 15);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 102);
        assert_eq!(tournament.top1_score, 20);

        assert_eq!(tournament.top2_player_id, 1);
        assert_eq!(tournament.top2_game_id, 103);
        assert_eq!(tournament.top2_score, 15);

        assert_eq!(tournament.top3_player_id, 1);
        assert_eq!(tournament.top3_game_id, 101);
        assert_eq!(tournament.top3_score, 10);
    }

    #[test]
    fn test_shift_entries_on_higher_score() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 10);
        tournament.score(2, 102, 20);
        tournament.score(3, 103, 15);

        // Player 3 improves score in Game 103 to 25
        tournament.score(3, 103, 25);

        assert_eq!(tournament.top1_player_id, 3);
        assert_eq!(tournament.top1_game_id, 103);
        assert_eq!(tournament.top1_score, 25);

        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_game_id, 102);
        assert_eq!(tournament.top2_score, 20);

        assert_eq!(tournament.top3_player_id, 1);
        assert_eq!(tournament.top3_game_id, 101);
        assert_eq!(tournament.top3_score, 10);
    }

    #[test]
    fn test_tied_scores() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 20);
        tournament.score(2, 102, 30);
        tournament.score(3, 103, 30);

        // Check that the first to achieve the score stays higher
        assert_eq!(tournament.top1_player_id, 2);
        assert_eq!(tournament.top1_score, 30);

        assert_eq!(tournament.top2_player_id, 3);
        assert_eq!(tournament.top2_score, 30);

        assert_eq!(tournament.top3_player_id, 1);
        assert_eq!(tournament.top3_score, 20);
    }

    #[test]
    fn test_leaderboard_with_one_entry() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 50);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 50);
        assert_eq!(tournament.top2_player_id, 0);
        assert_eq!(tournament.top3_player_id, 0);
    }

    #[test]
    fn test_leaderboard_with_two_entries() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 40);
        tournament.score(2, 102, 30);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 40);
        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_score, 30);
        assert_eq!(tournament.top3_player_id, 0);
    }

    #[test]
    fn test_insert_score_when_leaderboard_full() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 30);
        tournament.score(2, 102, 20);
        tournament.score(3, 103, 10);

        // New score that's not high enough to enter the leaderboard
        tournament.score(4, 104, 5);

        // Leaderboard should remain unchanged
        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 30);
        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_score, 20);
        assert_eq!(tournament.top3_player_id, 3);
        assert_eq!(tournament.top3_score, 10);
    }

    #[test]
    fn test_insert_score_into_full_leaderboard() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 30);
        tournament.score(2, 102, 20);
        tournament.score(3, 103, 10);

        // New high score that should enter the leaderboard
        tournament.score(4, 104, 25);

        // Leaderboard should update accordingly
        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 30);
        assert_eq!(tournament.top2_player_id, 4);
        assert_eq!(tournament.top2_score, 25);
        assert_eq!(tournament.top3_player_id, 2);
        assert_eq!(tournament.top3_score, 20);
    }

    #[test]
    fn test_multiple_updates_to_same_game() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 10);
        tournament.score(1, 101, 20);
        tournament.score(1, 101, 30);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 101);
        assert_eq!(tournament.top1_score, 30);
    }

    #[test]
    fn test_scores_with_zero_values() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 0);
        tournament.score(2, 102, 0);
        tournament.score(3, 103, 0);

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_score, 0);
        assert_eq!(tournament.top2_player_id, 2);
        assert_eq!(tournament.top2_score, 0);
        assert_eq!(tournament.top3_player_id, 3);
        assert_eq!(tournament.top3_score, 0);
    }

    #[test]
    fn test_player_with_multiple_games_and_updates() {
        let mut tournament: Tournament = Default::default();
        tournament.score(1, 101, 15);
        tournament.score(1, 102, 20);
        tournament.score(1, 101, 25); // Update Game 101

        assert_eq!(tournament.top1_player_id, 1);
        assert_eq!(tournament.top1_game_id, 101);
        assert_eq!(tournament.top1_score, 25);

        assert_eq!(tournament.top2_player_id, 1);
        assert_eq!(tournament.top2_game_id, 102);
        assert_eq!(tournament.top2_score, 20);
    }
}

