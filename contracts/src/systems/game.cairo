use zkube::types::bonus::Bonus;

#[starknet::interface]
trait IGameSystem<T> {
    /// Create a new game with level system
    fn create(ref self: T, game_id: u64);
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
    /// Returns: (level, level_score, level_moves, combo, max_combo, hammer, wave, totem, total_stars, over)
    fn get_game_data(
        self: @T, game_id: u64,
    ) -> (u8, u8, u8, u8, u8, u8, u8, u8, u16, bool);
}

#[dojo::contract]
mod game_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::game::GameSeed;
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::level::{LevelGenerator, LevelGeneratorTrait};
    use zkube::types::bonus::Bonus;
    use zkube::events::{StartGame, UseBonus, LevelStarted, LevelCompleted, RunEnded};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};

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

    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        denshokan_address: ContractAddress,
        renderer_address: Option<ContractAddress>,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let (config_system_address, _) = world.dns(@"config_system").unwrap();

        self
            .minigame
            .initializer(
                creator_address,
                "zKube",
                "zKube is an onchain puzzle roguelike with 100+ levels, constraints, and star ratings.",
                "zKorp",
                "zKorp",
                "Puzzle",
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                Option::Some("#3c2fba"),
                Option::None,
                renderer_address,
                Option::Some(config_system_address),
                Option::None,
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

            // Create game with level system
            let game = GameTrait::new(game_id, random.seed, timestamp);
            world.write_model(@game);

            // Store the seed separately
            let game_seed = GameSeed { game_id, seed: random.seed };
            world.write_model(@game_seed);

            // Initialize or update player meta
            let player = get_caller_address();
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            player_meta.increment_runs();
            world.write_model(@player_meta);

            post_action(token_address, game_id);

            // Emit events
            world
                .emit_event(
                    @StartGame { player, timestamp, game_id, },
                );

            // Emit level 1 started
            let level_config = LevelGeneratorTrait::generate(random.seed, 1);
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

            let base_seed: GameSeed = world.read_model(game_id);

            // Make the move
            let _lines_cleared = game.make_move(base_seed.seed, row_index, start_index, final_index);

            // Check for level completion
            if game.is_level_complete(base_seed.seed) {
                let (stars, bonuses) = game.complete_level(base_seed.seed);

                // Award bonuses
                if bonuses > 0 {
                    game.award_bonuses(base_seed.seed, bonuses);
                }

                let player = get_caller_address();
                let run_data = game.get_run_data();
                let completed_level = run_data.current_level - 1; // We already advanced

                // Emit level completed
                world
                    .emit_event(
                        @LevelCompleted {
                            game_id,
                            player,
                            level: completed_level,
                            stars,
                            moves_used: run_data.level_moves.into(), // This is 0 since we reset
                            score: run_data.level_score.into(), // This is 0 since we reset
                            bonuses_earned: bonuses,
                        },
                    );

                // Emit next level started
                let next_level_config = LevelGeneratorTrait::generate(
                    base_seed.seed, run_data.current_level,
                );
                world
                    .emit_event(
                        @LevelStarted {
                            game_id,
                            player,
                            level: run_data.current_level,
                            points_required: next_level_config.points_required,
                            max_moves: next_level_config.max_moves,
                            constraint_type: next_level_config.constraint.constraint_type,
                            constraint_value: next_level_config.constraint.value,
                            constraint_required: next_level_config.constraint.required_count,
                        },
                    );
            } else if game.is_level_failed(base_seed.seed) || game.over {
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
            game.apply_bonus(base_seed.seed, bonus, row_index, line_index);

            // Check for level completion after bonus
            if game.is_level_complete(base_seed.seed) {
                let (stars, bonuses) = game.complete_level(base_seed.seed);

                if bonuses > 0 {
                    game.award_bonuses(base_seed.seed, bonuses);
                }

                let player = get_caller_address();
                let run_data = game.get_run_data();
                let completed_level = run_data.current_level - 1;

                world
                    .emit_event(
                        @LevelCompleted {
                            game_id,
                            player,
                            level: completed_level,
                            stars,
                            moves_used: 0,
                            score: 0,
                            bonuses_earned: bonuses,
                        },
                    );

                let next_level_config = LevelGeneratorTrait::generate(
                    base_seed.seed, run_data.current_level,
                );
                world
                    .emit_event(
                        @LevelStarted {
                            game_id,
                            player,
                            level: run_data.current_level,
                            points_required: next_level_config.points_required,
                            max_moves: next_level_config.max_moves,
                            constraint_type: next_level_config.constraint.constraint_type,
                            constraint_value: next_level_config.constraint.value,
                            constraint_required: next_level_config.constraint.required_count,
                        },
                    );
            }

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
                run_data.total_stars,
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

        fn handle_game_over(ref self: ContractState, ref world: WorldStorage, game: Game) {
            let player = get_caller_address();
            let run_data = game.get_run_data();

            // Update player meta with best level
            let mut player_meta: PlayerMeta = world.read_model(player);
            player_meta.update_best_level(run_data.current_level);
            player_meta.add_stars(run_data.total_stars);
            world.write_model(@player_meta);

            // Emit run ended event
            world
                .emit_event(
                    @RunEnded {
                        game_id: game.game_id,
                        player,
                        final_level: run_data.current_level,
                        final_score: run_data.level_score.into(),
                        total_stars: run_data.total_stars,
                        started_at: game.started_at,
                        ended_at: get_block_timestamp(),
                    },
                );
        }
    }
}
