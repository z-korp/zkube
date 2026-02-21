//! Shared game over handling logic.
//! Consolidates duplicate handle_game_over() from game_system and play_system.

use starknet::{ContractAddress, get_block_timestamp};
use dojo::model::ModelStorage;
use dojo::world::WorldStorage;
use dojo::event::EventStorage;

use zkube::constants::DEFAULT_SETTINGS::is_default_settings;
use zkube::models::game::{Game, GameTrait};
use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
use zkube::events::RunEnded;
use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
use zkube::helpers::config::ConfigUtilsTrait;

/// Handle game over: update player meta, mint cubes, emit event.
/// Used by game_system (surrender) and move_system (level failed/game over).
pub fn handle_game_over(
    ref world: WorldStorage,
    game: Game,
    player: ContractAddress,
) {
    let run_data = game.get_run_data();

    // Update player meta with best level
    let mut player_meta: PlayerMeta = world.read_model(player);
    if !player_meta.exists() {
        player_meta = PlayerMetaTrait::new(player);
    }
    player_meta.update_best_level(run_data.current_level);

    // Get game settings for default check
    let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);

    // Calculate cubes to mint:
    // - Spending first depletes brought cubes (already burned from wallet)
    // - Any excess spending comes from earned cubes
    // - Mint: total_cubes - max(0, cubes_spent - cubes_brought)
    let cubes_spent_from_earned: u16 = if run_data.cubes_spent > run_data.cubes_brought {
        run_data.cubes_spent - run_data.cubes_brought
    } else {
        0
    };
    let base_cubes: u16 = if run_data.total_cubes > cubes_spent_from_earned {
        run_data.total_cubes - cubes_spent_from_earned
    } else {
        0
    };

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
}
