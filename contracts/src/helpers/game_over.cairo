//! Shared game over handling logic.
//! Consolidates duplicate handle_game_over() from game_system and play_system.

use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::{ContractAddress, get_block_timestamp};
use zkube::constants::DAILY_CHALLENGE::is_daily_challenge_settings;
use zkube::events::RunEnded;
use zkube::helpers::config::ConfigUtilsTrait;
use zkube::helpers::daily;
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
use zkube::models::daily::{DailyChallenge, DailyEntry, DailyEntryTrait, GameChallenge};

/// Handle game over: update player meta, emit event, submit daily result.
/// Used by game_system (surrender) and move_system (level failed/game over).
pub fn handle_game_over(ref world: WorldStorage, game: Game, player: ContractAddress) {
    let run_data = game.get_run_data();
    let capped_score: u16 = if run_data.total_score > 65535 {
        65535
    } else {
        run_data.total_score.try_into().unwrap()
    };

    // Update player meta with best level
    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    }
    player_meta.update_best_level(run_data.current_level);

    world.write_model(@player_meta);

    let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);

    // Emit run ended event
    world
        .emit_event(
            @RunEnded {
                game_id: game.game_id,
                player,
                final_level: run_data.current_level,
                final_score: run_data.total_score,
                endless_depth: run_data.endless_depth,
                started_at: game.started_at,
                ended_at: get_block_timestamp(),
            },
        );

    // Auto-submit result for daily challenge games
    if is_daily_challenge_settings(settings.settings_id) {
        let game_challenge: GameChallenge = world.read_model(game.game_id);
        if game_challenge.challenge_id > 0 {
            auto_submit_daily_result(
                ref world,
                game_challenge.challenge_id,
                game.game_id,
                player,
                capped_score,
                run_data.current_level,
                run_data.endless_depth,
                0,
            );

            // Participation star for completing a daily challenge game.
            // handle_game_over is called only once the run is over.
            player_meta.increment_daily_stars();
            world.write_model(@player_meta);
        }
    }
}

/// Auto-submit a game result to the daily challenge leaderboard.
/// Called inline during game_over — no cross-contract call needed since we
/// have direct world access to the DailyEntry and DailyLeaderboard models.
fn auto_submit_daily_result(
    ref world: WorldStorage,
    challenge_id: u32,
    game_id: felt252,
    player: ContractAddress,
    total_score: u16,
    current_level: u8,
    endless_depth: u8,
    total_cubes: u16,
) {
    let challenge: DailyChallenge = world.read_model(challenge_id);
    if challenge.settled {
        return; // Challenge already settled, skip
    }

    let mut entry: DailyEntry = world.read_model((challenge_id, player));
    if !entry.exists() {
        return; // Player hasn't registered, skip
    }

    // Composite ranking: depth dominates, score breaks ties.
    let ranking_value: u32 = endless_depth.into() * 65536 + total_score.into();

    // Check if this beats the player's current best
    let current_best: u32 = entry.best_depth.into() * 65536 + entry.best_score.into();

    if ranking_value > current_best {
        // Update entry with new bests
        entry.best_score = total_score;
        entry.best_level = current_level;
        entry.best_depth = endless_depth;
        entry.best_cubes = total_cubes;
        entry.best_game_id = game_id;
        world.write_model(@entry);

        // Update leaderboard via shared helper
        daily::update_daily_leaderboard(ref world, challenge_id, player, ranking_value);
    }
}
