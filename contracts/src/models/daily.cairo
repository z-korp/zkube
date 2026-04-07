use starknet::ContractAddress;

/// Maps a game to its daily challenge (if any)
/// Written when a game is created via start_daily_game()
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct GameChallenge {
    #[key]
    pub game_id: felt252,
    /// The daily challenge this game belongs to (0 = not a daily challenge game)
    pub challenge_id: u32,
}

/// Daily challenge definition — auto-created on first play of the day
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyChallenge {
    #[key]
    pub challenge_id: u32,
    /// GameSettings ID for this challenge's zone ruleset (derived from zone_id)
    pub settings_id: u32,
    /// Deterministic seed — shared by all players for identical block sequences
    pub seed: felt252,
    /// UTC timestamp (midnight)
    pub start_time: u64,
    /// start_time + 86400
    pub end_time: u64,
    /// Unique player count (incremented only on first attempt)
    pub total_entries: u32,
    /// True once reward distribution is finalized
    pub settled: bool,
    /// Randomly selected zone (1-10)
    pub zone_id: u8,
    /// Randomly selected active mutator (bonus profile, odd IDs 1-19)
    pub active_mutator_id: u8,
    /// Randomly selected passive mutator (stat modifiers, even IDs 2-20)
    pub passive_mutator_id: u8,
    /// Randomly selected boss identity (1-10)
    pub boss_id: u8,
}

/// Per-player attempt for a daily game — links game_id to daily context
/// Analogous to StoryAttempt for settings resolution + auth bypass
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyAttempt {
    #[key]
    pub game_id: felt252,
    pub player: ContractAddress,
    pub zone_id: u8,
    pub challenge_id: u32,
}

/// Per-player entry tracking for a daily challenge (compound key)
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyEntry {
    #[key]
    pub challenge_id: u32,
    #[key]
    pub player: ContractAddress,
    /// Number of attempts by this player
    pub attempts: u32,
    /// Best score achieved across all attempts
    pub best_score: u32,
    /// Best level reached across all attempts
    pub best_level: u8,
    /// Best stars earned across all attempts
    pub best_stars: u8,
    /// Game ID of the best run (for verification)
    pub best_game_id: felt252,
    /// Final rank (set during settlement, 0 = unranked)
    pub rank: u32,
    /// zStar reward amount (set during settlement)
    pub star_reward: u256,
}

/// Top N leaderboard tracking (compound key: challenge_id + rank)
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyLeaderboard {
    #[key]
    pub challenge_id: u32,
    #[key]
    pub rank: u32,
    /// Player at this rank
    pub player: ContractAddress,
    /// Ranking metric value — u64 to hold zone composite: (stars << 32) | score
    pub value: u64,
}

// ============================================================
// Trait implementations
// ============================================================

#[generate_trait]
pub impl DailyChallengeImpl of DailyChallengeTrait {
    /// Check if the challenge exists (non-zero start_time)
    #[inline(always)]
    fn exists(self: @DailyChallenge) -> bool {
        *self.start_time != 0
    }

    /// Check if the challenge is currently active (within time window)
    fn is_active(self: @DailyChallenge, current_time: u64) -> bool {
        current_time >= *self.start_time && current_time < *self.end_time
    }

    /// Check if the challenge has ended
    fn has_ended(self: @DailyChallenge, current_time: u64) -> bool {
        current_time >= *self.end_time
    }
}

#[generate_trait]
pub impl DailyEntryImpl of DailyEntryTrait {
    /// Check if this entry exists (has at least one attempt)
    #[inline(always)]
    fn exists(self: @DailyEntry) -> bool {
        *self.attempts > 0
    }
}

#[generate_trait]
pub impl DailyAttemptImpl of DailyAttemptTrait {
    /// Check if this attempt exists (non-zero player)
    #[inline(always)]
    fn exists(self: @DailyAttempt) -> bool {
        let zero: ContractAddress = core::num::traits::Zero::zero();
        *self.player != zero
    }
}

#[cfg(test)]
mod tests {
    use super::{DailyChallenge, DailyChallengeTrait, DailyEntry, DailyEntryTrait};

    fn make_challenge(start: u64, end: u64) -> DailyChallenge {
        DailyChallenge {
            challenge_id: 1,
            settings_id: 0,
            seed: 'test_seed',
            start_time: start,
            end_time: end,
            total_entries: 0,
            settled: false,
            zone_id: 1,
            active_mutator_id: 1,
            passive_mutator_id: 2,
            boss_id: 1,
        }
    }

    #[test]
    fn test_challenge_exists() {
        let c = make_challenge(1000, 87400);
        assert!(c.exists(), "Challenge with start_time > 0 should exist");
    }

    #[test]
    fn test_challenge_not_exists() {
        let c = make_challenge(0, 0);
        assert!(!c.exists(), "Challenge with start_time 0 should not exist");
    }

    #[test]
    fn test_challenge_is_active() {
        let c = make_challenge(1000, 87400);
        assert!(c.is_active(1000), "Should be active at start_time");
        assert!(c.is_active(50000), "Should be active in the middle");
        assert!(c.is_active(87399), "Should be active just before end");
    }

    #[test]
    fn test_challenge_not_active_before_start() {
        let c = make_challenge(1000, 87400);
        assert!(!c.is_active(999), "Should not be active before start");
    }

    #[test]
    fn test_challenge_not_active_after_end() {
        let c = make_challenge(1000, 87400);
        assert!(!c.is_active(87400), "Should not be active at end_time");
        assert!(!c.is_active(100000), "Should not be active after end");
    }

    #[test]
    fn test_challenge_has_ended() {
        let c = make_challenge(1000, 87400);
        assert!(!c.has_ended(1000), "Should not have ended at start");
        assert!(!c.has_ended(87399), "Should not have ended before end");
        assert!(c.has_ended(87400), "Should have ended at end_time");
        assert!(c.has_ended(100000), "Should have ended after end");
    }

    #[test]
    fn test_entry_exists() {
        let entry = DailyEntry {
            challenge_id: 1,
            player: 0x1_felt252.try_into().unwrap(),
            attempts: 1,
            best_score: 0,
            best_level: 0,
            best_stars: 0,
            best_game_id: 0,
            rank: 0,
            star_reward: 0,
        };
        assert!(entry.exists(), "Entry with attempts > 0 should exist");
    }

    #[test]
    fn test_entry_not_exists() {
        let entry = DailyEntry {
            challenge_id: 1,
            player: 0x1_felt252.try_into().unwrap(),
            attempts: 0,
            best_score: 0,
            best_level: 0,
            best_stars: 0,
            best_game_id: 0,
            rank: 0,
            star_reward: 0,
        };
        assert!(!entry.exists(), "Entry with 0 attempts should not exist");
    }
}
