//! Bonus System - handles applying bonuses during gameplay.
//! Split from play_system to reduce contract size.

use zkube::types::bonus::Bonus;

#[starknet::interface]
pub trait IBonusSystem<T> {
    /// Apply a bonus from inventory
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8);
}

#[dojo::contract]
mod bonus_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert, GameLevel};
    use zkube::helpers::token;
    use zkube::helpers::level_check;
    use zkube::helpers::game_libs::{
        GameLibsImpl,
        ILevelSystemDispatcherTrait, IGridSystemDispatcherTrait
    };
    use zkube::types::bonus::Bonus;
    use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait};
    use zkube::events::UseBonus;

    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use dojo::event::EventStorage;

    use starknet::get_block_timestamp;

    use game_components_minigame::libs::{assert_token_ownership, pre_action, post_action};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl BonusSystemImpl of super::IBonusSystem<ContractState> {
        fn apply_bonus(
            ref self: ContractState, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = token::get_token_address(world);
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();
            game.assert_bonus_available(bonus);

            // Check if NoBonusUsed constraint is active using run_data flag
            let run_data = game.get_run_data();
            assert!(
                !run_data.no_bonus_constraint,
                "Cannot use bonus - NoBonusUsed constraint is active for this level"
            );

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);
            
            // Apply bonus via grid_system dispatcher (contains all bonus implementations)
            let lines_cleared = libs.grid.apply_bonus(game_id, bonus, row_index, line_index);
            
            // Re-read game and level after grid_system modified them
            let game: Game = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let mut run_data = game.get_run_data();
            
            // Update constraint progress using GameLevel data
            let constraint = LevelConstraint {
                constraint_type: game_level.constraint_type.into(),
                value: game_level.constraint_value,
                required_count: game_level.constraint_count,
            };
            let constraint_2 = LevelConstraint {
                constraint_type: game_level.constraint2_type.into(),
                value: game_level.constraint2_value,
                required_count: game_level.constraint2_count,
            };
            run_data.constraint_progress = constraint.update_progress(run_data.constraint_progress, lines_cleared);
            run_data.constraint_2_progress = constraint_2.update_progress(run_data.constraint_2_progress, lines_cleared);
            
            // Write updated constraint progress
            let mut updated_game: Game = world.read_model(game_id);
            updated_game.set_run_data(run_data);
            world.write_model(@updated_game);
            
            // Check level completion using lightweight check
            let is_complete = level_check::is_level_complete(@game_level, @run_data);
            
            if is_complete {
                // Level complete - call level_system via GameLibs
                libs.level.complete_level(game_id);
            } else if game.blocks == 0 {
                // Grid is empty but level not complete - insert a line
                libs.grid.insert_line_if_empty(game_id);
            }
            
            post_action(token_address, game_id);

            world
                .emit_event(
                    @UseBonus {
                        player: starknet::get_caller_address(),
                        timestamp: get_block_timestamp(),
                        game_id,
                        bonus,
                    },
                );
        }
    }
}
