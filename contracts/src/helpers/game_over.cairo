//! Shared game over handling logic.
//! Consolidates duplicate handle_game_over() from game_system and play_system.

use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::{ContractAddress, get_block_timestamp};
use zkube::events::RunEnded;
use zkube::helpers::config::ConfigUtilsTrait;
use zkube::models::daily::{
    ActiveDailyAttempt, ActiveDailyAttemptTrait, DailyAttempt, DailyAttemptTrait,
};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerBestRun, PlayerBestRunTrait, PlayerMeta, PlayerMetaTrait};
use zkube::models::story::{
    ActiveStoryAttempt, ActiveStoryAttemptTrait, StoryAttempt, StoryAttemptTrait,
};
/// Handle game over: update player meta, emit event.
/// Used by game_system (surrender) and move_system (level failed/game over).
pub fn handle_game_over(ref world: WorldStorage, game: Game, player: ContractAddress) {
    let run_data = game.get_run_data();
    let run_type = run_data.run_type;

    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    }
    player_meta.update_best_level(run_data.current_level);

    let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);
    let story_game: StoryAttempt = world.read_model(game.game_id);

    if story_game.exists() {
        let active_story: ActiveStoryAttempt = world.read_model(player);
        if active_story.exists() && active_story.game_id == game.game_id {
            world.write_model(@ActiveStoryAttemptTrait::empty(player));
        }

        world.write_model(@player_meta);

        world
            .emit_event(
                @RunEnded {
                    game_id: game.game_id,
                    player,
                    final_level: run_data.current_level,
                    final_score: run_data.total_score,
                    current_difficulty: run_data.current_difficulty,
                    started_at: game.started_at,
                    ended_at: get_block_timestamp(),
                },
            );
        return;
    }

    // Daily game path: clear active attempt and return early.
    // Stars are tracked per-level in finalize_level, not on game_over.
    let daily_game: DailyAttempt = world.read_model(game.game_id);
    if daily_game.exists() {
        let active_daily: ActiveDailyAttempt = world.read_model(player);
        if active_daily.exists() && active_daily.game_id == game.game_id {
            world.write_model(@ActiveDailyAttemptTrait::empty(player));
        }

        player_meta.increment_daily_stars();
        world.write_model(@player_meta);

        world
            .emit_event(
                @RunEnded {
                    game_id: game.game_id,
                    player,
                    final_level: run_data.current_level,
                    final_score: run_data.total_score,
                    current_difficulty: run_data.current_difficulty,
                    started_at: game.started_at,
                    ended_at: get_block_timestamp(),
                },
            );
        return;
    }

    // Token game path: update PlayerBestRun
    let total_stars = if run_type == 0 {
        calculate_total_stars(game)
    } else {
        0
    };
    let mut best_run: PlayerBestRun = world.read_model((player, settings.settings_id, run_type));
    if run_type == 0 {
        best_run.update_best_level_stars(game.level_stars);
    }
    if run_type == 0 && run_data.zone_cleared && !best_run.zone_cleared {
        player_meta.increment_xp(1000);
    }

    world.write_model(@player_meta);

    if best_run.is_new_best(run_type, run_data.total_score, total_stars) {
        best_run.player = player;
        best_run.settings_id = settings.settings_id;
        best_run.run_type = run_type;
        best_run.best_score = run_data.total_score;
        best_run.best_stars = total_stars;
        best_run.best_level = run_data.current_level;
        best_run.zone_cleared = run_data.zone_cleared;
        best_run.best_game_id = game.game_id;
    }
    world.write_model(@best_run);

    // Emit run ended event
    world
        .emit_event(
            @RunEnded {
                game_id: game.game_id,
                player,
                final_level: run_data.current_level,
                final_score: run_data.total_score,
                current_difficulty: run_data.current_difficulty,
                started_at: game.started_at,
                ended_at: get_block_timestamp(),
            },
        );
}

/// Sum stars across map levels 1..10.
fn calculate_total_stars(game: Game) -> u8 {
    let mut stars: u8 = 0;
    let mut level: u8 = 1;
    while level <= 10 {
        stars += game.get_level_stars(level);
        level += 1;
    }
    stars
}
