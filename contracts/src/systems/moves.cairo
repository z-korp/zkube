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
    use zkube::models::game::GameSeed;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::token;
    use zkube::helpers::game_over;
    use zkube::helpers::level_check;
    use zkube::helpers::move_logic;
    use zkube::helpers::dispatchers;
    use zkube::systems::level::ILevelSystemDispatcherTrait;
    use zkube::elements::tasks::{clearer, combo};

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

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            let base_seed: GameSeed = world.read_model(game_id);
            
            // Get game settings for level generation
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Make the move using the dedicated move_logic helper
            // This keeps move implementation code out of the Game model
            let mut run_data = game.get_run_data();
            let (new_blocks, new_next_row, lines_cleared, is_grid_full) = move_logic::make_move_on_grid(
                game.blocks,
                game.next_row,
                ref game.combo_counter,
                ref game.max_combo,
                ref run_data,
                base_seed.seed,
                row_index,
                start_index,
                final_index,
                settings,
            );
            
            // Update game state
            game.blocks = new_blocks;
            game.next_row = new_next_row;
            game.set_run_data(run_data);
            
            // Check for grid full condition
            if is_grid_full {
                game.over = true;
            }

            // Track quest progress for lines cleared and combos
            let player = get_caller_address();
            if lines_cleared > 0 {
                // Track lines cleared (LineClearer task)
                dispatchers::track_quest_progress(world, player, clearer::LineClearer::identifier(), lines_cleared.into(), settings.settings_id);
                
                // Track combo achievements based on lines cleared in one move
                if lines_cleared >= 3 {
                    dispatchers::track_quest_progress(world, player, combo::ComboThree::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 5 {
                    dispatchers::track_quest_progress(world, player, combo::ComboFive::identifier(), 1, settings.settings_id);
                }
                if lines_cleared >= 8 {
                    dispatchers::track_quest_progress(world, player, combo::ComboEight::identifier(), 1, settings.settings_id);
                }
            }

            // Write game state before checking completion
            world.write_model(@game);
            
            // Read GameLevel for lightweight completion/failure check
            let game_level: GameLevel = world.read_model(game_id);
            let run_data = game.get_run_data();
            
            // Check for level completion using lightweight check (no LevelGeneratorTrait import)
            let is_complete = level_check::is_level_complete(@game_level, @run_data);
            
            if is_complete {
                // Level complete - call level_system via dispatcher for heavy operations
                let level_system = dispatchers::get_level_system_dispatcher(world);
                level_system.complete_level(game_id);
            } else {
                // Check for failure using lightweight check
                let is_failed = level_check::is_level_failed(@game_level, @run_data);
                
                if is_failed || game.over {
                    // Level failed (move limit exceeded) or grid full
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
