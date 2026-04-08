#[starknet::interface]
pub trait IStorySystem<T> {
    fn start_story_attempt(ref self: T, zone_id: u8) -> felt252;
    fn replay_story_level(ref self: T, zone_id: u8, level: u8) -> felt252;
    fn claim_zone_perfection(ref self: T, zone_id: u8);
}

#[dojo::contract]
mod story_system {
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use starknet::{get_block_timestamp, get_caller_address, get_tx_info};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::events::{LevelStarted, StartGame};
    use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
    use zkube::helpers::game_libs::{GameLibsImpl, IGridSystemDispatcherTrait};
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::models::entitlement::ZoneEntitlement;
    use zkube::models::game::{Game, GameLevelTrait, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::models::story::{
        ActiveStoryAttempt, ActiveStoryAttemptTrait, StoryAttempt, StoryZoneProgress,
        StoryZoneProgressTrait,
    };
    use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
    use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};
    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl StorySystemImpl of super::IStorySystem<ContractState> {
        fn start_story_attempt(ref self: ContractState, zone_id: u8) -> felt252 {
            InternalImpl::create_story_attempt(ref self, zone_id, 0)
        }

        fn replay_story_level(ref self: ContractState, zone_id: u8, level: u8) -> felt252 {
            assert!(level >= 1 && level <= 10, "invalid level");
            InternalImpl::create_story_attempt(ref self, zone_id, level)
        }

        fn claim_zone_perfection(ref self: ContractState, zone_id: u8) {
            assert!(zone_id >= 1 && zone_id <= 10, "invalid zone");

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();
            let mut progress: StoryZoneProgress = world.read_model((player, zone_id));
            assert!(progress.exists(), "missing progress");
            assert!(!progress.perfection_claimed, "already claimed");

            let total_stars = InternalImpl::total_stars(@progress);
            assert!(total_stars == 30, "not perfected");

            progress.perfection_claimed = true;
            world.write_model(@progress);

            match world.dns_address(@"config_system") {
                Option::Some(config_address) => {
                    let config_dispatcher = IConfigSystemDispatcher {
                        contract_address: config_address,
                    };
                    let zstar_address = config_dispatcher.get_zstar_address();
                    if !zstar_address.is_zero() {
                        let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                        zstar.mint(player, 20);
                    }
                },
                Option::None => {},
            }

            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            player_meta.increment_xp(700);
            world.write_model(@player_meta);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn create_story_attempt(
            ref self: ContractState, zone_id: u8, requested_level: u8,
        ) -> felt252 {
            assert!(zone_id >= 1 && zone_id <= 10, "invalid zone");

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();
            let settings_id = Self::settings_id_for_zone(zone_id);
            let timestamp = get_block_timestamp();

            let settings: GameSettings = world.read_model(settings_id);
            assert!(settings.exists(), "missing settings");

            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            if !metadata.is_free {
                let entitlement: ZoneEntitlement = world.read_model((player, settings_id));
                assert!(entitlement.purchased_at != 0, "zone locked");
            }

            let mut progress: StoryZoneProgress = world.read_model((player, zone_id));
            if !progress.exists() {
                progress = StoryZoneProgressTrait::new(player, zone_id);
            }

            let mut active: ActiveStoryAttempt = world.read_model(player);
            if active.exists() {
                let existing_game: Game = world.read_model(active.game_id);
                if existing_game.is_non_zero() && !existing_game.over {
                    assert!(false, "active story game");
                }
                active = ActiveStoryAttemptTrait::empty(player);
                world.write_model(@active);
            }

            let highest_unlocked = if progress.highest_cleared >= 10 {
                10_u8
            } else {
                progress.highest_cleared + 1
            };
            let is_replay = requested_level != 0;
            let level = if is_replay {
                requested_level
            } else if highest_unlocked == 0 {
                1
            } else {
                highest_unlocked
            };
            assert!(level <= highest_unlocked, "level locked");

            let tx_info = get_tx_info().unbox();
            let game_id = poseidon_hash_span(
                array![
                    player.into(), zone_id.into(), level.into(), timestamp.into(),
                    tx_info.transaction_hash,
                ]
                    .span(),
            );
            let random = RandomImpl::new_pseudo_random();
            let seed = random.seed;
            let level_seed = GameTrait::generate_level_seed(seed, level);

            // Read bonus config from the active mutator
            let active_mut_id = settings.active_mutator_id;
            let bonus_mutator_def = Self::read_mutator_def(world, active_mut_id);
            let seed_u256: u256 = seed.into();
            let (bonus_slot, bonus_type, starting_charges) = Self::select_bonus_slot(
                seed_u256, @bonus_mutator_def,
            );

            // Store passive mutator in RunData for stat effects during gameplay
            let passive_mut_id = settings.passive_mutator_id;
            let mut game = GameTrait::new_empty(game_id, timestamp, zone_id, passive_mut_id, 0);
            let mut run_data = game.get_run_data();
            run_data.current_level = level;
            run_data.bonus_slot = bonus_slot;
            run_data.bonus_type = bonus_type;
            run_data.bonus_charges = if starting_charges > 15 {
                15
            } else {
                starting_charges
            };
            game.set_run_data(run_data);

            // Use passive mutator for level generation (stat modifiers)
            let passive_mutator_def = Self::read_mutator_def(world, passive_mut_id);
            let level_config = LevelGeneratorTrait::generate(
                level_seed, level, settings, @passive_mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);
            game_level.mutator_id = passive_mut_id;

            let game_seed = GameSeed { game_id, seed, level_seed, vrf_enabled: false };
            let story_game = StoryAttempt { game_id, player, zone_id, level, is_replay };
            let active_game = ActiveStoryAttemptTrait::new(
                player, game_id, zone_id, level, is_replay,
            );

            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            } else if player_meta.last_active > 0 && timestamp - player_meta.last_active > 604800 {
                match world.dns_address(@"config_system") {
                    Option::Some(config_address) => {
                        let config_dispatcher = IConfigSystemDispatcher {
                            contract_address: config_address,
                        };
                        let zstar_address = config_dispatcher.get_zstar_address();
                        if !zstar_address.is_zero() {
                            let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                            zstar.mint(player, 5);
                        }
                    },
                    Option::None => {},
                }
                player_meta.increment_xp(50);
            }

            world.write_model(@game);
            world.write_model(@game_seed);
            world.write_model(@game_level);
            world.write_model(@story_game);
            world.write_model(@active_game);
            world.write_model(@progress);

            player_meta.increment_runs();
            player_meta.last_active = timestamp;
            world.write_model(@player_meta);

            world.emit_event(@StartGame { player, timestamp, game_id });
            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level,
                        points_required: level_config.points_required,
                        max_moves: game_level.max_moves,
                        constraint_type: level_config.constraint.constraint_type,
                        constraint_value: level_config.constraint.value,
                        constraint_required: level_config.constraint.required_count,
                    },
                );

            match world.dns_address(@"progress_system") {
                Option::Some(progress_address) => {
                    let progress_dispatcher = IProgressSystemDispatcher {
                        contract_address: progress_address,
                    };
                    progress_dispatcher
                        .emit_progress(player, Task::GameStart.identifier(), 1, settings_id);
                },
                Option::None => {},
            }

            let libs = GameLibsImpl::new(world);
            libs.grid.initialize_grid(game_id);

            game_id
        }

        fn settings_id_for_zone(zone_id: u8) -> u32 {
            ((zone_id - 1) * 2).into()
        }

        /// Select a bonus slot from the active mutator's non-None bonus slots.
        /// Returns (bonus_slot, bonus_type, starting_charges).
        fn select_bonus_slot(seed_u256: u256, mutator_def: @MutatorDef) -> (u8, u8, u8) {
            // Count non-None slots
            let mut count: u8 = 0;
            if *mutator_def.bonus_1_type > 0 {
                count += 1;
            }
            if *mutator_def.bonus_2_type > 0 {
                count += 1;
            }
            if *mutator_def.bonus_3_type > 0 {
                count += 1;
            }
            if count == 0 {
                return (0, 0, 0);
            }

            let pick: u8 = (seed_u256 % count.into()).try_into().unwrap();
            let mut found: u8 = 0;

            if *mutator_def.bonus_1_type > 0 {
                if found == pick {
                    return (0, *mutator_def.bonus_1_type, *mutator_def.bonus_1_starting_charges);
                }
                found += 1;
            }
            if *mutator_def.bonus_2_type > 0 {
                if found == pick {
                    return (1, *mutator_def.bonus_2_type, *mutator_def.bonus_2_starting_charges);
                }
                found += 1;
            }
            if *mutator_def.bonus_3_type > 0 {
                if found == pick {
                    return (2, *mutator_def.bonus_3_type, *mutator_def.bonus_3_starting_charges);
                }
            }

            // Fallback (should not reach)
            (0, 0, 0)
        }

        fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
            if mutator_id == 0 {
                return MutatorEffectsTrait::neutral(0);
            }
            let stored: MutatorDef = world.read_model(mutator_id);
            MutatorEffectsTrait::normalize(mutator_id, stored)
        }

        fn total_stars(progress: @StoryZoneProgress) -> u8 {
            let mut total: u8 = 0;
            let mut level: u8 = 1;
            loop {
                if level > 10 {
                    break;
                }
                total += progress.get_level_stars(level);
                level += 1;
            }
            total
        }
    }
}
