//! Move System - handles player moves on the grid.
//! Split from play_system to reduce contract size.

#[starknet::interface]
pub trait IMoveSystem<T> {
    /// Make a move - also handles level completion automatically
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
}

#[dojo::contract]
mod move_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert, GameLevel};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::token;
    use zkube::helpers::game_over;
    use zkube::helpers::level_check;
    use zkube::helpers::game_libs::{
        GameLibsImpl,
        ILevelSystemDispatcherTrait, IGridSystemDispatcherTrait
    };
    use zkube::elements::tasks::{clearer, combo, combo_streak};

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;

    use starknet::{get_block_timestamp, get_caller_address};

    use game_components_minigame::libs::{assert_token_ownership, pre_action, post_action};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MoveSystemImpl of super::IMoveSystem<ContractState> {
        fn move(
            ref self: ContractState, game_id: u64, row_index: u8, start_index: u8, final_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = token::get_token_address(world);
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);
            
            // Execute move via grid_system dispatcher (contains Controller logic)
            let (lines_cleared, is_grid_full) = libs.grid.execute_move(
                game_id, row_index, start_index, final_index
            );
            
            // Get settings for quest tracking
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();

            // Track quest progress for lines cleared and combos
            if lines_cleared > 0 {
                libs.track_quest(player, clearer::LineClearer::identifier(), lines_cleared.into(), settings.settings_id);
                
                // Track achievement progress for lines cleared (cumulative)
                libs.track_achievement(player, clearer::LineClearer::identifier(), lines_cleared.into(), settings.settings_id);
                
                // Achievement combo flow tracking (3+ combos)
                if lines_cleared >= 2 {
                    libs.track_achievement(player, combo::ComboTwo::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 3 {
                    libs.track_achievement(player, combo::ComboThree::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 4 {
                    libs.track_achievement(player, combo::ComboFour::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 5 {
                    libs.track_achievement(player, combo::ComboFive::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 6 {
                    libs.track_achievement(player, combo::ComboSix::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 7 {
                    libs.track_achievement(player, combo::ComboSeven::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 8 {
                    libs.track_achievement(player, combo::ComboEight::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 9 {
                    libs.track_achievement(player, combo::ComboNine::identifier(), 1, settings.settings_id);
                }

                // Quest combo tracking (4/5/6 thresholds)
                if lines_cleared >= 4 {
                    libs.track_quest(player, combo::ComboFour::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 5 {
                    libs.track_quest(player, combo::ComboFive::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 6 {
                    libs.track_quest(player, combo::ComboSix::identifier(), 1, settings.settings_id);
                }
            }

            // Re-read game after grid_system modified it
            let game: Game = world.read_model(game_id);

            // Track combo streak quest progress
            if game.combo_counter >= 15 {
                libs.track_quest(player, combo_streak::ComboStreakFifteen::identifier(), 1, settings.settings_id);
                libs.track_achievement(player, combo_streak::ComboStreakFifteen::identifier(), 1, settings.settings_id);
            }
            if game.combo_counter >= 20 {
                libs.track_quest(player, combo_streak::ComboStreakTwenty::identifier(), 1, settings.settings_id);
            }
            if game.combo_counter >= 25 {
                libs.track_quest(player, combo_streak::ComboStreakTwentyFive::identifier(), 1, settings.settings_id);
            }
            if game.combo_counter >= 50 {
                libs.track_achievement(player, combo_streak::ComboStreakFifty::identifier(), 1, settings.settings_id);
            }
            if game.combo_counter >= 100 {
                libs.track_achievement(player, combo_streak::ComboStreakHundred::identifier(), 1, settings.settings_id);
            }
            let game_level: GameLevel = world.read_model(game_id);
            let run_data = game.get_run_data();
            
            // Check for level completion using lightweight check
            let is_complete = level_check::is_level_complete(@game_level, @run_data);
            
            if is_complete {
                // Level complete - call level_system via GameLibs
                libs.level.complete_level(game_id);
            } else if is_grid_full {
                // Grid full - game over
                let mut updated_game: Game = world.read_model(game_id);
                updated_game.over = true;
                world.write_model(@updated_game);
                game_over::handle_game_over(ref world, updated_game, player);
            } else {
                // Check for failure (move limit exceeded)
                let is_failed = level_check::is_level_failed(@game_level, @run_data);
                if is_failed {
                    let mut updated_game: Game = world.read_model(game_id);
                    updated_game.over = true;
                    world.write_model(@updated_game);
                    game_over::handle_game_over(ref world, updated_game, player);
                }
            }

            post_action(token_address, game_id);
        }
    }
}
