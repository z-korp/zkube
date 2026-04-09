//! Regression tests for daily score types and ranking composites.
//!
//! Verifies that:
//! - DailyEntry level_stars packing works correctly (2 bits per level).
//! - Ranking composite uses total_stars DESC, last_star_time ASC (earlier = better).

use zkube::models::daily::{DailyEntry, DailyEntryTrait};

// -- Ranking composite helper (matches daily_challenge_system::InternalImpl) --

fn compute_ranking_value(total_stars: u8, last_star_time: u64) -> u64 {
    let stars_u64: u64 = total_stars.into();
    let max_48: u64 = 0xFFFFFFFFFFFF;
    let time_truncated: u64 = last_star_time & max_48;
    let time_inverted: u64 = max_48 - time_truncated;
    (stars_u64 * 0x1000000000000) + time_inverted
}

// -- Level stars packing tests --

#[test]
fn test_entry_level_stars_roundtrip() {
    let mut entry = DailyEntryTrait::new(1, 0x1_felt252.try_into().unwrap(), 1000);

    entry.set_level_stars(1, 3);
    entry.set_level_stars(5, 2);
    entry.set_level_stars(10, 1);

    assert!(entry.get_level_stars(1) == 3, "level 1 stars");
    assert!(entry.get_level_stars(5) == 2, "level 5 stars");
    assert!(entry.get_level_stars(10) == 1, "level 10 stars");
    assert!(entry.get_level_stars(2) == 0, "unset levels should be zero");
}

#[test]
fn test_entry_level_stars_overwrite() {
    let mut entry = DailyEntryTrait::new(1, 0x1_felt252.try_into().unwrap(), 1000);

    entry.set_level_stars(3, 1);
    assert!(entry.get_level_stars(3) == 1, "initial set");

    entry.set_level_stars(3, 3);
    assert!(entry.get_level_stars(3) == 3, "overwrite to higher");
}

// -- Ranking ordering tests --

#[test]
fn test_ranking_stars_first() {
    // Higher stars always wins, regardless of time
    let low_stars = compute_ranking_value(10, 1000);
    let high_stars = compute_ranking_value(11, 99999);
    assert!(high_stars > low_stars, "more stars must always rank higher");
}

#[test]
fn test_ranking_time_breaks_tie() {
    // Same stars -> earlier time wins (higher ranking value)
    let same_stars_later = compute_ranking_value(20, 50001);
    let same_stars_earlier = compute_ranking_value(20, 50000);
    assert!(same_stars_earlier > same_stars_later, "earlier time breaks star ties");
}

#[test]
fn test_ranking_no_overflow_max_values() {
    // Max stars (30) and a large timestamp
    let value = compute_ranking_value(30, 0xFFFFFFFFFFFF);
    // With max time, time_inverted = 0, so value = 30 * 2^48
    let expected: u64 = 30 * 0x1000000000000;
    assert!(value == expected, "max ranking must not overflow u64");
}

// -- Entry existence tests --

#[test]
fn test_entry_exists_with_joined_at() {
    let entry = DailyEntryTrait::new(1, 0x1_felt252.try_into().unwrap(), 1000);
    assert!(entry.exists(), "entry with joined_at > 0 should exist");
}

#[test]
fn test_entry_not_exists_zero_joined_at() {
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
    assert!(!entry.exists(), "entry with joined_at 0 should not exist");
}
