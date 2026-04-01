#[starknet::interface]
pub trait IGameSystem<T> {
    /// Create a new game
    /// @param game_id: NFT token ID for this game
    fn create(ref self: T, game_id: felt252, mode: u8);
    /// Create a new game run
    /// @param game_id: NFT token ID for this game
    fn create_run(ref self: T, game_id: felt252, mode: u8);
    /// Surrender the current run (game over)
    fn surrender(ref self: T, game_id: felt252);
    /// Apply currently active mutator bonus at target block position
    fn apply_bonus(ref self: T, game_id: felt252, row_index: u8, block_index: u8);
    /// Get player name from token
    fn get_player_name(self: @T, game_id: felt252) -> felt252;
    /// Get current level score
    fn get_score(self: @T, game_id: felt252) -> u16;
    /// Get game data for UI
    /// Returns:
    /// (level, level_score, level_moves, combo, max_combo,
    ///  reserved_1, reserved_2, reserved_3, reserved_4, over)
    fn get_game_data(self: @T, game_id: felt252) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool);
}

#[dojo::contract]
mod game_system {
    use core::num::traits::Zero;
    use core::traits::Into;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_embeddable_game_standard::minigame::interface::IMinigameTokenData;
    use game_components_embeddable_game_standard::minigame::minigame::{
        assert_token_ownership, get_player_name as get_token_player_name, post_action, pre_action,
    };
    use game_components_embeddable_game_standard::minigame::minigame_component::MinigameComponent;
    use game_components_embeddable_game_standard::token::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_embeddable_game_standard::token::token::LifecycleTrait;
    use game_components_embeddable_game_standard::token::structs::TokenMetadata;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::events::StartGame;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::game_libs::{
        GameLibsImpl, IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait,
    };
    use zkube::helpers::game_over;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::config::GameSettingsMetadata;
    use zkube::models::entitlement::MapEntitlement;
    use zkube::models::game::{Game, GameAssert, GameSeed, GameTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::models::daily::{DailyChallenge, DailyEntry, DailyEntryTrait, GameChallenge};
    use zkube::types::mutator::{FULL_MUTATOR_MASK, MutatorTrait};
    use zkube::types::bonus::{Bonus, BonusTrait};
    use zkube::systems::daily_challenge::{
        IDailyChallengeSystemDispatcher, IDailyChallengeSystemDispatcherTrait,
    };

    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: MinigameComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        /// VRF provider address. If zero, use pseudo-random (for slot/katana).
        /// If set, use Cartridge VRF (for sepolia/mainnet).
        vrf_address: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: MinigameComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    /// @title Dojo Init
    /// @notice Initializes the contract and registers with the MinigameRegistry
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    ///
    /// @param creator_address: the address of the creator of the game
    /// @param denshokan_address: the address of the FullTokenContract (MinigameToken)
    /// @param renderer_address: optional renderer address, defaults to 'renderer_systems' if None
    /// @param vrf_address: VRF provider address. Use zero for slot/katana (pseudo-random),
    ///                     or Cartridge VRF address for sepolia/mainnet
    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        denshokan_address: ContractAddress,
        renderer_address: Option<ContractAddress>,
        vrf_address: ContractAddress,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let (config_system_address, _) = world.dns(@"config_system").unwrap();

        // Use provided renderer address or default to 'renderer_systems'
        let final_renderer_address = match renderer_address {
            Option::Some(addr) => addr,
            Option::None => {
                // Try to get renderer_systems, but don't fail if it doesn't exist yet
                match world.dns(@"renderer_systems") {
                    Option::Some((addr, _)) => addr,
                    Option::None => {
                        // Use zero address as fallback - can be updated later
                        core::num::traits::Zero::zero()
                    },
                }
            },
        };

        if !denshokan_address.is_zero() {
            self
                .minigame
                .initializer(
                    creator_address,
                    "zKube",
                    "zKube - fast puzzle score-survival with themed zones and endless mode.",
                    "zKorp",
                    "zKorp",
                    "Puzzle",
                    "https://zkube.vercel.app/assets/pwa-512x512.png",
                    Option::Some("#3c2fba"),
                    Option::None,
                    if final_renderer_address.is_zero() {
                        Option::None
                    } else {
                        Option::Some(final_renderer_address)
                    },
                    Option::Some(config_system_address),
                    Option::None,
                    denshokan_address,
                    Option::None,
                    Option::None,
                    1,
                );
        }

        self.vrf_address.write(vrf_address);
    }

    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: felt252) -> u64 {
            let game_id = token_id;
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            // Return level score as the "score" for token metadata
            game.get_level_score().into()
        }

        fn game_over(self: @ContractState, token_id: felt252) -> bool {
            let game_id = token_id;
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.over
        }

        fn score_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<u64> {
            let mut scores = array![];
            let mut i: u32 = 0;

            loop {
                if i >= token_ids.len() {
                    break;
                }

                let token_id = *token_ids.at(i);
                let score = self.score(token_id);
                scores.append(score);
                i += 1;
            };

            scores
        }

        fn game_over_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<bool> {
            let mut statuses = array![];
            let mut i: u32 = 0;

            loop {
                if i >= token_ids.len() {
                    break;
                }

                let token_id = *token_ids.at(i);
                let over = self.game_over(token_id);
                statuses.append(over);
                i += 1;
            };

            statuses
        }
    }

    #[abi(embed_v0)]
    impl GameSystemImpl of super::IGameSystem<ContractState> {
        fn create(ref self: ContractState, game_id: felt252, mode: u8) {
            self.create_run(game_id, mode);
        }

        fn create_run(ref self: ContractState, game_id: felt252, mode: u8) {
            InternalImpl::create_game(ref self, game_id, mode);
        }

        fn surrender(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            let token_id_felt = game_id;
            pre_action(token_address, token_id_felt);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, token_id_felt);
            game.assert_not_over();

            game.over = true;
            world.write_model(@game);

            let player = get_caller_address();
            game_over::handle_game_over(ref world, game, player);

            post_action(token_address, token_id_felt);
        }

        fn apply_bonus(
            ref self: ContractState,
            game_id: felt252,
            row_index: u8,
            block_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            let token_id_felt = game_id;
            pre_action(token_address, token_id_felt);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, token_id_felt);
            game.assert_not_over();

            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(block_index < 8, "Invalid block_index: must be < 8");

            let mut run_data = game.get_run_data();
            assert!(run_data.bonus_charges > 0, "No bonus charges available");
            assert!(run_data.bonus_type > 0, "No active bonus");

            let bonus: Bonus = run_data.bonus_type.into();
            let new_blocks = bonus.apply(game.blocks, row_index, block_index);
            game.blocks = Controller::apply_gravity(new_blocks);

            run_data.bonus_charges -= 1;
            game.set_run_data(run_data);
            world.write_model(@game);

            post_action(token_address, token_id_felt);
        }

        fn get_player_name(self: @ContractState, game_id: felt252) -> felt252 {
            let token_address = self.token_address();
            let token_id_felt = game_id;
            get_token_player_name(token_address, token_id_felt)
        }

        fn get_score(self: @ContractState, game_id: felt252) -> u16 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.get_level_score().into()
        }

        fn get_game_data(
            self: @ContractState, game_id: felt252,
        ) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            (
                run_data.current_level,
                run_data.level_score,
                run_data.level_moves,
                game.combo_counter,
                game.max_combo,
                0,
                0,
                0,
                0,
                game.over,
            )
        }
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        fn create_game(ref self: ContractState, game_id: felt252, mode: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();
            let mode_val: u8 = mode & 0x1;

            let token_address = self.token_address();
            let token_id_felt = game_id;
            pre_action(token_address, token_id_felt);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
            self.validate_start_conditions(game_id, @token_metadata, token_address);

            // Get game settings (selected via token settings_id)
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Detect active daily challenge context by (mode, map_settings_id).
            let mut daily_seed: felt252 = 0;
            let mut daily_challenge_id: u32 = 0;
            match world.dns_address(@"daily_challenge_system") {
                Option::Some(daily_system_addr) => {
                    let daily = IDailyChallengeSystemDispatcher {
                        contract_address: daily_system_addr,
                    };
                    let challenge_id = daily.get_current_challenge();
                    if challenge_id > 0 {
                        let challenge: DailyChallenge = world.read_model(challenge_id);
                        if challenge.map_settings_id == settings.settings_id
                            && challenge.game_mode == mode_val {
                            let entry: DailyEntry = world.read_model((challenge_id, player));
                            assert!(entry.exists(), "Must register for daily challenge first");

                            let game_challenge = GameChallenge { game_id, challenge_id };
                            world.write_model(@game_challenge);

                            daily_seed = challenge.seed;
                            daily_challenge_id = challenge_id;
                        }
                    }
                },
                Option::None => {},
            }
            let is_daily_game = daily_challenge_id > 0;

            // === MAP ACCESS GATE ===
            // Daily challenge runs bypass entitlement checks.
            if !is_daily_game {
                let metadata: GameSettingsMetadata = world.read_model(settings.settings_id);
                if !metadata.is_free {
                    let entitlement: MapEntitlement = world.read_model((player, settings.settings_id));
                    assert!(entitlement.purchased_at != 0, "Map not purchased - unlock this map first");
                }
            }

            // Generate seed: daily challenge uses shared seed, otherwise VRF/pseudo-random.
            let (seed, vrf_enabled) = if is_daily_game {
                (daily_seed, false)
            } else {
                // Normal game: use VRF if available, otherwise pseudo-random
                let vrf_addr = self.vrf_address.read();
                let vrf_on = !vrf_addr.is_zero();
                let random = if vrf_addr.is_zero() {
                    RandomImpl::new_pseudo_random()
                } else {
                    RandomImpl::new_vrf(game_id)
                };
                (random.seed, vrf_on)
            };
            let active_mutator_id: u8 = if mode_val == 1 {
                MutatorTrait::roll_mutator(seed, FULL_MUTATOR_MASK)
            } else {
                MutatorTrait::roll_mutator(seed, settings.allowed_mutators)
            };

            let seed_u256: u256 = seed.into();
            let bonus_slot: u8 = (seed_u256 % 3_u256).try_into().unwrap();
            let (bonus_type, starting_charges) = match bonus_slot {
                0 => (settings.bonus_1_type, settings.bonus_1_starting_charges),
                1 => (settings.bonus_2_type, settings.bonus_2_starting_charges),
                2 => (settings.bonus_3_type, settings.bonus_3_starting_charges),
                _ => (0_u8, 0_u8),
            };

            let timestamp = get_block_timestamp();

            // Create empty game shell (grid will be initialized via dispatcher)
            let mut game = GameTrait::new_empty(game_id, timestamp, 0, active_mutator_id, mode_val);
            let mut run_data = game.get_run_data();
            run_data.bonus_slot = bonus_slot;
            run_data.bonus_type = bonus_type;
            run_data.bonus_charges = if starting_charges > 15 { 15 } else { starting_charges };
            game.set_run_data(run_data);

            // Store the seed separately
            let game_seed = GameSeed {
                game_id, seed, level_seed: seed, vrf_enabled,
            };
            world.write_model(@game_seed);

            // Initialize or update player meta
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);

            world.write_model(@game);

            player_meta.increment_runs();
            world.write_model(@player_meta);

            post_action(token_address, token_id_felt);

            // Emit start game event
            world.emit_event(@StartGame { player, timestamp, game_id });

            // Initialize mode-specific level config, then grid.
            if mode_val == 1 {
                libs.level.initialize_endless_level(game_id);
            } else {
                libs.level.initialize_level(game_id);
            }
            libs.grid.initialize_grid(game_id);
        }

        #[inline(always)]
        fn validate_start_conditions(
            self: @ContractState,
            token_id: felt252,
            token_metadata: @TokenMetadata,
            token_address: ContractAddress,
        ) {
            assert_token_ownership(token_address, token_id);
            self.assert_game_not_started(token_id);
            assert!(
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()),
                "Game {} lifecycle is not playable",
                token_id,
            );
        }

        #[inline(always)]
        fn assert_game_not_started(self: @ContractState, game_id: felt252) {
            let game: Game = self.world(@DEFAULT_NS()).read_model(game_id);
            assert!(game.blocks == 0, "Game {} has already started", game_id);
        }
    }
}
