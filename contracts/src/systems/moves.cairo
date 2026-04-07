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
    use zkube::constants::DEFAULT_SETTINGS::DEFAULT_SETTINGS_ID;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::{game_over, grid_ops, level_check, token};
    use zkube::models::config::{GameSettings, GameSettingsTrait};
    use zkube::models::daily::{DailyAttempt, DailyAttemptTrait, DailyChallenge};
    use zkube::models::game::{Game, GameAssert, GameLevel, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::models::player::PlayerBestRun;
    use zkube::models::story::{StoryAttempt, StoryAttemptTrait, StoryZoneProgress};
    use zkube::systems::level::{ILevelSystemDispatcher, ILevelSystemDispatcherTrait};
    use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};
    use zkube::types::difficulty::Difficulty;

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
            let player = get_caller_address();

            // Read StoryAttempt first; skip DailyAttempt read entirely when
            // it's a story game (saves ~2,500 gas on every story move).
            let story_game: StoryAttempt = world.read_model(game_id);
            let is_story_game = story_game.exists();
            let (is_daily_game, daily_player, daily_zone_id, daily_challenge_id) =
                if is_story_game {
                (false, core::num::traits::Zero::zero(), 0_u8, 0_u32)
            } else {
                let daily: DailyAttempt = world.read_model(game_id);
                (daily.exists(), daily.player, daily.zone_id, daily.challenge_id)
            };
            let is_non_token_game = is_story_game || is_daily_game;

            let token_address = token::get_token_address(world);
            let token_id_felt: felt252 = game_id.into();
            if !is_non_token_game {
                pre_action(token_address, token_id_felt);

                let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
                let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
                assert!(
                    token_metadata.lifecycle.is_playable(get_block_timestamp()),
                    "Game {} lifecycle is not playable",
                    game_id,
                );
            }

            let mut game: Game = world.read_model(game_id);
            if is_story_game {
                assert!(story_game.player == player, "not story owner");
            } else if is_daily_game {
                assert!(daily_player == player, "not daily owner");
            } else {
                assert_token_ownership(token_address, token_id_felt);
            }
            game.assert_not_over();
            let run_data_before_move = game.get_run_data();

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            // Inline settings resolution — avoids redundant StoryAttempt/DailyAttempt
            // reads that ConfigUtilsTrait::get_game_settings would perform again.
            let settings = if is_story_game {
                let sid: u32 = ((story_game.zone_id - 1) * 2).into();
                let s: GameSettings = world.read_model(sid);
                if s.exists() {
                    s
                } else {
                    GameSettingsTrait::new_with_defaults(
                        DEFAULT_SETTINGS_ID, Difficulty::Increasing,
                    )
                }
            } else if is_daily_game {
                let sid: u32 = ((daily_zone_id - 1) * 2).into();
                let mut s: GameSettings = world.read_model(sid);
                if s.exists() {
                    let challenge: DailyChallenge = world.read_model(daily_challenge_id);
                    s.active_mutator_id = challenge.active_mutator_id;
                    s.passive_mutator_id = challenge.passive_mutator_id;
                    s.boss_id = challenge.boss_id;
                    s
                } else {
                    GameSettingsTrait::new_with_defaults(
                        DEFAULT_SETTINGS_ID, Difficulty::Increasing,
                    )
                }
            } else {
                // NFT token path
                let token_disp = IMinigameTokenDispatcher { contract_address: token_address };
                let tok_sid = token_disp.settings_id(game_id);
                let s: GameSettings = world.read_model(tok_sid);
                if s.exists() {
                    s
                } else {
                    let fallback: GameSettings = world.read_model(DEFAULT_SETTINGS_ID);
                    if fallback.exists() {
                        fallback
                    } else {
                        GameSettingsTrait::new_with_defaults(
                            DEFAULT_SETTINGS_ID, Difficulty::Increasing,
                        )
                    }
                }
            };

            let sid = settings.settings_id;

            // Read models once for the inline grid call
            let base_seed: GameSeed = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let mutator_def_passive = grid_ops::read_mutator_def(
                world, run_data_before_move.active_mutator_id,
            );

            // Execute move inline — game is updated by ref, no re-read needed
            let (lines_cleared, is_grid_full) = grid_ops::execute_move_inline(
                ref world,
                game_id,
                ref game,
                base_seed,
                game_level,
                settings,
                @mutator_def_passive,
                row_index,
                start_index,
                final_index,
            );

            // Re-read run_data and game_level from updated state
            // (execute_move_inline modifies game in-place)
            let mut game_level: GameLevel = world.read_model(game_id);
            let mut run_data = game.get_run_data();

            // Collect all progress tasks into a batch array (emitted once at
            // the end) to avoid multiple cross-contract dispatcher calls.
            let mut progress_tasks: Array<(felt252, u128)> = array![];
            if lines_cleared > 0 {
                progress_tasks.append((Task::LineClear.identifier(), lines_cleared.into()));
            }
            if game.combo_counter >= 3 {
                progress_tasks.append((Task::Combo3.identifier(), 1));
            }
            if game.combo_counter >= 4 {
                progress_tasks.append((Task::Combo4.identifier(), 1));
            }
            if game.combo_counter >= 5 {
                progress_tasks.append((Task::Combo5.identifier(), 1));
            }

            // Reuse the passive mutator def already read for the grid call.
            let mut run_data_changed = false;
            let mutator_def = mutator_def_passive;

            // Track per-level lines cleared in run_data.
            let next_level_lines_cleared_u16: u16 = run_data.level_lines_cleared.into()
                + lines_cleared.into();
            let next_level_lines_cleared = if next_level_lines_cleared_u16 > 15 {
                15_u8
            } else {
                next_level_lines_cleared_u16.try_into().unwrap()
            };
            if run_data.level_lines_cleared != next_level_lines_cleared {
                run_data.level_lines_cleared = next_level_lines_cleared;
                run_data_changed = true;
            }

            // Bonus charges: read trigger config from the active mutator's bonus slots.
            let active_bonus_mut_id = settings.active_mutator_id;
            let (trigger_type, threshold) = if active_bonus_mut_id > 0 {
                let bonus_mutator: MutatorDef = world.read_model(active_bonus_mut_id);
                match run_data.bonus_slot {
                    0 => (
                        bonus_mutator.bonus_1_trigger_type, bonus_mutator.bonus_1_trigger_threshold,
                    ),
                    1 => (
                        bonus_mutator.bonus_2_trigger_type, bonus_mutator.bonus_2_trigger_threshold,
                    ),
                    2 => (
                        bonus_mutator.bonus_3_trigger_type, bonus_mutator.bonus_3_trigger_threshold,
                    ),
                    _ => (0_u8, 0_u8),
                }
            } else {
                (0_u8, 0_u8)
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

            // Apply run_data to the cached game struct (defers storage write
            // to the branch below so we write at most once).
            if run_data_changed {
                game.set_run_data(run_data);
            }

            if run_data.run_type == 0 {
                // Zone run: preserve existing completion/failure flow.
                let is_complete = level_check::is_level_complete(@game_level, @run_data);

                if is_complete {
                    progress_tasks.append((Task::LevelComplete.identifier(), 1));
                    if game_level.max_moves > 0 {
                        let perfect_threshold = game_level.max_moves * 40 / 100;
                        if run_data.level_moves.into() <= perfect_threshold {
                            progress_tasks.append((Task::PerfectLevel.identifier(), 1));
                        }
                    }
                    if run_data.current_level >= 10 {
                        progress_tasks.append((Task::BossDefeat.identifier(), 1));
                        if is_story_game {
                            let story_progress: StoryZoneProgress = world
                                .read_model((player, story_game.zone_id));
                            if !story_progress.boss_cleared {
                                progress_tasks.append((Task::ZoneComplete.identifier(), 1));
                            }
                        } else {
                            // ZoneComplete only on FIRST clear — check PlayerBestRun.zone_cleared
                            let best_run: PlayerBestRun = world.read_model((player, sid, 0_u8));
                            if !best_run.zone_cleared {
                                progress_tasks.append((Task::ZoneComplete.identifier(), 1));
                            }
                        }
                    }
                    // Flush cached game to storage before cross-contract
                    // finalize_level call (it reads game from storage).
                    if run_data_changed {
                        world.write_model(@game);
                    }
                    let level_addr = world
                        .dns_address(@"level_system")
                        .expect('LevelSystem not found');
                    let level_dispatcher = ILevelSystemDispatcher { contract_address: level_addr };
                    level_dispatcher.finalize_level(game_id, player);
                } else if is_grid_full {
                    game.over = true;
                    world.write_model(@game);
                    game_over::handle_game_over(ref world, game, player);
                } else {
                    let is_failed = level_check::is_level_failed(@game_level, @run_data);
                    if is_failed {
                        game.over = true;
                        world.write_model(@game);
                        game_over::handle_game_over(ref world, game, player);
                    } else if run_data_changed {
                        // No level transition or game-over — just persist
                        // the updated run_data that was deferred above.
                        world.write_model(@game);
                    }
                }
            } else {
                // Endless run: no level completion/failure checks.
                let ramped_score = MutatorEffectsTrait::apply_endless_ramp(
                    @mutator_def, run_data.total_score,
                );
                let target_difficulty = LevelGeneratorTrait::get_endless_difficulty_for_score(
                    ramped_score, @settings,
                );
                let target_difficulty_u8: u8 = target_difficulty.into();

                let difficulty_changed = run_data.current_difficulty != target_difficulty_u8;
                if difficulty_changed {
                    run_data.current_difficulty = target_difficulty_u8;
                    game.set_run_data(run_data);

                    game_level.difficulty = target_difficulty_u8;
                    world.write_model(@game_level);
                }

                if is_grid_full {
                    game.over = true;
                    world.write_model(@game);
                    game_over::handle_game_over(ref world, game, player);
                } else if difficulty_changed || run_data_changed {
                    // Persist deferred run_data / difficulty changes.
                    world.write_model(@game);
                }
            }
            // Single bulk dispatch for all collected progress tasks.
            if progress_tasks.len() > 0 {
                match world.dns_address(@"progress_system") {
                    Option::Some(progress_address) => {
                        let progress_dispatcher = IProgressSystemDispatcher {
                            contract_address: progress_address,
                        };
                        progress_dispatcher.emit_progress_bulk(player, progress_tasks.span(), sid);
                    },
                    Option::None => {},
                }
            }

            if !is_story_game {
                post_action(token_address, token_id_felt);
            }
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
    }
}
