//! Regression tests for daily score types and ranking composites.
//!
//! Verifies that:
//! - DailyEntry.best_score (u32) stores values above 65535 without truncation.
//! - Zone ranking composite uses stars-first ordering via (stars << 32) | score.
//! - Endless ranking uses raw score only.
//! - DailyLeaderboard.value (u64) holds the full composite.

use zkube::models::daily::{DailyEntry, DailyEntryTrait, DailyLeaderboard};

// ── Ranking composite helpers (mirrors game_over / daily_challenge logic) ──

fn compute_ranking_value(run_type: u8, total_stars: u8, total_score: u32) -> u64 {
    if run_type == 1 {
        total_score.into()
    } else {
        let stars_u64: u64 = total_stars.into();
        let score_u64: u64 = total_score.into();
        (stars_u64 * 0x100000000) + score_u64
    }
}

// ── Score storage tests
// ─────────────────────────────────────────────

#[test]
fn test_best_score_stores_above_65535() {
    let entry = DailyEntry {
        challenge_id: 1,
        player: 0x1_felt252.try_into().unwrap(),
        attempts: 1,
        best_score: 100000_u32,
        best_level: 5,
        best_depth: 0,
        best_game_id: 'game1',
        rank: 0,
        prize_amount: 0,
        claimed: false,
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
        best_depth: 0,
        best_game_id: 'game2',
        rank: 0,
        prize_amount: 0,
        claimed: false,
    };
    assert!(entry.best_score == 4294967295, "best_score must handle u32 max");
}

// ── Leaderboard value tests
// ─────────────────────────────────────────

#[test]
fn test_leaderboard_value_holds_zone_composite() {
    // 30 stars, 100000 score → (30 << 32) | 100000
    let value: u64 = compute_ranking_value(0, 30, 100000);
    let lb = DailyLeaderboard {
        challenge_id: 1, rank: 1, player: 0x1_felt252.try_into().unwrap(), value,
    };
    assert!(lb.value == value, "leaderboard value must hold full u64 composite");
    assert!(lb.value > 0x100000000, "30 stars composite must exceed 2^32");
}

// ── Ranking ordering tests
// ──────────────────────────────────────────

#[test]
fn test_zone_ranking_stars_first() {
    // Higher stars always wins, regardless of score
    let low_stars_high_score = compute_ranking_value(0, 10, 999999);
    let high_stars_low_score = compute_ranking_value(0, 11, 0);
    assert!(
        high_stars_low_score > low_stars_high_score,
        "more stars must always rank higher in zone mode",
    );
}

#[test]
fn test_zone_ranking_score_breaks_tie() {
    // Same stars → higher score wins
    let same_stars_lower = compute_ranking_value(0, 20, 50000);
    let same_stars_higher = compute_ranking_value(0, 20, 50001);
    assert!(same_stars_higher > same_stars_lower, "higher score breaks star ties in zone mode");
}

#[test]
fn test_endless_ranking_raw_score() {
    let r1 = compute_ranking_value(1, 0, 100000);
    let r2 = compute_ranking_value(1, 0, 200000);
    assert!(r1 == 100000, "endless ranking should be raw score");
    assert!(r2 == 200000, "endless ranking should be raw score");
    assert!(r2 > r1, "higher score ranks higher in endless");
}

#[test]
fn test_endless_ignores_stars() {
    // Stars are always 0 for endless, but verify the formula handles it
    let with_stars = compute_ranking_value(1, 30, 100000);
    let without_stars = compute_ranking_value(1, 0, 100000);
    assert!(with_stars == without_stars, "endless ranking must ignore stars");
}

#[test]
fn test_zone_ranking_no_overflow_max_values() {
    // Max stars (30) and max score (u32 max)
    let value = compute_ranking_value(0, 30, 4294967295);
    // (30 << 32) + 4294967295 = 30 * 4294967296 + 4294967295 = 133143986175
    let expected: u64 = 30 * 0x100000000 + 4294967295;
    assert!(value == expected, "max zone ranking must not overflow u64");
}
