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
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use game_components_minigame::libs::{assert_token_ownership, post_action, pre_action};
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;
    use starknet::get_block_timestamp;
    use zkube::constants::DEFAULT_NS;
    use zkube::events::UseBonus;
    use zkube::helpers::game_libs::{
        GameLibsImpl, IDraftSystemDispatcherTrait, IGridSystemDispatcherTrait,
        ILevelSystemDispatcherTrait,
    };
    use zkube::helpers::{level_check, token};
    use zkube::models::game::{Game, GameAssert, GameLevel, GameTrait};
    use zkube::models::skill_tree::PlayerSkillTree;
    use zkube::types::bonus::Bonus;
    use zkube::types::constraint::{ConstraintContext, LevelConstraint, LevelConstraintTrait};

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
            let player = starknet::get_caller_address();
            let skill_tree: PlayerSkillTree = world.read_model(player);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();
            game.assert_bonus_available(bonus);

            // Check if NoBonusUsed constraint is active using run_data flag
            let run_data = game.get_run_data();
            assert!(
                !run_data.no_bonus_constraint,
                "Cannot use bonus - NoBonusUsed constraint is active for this level",
            );

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);

            // Apply bonus via grid_system dispatcher (contains all bonus implementations)
            let lines_cleared = libs
                .grid
                .apply_bonus(game_id, bonus, row_index, line_index, skill_tree.skill_data);

            // Re-read game and level after grid_system modified them
            let game: Game = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let mut run_data = game.get_run_data();

            // Build constraints from GameLevel data
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
            let constraint_3 = LevelConstraint {
                constraint_type: game_level.constraint3_type.into(),
                value: game_level.constraint3_value,
                required_count: game_level.constraint3_count,
            };

            // Build ConstraintContext for bonus action
            // Note: For bonus actions, highest_row_before/after are 0 and blocks tracking is 0
            // since bonuses don't contribute to Fill or BreakBlocks constraints
            // (BreakBlocks via Harvest is tracked by the grid system's assess_game)
            let ctx = ConstraintContext {
                lines_cleared,
                combo_counter: game.combo_counter,
                highest_row_before: 0,
                highest_row_after: 0,
                grid_is_empty: game.blocks == 0,
                blocks_destroyed_of_target_size: 0,
            };

            // Update all three constraint progresses
            run_data
                .constraint_progress = constraint
                .update_progress(run_data.constraint_progress, ctx);
            run_data
                .constraint_2_progress = constraint_2
                .update_progress(run_data.constraint_2_progress, ctx);
            run_data
                .constraint_3_progress = constraint_3
                .update_progress(run_data.constraint_3_progress, ctx);

            // Write updated constraint progress
            let mut updated_game: Game = world.read_model(game_id);
            updated_game.set_run_data(run_data);
            world.write_model(@updated_game);

            // Check level completion using lightweight check
            let is_complete = level_check::is_level_complete(@game_level, @run_data);

            if is_complete {
                // Level complete - call level_system via GameLibs
                let completed_level = run_data.current_level;
                libs.level.complete_level(game_id, skill_tree.skill_data);
                libs
                    .draft
                    .maybe_open_after_level(
                        game_id, completed_level, starknet::get_caller_address(),
                    );
            } else if game.blocks == 0 {
                // Grid is empty but level not complete - insert a line
                libs.grid.insert_line_if_empty(game_id);
            }

            post_action(token_address, game_id);

            world
                .emit_event(
                    @UseBonus {
                        player,
                        timestamp: get_block_timestamp(),
                        game_id,
                        bonus,
                    },
                );
        }
    }
}
