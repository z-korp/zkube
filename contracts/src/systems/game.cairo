use zkube::types::bonus::Bonus;

#[starknet::interface]
pub trait IGameSystem<T> {
    /// Create a new game with level system
    fn create(ref self: T, game_id: u64);
    /// Create a new game and bring cubes into the run for in-game shop spending
    /// cubes_amount is burned from player's wallet and added to run budget
    fn create_with_cubes(ref self: T, game_id: u64, cubes_amount: u16);
    /// Surrender the current run (game over)
    fn surrender(ref self: T, game_id: u64);
    /// Make a move - also handles level completion automatically
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
    /// Apply a bonus from inventory
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8);
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
    use zkube::models::game::{GameSeed, GameLevel, GameLevelTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::models::config::{GameSettings, GameSettingsTrait};
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::level::{LevelGenerator, LevelGeneratorTrait};
    use zkube::helpers::config::ConfigUtilsTrait;
    use zkube::types::bonus::Bonus;
    use zkube::events::{StartGame, UseBonus, LevelStarted, LevelCompleted, RunEnded, RunCompleted};
    use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};
    use zkube::systems::quest::{IQuestSystemDispatcher, IQuestSystemDispatcherTrait};
    use zkube::elements::tasks::{grinder, clearer, combo};

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
        fn create(ref self: ContractState, game_id: u64) {
            // Delegate to create_with_cubes with 0 cubes
            self.create_with_cubes(game_id, 0);
        }

        fn create_with_cubes(ref self: ContractState, game_id: u64, cubes_amount: u16) {
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

            // Handle cube bridging if cubes_amount > 0
            if cubes_amount > 0 {
                // Check player has unlocked bridging
                let max_allowed = player_meta.get_max_cubes_to_bring();
                assert!(max_allowed > 0, "Bridging not unlocked - upgrade bridging rank first");
                assert!(cubes_amount <= max_allowed, "Exceeds max cubes for your bridging rank");
                
                // Burn cubes from ERC1155 wallet (will revert if insufficient)
                let cube_token = self.get_cube_token_dispatcher();
                cube_token.burn(player, cubes_amount.into());
                
                // Set cubes_brought in run_data
                let mut run_data = game.get_run_data();
                run_data.cubes_brought = cubes_amount;
                game.set_run_data(run_data);
            }

            // Apply starting bonuses from player meta upgrades (capped at bag size)
            let meta_data = player_meta.get_meta_data();
            if meta_data.starting_hammer > 0
                || meta_data.starting_wave > 0
                || meta_data.starting_totem > 0 {
                let mut run_data = game.get_run_data();
                let hammer_bag = player_meta.get_bag_size(0);
                let wave_bag = player_meta.get_bag_size(1);
                let totem_bag = player_meta.get_bag_size(2);
                run_data.hammer_count = if meta_data.starting_hammer > hammer_bag { hammer_bag } else { meta_data.starting_hammer };
                run_data.wave_count = if meta_data.starting_wave > wave_bag { wave_bag } else { meta_data.starting_wave };
                run_data.totem_count = if meta_data.starting_totem > totem_bag { totem_bag } else { meta_data.starting_totem };
                game.set_run_data(run_data);
            }

            world.write_model(@game);

            player_meta.increment_runs();
            world.write_model(@player_meta);

            // Track quest progress: games played (Grinder task)
            self.track_quest_progress(player, grinder::Grinder::identifier(), 1);

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

            self.handle_game_over(ref world, game);

            post_action(token_address, game_id);
        }

        fn move(
            ref self: ContractState, game_id: u64, row_index: u8, start_index: u8, final_index: u8,
        ) {
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

            // Validate move indices (grid is 10 rows x 8 columns)
            assert!(row_index < 10, "Invalid row_index: must be < 10");
            assert!(start_index < 8, "Invalid start_index: must be < 8");
            assert!(final_index < 8, "Invalid final_index: must be < 8");

            let base_seed: GameSeed = world.read_model(game_id);
            
            // Get game settings for level generation
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);

            // Make the move using the selected game settings
            let lines_cleared = game.make_move(
                base_seed.seed, row_index, start_index, final_index, settings,
            );

            // Track quest progress for lines cleared and combos
            let player = get_caller_address();
            if lines_cleared > 0 {
                // Track lines cleared (LineClearer task)
                self.track_quest_progress(player, clearer::LineClearer::identifier(), lines_cleared.into());
                
                // Track combo achievements based on lines cleared in one move
                if lines_cleared >= 3 {
                    self.track_quest_progress(player, combo::ComboThree::identifier(), 1);
                }
                if lines_cleared >= 5 {
                    self.track_quest_progress(player, combo::ComboFive::identifier(), 1);
                }
                if lines_cleared >= 8 {
                    self.track_quest_progress(player, combo::ComboEight::identifier(), 1);
                }
            }

            // Check for level completion
            let level_completed = self.check_and_complete_level(
                ref world, ref game, game_id, base_seed.seed, settings,
            );

            if !level_completed && (game.is_level_failed(base_seed.seed, settings) || game.over) {
                // Level failed (move limit exceeded) or grid full
                game.over = true;
                self.handle_game_over(ref world, game);
            }

            world.write_model(@game);

            post_action(token_address, game_id);
        }

        fn apply_bonus(
            ref self: ContractState, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();
            game.assert_bonus_available(bonus);

            let base_seed: GameSeed = world.read_model(game_id);
            
            // Get game settings
            let settings = ConfigUtilsTrait::get_game_settings(world, game_id);
            
            game.apply_bonus(base_seed.seed, bonus, row_index, line_index, settings);

            // Check for level completion after bonus
            self.check_and_complete_level(ref world, ref game, game_id, base_seed.seed, settings);

            world.write_model(@game);
            post_action(token_address, game_id);

            world
                .emit_event(
                    @UseBonus {
                        player: starknet::get_caller_address(),
                        timestamp: get_block_timestamp(),
                        game_id,
                        bonus,
                    },
                );
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

        /// Award random bonuses after completing a level.
        /// Returns the number of bonuses actually added (can be < requested if bags are full).
        fn award_level_bonuses(
            ref self: ContractState,
            ref world: WorldStorage,
            ref game: Game,
            seed: felt252,
            player: ContractAddress,
            bonuses_to_award: u8,
        ) -> u8 {
            if bonuses_to_award == 0 {
                return 0;
            }

            // Read player meta for bag sizes
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            let hammer_bag = player_meta.get_bag_size(0);
            let wave_bag = player_meta.get_bag_size(1);
            let totem_bag = player_meta.get_bag_size(2);

            let mut run_data = game.get_run_data();
            let current_level = run_data.current_level;

            let mut awarded: u8 = 0;
            let mut i: u8 = 0;
            loop {
                if i >= bonuses_to_award {
                    break;
                }

                // Use level+offset as deterministic index; clamp to avoid u8 overflow.
                let idx_u16: u16 = current_level.into() + i.into();
                let idx: u8 = if idx_u16 > 255 { 255 } else { idx_u16.try_into().unwrap() };
                let bonus_type = LevelGeneratorTrait::get_random_bonus_type(seed, idx);

                match bonus_type {
                    0 => {
                        if run_data.hammer_count < hammer_bag {
                            run_data.hammer_count += 1;
                            awarded += 1;
                        }
                    },
                    1 => {
                        if run_data.wave_count < wave_bag {
                            run_data.wave_count += 1;
                            awarded += 1;
                        }
                    },
                    _ => {
                        if run_data.totem_count < totem_bag {
                            run_data.totem_count += 1;
                            awarded += 1;
                        }
                    },
                }

                i += 1;
            };

            game.set_run_data(run_data);
            awarded
        }

        fn handle_game_over(ref self: ContractState, ref world: WorldStorage, game: Game) {
            let player = get_caller_address();
            let run_data = game.get_run_data();

            // Update player meta with best level
            let mut player_meta: PlayerMeta = world.read_model(player);
            player_meta.update_best_level(run_data.current_level);
            
            // Get game settings for cube multiplier
            let settings = ConfigUtilsTrait::get_game_settings(world, game.game_id);
            
            // Calculate cubes to mint:
            // - Spending first depletes brought cubes (already burned from wallet)
            // - Any excess spending comes from earned cubes
            // - Mint: total_cubes - max(0, cubes_spent - cubes_brought)
            let cubes_spent_from_earned: u16 = if run_data.cubes_spent > run_data.cubes_brought {
                run_data.cubes_spent - run_data.cubes_brought
            } else {
                0
            };
            let base_cubes: u16 = if run_data.total_cubes > cubes_spent_from_earned {
                run_data.total_cubes - cubes_spent_from_earned
            } else {
                0
            };
            
            // Apply cube multiplier from settings (e.g., 200 = 2x cubes)
            let cubes_to_mint: u16 = settings.apply_cube_multiplier(base_cubes);
            
            // Mint cubes to player's ERC1155 wallet
            if cubes_to_mint > 0 {
                let cube_token = self.get_cube_token_dispatcher();
                cube_token.mint(player, cubes_to_mint.into());
            }
            
            // Update lifetime stats
            player_meta.add_cubes_earned(cubes_to_mint.into());
            world.write_model(@player_meta);

            // Emit run ended event
            world
                .emit_event(
                    @RunEnded {
                        game_id: game.game_id,
                        player,
                        final_level: run_data.current_level,
                        final_score: run_data.total_score,
                        total_cubes: run_data.total_cubes,
                        started_at: game.started_at,
                        ended_at: get_block_timestamp(),
                    },
                );
        }

        /// Get the CubeToken contract dispatcher via world DNS
        fn get_cube_token_dispatcher(self: @ContractState) -> ICubeTokenDispatcher {
            let world = self.world(@DEFAULT_NS());
            let cube_token_address = world.dns_address(@"cube_token")
                .expect('CubeToken not found in DNS');
            ICubeTokenDispatcher { contract_address: cube_token_address }
        }

        /// Get the QuestSystem contract dispatcher via world DNS
        /// Returns Option to gracefully handle missing quest_system (during migration)
        fn get_quest_system_dispatcher(self: @ContractState) -> Option<IQuestSystemDispatcher> {
            let world = self.world(@DEFAULT_NS());
            match world.dns_address(@"quest_system") {
                Option::Some(address) => Option::Some(
                    IQuestSystemDispatcher { contract_address: address },
                ),
                Option::None => Option::None,
            }
        }

        /// Track quest progress for a player (no-op if quest system not deployed)
        fn track_quest_progress(
            self: @ContractState, player: ContractAddress, task_id: felt252, count: u32,
        ) {
            if let Option::Some(quest_system) = self.get_quest_system_dispatcher() {
                quest_system.progress(player, task_id, count);
            }
        }

        /// Check if level is complete and handle the completion flow.
        /// Returns true if the level was completed.
        fn check_and_complete_level(
            ref self: ContractState,
            ref world: WorldStorage,
            ref game: Game,
            game_id: u64,
            base_seed: felt252,
            settings: GameSettings,
        ) -> bool {
            if !game.is_level_complete(base_seed, settings) {
                return false;
            }

            // Capture stats BEFORE completing level (they get reset)
            let pre_complete_data = game.get_run_data();
            let completed_level = pre_complete_data.current_level;
            let final_score = pre_complete_data.level_score;
            let final_moves = pre_complete_data.level_moves;
            let pre_total_score = pre_complete_data.total_score;

            let player = get_caller_address();

            let (cubes, bonuses, is_victory) = game.complete_level(base_seed, settings);
            let bonuses_earned = self.award_level_bonuses(ref world, ref game, base_seed, player, bonuses);

            // Emit level completed with pre-reset stats
            world
                .emit_event(
                    @LevelCompleted {
                        game_id,
                        player,
                        level: completed_level,
                        cubes,
                        moves_used: final_moves.into(),
                        score: final_score.into(),
                        total_score: pre_total_score,
                        bonuses_earned,
                    },
                );

            // Check if this is a victory (level 50 completed)
            if is_victory {
                // End the game with victory state
                game.over = true;
                
                let final_run_data = game.get_run_data();
                
                // Emit RunCompleted event (victory!)
                world
                    .emit_event(
                        @RunCompleted {
                            game_id,
                            player,
                            final_score: final_run_data.total_score,
                            total_cubes: final_run_data.total_cubes,
                            started_at: game.started_at,
                            completed_at: get_block_timestamp(),
                        },
                    );
                
                // Mint earned cubes to player (same as game over flow)
                let cubes_to_mint: u256 = final_run_data.total_cubes.into();
                if cubes_to_mint > 0 {
                    let cube_token = self.get_cube_token_dispatcher();
                    cube_token.mint(player, cubes_to_mint);
                }
                
                return true;
            }

            // Normal flow: generate next level config and write to model
            let updated_run_data = game.get_run_data();
            let next_level_config = LevelGeneratorTrait::generate(
                base_seed, updated_run_data.current_level, settings,
            );
            
            // Write next level config to GameLevel model (single source of truth for client)
            let game_level = GameLevelTrait::from_level_config(game_id, next_level_config);
            world.write_model(@game_level);

            // Emit level started event
            world
                .emit_event(
                    @LevelStarted {
                        game_id,
                        player,
                        level: updated_run_data.current_level,
                        points_required: next_level_config.points_required,
                        max_moves: next_level_config.max_moves,
                        constraint_type: next_level_config.constraint.constraint_type,
                        constraint_value: next_level_config.constraint.value,
                        constraint_required: next_level_config.constraint.required_count,
                    },
                );

            true
        }
    }
}
