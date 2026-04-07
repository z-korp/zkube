use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::ContractAddress;
use zkube::models::weekly::{WeeklyEndless, WeeklyEndlessEntry};

pub const MAX_RANKED_PLAYERS: u32 = 250;

/// Update a player's weekly endless entry with a new best score.
/// No longer maintains an on-chain sorted leaderboard -- settlement
/// accepts a caller-provided ranked list and verifies ordering.
pub fn update_weekly_entry(
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
}
