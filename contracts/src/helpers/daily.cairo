//! Shared daily challenge helpers.
//! Contains leaderboard update logic used by both game_over.cairo (auto-submit)
//! and daily_challenge_system.cairo (manual submit).

use core::num::traits::Zero;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::ContractAddress;
use zkube::models::daily::DailyLeaderboard;

/// Max leaderboard size cap
pub const MAX_LEADERBOARD_SIZE: u32 = 250;

/// Update the daily challenge leaderboard with a player's new score.
/// Insert-sorts into the top N positions (capped at MAX_LEADERBOARD_SIZE).
///
/// This function is called from:
/// - game_over::auto_submit_daily_result (inline during game over)
/// - daily_challenge_system::submit_result (manual backup submission)
pub fn update_daily_leaderboard(
    ref world: WorldStorage, challenge_id: u32, player: ContractAddress, new_value: u32,
) {
    // Walk the leaderboard from rank 1 to find insertion point
    let mut insert_rank: u32 = 0;
    let mut existing_rank: u32 = 0;
    let mut rank: u32 = 1;

    while rank <= MAX_LEADERBOARD_SIZE {
        let lb: DailyLeaderboard = world.read_model((challenge_id, rank));
        if lb.player.is_zero() {
            // Empty slot — if we haven't found insert position yet, insert here
            if insert_rank == 0 {
                insert_rank = rank;
            }
            break;
        }
        if lb.player == player {
            existing_rank = rank;
        }
        if new_value > lb.value && insert_rank == 0 {
            insert_rank = rank;
        }
        rank += 1;
    }

    // If player didn't beat anyone and no empty slot, they don't make the board
    if insert_rank == 0 {
        return;
    }

    // If player already at same or better rank, update value in place
    if existing_rank > 0 && existing_rank <= insert_rank {
        let updated = DailyLeaderboard {
            challenge_id, rank: existing_rank, player, value: new_value,
        };
        world.write_model(@updated);
        return;
    }

    // Shift entries down to make room at insert_rank
    // If player was already on the board at a worse rank, remove them first
    let shift_end = if existing_rank > 0 {
        existing_rank
    } else {
        // Find the last occupied rank (cap at MAX_LEADERBOARD_SIZE)
        let mut last: u32 = insert_rank;
        let mut r: u32 = insert_rank;
        while r <= MAX_LEADERBOARD_SIZE {
            let lb: DailyLeaderboard = world.read_model((challenge_id, r));
            if lb.player.is_zero() {
                break;
            }
            last = r;
            r += 1;
        }
        // Cap: don't push beyond MAX_LEADERBOARD_SIZE
        if last < MAX_LEADERBOARD_SIZE {
            last + 1
        } else {
            MAX_LEADERBOARD_SIZE
        }
    };

    // Shift down: move entries from shift_end-1 down to insert_rank
    let mut r: u32 = shift_end;
    while r > insert_rank {
        let prev: DailyLeaderboard = world.read_model((challenge_id, r - 1));
        let shifted = DailyLeaderboard {
            challenge_id, rank: r, player: prev.player, value: prev.value,
        };
        world.write_model(@shifted);
        r -= 1;
    }

    // Insert the new entry
    let new_lb = DailyLeaderboard { challenge_id, rank: insert_rank, player, value: new_value };
    world.write_model(@new_lb);
}
