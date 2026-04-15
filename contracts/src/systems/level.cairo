//! Level System - level initialization and in-tx auto-advance.

#[starknet::interface]
pub trait ILevelSystem<T> {
    /// Initialize level 1 for a new game.
    fn initialize_level(ref self: T, game_id: felt252) -> bool;

    /// Initialize dedicated endless mode level config for a new game.
    fn initialize_endless_level(ref self: T, game_id: felt252);

    /// Finalize the current level and immediately advance in the same transaction.
    /// Returns reserved legacy tuple: (0, 0, false).
    fn finalize_level(
        ref self: T, game_id: felt252, player: starknet::ContractAddress,
    ) -> (u8, u8, bool);

    /// Legacy compatibility entrypoint. Transitioning is now automatic.
    fn start_next_level(ref self: T, game_id: felt252);

    /// Insert a new line when grid is empty.
    fn insert_line_if_empty(ref self: T, game_id: felt252);
}

#[dojo::contract]
mod level_system {
    use core::num::traits::Zero;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use starknet::{ContractAddress, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::events::{LevelCompleted, LevelStarted};
    use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{GameLibsImpl, IGridSystemDispatcherTrait};
    use zkube::helpers::game_over;
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::config::GameSettings;
    use zkube::models::daily::{DailyAttempt, DailyAttemptTrait, DailyEntry, DailyEntryTrait};
    use zkube::models::game::{Game, GameLevel, GameLevelTrait, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::models::player::{PlayerBestRun, PlayerBestRunTrait, PlayerMeta, PlayerMetaTrait};
    use zkube::models::story::{
        StoryAttempt, StoryAttemptTrait, StoryZoneProgress, StoryZoneProgressTrait,
    };
    use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
    use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl LevelSystemImpl of super::ILevelSystem<ContractState> {
        fn initialize_level(ref self: ContractState, game_id: felt252) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let player = get_caller_address();
            let active_mutator_id = game.get_run_data().active_mutator_id;
            let mutator_def = InternalImpl::read_mutator_def(world, active_mutator_id);

            let level_config = LevelGeneratorTrait::generate(
                base_seed.level_seed, 1, settings, @mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);
            game_level.mutator_id = active_mutator_id;
            world.write_model(@game_level);

            // Defensive reset of per-level/runtime fields for a fresh run.
            let mut run_data = game.get_run_data();
            run_data.current_level = 1;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;
            run_data.zone_cleared = false;
            run_data.current_difficulty = 0;
            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);
            world.write_model(@game);

            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: 1,
                        points_required: level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: level_config.constraint.constraint_type,
                        constraint_value: level_config.constraint.value,
                        constraint_required: level_config.constraint.required_count,
                    },
                );

            false
        }

        fn initialize_endless_level(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut game: Game = world.read_model(game_id);
            let base_seed: GameSeed = world.read_model(game_id);
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            let level_config = LevelGeneratorTrait::generate_endless_level(
                base_seed.seed, settings,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);

            let mut run_data = game.get_run_data();
            run_data.current_level = 1;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;
            run_data.zone_cleared = false;
            run_data.current_difficulty = 0;

            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);

            game_level.mutator_id = run_data.active_mutator_id;

            world.write_model(@game_level);
            world.write_model(@game);
        }

        fn finalize_level(
            ref self: ContractState, game_id: felt252, player: ContractAddress,
        ) -> (u8, u8, bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();
            let move_system = world
                .dns_address(@"move_system")
                .expect('MoveSystem not found in DNS');
            assert!(caller == move_system, "Unauthorized finalize");

            let mut game: Game = world.read_model(game_id);
            let game_level: GameLevel = world.read_model(game_id);
            let run_data = game.get_run_data();

            let completed_level = run_data.current_level;
            let final_score = run_data.level_score;
            let final_moves = run_data.level_moves;
            let total_score = run_data.total_score;
            let story_game: StoryAttempt = world.read_model(game_id);

            // Get settings for star threshold modifier and delta minting
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let passive_mutator = InternalImpl::read_mutator_def(
                world, settings.passive_mutator_id,
            );
            let stars = InternalImpl::calculate_stars_for_level(
                game_level, final_moves.into(), passive_mutator.star_threshold_modifier,
            );
            if completed_level <= 10 {
                game.set_level_stars(completed_level, stars);
            }
            world.write_model(@game);
            let sid = settings.settings_id;

            if story_game.exists() {
                let story_player = story_game.player;
                let mut story_progress: StoryZoneProgress = world
                    .read_model((story_player, story_game.zone_id));
                if !story_progress.exists() {
                    story_progress = StoryZoneProgressTrait::new(story_player, story_game.zone_id);
                }

                if completed_level <= 10 && stars > 0 {
                    let previous_best = story_progress.get_level_stars(completed_level);
                    if stars > previous_best {
                        let delta: u8 = stars - previous_best;
                        story_progress.set_level_stars(completed_level, stars);

                        match world.dns_address(@"config_system") {
                            Option::Some(config_address) => {
                                let config = IConfigSystemDispatcher {
                                    contract_address: config_address,
                                };
                                if config.is_star_eligible(sid) {
                                    let zstar_address = config.get_zstar_address();
                                    if !zstar_address.is_zero() {
                                        let zstar = IZStarTokenDispatcher {
                                            contract_address: zstar_address,
                                        };
                                        zstar.mint(story_player, delta.into());
                                    }

                                    let mut player_meta: PlayerMeta = world
                                        .read_model(story_player);
                                    if !player_meta.exists() {
                                        player_meta = PlayerMetaTrait::new(story_player);
                                    }
                                    player_meta.increment_xp(delta.into() * 10);
                                    world.write_model(@player_meta);
                                }
                            },
                            Option::None => {},
                        }
                    }
                }

                if stars > 0 && completed_level > story_progress.highest_cleared {
                    story_progress.highest_cleared = completed_level;
                }
                if stars > 0 && completed_level >= 10 {
                    story_progress.boss_cleared = true;
                }
                world.write_model(@story_progress);

                world
                    .emit_event(
                        @LevelCompleted {
                            game_id,
                            player: story_player,
                            level: completed_level,
                            moves_used: final_moves.into(),
                            score: final_score.into(),
                            total_score,
                        },
                    );

                let progress_address = world
                    .dns_address(@"progress_system")
                    .expect('ProgressSystem not found');
                let progress_dispatcher = IProgressSystemDispatcher {
                    contract_address: progress_address,
                };
                progress_dispatcher
                    .emit_progress(story_player, Task::LevelComplete.identifier(), 1, sid);

                game.over = true;
                world.write_model(@game);
                game_over::handle_game_over(ref world, game, story_player);
                return (0, 0, false);
            }

            // Daily game path: update DailyEntry per-level stars, then end game.
            let daily_game: DailyAttempt = world.read_model(game_id);
            if daily_game.exists() {
                let daily_player = daily_game.player;
                let challenge_id = daily_game.challenge_id;

                let mut entry: DailyEntry = world.read_model((challenge_id, daily_player));

                // Delta star tracking (same logic as story path)
                if completed_level <= 10 && stars > 0 {
                    let previous_best = entry.get_level_stars(completed_level);
                    if stars > previous_best {
                        let delta: u8 = stars - previous_best;
                        entry.set_level_stars(completed_level, stars);
                        entry.total_stars += delta;
                        entry.last_star_time = starknet::get_block_timestamp();

                        // Delta mint zStar + XP
                        match world.dns_address(@"config_system") {
                            Option::Some(config_address) => {
                                let config = IConfigSystemDispatcher {
                                    contract_address: config_address,
                                };
                                if config.is_star_eligible(sid) {
                                    let zstar_address = config.get_zstar_address();
                                    if !zstar_address.is_zero() {
                                        let zstar = IZStarTokenDispatcher {
                                            contract_address: zstar_address,
                                        };
                                        zstar.mint(daily_player, delta.into());
                                    }

                                    let mut player_meta: PlayerMeta = world
                                        .read_model(daily_player);
                                    if !player_meta.exists() {
                                        player_meta = PlayerMetaTrait::new(daily_player);
                                    }
                                    player_meta.increment_xp(delta.into() * 10);
                                    world.write_model(@player_meta);
                                }
                            },
                            Option::None => {},
                        }
                    }
                }

                // Advance highest_cleared for non-replay forward progress
                if !daily_game.is_replay && stars > 0 && completed_level > entry.highest_cleared {
                    entry.highest_cleared = completed_level;
                }

                world.write_model(@entry);

                world
                    .emit_event(
                        @LevelCompleted {
                            game_id,
                            player: daily_player,
                            level: completed_level,
                            moves_used: final_moves.into(),
                            score: final_score.into(),
                            total_score,
                        },
                    );

                let progress_address = world
                    .dns_address(@"progress_system")
                    .expect('ProgressSystem not found');
                let progress_dispatcher = IProgressSystemDispatcher {
                    contract_address: progress_address,
                };
                progress_dispatcher
                    .emit_progress(daily_player, Task::LevelComplete.identifier(), 1, sid);

                // End game (one level per game, like story)
                game.over = true;
                world.write_model(@game);
                game_over::handle_game_over(ref world, game, daily_player);
                return (0, 0, false);
            }

            // Delta star minting: only mint the improvement over previous best
            if completed_level <= 10 && stars > 0 {
                let mut best_run: PlayerBestRun = world.read_model((player, sid, 0_u8));
                let previous_best = best_run.get_best_level_stars(completed_level);
                if stars > previous_best {
                    let delta: u8 = stars - previous_best;
                    // Mint delta zStar + XP via config dispatcher
                    match world.dns_address(@"config_system") {
                        Option::Some(config_address) => {
                            let config = IConfigSystemDispatcher {
                                contract_address: config_address,
                            };
                            if config.is_star_eligible(sid) {
                                let zstar_address = config.get_zstar_address();
                                if !zstar_address.is_zero() {
                                    let zstar = IZStarTokenDispatcher {
                                        contract_address: zstar_address,
                                    };
                                    zstar.mint(player, delta.into());
                                }
                                // XP: 100 per star
                                let mut player_meta: PlayerMeta = world.read_model(player);
                                if !player_meta.exists() {
                                    player_meta = PlayerMetaTrait::new(player);
                                }
                                player_meta.increment_xp(delta.into() * 10);
                                world.write_model(@player_meta);
                            }
                        },
                        Option::None => {},
                    }
                }
            }

            world
                .emit_event(
                    @LevelCompleted {
                        game_id,
                        player,
                        level: completed_level,
                        moves_used: final_moves.into(),
                        score: final_score.into(),
                        total_score,
                    },
                );

            let progress_address = world
                .dns_address(@"progress_system")
                .expect('ProgressSystem not found');
            let progress_dispatcher = IProgressSystemDispatcher {
                contract_address: progress_address,
            };
            progress_dispatcher.emit_progress(player, Task::LevelComplete.identifier(), 1, sid);

            InternalImpl::advance_level(ref world, game_id, player, game, settings);

            (0, 0, false)
        }

        fn start_next_level(ref self: ContractState, game_id: felt252) {
            let _ = game_id;
        }

        fn insert_line_if_empty(ref self: ContractState, game_id: felt252) {
            let world: WorldStorage = self.world(@DEFAULT_NS());

            let game: Game = world.read_model(game_id);
            if game.blocks != 0 {
                return;
            }

            let libs = GameLibsImpl::new(world);
            libs.grid.insert_line_if_empty(game_id);
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

        fn calculate_stars_for_level(
            game_level: GameLevel, moves_used: u16, star_threshold_modifier: u8,
        ) -> u8 {
            // star_threshold_modifier uses bias-128 encoding with 5% per unit.
            //   128 = neutral (base 50% / 75%)
            //   >128 = harder (shrinks the move window for 3-star / 2-star)
            //   <128 = easier (widens the window)
            // Practical range: 124..132 = -20%..+20% in 5-point steps.
            let (is_positive, magnitude) = zkube::helpers::mutator::decode_bias(
                star_threshold_modifier,
            );
            let mag_pct: u16 = magnitude.into() * 5;

            // Base thresholds (neutral): star3 at <=50% moves used, star2 at <=75%.
            // Positive magnitude = harder, so subtract from the base.
            let star3_pct: u16 = if is_positive {
                if mag_pct >= 40 {
                    10
                } else {
                    50_u16 - mag_pct
                }
            } else {
                let raw = 50_u16 + mag_pct;
                if raw > 90 {
                    90
                } else {
                    raw
                }
            };
            let star2_pct: u16 = if is_positive {
                let raw = if mag_pct >= 75 {
                    0_u16
                } else {
                    75_u16 - mag_pct
                };
                let floor = star3_pct + 1;
                if raw < floor {
                    floor
                } else {
                    raw
                }
            } else {
                let raw = 75_u16 + mag_pct;
                if raw > 99 {
                    99
                } else {
                    raw
                }
            };

            let cube_3_threshold = game_level.max_moves * star3_pct / 100;
            let cube_2_threshold = game_level.max_moves * star2_pct / 100;
            if moves_used <= cube_3_threshold {
                3
            } else if moves_used <= cube_2_threshold {
                2
            } else {
                1
            }
        }

        fn advance_level(
            ref world: WorldStorage,
            game_id: felt252,
            player: ContractAddress,
            mut game: Game,
            settings: GameSettings,
        ) {
            let base_seed: GameSeed = world.read_model(game_id);

            let mut run_data = game.get_run_data();
            let current_level = run_data.current_level;

            // Dedicated endless mode does not use level progression.
            if run_data.run_type == 1 {
                return;
            }

            // Zone run victory at level cap: finish run (no transition to endless).
            if current_level >= 10 {
                run_data.zone_cleared = true;
                game.over = true;
                game.set_run_data(run_data);
                world.write_model(@game);
                game_over::handle_game_over(ref world, game, player);
                return;
            }

            let next_level = current_level + 1;

            run_data.current_level = next_level;
            run_data.level_score = 0;
            run_data.level_moves = 0;
            run_data.constraint_progress = 0;
            run_data.constraint_2_progress = 0;
            run_data.level_lines_cleared = 0;

            game.combo_counter = 0;
            game.max_combo = 0;
            game.set_run_data(run_data);

            // Write game before grid reset; grid system reads current_level from run_data.
            world.write_model(@game);

            // Reseed per level using VRF/pseudo-random.
            // (Daily games never reach advance_level — they return early in finalize_level.)
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), next_level.into()].span(),
            );
            let next_seed_random = RandomImpl::from_vrf_enabled(base_seed.vrf_enabled, vrf_salt);
            let next_level_seed = next_seed_random.seed;

            let next_game_seed = GameSeed {
                game_id,
                seed: base_seed.seed,
                level_seed: next_level_seed,
                vrf_enabled: base_seed.vrf_enabled,
            };
            world.write_model(@next_game_seed);

            let mutator_def = Self::read_mutator_def(world, run_data.active_mutator_id);
            let next_level_config = LevelGeneratorTrait::generate(
                next_level_seed, next_level, settings, @mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
            game_level.mutator_id = run_data.active_mutator_id;
            world.write_model(@game_level);

            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: next_level,
                        points_required: next_level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: next_level_config.constraint.constraint_type,
                        constraint_value: next_level_config.constraint.value,
                        constraint_required: next_level_config.constraint.required_count,
                    },
                );

            let libs = GameLibsImpl::new(world);
            libs.grid.reset_grid_for_level(game_id);
        }
    }
}
