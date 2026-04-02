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
use zkube::helpers::daily;
use zkube::models::daily::{
    DailyChallenge, DailyChallengeTrait, DailyEntry, DailyEntryTrait, GameChallenge,
};
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerBestRun, PlayerBestRunTrait, PlayerMeta, PlayerMetaTrait};
use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};

/// Handle game over: update player meta, emit event, submit daily result.
/// Used by game_system (surrender) and move_system (level failed/game over).
pub fn handle_game_over(ref world: WorldStorage, game: Game, player: ContractAddress) {
    let run_data = game.get_run_data();
    let mode = run_data.mode;
    let capped_score: u16 = if run_data.total_score > 65535 {
        65535
    } else {
        run_data.total_score.try_into().unwrap()
    };

    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    }
    player_meta.update_best_level(run_data.current_level);

    let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);

    let total_stars = if mode == 0 {
        calculate_total_stars(game)
    } else {
        0
    };
    let mut best_run: PlayerBestRun = world.read_model((player, settings.settings_id, mode));
    if mode == 0 {
        best_run.update_best_level_stars(game.level_stars);
    }
    if mode == 0 && run_data.zone_cleared && !best_run.map_cleared {
        world
            .emit_event(
                @ZoneClearBonus { player, settings_id: settings.settings_id, amount: 100 },
            );
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

    if best_run.is_new_best(mode, run_data.total_score, total_stars) {
        best_run.player = player;
        best_run.settings_id = settings.settings_id;
        best_run.mode = mode;
        best_run.best_score = run_data.total_score;
        best_run.best_stars = total_stars;
        best_run.best_level = run_data.current_level;
        best_run.map_cleared = run_data.zone_cleared;
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

    // Auto-submit result for daily challenge games.
    let game_challenge: GameChallenge = world.read_model(game.game_id);
    if game_challenge.challenge_id > 0 {
        let challenge: DailyChallenge = world.read_model(game_challenge.challenge_id);
        if challenge.exists() {
            auto_submit_daily_result(
                ref world,
                game_challenge.challenge_id,
                game.game_id,
                player,
                capped_score,
                run_data.current_level,
                run_data.current_difficulty,
                total_stars,
                challenge.game_mode,
            );

            // Participation star for completing a daily challenge game.
            // handle_game_over is called only once the run is over.
            player_meta.increment_daily_stars();
            world.write_model(@player_meta);
        }
    }
}

/// Compute ranking value by mode.
/// - Map: total_stars * 65536 + total_score
/// - Endless: total_score
fn compute_ranking_value(mode: u8, total_stars: u8, total_score: u16) -> u32 {
    if mode == 1 {
        total_score.into()
    } else {
        total_stars.into() * 65536 + total_score.into()
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

/// Resolve stars for an existing daily entry best game (map mode ranking).
fn get_entry_best_stars(world: WorldStorage, entry: DailyEntry) -> u8 {
    if entry.best_game_id == 0 {
        return 0;
    }

    let best_game: Game = world.read_model(entry.best_game_id);
    calculate_total_stars(best_game)
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
    total_stars: u8,
    mode: u8,
) {
    let challenge: DailyChallenge = world.read_model(challenge_id);
    if challenge.settled {
        return; // Challenge already settled, skip
    }

    let mut entry: DailyEntry = world.read_model((challenge_id, player));
    if !entry.exists() {
        return; // Player hasn't registered, skip
    }

    let ranking_value = compute_ranking_value(mode, total_stars, total_score);

    // Check if this beats the player's current best
    let current_best: u32 = if mode == 1 {
        entry.best_score.into()
    } else {
        let best_stars = get_entry_best_stars(world, entry);
        compute_ranking_value(0, best_stars, entry.best_score)
    };

    if ranking_value > current_best {
        // Update entry with new bests
        entry.best_score = total_score;
        entry.best_level = current_level;
        entry.best_depth = endless_depth;
        entry.best_game_id = game_id;
        world.write_model(@entry);

        // Update leaderboard via shared helper
        daily::update_daily_leaderboard(ref world, challenge_id, player, ranking_value);
    }
}
