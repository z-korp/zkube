#[starknet::interface]
pub trait IGameSystem<T> {
    /// Create a new game with bonus selection and optional cubes
    /// @param game_id: NFT token ID for this game
    /// @param selected_bonuses: Array of 3 bonus types [0-5] to use this run
    ///   - 0=None (invalid), 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
    ///   - Pass empty array for default selection [Hammer, Wave, Totem]
    /// @param cubes_amount: Cubes to bring into run (burned from wallet), 0 for none
    fn create(ref self: T, game_id: u64, selected_bonuses: Span<u8>, cubes_amount: u16);
    /// Surrender the current run (game over)
    fn surrender(ref self: T, game_id: u64);
    /// Get player name from token
    fn get_player_name(self: @T, game_id: u64) -> felt252;
    /// Get current level score
    fn get_score(self: @T, game_id: u64) -> u16;
    /// Get game data for UI
    /// Returns: (level, level_score, level_moves, combo, max_combo, hammer, wave, totem, total_cubes, over)
    fn get_game_data(
        self: @T, game_id: u64,
    ) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool);
}

#[dojo::contract]
mod game_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::game::{GameSeed, GameLevelTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::level::LevelGeneratorTrait;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::packing::MetaDataPackingTrait;
    use zkube::helpers::game_over;
    use zkube::events::{StartGame, LevelStarted};
    use zkube::systems::cube_token::ICubeTokenDispatcherTrait;
    use zkube::helpers::dispatchers;
    use zkube::elements::tasks::grinder;

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};
    use core::num::traits::Zero;

    use game_components_minigame::interface::{IMinigameTokenData};
    use game_components_minigame::libs::{
        assert_token_ownership, get_player_name as get_token_player_name, post_action, pre_action,
    };
    use game_components_minigame::minigame::MinigameComponent;
    use game_components_token::core::interface::{
        IMinigameTokenDispatcher, IMinigameTokenDispatcherTrait,
    };
    use game_components_token::libs::LifecycleTrait;
    use game_components_token::structs::TokenMetadata;
    use openzeppelin_introspection::src5::SRC5Component;

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
    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        denshokan_address: ContractAddress,
        renderer_address: Option<ContractAddress>,
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
                        starknet::contract_address_const::<0>()
                    },
                }
            },
        };

        self
            .minigame
            .initializer(
                creator_address,
                "zKube",
                "zKube is an onchain puzzle roguelike with 50 levels, constraints, and star ratings.",
                "zKorp",
                "zKorp",
                "Puzzle",
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                Option::Some("#3c2fba"),
                Option::None, // client_url
                if final_renderer_address.is_zero() {
                    Option::None
                } else {
                    Option::Some(final_renderer_address)
                }, // renderer address
                Option::Some(config_system_address), // settings_address
                Option::None, // objectives_address (using Cartridge arcade)
                denshokan_address,
            );
    }

    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            // Return level score as the "score" for token metadata
            game.get_level_score().into()
        }

        fn game_over(self: @ContractState, token_id: u64) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            game.over
        }
    }

    #[abi(embed_v0)]
    impl GameSystemImpl of super::IGameSystem<ContractState> {
        fn create(ref self: ContractState, game_id: u64, selected_bonuses: Span<u8>, cubes_amount: u16) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            self.validate_start_conditions(game_id, @token_metadata, token_address);

            // Generate seed using pseudo-random (for slot) or VRF (for mainnet)
            // For mainnet/sepolia, change this to RandomImpl::new_vrf()
            let random = RandomImpl::new_pseudo_random();
            let timestamp = get_block_timestamp();

            // Get game settings (selected via token settings_id) and create a settings-aware game.
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            let mut game = GameTrait::new(game_id, random.seed, timestamp, settings);

            // Store the seed separately
            let game_seed = GameSeed { game_id, seed: random.seed };
            world.write_model(@game_seed);

            // Initialize or update player meta
            let player = get_caller_address();
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            let meta_data = player_meta.get_meta_data();

            // Process bonus selection
            let mut run_data = game.get_run_data();
            
            // Determine selected bonuses (use defaults if empty)
            let (bonus_1, bonus_2, bonus_3) = if selected_bonuses.len() == 0 {
                // Default selection: Hammer(1), Wave(3), Totem(2)
                (1_u8, 3_u8, 2_u8)
            } else {
                // Validate exactly 3 bonuses selected
                assert!(selected_bonuses.len() == 3, "Must select exactly 3 bonuses");
                
                let b1 = *selected_bonuses.at(0);
                let b2 = *selected_bonuses.at(1);
                let b3 = *selected_bonuses.at(2);
                
                // Validate each bonus is valid (1-5, not 0)
                assert!(b1 >= 1 && b1 <= 5, "Invalid bonus type");
                assert!(b2 >= 1 && b2 <= 5, "Invalid bonus type");
                assert!(b3 >= 1 && b3 <= 5, "Invalid bonus type");
                
                // Validate no duplicates
                assert!(b1 != b2 && b1 != b3 && b2 != b3, "Duplicate bonus selection");
                
                // Validate Shrink(4) and Shuffle(5) are unlocked
                if b1 == 4 || b2 == 4 || b3 == 4 {
                    assert!(meta_data.shrink_unlocked, "Shrink bonus not unlocked");
                }
                if b1 == 5 || b2 == 5 || b3 == 5 {
                    assert!(meta_data.shuffle_unlocked, "Shuffle bonus not unlocked");
                }
                
                (b1, b2, b3)
            };
            
            // Store selected bonuses in run_data
            run_data.selected_bonus_1 = bonus_1;
            run_data.selected_bonus_2 = bonus_2;
            run_data.selected_bonus_3 = bonus_3;
            // All bonuses start at level 0 (L1)
            run_data.bonus_1_level = 0;
            run_data.bonus_2_level = 0;
            run_data.bonus_3_level = 0;

            // Handle cube bridging if cubes_amount > 0
            if cubes_amount > 0 {
                // Check player has unlocked bridging
                let max_allowed = player_meta.get_max_cubes_to_bring();
                assert!(max_allowed > 0, "Bridging not unlocked - upgrade bridging rank first");
                assert!(cubes_amount <= max_allowed, "Exceeds max cubes for your bridging rank");
                
                // Burn cubes from ERC1155 wallet (will revert if insufficient)
                let cube_token = dispatchers::get_cube_token_dispatcher(world);
                cube_token.burn(player, cubes_amount.into());
                
                // Set cubes_brought in run_data
                run_data.cubes_brought = cubes_amount;
            }

            // Apply starting bonuses ONLY for selected bonus types (capped at bag size)
            // Helper to apply starting bonus if selected
            // Hammer = 1
            if bonus_1 == 1 || bonus_2 == 1 || bonus_3 == 1 {
                let bag_size = meta_data.get_bag_size(0);
                let starting = meta_data.starting_hammer;
                run_data.hammer_count = if starting > bag_size { bag_size } else { starting };
            }
            // Totem = 2
            if bonus_1 == 2 || bonus_2 == 2 || bonus_3 == 2 {
                let bag_size = meta_data.get_bag_size(2);
                let starting = meta_data.starting_totem;
                run_data.totem_count = if starting > bag_size { bag_size } else { starting };
            }
            // Wave = 3
            if bonus_1 == 3 || bonus_2 == 3 || bonus_3 == 3 {
                let bag_size = meta_data.get_bag_size(1);
                let starting = meta_data.starting_wave;
                run_data.wave_count = if starting > bag_size { bag_size } else { starting };
            }
            // Shrink = 4
            if bonus_1 == 4 || bonus_2 == 4 || bonus_3 == 4 {
                let bag_size = meta_data.get_bag_size(3);
                let starting = meta_data.starting_shrink;
                run_data.shrink_count = if starting > bag_size { bag_size } else { starting };
            }
            // Shuffle = 5
            if bonus_1 == 5 || bonus_2 == 5 || bonus_3 == 5 {
                let bag_size = meta_data.get_bag_size(4);
                let starting = meta_data.starting_shuffle;
                run_data.shuffle_count = if starting > bag_size { bag_size } else { starting };
            }

            game.set_run_data(run_data);
            world.write_model(@game);

            player_meta.increment_runs();
            world.write_model(@player_meta);

            // Track quest progress: games played (Grinder task)
            // Only counts for default settings games
            dispatchers::track_quest_progress(world, player, grinder::Grinder::identifier(), 1, settings.settings_id);

            post_action(token_address, game_id);

            // Emit events
            world
                .emit_event(
                    @StartGame { player, timestamp, game_id, },
                );

            // Generate level 1 config and write to GameLevel model
            // This is the single source of truth for level config (replaces client-side generation)
            let level_config = LevelGeneratorTrait::generate(random.seed, 1, settings);
            let game_level = GameLevelTrait::from_level_config(game_id, level_config);
            world.write_model(@game_level);

            // Emit level 1 started
            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: 1,
                        points_required: level_config.points_required,
                        max_moves: level_config.max_moves,
                        constraint_type: level_config.constraint.constraint_type,
                        constraint_value: level_config.constraint.value,
                        constraint_required: level_config.constraint.required_count,
                    },
                );
        }

        fn surrender(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
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

            game.over = true;
            world.write_model(@game);

            let player = get_caller_address();
            game_over::handle_game_over(ref world, game, player);

            post_action(token_address, game_id);
        }

        fn get_player_name(self: @ContractState, game_id: u64) -> felt252 {
            let token_address = self.token_address();
            get_token_player_name(token_address, game_id)
        }

        fn get_score(self: @ContractState, game_id: u64) -> u16 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.get_level_score().into()
        }

        fn get_game_data(
            self: @ContractState, game_id: u64,
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
                run_data.hammer_count,
                run_data.wave_count,
                run_data.totem_count,
                run_data.total_cubes,
                game.over,
            )
        }
    }

    #[generate_trait]
    pub impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn validate_start_conditions(
            self: @ContractState,
            token_id: u64,
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
        fn assert_game_not_started(self: @ContractState, game_id: u64) {
            let game: Game = self.world(@DEFAULT_NS()).read_model(game_id);
            assert!(game.blocks == 0, "Game {} has already started", game_id);
        }
    }
}
