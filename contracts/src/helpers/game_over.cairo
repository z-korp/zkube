//! Shared game over handling logic.
//! Consolidates duplicate handle_game_over() from game_system and play_system.

use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use starknet::{ContractAddress, get_block_timestamp};
use zkube::constants::DEFAULT_SETTINGS::is_default_settings;
use zkube::constants::DAILY_CHALLENGE::is_daily_challenge_settings;
use zkube::events::RunEnded;
use zkube::helpers::config::ConfigUtilsTrait;
use zkube::helpers::daily;
use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
use zkube::models::daily::{DailyChallenge, DailyEntry, DailyEntryTrait, GameChallenge};
use zkube::types::daily::RankingMetric;

/// Handle game over: update player meta, mint cubes, emit event.
/// Used by game_system (surrender) and move_system (level failed/game over).
pub fn handle_game_over(ref world: WorldStorage, game: Game, player: ContractAddress) {
    let run_data = game.get_run_data();

    // Update player meta with best level
    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    }
    player_meta.update_best_level(run_data.current_level);

    // Get game settings for default check
    let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);

    let base_cubes: u16 = run_data.total_cubes;

    // Only mint cubes and update stats for games using default settings
    let libs = GameLibsImpl::new(world);
    if is_default_settings(settings.settings_id) {
        if base_cubes > 0 {
            libs.cube.mint(player, base_cubes.into());
            player_meta.add_cubes_earned(base_cubes.into());
        }
    }
    world.write_model(@player_meta);

    // Emit run ended event
    world
        .emit_event(
            @RunEnded {
                game_id: game.game_id,
                player,
                final_level: run_data.current_level,
                final_score: run_data.total_score,
                total_cubes: run_data.total_cubes,
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
                run_data.total_score,
                run_data.current_level,
                run_data.total_cubes,
            );
        }
    }
}

/// Auto-submit a game result to the daily challenge leaderboard.
/// Called inline during game_over — no cross-contract call needed since we
/// have direct world access to the DailyEntry and DailyLeaderboard models.
fn auto_submit_daily_result(
    ref world: WorldStorage,
    challenge_id: u32,
    game_id: u64,
    player: ContractAddress,
    total_score: u16,
    current_level: u8,
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

    // Determine the ranking value based on challenge metric
    let metric: RankingMetric = challenge.ranking_metric.into();
    let ranking_value: u32 = match metric {
        RankingMetric::Score => total_score.into(),
        RankingMetric::Level => current_level.into(),
        RankingMetric::CubesEarned => total_cubes.into(),
    };

    // Check if this beats the player's current best
    let current_best: u32 = match metric {
        RankingMetric::Score => entry.best_score.into(),
        RankingMetric::Level => entry.best_level.into(),
        RankingMetric::CubesEarned => entry.best_cubes.into(),
    };

    if ranking_value > current_best {
        // Update entry with new bests
        entry.best_score = total_score;
        entry.best_level = current_level;
        entry.best_cubes = total_cubes;
        entry.best_game_id = game_id;
        world.write_model(@entry);

        // Update leaderboard via shared helper
        daily::update_daily_leaderboard(ref world, challenge_id, player, ranking_value);
    }
}
