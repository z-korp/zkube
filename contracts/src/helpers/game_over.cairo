//! Shared game over handling logic.
//! Consolidates duplicate handle_game_over() from game_system and play_system.

use core::num::traits::Zero;
use dojo::event::EventStorage;
use dojo::model::ModelStorage;
use dojo::world::{WorldStorage, WorldStorageTrait};
use starknet::{ContractAddress, get_block_timestamp};
use zkube::events::{RunEnded, ZoneClearBonus};
use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
use zkube::helpers::config::ConfigUtilsTrait;
use zkube::helpers::{daily, weekly};
use zkube::models::daily::{
    DailyAttempt, DailyChallenge, DailyChallengeTrait, DailyEntry, DailyEntryTrait, GameChallenge,
};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerBestRun, PlayerBestRunTrait, PlayerMeta, PlayerMetaTrait};
use zkube::models::story::{
    ActiveStoryAttempt, ActiveStoryAttemptTrait, StoryAttempt, StoryAttemptTrait,
};
use zkube::models::weekly::current_week_id;
use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};

/// Handle game over: update player meta, emit event, submit daily result.
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
        world
            .emit_event(@ZoneClearBonus { player, settings_id: settings.settings_id, amount: 100 });
        player_meta.increment_xp(10000);

        match world.dns_address(@"config_system") {
            Option::Some(config_address) => {
                let config_dispatcher = IConfigSystemDispatcher {
                    contract_address: config_address,
                };
                let zstar_address = config_dispatcher.get_zstar_address();
                if !zstar_address.is_zero() {
                    let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                    zstar.mint(player, 100);
                }
            },
            Option::None => {},
        }
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

    if run_type == 1 {
        let is_eligible = match world.dns_address(@"config_system") {
            Option::Some(config_address) => {
                let config = IConfigSystemDispatcher { contract_address: config_address };
                config.is_star_eligible(settings.settings_id)
            },
            Option::None => false,
        };
        if is_eligible {
            let week_id = current_week_id(get_block_timestamp());
            weekly::update_weekly_leaderboard(ref world, week_id, player, run_data.total_score);
        }
    }

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

    // Auto-submit result for daily challenge games (skip if settled or ended).
    let game_challenge: GameChallenge = world.read_model(game.game_id);
    if game_challenge.challenge_id > 0 {
        let challenge: DailyChallenge = world.read_model(game_challenge.challenge_id);
        let timestamp = starknet::get_block_timestamp();
        if challenge.exists() && !challenge.settled && !challenge.has_ended(timestamp) {
            auto_submit_daily_result(
                ref world,
                game_challenge.challenge_id,
                game.game_id,
                player,
                run_data.total_score,
                run_data.current_level,
                total_stars,
            );

            // Participation star for completing a daily challenge game.
            // handle_game_over is called only once the run is over.
            player_meta.increment_daily_stars();
            world.write_model(@player_meta);
        }
    }
}

/// Compute ranking value by run type.
/// - Zone: (total_stars << 32) | total_score  (stars-first composite)
/// - Endless: total_score
fn compute_ranking_value(run_type: u8, total_stars: u8, total_score: u32) -> u64 {
    if run_type == 1 {
        total_score.into()
    } else {
        let stars_u64: u64 = total_stars.into();
        let score_u64: u64 = total_score.into();
        (stars_u64 * 0x100000000) + score_u64
    }
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

/// Auto-submit a game result to the daily challenge leaderboard.
/// Called inline during game_over — no cross-contract call needed since we
/// have direct world access to the DailyEntry and DailyLeaderboard models.
fn auto_submit_daily_result(
    ref world: WorldStorage,
    challenge_id: u32,
    game_id: felt252,
    player: ContractAddress,
    total_score: u32,
    current_level: u8,
    total_stars: u8,
) {
    let challenge: DailyChallenge = world.read_model(challenge_id);
    if challenge.settled {
        return; // Challenge already settled, skip
    }

    let mut entry: DailyEntry = world.read_model((challenge_id, player));
    if !entry.exists() {
        return; // Player hasn't registered, skip
    }

    // Daily challenges are always zone runs — use zone composite ranking.
    let ranking_value = compute_ranking_value(0, total_stars, total_score);

    // Check if this beats the player's current best
    let current_best: u64 = compute_ranking_value(0, entry.best_stars, entry.best_score);

    if ranking_value > current_best {
        // Update entry with new bests
        entry.best_score = total_score;
        entry.best_level = current_level;
        entry.best_stars = total_stars;
        entry.best_game_id = game_id;
        world.write_model(@entry);

        // Update leaderboard via shared helper
        daily::update_daily_leaderboard(ref world, challenge_id, player, ranking_value);
    }
}
