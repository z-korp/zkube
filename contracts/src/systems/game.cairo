#[starknet::interface]
pub trait IGameSystem<T> {
    /// Create a new game with bonus selection
    /// @param game_id: NFT token ID for this game
    /// @param selected_bonuses: Array of 3 bonus types [0-5] to use this run
    ///   - 0=None (invalid), 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
    ///   - Pass empty array for default selection [Combo, Score, Harvest]
    fn create(ref self: T, game_id: u64, selected_bonuses: Span<u8>);
    /// Surrender the current run (game over)
    fn surrender(ref self: T, game_id: u64);
    /// Get player name from token
    fn get_player_name(self: @T, game_id: u64) -> felt252;
    /// Get current level score
    fn get_score(self: @T, game_id: u64) -> u16;
    /// Get game data for UI
    /// Returns: (level, level_score, level_moves, combo, max_combo, combo_bonus, score_bonus,
    /// harvest_bonus, total_cubes, over)
    fn get_game_data(self: @T, game_id: u64) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool);
}

#[dojo::contract]
mod game_system {
    use core::num::traits::Zero;
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::interface::IMinigameTokenData;
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
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::grinder;
    use zkube::events::StartGame;
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::helpers::game_libs::{
        GameLibsImpl, IGridSystemDispatcherTrait, ILevelSystemDispatcherTrait,
    };
    use zkube::helpers::game_over;
    use zkube::helpers::random::RandomImpl;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameAssert, GameSeed, GameTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};

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

        // Store VRF address for runtime random source selection
        self.vrf_address.write(vrf_address);
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
        fn create(ref self: ContractState, game_id: u64, selected_bonuses: Span<u8>) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            self.validate_start_conditions(game_id, @token_metadata, token_address);

            // Generate seed: use VRF if vrf_address is set, otherwise pseudo-random
            let vrf_addr = self.vrf_address.read();
            let vrf_enabled = !vrf_addr.is_zero();
            let random = if vrf_addr.is_zero() {
                RandomImpl::new_pseudo_random()
            } else {
                RandomImpl::new_vrf()
            };
            let timestamp = get_block_timestamp();

            // Get game settings (selected via token settings_id)
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Create empty game shell (grid will be initialized via dispatcher)
            let mut game = GameTrait::new_empty(game_id, timestamp);

            // Store the seed separately
            let game_seed = GameSeed { game_id, seed: random.seed, vrf_enabled };
            world.write_model(@game_seed);

            let draft_state: DraftState = DraftStateTrait::new(game_id, random.seed);
            world.write_model(@draft_state);

            // Initialize or update player meta
            let player = get_caller_address();
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            // Process bonus selection
            let mut run_data = game.get_run_data();

            // Determine selected bonuses (use defaults if empty)
            let (bonus_1, bonus_2, bonus_3) = if selected_bonuses.len() == 0 {
                // Default selection: Combo(1), Score(2), Harvest(3)
                (1_u8, 2_u8, 3_u8)
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

            // Initialize GameLibs once for all dispatcher calls
            let libs = GameLibsImpl::new(world);

            game.set_run_data(run_data);
            world.write_model(@game);

            player_meta.increment_runs();
            world.write_model(@player_meta);

            // Track quest progress: games played (Grinder task)
            // Only counts for default settings games
            libs.track_quest(player, grinder::Grinder::identifier(), 1, settings.settings_id);

            // Track achievement progress: games played (Grinder achievement)
            libs.track_achievement(player, grinder::Grinder::identifier(), 1, settings.settings_id);

            post_action(token_address, game_id);

            // Emit start game event
            world.emit_event(@StartGame { player, timestamp, game_id });

            // Initialize level 1 and grid via GameLibs dispatchers
            let has_no_bonus = libs.level.initialize_level(game_id);
            libs.grid.initialize_grid(game_id);

            // Update run_data with no_bonus_constraint flag if needed
            if has_no_bonus {
                let mut game: Game = world.read_model(game_id);
                let mut run_data = game.get_run_data();
                run_data.no_bonus_constraint = true;
                game.set_run_data(run_data);
                world.write_model(@game);
            }
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
                run_data.combo_count,
                run_data.score_count,
                run_data.harvest_count,
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
