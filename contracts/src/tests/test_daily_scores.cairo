//! Regression tests for daily score types and ranking composites.
//!
//! Verifies that:
//! - DailyEntry.best_score (u32) stores values above 65535 without truncation.
//! - Zone ranking composite uses stars-first ordering via (stars << 32) | score.

use zkube::models::daily::{DailyEntry, DailyEntryTrait};

// -- Ranking composite helper (always zone mode: stars-first) --

fn compute_ranking_value(total_stars: u8, total_score: u32) -> u64 {
    let stars_u64: u64 = total_stars.into();
    let score_u64: u64 = total_score.into();
    (stars_u64 * 0x100000000) + score_u64
}

// -- Score storage tests --

#[test]
fn test_best_score_stores_above_65535() {
    let entry = DailyEntry {
        challenge_id: 1,
        player: 0x1_felt252.try_into().unwrap(),
        attempts: 1,
        best_score: 100000_u32,
        best_level: 5,
        best_stars: 0,
        best_game_id: 'game1',
        rank: 0,
        star_reward: 0,
    };
    assert!(entry.best_score == 100000, "best_score must store values > 65535");
}

#[test]
fn test_best_score_max_u32() {
    let entry = DailyEntry {
        challenge_id: 1,
        player: 0x1_felt252.try_into().unwrap(),
        attempts: 1,
        best_score: 4294967295_u32,
        best_level: 10,
        best_stars: 0,
        best_game_id: 'game2',
        rank: 0,
        star_reward: 0,
    };
    assert!(entry.best_score == 4294967295, "best_score must handle u32 max");
}

// -- Ranking ordering tests --

#[test]
fn test_zone_ranking_stars_first() {
    // Higher stars always wins, regardless of score
    let low_stars_high_score = compute_ranking_value(10, 999999);
    let high_stars_low_score = compute_ranking_value(11, 0);
    assert!(
        high_stars_low_score > low_stars_high_score,
        "more stars must always rank higher in zone mode",
    );
}

#[test]
fn test_zone_ranking_score_breaks_tie() {
    // Same stars -> higher score wins
    let same_stars_lower = compute_ranking_value(20, 50000);
    let same_stars_higher = compute_ranking_value(20, 50001);
    assert!(same_stars_higher > same_stars_lower, "higher score breaks star ties in zone mode");
}

#[test]
fn test_zone_ranking_no_overflow_max_values() {
    // Max stars (30) and max score (u32 max)
    let value = compute_ranking_value(30, 4294967295);
    // (30 << 32) + 4294967295 = 30 * 4294967296 + 4294967295 = 133143986175
    let expected: u64 = 30 * 0x100000000 + 4294967295;
    assert!(value == expected, "max zone ranking must not overflow u64");
}
