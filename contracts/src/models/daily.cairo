use alexandria_math::BitShift;
use starknet::ContractAddress;

/// Maps a game to its daily challenge (if any)
/// DEPRECATED: Kept for migration safety. No longer written by new code.
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
    /// Unique player count (incremented only on first join)
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

/// Per-player attempt for a daily game — links game_id to daily context.
/// Each game plays ONE level (like story mode).
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyAttempt {
    #[key]
    pub game_id: felt252,
    pub player: ContractAddress,
    pub zone_id: u8,
    pub challenge_id: u32,
    pub level: u8,
    pub is_replay: bool,
}

/// Tracks the player's currently active daily game (keyed by player).
/// Prevents starting a new daily game while one is in progress.
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct ActiveDailyAttempt {
    #[key]
    pub player: ContractAddress,
    pub game_id: felt252,
    pub challenge_id: u32,
    pub level: u8,
    pub is_replay: bool,
}

/// Per-player zone-like progress for a daily challenge (compound key).
/// Tracks per-level stars, total stars, and progression — used as live leaderboard source.
/// Ranking: total_stars DESC, last_star_time ASC (earlier = better tiebreak).
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct DailyEntry {
    #[key]
    pub challenge_id: u32,
    #[key]
    pub player: ContractAddress,
    /// Packed level stars: 2 bits per level (levels 1-10), same encoding as StoryZoneProgress
    pub level_stars: u32,
    /// Sum of all level stars (0-30)
    pub total_stars: u8,
    /// Furthest level cleared (0-10)
    pub highest_cleared: u8,
    /// Timestamp of last star increase (leaderboard tiebreak — earlier is better)
    pub last_star_time: u64,
    /// When the player first joined this daily (existence sentinel: >0 = exists)
    pub joined_at: u64,
    /// Final rank (set during settlement, 0 = unranked)
    pub rank: u32,
    /// zStar reward amount (set during settlement)
    pub star_reward: u64,
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
    fn new(challenge_id: u32, player: ContractAddress, joined_at: u64) -> DailyEntry {
        DailyEntry {
            challenge_id,
            player,
            level_stars: 0,
            total_stars: 0,
            highest_cleared: 0,
            last_star_time: 0,
            joined_at,
            rank: 0,
            star_reward: 0,
        }
    }

    /// Check if this entry exists (player has joined this daily)
    #[inline(always)]
    fn exists(self: @DailyEntry) -> bool {
        *self.joined_at > 0
    }

    /// Get stars for a specific level (2-bit packed, levels 1-10)
    fn get_level_stars(self: @DailyEntry, level: u8) -> u8 {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u32 = ((level - 1) * 2).into();
        ((BitShift::shr(*self.level_stars, shift) & 0x3_u32)).try_into().unwrap()
    }

    /// Set stars for a specific level (2-bit packed, levels 1-10)
    fn set_level_stars(ref self: DailyEntry, level: u8, stars: u8) {
        assert!(level >= 1 && level <= 10, "invalid level");
        let shift: u32 = ((level - 1) * 2).into();
        let current: u32 = BitShift::shr(self.level_stars, shift) & 0x3_u32;
        let star_val: u32 = (stars & 0x3).into();
        self.level_stars = self.level_stars
            - BitShift::shl(current, shift)
            + BitShift::shl(star_val, shift);
    }
}

#[generate_trait]
pub impl ActiveDailyAttemptImpl of ActiveDailyAttemptTrait {
    fn new(
        player: ContractAddress, game_id: felt252, challenge_id: u32, level: u8, is_replay: bool,
    ) -> ActiveDailyAttempt {
        ActiveDailyAttempt { player, game_id, challenge_id, level, is_replay }
    }

    fn empty(player: ContractAddress) -> ActiveDailyAttempt {
        ActiveDailyAttempt { player, game_id: 0, challenge_id: 0, level: 0, is_replay: false }
    }

    #[inline(always)]
    fn exists(self: @ActiveDailyAttempt) -> bool {
        *self.game_id != 0
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
    use super::{
        ActiveDailyAttemptTrait, DailyChallenge, DailyChallengeTrait, DailyEntry, DailyEntryTrait,
    };

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
        let entry = DailyEntryTrait::new(1, 0x1_felt252.try_into().unwrap(), 1000);
        assert!(entry.exists(), "Entry with joined_at > 0 should exist");
    }

    #[test]
    fn test_entry_not_exists() {
        let entry = DailyEntry {
            challenge_id: 1,
            player: 0x1_felt252.try_into().unwrap(),
            level_stars: 0,
            total_stars: 0,
            highest_cleared: 0,
            last_star_time: 0,
            joined_at: 0,
            rank: 0,
            star_reward: 0,
        };
        assert!(!entry.exists(), "Entry with joined_at 0 should not exist");
    }

    #[test]
    fn test_entry_level_stars_roundtrip() {
        let mut entry = DailyEntryTrait::new(1, 0x1_felt252.try_into().unwrap(), 1000);

        entry.set_level_stars(1, 3);
        entry.set_level_stars(6, 2);
        entry.set_level_stars(10, 1);

        assert!(entry.get_level_stars(1) == 3, "level 1 stars");
        assert!(entry.get_level_stars(6) == 2, "level 6 stars");
        assert!(entry.get_level_stars(10) == 1, "level 10 stars");
        assert!(entry.get_level_stars(2) == 0, "unset levels should be zero");
    }

    #[test]
    fn test_active_daily_empty_is_not_active() {
        let player: starknet::ContractAddress = 'PLAYER'.try_into().unwrap();
        let active = ActiveDailyAttemptTrait::empty(player);
        assert!(!active.exists(), "empty active daily game should not exist");
    }
}
