//! Move System - handles player moves on the grid.
//! Split from play_system to reduce contract size.

#[starknet::interface]
pub trait IMoveSystem<T> {
    /// Make a move - also handles level completion automatically
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
}

#[dojo::contract]
mod move_system {
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use game_components_minigame::libs::{assert_token_ownership, post_action, pre_action};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;
    use starknet::{get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::{clearer, combo, combo_streak};

    use zkube::helpers::game_libs::{
        GameLibsImpl, IAchievementSystemDispatcher, IAchievementSystemDispatcherTrait,
        IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait, IQuestSystemDispatcher,
        IQuestSystemDispatcherTrait,
    };
    use zkube::constants::DEFAULT_SETTINGS::is_default_settings;
    use zkube::helpers::{game_over, level_check, token};
    use zkube::models::game::{Game, GameAssert, GameLevel, GameTrait};
    use zkube::models::skill_tree::PlayerSkillTree;

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

            // Cannot move while level transition is pending (must call start_next_level first)
            let run_data_check = game.get_run_data();
            assert!(
                !run_data_check.level_transition_pending,
                "Level transition pending - call start_next_level first",
            );

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);
            let player = get_caller_address();
            let skill_tree: PlayerSkillTree = world.read_model(player);

            // Execute move via grid_system dispatcher (contains Controller logic)
            let (lines_cleared, is_grid_full) = libs
                .grid
                .execute_move(game_id, row_index, start_index, final_index, skill_tree.skill_data);

            // Get settings_id directly from token_dispatcher (already resolved at line 47)
            // Avoids full ConfigUtilsTrait::get_game_settings chain (DNS lookup + model read)
            let settings_id = token_dispatcher.settings_id(game_id);

            // Hoist default-settings check and Option unwraps once (saves 19x redundant checks)
            // Quest and achievement tracking only applies to default settings games
            if is_default_settings(settings_id) {
                // Extract raw dispatchers once — avoids repeated Option checks per call
                let quest_dispatcher: Option<IQuestSystemDispatcher> = libs.quest;
                let achievement_dispatcher: Option<IAchievementSystemDispatcher> = libs.achievement;

                // --- Lines cleared tracking ---
                if lines_cleared > 0 {
                    if let Option::Some(quest) = quest_dispatcher {
                        quest.progress(player, clearer::LineClearer::identifier(), lines_cleared.into());
                        if lines_cleared >= 4 {
                            quest.progress(player, combo::ComboFour::identifier(), 1);
                        }
                        if lines_cleared >= 5 {
                            quest.progress(player, combo::ComboFive::identifier(), 1);
                        }
                        if lines_cleared >= 6 {
                            quest.progress(player, combo::ComboSix::identifier(), 1);
                        }
                    }

                    if let Option::Some(achievement) = achievement_dispatcher {
                        achievement.progress(player, clearer::LineClearer::identifier(), lines_cleared.into());
                        if lines_cleared >= 2 {
                            achievement.progress(player, combo::ComboTwo::identifier(), 1);
                        }
                        if lines_cleared >= 3 {
                            achievement.progress(player, combo::ComboThree::identifier(), 1);
                        }
                        if lines_cleared >= 4 {
                            achievement.progress(player, combo::ComboFour::identifier(), 1);
                        }
                        if lines_cleared >= 5 {
                            achievement.progress(player, combo::ComboFive::identifier(), 1);
                        }
                        if lines_cleared >= 6 {
                            achievement.progress(player, combo::ComboSix::identifier(), 1);
                        }
                        if lines_cleared >= 7 {
                            achievement.progress(player, combo::ComboSeven::identifier(), 1);
                        }
                        if lines_cleared >= 8 {
                            achievement.progress(player, combo::ComboEight::identifier(), 1);
                        }
                        if lines_cleared >= 9 {
                            achievement.progress(player, combo::ComboNine::identifier(), 1);
                        }
                    }
                }

                // Re-read game for combo streak tracking
                let game: Game = world.read_model(game_id);

                // --- Combo streak tracking ---
                if let Option::Some(quest) = quest_dispatcher {
                    if game.combo_counter >= 15 {
                        quest.progress(player, combo_streak::ComboStreakFifteen::identifier(), 1);
                    }
                    if game.combo_counter >= 20 {
                        quest.progress(player, combo_streak::ComboStreakTwenty::identifier(), 1);
                    }
                    if game.combo_counter >= 25 {
                        quest.progress(player, combo_streak::ComboStreakTwentyFive::identifier(), 1);
                    }
                }

                if let Option::Some(achievement) = achievement_dispatcher {
                    if game.combo_counter >= 15 {
                        achievement.progress(player, combo_streak::ComboStreakFifteen::identifier(), 1);
                    }
                    if game.combo_counter >= 50 {
                        achievement.progress(player, combo_streak::ComboStreakFifty::identifier(), 1);
                    }
                    if game.combo_counter >= 100 {
                        achievement.progress(player, combo_streak::ComboStreakHundred::identifier(), 1);
                    }
                }
            }

            // Re-read game after grid_system modified it (needed for level/game-over checks)
            let game: Game = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let run_data = game.get_run_data();

            // Check for level completion
            let is_complete = level_check::is_level_complete(@game_level, @run_data);

            if is_complete {
                libs.level.finalize_level(game_id, skill_tree.skill_data);
            } else if is_grid_full {
                let mut updated_game: Game = world.read_model(game_id);
                updated_game.over = true;
                world.write_model(@updated_game);
                game_over::handle_game_over(ref world, updated_game, player);
            } else {
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
