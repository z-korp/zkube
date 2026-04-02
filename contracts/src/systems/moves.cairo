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
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_embeddable_game_standard::minigame::minigame::{
        assert_token_ownership, post_action, pre_action,
    };
    use game_components_embeddable_game_standard::token::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_embeddable_game_standard::token::structs::TokenMetadata;
    use game_components_embeddable_game_standard::token::token::LifecycleTrait;
    use starknet::{get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{
        GameLibsImpl, IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait,
    };
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::{game_over, level_check, token};
    use zkube::models::game::{Game, GameAssert, GameLevel, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::models::player::PlayerBestRun;
    use zkube::systems::game::{IGameSystemDispatcher, IGameSystemDispatcherTrait};

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
            let run_data_before_move = game.get_run_data();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);
            let player = get_caller_address();
            let game_address = world
                .dns_address(@"game_system")
                .expect('GameSystem not found in DNS');
            let game_dispatcher = IGameSystemDispatcher { contract_address: game_address };

            // Execute move via grid_system dispatcher (contains Controller logic)
            let (lines_cleared, is_grid_full) = libs
                .grid
                .execute_move(game_id, row_index, start_index, final_index);

            // Re-read game after grid_system modified it (needed for level/game-over checks)
            let game: Game = world.read_model(game_id);
            let mut game_level: GameLevel = world.read_model(game_id);
            let mut run_data = game.get_run_data();
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let sid = settings.settings_id;
            if lines_cleared > 0 {
                let lc_count: u128 = lines_cleared.into();
                game_dispatcher.emit_progress(player, Task::LineClear.identifier(), lc_count, sid);
            }
            if game.combo_counter >= 3 {
                game_dispatcher.emit_progress(player, Task::Combo3.identifier(), 1, sid);
            }
            if game.combo_counter >= 4 {
                game_dispatcher.emit_progress(player, Task::Combo4.identifier(), 1, sid);
            }
            if game.combo_counter >= 5 {
                game_dispatcher.emit_progress(player, Task::Combo5.identifier(), 1, sid);
            }

            // Mutator-driven non-bonus effects (scoring/pressure) still read from MutatorDef.
            let mut run_data_changed = false;
            let active_mutator_id = run_data.active_mutator_id;
            let mutator_def = InternalImpl::read_mutator_def(world, active_mutator_id);

            // Track per-level lines cleared in run_data.
            let next_level_lines_cleared_u16: u16 = run_data.level_lines_cleared.into()
                + lines_cleared.into();
            let next_level_lines_cleared = if next_level_lines_cleared_u16 > 255 {
                255_u8
            } else {
                next_level_lines_cleared_u16.try_into().unwrap()
            };
            if run_data.level_lines_cleared != next_level_lines_cleared {
                run_data.level_lines_cleared = next_level_lines_cleared;
                run_data_changed = true;
            }

            // Bonus charges now use per-map bonus slot configuration from GameSettings.
            let (trigger_type, threshold) = match run_data.bonus_slot {
                0 => (settings.bonus_1_trigger_type, settings.bonus_1_trigger_threshold),
                1 => (settings.bonus_2_trigger_type, settings.bonus_2_trigger_threshold),
                2 => (settings.bonus_3_trigger_type, settings.bonus_3_trigger_threshold),
                _ => (0_u8, 0_u8),
            };

            if trigger_type > 0 && threshold > 0 && run_data.bonus_type > 0 {
                if trigger_type == 1 {
                    // Combo streak (per-level): award one charge each exact threshold hit.
                    if game.combo_counter > 0 && game.combo_counter % threshold == 0 {
                        let next_charges = InternalImpl::add_bonus_charges(
                            run_data.bonus_charges, 1,
                        );
                        if next_charges != run_data.bonus_charges {
                            run_data.bonus_charges = next_charges;
                            run_data_changed = true;
                        }
                    }
                } else if trigger_type == 2 {
                    // Lines cleared (per-level, monotonic threshold crossings).
                    let earned = run_data.level_lines_cleared / threshold;
                    let prev_earned = run_data_before_move.level_lines_cleared / threshold;
                    if earned > prev_earned {
                        let charges_to_add = earned - prev_earned;
                        let next_charges = InternalImpl::add_bonus_charges(
                            run_data.bonus_charges, charges_to_add,
                        );
                        if next_charges != run_data.bonus_charges {
                            run_data.bonus_charges = next_charges;
                            run_data_changed = true;
                        }
                    }
                } else if trigger_type == 3 {
                    // Score (per-level, monotonic threshold crossings).
                    let earned = run_data.level_score / threshold;
                    let prev_earned = run_data_before_move.level_score / threshold;
                    if earned > prev_earned {
                        let charges_to_add = earned - prev_earned;
                        let next_charges = InternalImpl::add_bonus_charges(
                            run_data.bonus_charges, charges_to_add,
                        );
                        if next_charges != run_data.bonus_charges {
                            run_data.bonus_charges = next_charges;
                            run_data_changed = true;
                        }
                    }
                };
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
                    game_dispatcher.emit_progress(player, Task::LevelComplete.identifier(), 1, sid);
                    if game_level.max_moves > 0 {
                        let perfect_threshold = game_level.max_moves * 40 / 100;
                        if run_data.level_moves.into() <= perfect_threshold {
                            game_dispatcher
                                .emit_progress(player, Task::PerfectLevel.identifier(), 1, sid);
                        }
                    }
                    if run_data.current_level >= 10 {
                        game_dispatcher
                            .emit_progress(player, Task::BossDefeat.identifier(), 1, sid);
                        // ZoneComplete only on FIRST clear — check PlayerBestRun.map_cleared
                        let best_run: PlayerBestRun = world.read_model((player, sid, 0_u8));
                        if !best_run.map_cleared {
                            game_dispatcher
                                .emit_progress(player, Task::ZoneComplete.identifier(), 1, sid);
                        }
                    }
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
                    ramped_score, @settings,
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
        #[inline(always)]
        fn add_bonus_charges(current: u8, to_add: u8) -> u8 {
            let next_charges_u16: u16 = current.into() + to_add.into();
            if next_charges_u16 > 15 {
                15
            } else {
                next_charges_u16.try_into().unwrap()
            }
        }

        fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
            if mutator_id == 0 {
                return MutatorEffectsTrait::neutral(0);
            }

            let stored: MutatorDef = world.read_model(mutator_id);
            MutatorEffectsTrait::normalize(mutator_id, stored)
        }
    }
}
