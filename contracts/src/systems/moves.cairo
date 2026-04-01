//! Move System - handles player moves on the grid.
//! Split from play_system to reduce contract size.

#[starknet::interface]
pub trait IMoveSystem<T> {
    /// Make a move - also handles level completion automatically
    fn move(ref self: T, game_id: felt252, row_index: u8, start_index: u8, final_index: u8);
}

#[dojo::contract]
mod move_system {
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use game_components_embeddable_game_standard::minigame::minigame::{
        assert_token_ownership, post_action, pre_action,
    };
    use game_components_embeddable_game_standard::token::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_embeddable_game_standard::token::token::LifecycleTrait;
    use game_components_embeddable_game_standard::token::structs::TokenMetadata;
    use starknet::{get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;

    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{
        GameLibsImpl, IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait,
    };
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::{game_over, level_check, token};
    use zkube::models::game::{Game, GameAssert, GameLevel, GameTrait};
    use zkube::models::mutator::MutatorDef;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MoveSystemImpl of super::IMoveSystem<ContractState> {
        fn move(
            ref self: ContractState,
            game_id: felt252,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = token::get_token_address(world);
            let token_id_felt: felt252 = game_id.into();
            pre_action(token_address, token_id_felt);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, token_id_felt);
            game.assert_not_over();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);
            let player = get_caller_address();

            // Execute move via grid_system dispatcher (contains Controller logic)
            let (lines_cleared, is_grid_full) = libs
                .grid
                .execute_move(game_id, row_index, start_index, final_index);

            // Re-read game after grid_system modified it (needed for level/game-over checks)
            let game: Game = world.read_model(game_id);
            let mut game_level: GameLevel = world.read_model(game_id);
            let mut run_data = game.get_run_data();
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Mutator-driven bonus setup and charge gain.
            let mut run_data_changed = false;
            let active_mutator_id = run_data.active_mutator_id;
            let mutator_def = InternalImpl::read_mutator_def(world, active_mutator_id);

            let bonus_type = MutatorEffectsTrait::get_bonus_type(@mutator_def);
            if run_data.bonus_type != bonus_type {
                run_data.bonus_type = bonus_type;
                run_data_changed = true;
            }

            let trigger_type = MutatorEffectsTrait::get_trigger_type(@mutator_def);
            let threshold = MutatorEffectsTrait::get_trigger_threshold(@mutator_def);

            // Type 4 (blocks destroyed) is reserved until grid dispatcher exposes a value.
            let blocks_destroyed: u8 = 0;

            if trigger_type > 0 && threshold > 0 {
                let trigger_count: u8 = match trigger_type {
                    1 => game.combo_counter,
                    2 => lines_cleared,
                    3 => run_data.level_score,
                    4 => blocks_destroyed,
                    _ => 0,
                };

                if trigger_type == 1 {
                    // Combo trigger (cumulative): one charge every N combos.
                    if trigger_count > 0 && trigger_count % threshold == 0
                        && run_data.bonus_charges < 15 {
                        run_data.bonus_charges += 1;
                        run_data_changed = true;
                    }
                } else if trigger_type == 2 {
                    // Lines-cleared trigger (per move): can grant multiple charges in one move.
                    if trigger_count >= threshold && run_data.bonus_charges < 15 {
                        let earned = trigger_count / threshold;
                        if earned > 0 {
                            let next_charges_u16: u16 = run_data.bonus_charges.into()
                                + earned.into();
                            let next_charges: u8 = if next_charges_u16 > 15 {
                                15
                            } else {
                                next_charges_u16.try_into().unwrap()
                            };

                            if next_charges != run_data.bonus_charges {
                                run_data.bonus_charges = next_charges;
                                run_data_changed = true;
                            }
                        }
                    }
                } else if trigger_type == 3 {
                    // Score trigger (cumulative): charges are monotonic level_score / threshold.
                    let earned = trigger_count / threshold;
                    let capped_earned = if earned > 15 {
                        15
                    } else {
                        earned
                    };

                    if capped_earned > run_data.bonus_charges {
                        run_data.bonus_charges = capped_earned;
                        run_data_changed = true;
                    }
                }
            }

            if run_data_changed {
                let mut updated_game: Game = world.read_model(game_id);
                updated_game.set_run_data(run_data);
                world.write_model(@updated_game);
            }

            if run_data.mode == 0 {
                // Map mode: preserve existing completion/failure flow.
                let is_complete = level_check::is_level_complete(@game_level, @run_data);

                if is_complete {
                    libs.level.finalize_level(game_id);
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
            } else {
                // Endless mode: no level completion/failure checks.
                let ramped_score = MutatorEffectsTrait::apply_endless_ramp(
                    @mutator_def, run_data.total_score,
                );
                let target_difficulty = LevelGeneratorTrait::get_endless_difficulty_for_score(
                    ramped_score,
                    @settings,
                );
                let target_difficulty_u8: u8 = target_difficulty.into();

                if run_data.current_difficulty != target_difficulty_u8 {
                    run_data.current_difficulty = target_difficulty_u8;

                    let mut updated_game: Game = world.read_model(game_id);
                    updated_game.set_run_data(run_data);
                    world.write_model(@updated_game);

                    game_level.difficulty = target_difficulty_u8;
                    world.write_model(@game_level);
                }

                if is_grid_full {
                    let mut updated_game: Game = world.read_model(game_id);
                    updated_game.over = true;
                    world.write_model(@updated_game);
                    game_over::handle_game_over(ref world, updated_game, player);
                }
            }
            post_action(token_address, token_id_felt);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
            if mutator_id == 0 {
                return MutatorEffectsTrait::neutral(0);
            }

            let stored: MutatorDef = world.read_model(mutator_id);
            MutatorEffectsTrait::normalize(mutator_id, stored)
        }
    }
}
