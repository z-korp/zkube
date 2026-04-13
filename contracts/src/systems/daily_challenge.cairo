use starknet::ContractAddress;
use zkube::models::daily::DailyEntry;

#[starknet::interface]
pub trait IDailyChallengeSystem<T> {
    /// Start the next daily challenge level. Auto-creates today's challenge on first call.
    /// First call of the day joins the daily and starts level 1.
    /// Subsequent calls start at highest_cleared + 1.
    fn start_daily_game(ref self: T) -> felt252;
    /// Replay a previously cleared daily level for better stars.
    fn replay_daily_level(ref self: T, level: u8) -> felt252;
    /// Settle a daily challenge after it ends.
    /// `ranked_players` must be sorted by (total_stars DESC, last_star_time ASC).
    fn settle_challenge(ref self: T, challenge_id: u32, ranked_players: Span<ContractAddress>);
    /// Get today's challenge ID (day_id = timestamp / 86400)
    fn get_current_challenge(self: @T) -> u32;
    /// Get player entry for a challenge
    fn get_player_entry(self: @T, challenge_id: u32, player: ContractAddress) -> DailyEntry;
}

#[dojo::contract]
mod daily_challenge_system {
    use core::num::traits::Zero;
    use core::poseidon::poseidon_hash_span;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address, get_tx_info};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::events::{LevelStarted, StartGame};
    use zkube::helpers::game_creation::roll_bonus_trigger;
    use zkube::helpers::game_libs::{GameLibsImpl, IGridSystemDispatcherTrait};
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::helpers::{daily, economy};
    use zkube::models::config::{GameSettings, GameSettingsTrait, RewardKind, RewardTiers};
    use zkube::models::daily::{
        ActiveDailyAttempt, ActiveDailyAttemptTrait, DailyAttempt, DailyChallenge,
        DailyChallengeTrait, DailyEntry, DailyEntryTrait,
    };
    use zkube::models::game::{Game, GameLevelTrait, GameSeed, GameTrait};
    use zkube::models::mutator::MutatorDef;
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};

    #[storage]
    struct Storage {
        admin_address: ContractAddress,
    }

    fn dojo_init(ref self: ContractState, admin_address: ContractAddress) {
        assert!(!admin_address.is_zero(), "Admin address cannot be zero");
        self.admin_address.write(admin_address);
    }

    #[abi(embed_v0)]
    impl DailyChallengeImpl of super::IDailyChallengeSystem<ContractState> {
        fn start_daily_game(ref self: ContractState) -> felt252 {
            InternalImpl::create_daily_attempt(ref self, 0)
        }

        fn replay_daily_level(ref self: ContractState, level: u8) -> felt252 {
            assert!(level >= 1 && level <= 10, "invalid level");
            InternalImpl::create_daily_attempt(ref self, level)
        }

        fn settle_challenge(
            ref self: ContractState, challenge_id: u32, ranked_players: Span<ContractAddress>,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let timestamp = get_block_timestamp();

            let mut challenge: DailyChallenge = world.read_model(challenge_id);
            assert!(challenge.exists(), "Challenge does not exist");
            assert!(challenge.has_ended(timestamp), "Challenge has not ended yet");
            assert!(!challenge.settled, "Challenge already settled");

            let total_participants = challenge.total_entries;

            // Early return if no entries -- just mark as settled
            if total_participants == 0 {
                challenge.settled = true;
                world.write_model(@challenge);
                return;
            }

            // Cap the ranked list length
            let len = ranked_players.len();
            assert!(len <= daily::MAX_RANKED_PLAYERS, "Too many ranked players");

            // N = ceil(total_entries / 4), capped
            let num_winners = (total_participants + 3) / 4;
            let capped_winners = if num_winners > daily::MAX_RANKED_PLAYERS {
                daily::MAX_RANKED_PLAYERS
            } else {
                num_winners
            };

            // Verify descending order and distribute rewards.
            // Ranking: total_stars DESC, last_star_time ASC (earlier = better).
            // Composite: (total_stars << 48) | (MAX_48 - last_star_time_truncated)
            let mut prev_value: u64 = 0xFFFFFFFFFFFFFFFF; // max u64
            let mut rank: u32 = 1;
            while rank <= len && rank <= capped_winners {
                let player = *ranked_players.at(rank - 1);
                assert!(player.is_non_zero(), "Zero address in ranked list");

                let entry: DailyEntry = world.read_model((challenge_id, player));
                assert!(entry.exists(), "Player has no entry for this challenge");

                let value = InternalImpl::compute_ranking_value(
                    entry.total_stars, entry.last_star_time,
                );
                assert!(value <= prev_value, "Invalid ranking order");
                prev_value = value;

                let star_reward = InternalImpl::compute_star_reward(
                    @world, rank, total_participants,
                );
                if star_reward > 0 {
                    economy::mint_zstar(ref world, player, star_reward.into());

                    // Store rank and reward in DailyEntry
                    let mut entry_mut: DailyEntry = world.read_model((challenge_id, player));
                    entry_mut.rank = rank;
                    entry_mut.star_reward = star_reward;
                    world.write_model(@entry_mut);
                }

                rank += 1;
            }

            challenge.settled = true;
            world.write_model(@challenge);
        }

        fn get_current_challenge(self: @ContractState) -> u32 {
            (get_block_timestamp() / 86400).try_into().unwrap()
        }

        fn get_player_entry(
            self: @ContractState, challenge_id: u32, player: ContractAddress,
        ) -> DailyEntry {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model((challenge_id, player))
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Shared logic for start_daily_game (requested_level=0) and replay_daily_level.
        fn create_daily_attempt(ref self: ContractState, requested_level: u8) -> felt252 {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();
            let timestamp = get_block_timestamp();
            let tx_info = get_tx_info().unbox();
            let tx_hash = tx_info.transaction_hash;

            // Guard: reject if player already has an active daily game
            let active: ActiveDailyAttempt = world.read_model(player);
            if active.exists() {
                let existing_game: Game = world.read_model(active.game_id);
                assert!(!existing_game.is_non_zero() || existing_game.over, "active daily game");
            }

            // Compute day_id from UTC midnight boundaries
            let day_id: u32 = (timestamp / 86400).try_into().unwrap();

            // Auto-create today's challenge if it doesn't exist yet
            let mut challenge: DailyChallenge = world.read_model(day_id);
            if !challenge.exists() {
                let seed = poseidon_hash_span(array![day_id.into(), 'DAILY_CHALLENGE'].span());
                let seed_u256: u256 = seed.into();
                let zone_id: u8 = ((seed_u256 % 10) + 1).try_into().unwrap();

                let seed2 = poseidon_hash_span(array![seed, 1].span());
                let seed2_u256: u256 = seed2.into();
                let active_mutator_id: u8 = ((seed2_u256 % 10) * 2 + 1).try_into().unwrap();

                let seed3 = poseidon_hash_span(array![seed, 2].span());
                let seed3_u256: u256 = seed3.into();
                let passive_mutator_id: u8 = ((seed3_u256 % 10) * 2 + 2).try_into().unwrap();

                let seed4 = poseidon_hash_span(array![seed, 3].span());
                let seed4_u256: u256 = seed4.into();
                let boss_id: u8 = ((seed4_u256 % 10) + 1).try_into().unwrap();

                let settings_id: u32 = ((zone_id - 1) * 2).into();
                let start_time: u64 = (day_id.into()) * 86400;
                let end_time: u64 = start_time + 86400;

                challenge =
                    DailyChallenge {
                        challenge_id: day_id,
                        settings_id,
                        seed,
                        start_time,
                        end_time,
                        total_entries: 0,
                        settled: false,
                        zone_id,
                        active_mutator_id,
                        passive_mutator_id,
                        boss_id,
                    };
                world.write_model(@challenge);
            }

            // Assert challenge is active
            assert!(challenge.is_active(timestamp), "Challenge is not active");

            // Read GameSettings for the zone
            let settings: GameSettings = world.read_model(challenge.settings_id);
            assert!(settings.exists(), "missing settings");

            // Read/create DailyEntry
            let mut entry: DailyEntry = world.read_model((day_id, player));
            let is_new_player = !entry.exists();
            if is_new_player {
                entry = DailyEntryTrait::new(day_id, player, timestamp);
                challenge.total_entries += 1;
                world.write_model(@challenge);
            }

            // Determine target level
            let is_replay = requested_level != 0;
            let level = if is_replay {
                assert!(requested_level <= entry.highest_cleared, "level locked");
                requested_level
            } else {
                let next = entry.highest_cleared + 1;
                assert!(next <= 10, "all levels cleared");
                next
            };

            // Generate unique game_id
            let game_id = poseidon_hash_span(
                array![player.into(), day_id.into(), level.into(), timestamp.into(), tx_hash]
                    .span(),
            );

            // Read bonus config from the active mutator
            let bonus_mutator_def = Self::read_mutator_def(world, challenge.active_mutator_id);
            let seed_u256: u256 = challenge.seed.into();
            let (bonus_trigger_type, bonus_type, starting_charges) = roll_bonus_trigger(
                seed_u256, @bonus_mutator_def,
            );

            // Create Game: zone run_type=0, single level
            let mut game = GameTrait::new_empty(
                game_id, timestamp, challenge.zone_id, challenge.passive_mutator_id, 0,
            );
            let mut run_data = game.get_run_data();
            run_data.current_level = level;
            run_data.bonus_trigger_type = bonus_trigger_type;
            run_data.bonus_type = bonus_type;
            run_data.bonus_charges = if starting_charges > 15 {
                15
            } else {
                starting_charges
            };
            game.set_run_data(run_data);

            // Create GameSeed with shared daily seed, level-specific seed
            let level_seed = GameTrait::generate_level_seed(challenge.seed, level);
            let game_seed = GameSeed {
                game_id, seed: challenge.seed, level_seed, vrf_enabled: false,
            };

            // Generate level config using passive mutator
            let passive_mutator_def = Self::read_mutator_def(world, challenge.passive_mutator_id);
            let level_config = LevelGeneratorTrait::generate(
                level_seed, level, settings, @passive_mutator_def,
            );
            let mut game_level = GameLevelTrait::from_level_config(game_id, level_config);
            game_level.mutator_id = challenge.passive_mutator_id;

            // Create DailyAttempt (links game to daily context)
            let daily_attempt = DailyAttempt {
                game_id, player, zone_id: challenge.zone_id, challenge_id: day_id, level, is_replay,
            };

            // Update PlayerMeta
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            } else if player_meta.last_active > 0 && timestamp - player_meta.last_active > 604800 {
                // Returning player bonus (>7 days inactive)
                economy::mint_zstar(ref world, player, 5);
                player_meta.increment_xp(50);
            }
            player_meta.increment_runs();
            player_meta.last_active = timestamp;

            // Track active daily game
            let active_daily = ActiveDailyAttemptTrait::new(
                player, game_id, day_id, level, is_replay,
            );

            // Write all models
            world.write_model(@game);
            world.write_model(@game_seed);
            world.write_model(@game_level);
            world.write_model(@daily_attempt);
            world.write_model(@entry);
            world.write_model(@player_meta);
            world.write_model(@active_daily);

            // Initialize grid
            let libs = GameLibsImpl::new(world);
            libs.grid.initialize_grid(game_id);

            // Emit events
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

            // Emit progress tasks
            match world.dns_address(@"progress_system") {
                Option::Some(progress_address) => {
                    let progress_dispatcher = IProgressSystemDispatcher {
                        contract_address: progress_address,
                    };
                    progress_dispatcher
                        .emit_progress(
                            player, Task::GameStart.identifier(), 1, challenge.settings_id,
                        );
                    // DailyPlay tracks distinct daily-challenges joined, NOT
                    // levels played. Only emit on the first level of each
                    // (player, day) pair.
                    if is_new_player {
                        progress_dispatcher
                            .emit_progress(
                                player, Task::DailyPlay.identifier(), 1, challenge.settings_id,
                            );
                    }
                },
                Option::None => {},
            }

            game_id
        }

        /// Compute ranking value: total_stars DESC, last_star_time ASC.
        /// Uses (total_stars << 48) | (MAX_48 - truncated_time) to pack into u64.
        #[inline(always)]
        fn compute_ranking_value(total_stars: u8, last_star_time: u64) -> u64 {
            let stars_u64: u64 = total_stars.into();
            let max_48: u64 = 0xFFFFFFFFFFFF; // 2^48 - 1
            let time_truncated: u64 = last_star_time & max_48;
            let time_inverted: u64 = max_48 - time_truncated;
            (stars_u64 * 0x1000000000000) + time_inverted
        }

        #[inline(always)]
        fn assert_admin(self: @ContractState, caller: ContractAddress) {
            let admin = self.admin_address.read();
            assert!(caller == admin, "Caller is not admin");
        }

        fn read_mutator_def(world: WorldStorage, mutator_id: u8) -> MutatorDef {
            if mutator_id == 0 {
                return MutatorEffectsTrait::neutral(0);
            }
            let stored: MutatorDef = world.read_model(mutator_id);
            MutatorEffectsTrait::normalize(mutator_id, stored)
        }

        /// Read configurable daily reward magnitudes, falling back to the
        /// shipped defaults `(10, 7, 5, 3, 1)` when no `RewardTiers` row has
        /// been written yet (every field zero).
        fn read_daily_tiers(world: @WorldStorage) -> (u64, u64, u64, u64, u64) {
            let cfg: RewardTiers = world.read_model(RewardKind::DAILY);
            if cfg.tier_0 == 0
                && cfg.tier_1 == 0
                && cfg.tier_2 == 0
                && cfg.tier_3 == 0
                && cfg.tier_4 == 0 {
                (10_u64, 7, 5, 3, 1)
            } else {
                (
                    cfg.tier_0.into(),
                    cfg.tier_1.into(),
                    cfg.tier_2.into(),
                    cfg.tier_3.into(),
                    cfg.tier_4.into(),
                )
            }
        }

        fn compute_star_reward(world: @WorldStorage, rank: u32, total_participants: u32) -> u64 {
            if total_participants == 0 {
                return 0;
            }
            let (t0, t1, t2, t3, t4) = Self::read_daily_tiers(world);
            let percentile_x100: u32 = ((rank - 1) * 100) / total_participants;
            if percentile_x100 < 2 {
                t0 // top 1%
            } else if percentile_x100 < 5 {
                t1 // top 5%
            } else if percentile_x100 < 10 {
                t2 // top 10%
            } else if percentile_x100 < 25 {
                t3 // top 25%
            } else if percentile_x100 < 50 {
                t4 // top 50%
            } else {
                0
            }
        }
    }
}
