use core::num::traits::Zero;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::ContractAddress;
use zkube::models::weekly::{WeeklyEndless, WeeklyEndlessEntry, WeeklyEndlessLeaderboard};

pub const MAX_WEEKLY_LEADERBOARD_SIZE: u32 = 250;

pub fn update_weekly_leaderboard(
    ref world: WorldStorage, week_id: u32, player: ContractAddress, new_score: u32,
) {
    let mut entry: WeeklyEndlessEntry = world.read_model((week_id, player));
    let is_first = !entry.submitted;

    if !is_first && new_score <= entry.best_score {
        return;
    }

    entry.week_id = week_id;
    entry.player = player;
    entry.best_score = new_score;
    entry.submitted = true;
    world.write_model(@entry);

    if is_first {
        let mut weekly: WeeklyEndless = world.read_model(week_id);
        weekly.week_id = week_id;
        weekly.total_participants += 1;
        world.write_model(@weekly);
    }

    let mut insert_rank: u32 = 0;
    let mut existing_rank: u32 = 0;
    let mut rank: u32 = 1;

    while rank <= MAX_WEEKLY_LEADERBOARD_SIZE {
        let lb: WeeklyEndlessLeaderboard = world.read_model((week_id, rank));
        if lb.player.is_zero() {
            if insert_rank == 0 {
                insert_rank = rank;
            }
            break;
        }
        if lb.player == player {
            existing_rank = rank;
        }
        if new_score > lb.score && insert_rank == 0 {
            insert_rank = rank;
        }
        rank += 1;
    }

    if insert_rank == 0 {
        return;
    }

    if existing_rank > 0 && existing_rank <= insert_rank {
        let updated = WeeklyEndlessLeaderboard {
            week_id, rank: existing_rank, player, score: new_score,
        };
        world.write_model(@updated);
        return;
    }

    let shift_end = if existing_rank > 0 {
        existing_rank
    } else {
        let mut last: u32 = insert_rank;
        let mut r: u32 = insert_rank;
        while r <= MAX_WEEKLY_LEADERBOARD_SIZE {
            let lb: WeeklyEndlessLeaderboard = world.read_model((week_id, r));
            if lb.player.is_zero() {
                break;
            }
            last = r;
            r += 1;
        }
        if last < MAX_WEEKLY_LEADERBOARD_SIZE {
            last + 1
        } else {
            MAX_WEEKLY_LEADERBOARD_SIZE
        }
    };

    let mut r: u32 = shift_end;
    while r > insert_rank {
        let prev: WeeklyEndlessLeaderboard = world.read_model((week_id, r - 1));
        let shifted = WeeklyEndlessLeaderboard {
            week_id, rank: r, player: prev.player, score: prev.score,
        };
        world.write_model(@shifted);
        r -= 1;
    }

    let new_lb = WeeklyEndlessLeaderboard { week_id, rank: insert_rank, player, score: new_score };
    world.write_model(@new_lb);
}
