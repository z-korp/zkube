use zkube::types::bonus::Bonus;

#[starknet::interface]
trait IGameSystem<T> {
    fn create(ref self: T, game_id: u64);
    fn surrender(ref self: T, game_id: u64);
    fn move(ref self: T, game_id: u64, row_index: u8, start_index: u8, final_index: u8);
    fn apply_bonus(ref self: T, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8);
    fn get_player_name(self: @T, game_id: u64) -> felt252;
    fn get_score(self: @T, game_id: u64) -> u16;
    fn get_game_data(self: @T, game_id: u64) -> (u16, u16, u8, u8, u8, u8, u16, bool);
}

#[dojo::contract]
mod game_system {
    use zkube::constants::{DEFAULT_NS, SCORE_MODEL, SCORE_ATTRIBUTE, SETTINGS_MODEL};
    use zkube::models::config::{GameSettings, GameSettingsTrait};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::game::GameSeed;
    use zkube::types::difficulty::{Difficulty, IIncreasingDifficultyUtilsTrait};
    use zkube::helpers::config::ConfigUtilsImpl;
    use zkube::helpers::random::RandomImpl;
    use zkube::types::bonus::Bonus;
    use zkube::helpers::renderer::create_metadata;
    use zkube::events::{StartGame, UseBonus};
    use zkube::systems::achievement::{
        IAchievementSystemDispatcher, IAchievementSystemDispatcherTrait
    };

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};
    use starknet::storage::{StoragePointerReadAccess};

    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc721::interface::{IERC721Metadata};
    use openzeppelin_token::erc721::{ERC721Component, ERC721HooksEmptyImpl};

    use tournaments::components::game::game_component;
    use tournaments::components::interfaces::{IGameDetails, ISettings};
    use tournaments::components::libs::lifecycle::{
        LifecycleAssertionsImpl, LifecycleAssertionsTrait
    };
    use tournaments::components::models::game::{TokenMetadata};

    component!(path: game_component, storage: game, event: GameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: ERC721Component, storage: erc721, event: ERC721Event);

    #[abi(embed_v0)]
    impl GameImpl = game_component::GameImpl<ContractState>;
    impl GameInternalImpl = game_component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl ERC721Impl = ERC721Component::ERC721Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721CamelOnlyImpl = ERC721Component::ERC721CamelOnlyImpl<ContractState>;
    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        game: game_component::Storage,
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        GameEvent: game_component::Event,
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    fn dojo_init(ref self: ContractState, creator_address: ContractAddress) {
        self.erc721.initializer("zKube", "ZKUBE", "app.zkube.xyz");
        self
            .game
            .initializer(
                creator_address,
                'zKube',
                "zKube is an engaging puzzle game that puts players' strategic thinking to the test. Set within a dynamic grid, the objective is simple: manipulate blocks to form solid lines and earn points.",
                'zKorp',
                'zKorp',
                'Strategy',
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                DEFAULT_NS(),
                SCORE_MODEL(),
                SCORE_ATTRIBUTE(),
                SETTINGS_MODEL(),
            );
    }

    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn setting_exists(self: @ContractState, settings_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings.exists()
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsImpl of IGameDetails<ContractState> {
        fn score(self: @ContractState, game_id: u64) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.score.into()
        }
    }

    #[abi(embed_v0)]
    impl GameSystemImpl of super::IGameSystem<ContractState> {
        fn create(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(game_id);
            self.validate_start_conditions(game_id, @token_metadata);

            let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);

            let difficulty: Difficulty = if game_settings.difficulty == Difficulty::Increasing {
                IIncreasingDifficultyUtilsTrait::get_difficulty_from_moves(0)
            } else {
                game_settings.difficulty
            };

            let random = RandomImpl::new_vrf();
            let mut game = GameTrait::new(game_id, random.seed, difficulty);
            world.write_model(@game);

            // Store the seed separately to save gas
            let game_seed = GameSeed { game_id, seed: random.seed };
            world.write_model(@game_seed);

            game.update_metadata(world);

            world
                .emit_event(
                    @StartGame {
                        player: get_caller_address(), timestamp: get_block_timestamp(), game_id,
                    }
                );
        }

        fn surrender(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(game_id);
            token_metadata.lifecycle.assert_is_playable(game_id, get_block_timestamp());

            let mut game: Game = world.read_model(game_id);
            game.assert_owner(world);
            game.assert_not_over();

            game.over = true;
            world.write_model(@game);

            self.handle_game_over(game);

            game.update_metadata(world);
        }

        fn move(
            ref self: ContractState, game_id: u64, row_index: u8, start_index: u8, final_index: u8,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(game_id);
            token_metadata.lifecycle.assert_is_playable(game_id, get_block_timestamp());

            let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);

            let mut game: Game = world.read_model(game_id);
            game.assert_owner(world);
            game.assert_not_over();

            let difficulty: Difficulty = if game_settings.difficulty == Difficulty::Increasing {
                IIncreasingDifficultyUtilsTrait::get_difficulty_from_moves(game.moves)
            } else {
                game_settings.difficulty
            };

            let base_seed: GameSeed = world.read_model(game_id);
            game.move(difficulty, base_seed.seed, row_index, start_index, final_index);

            world.write_model(@game);

            if game.over {
                self.handle_game_over(game);
            }

            game.update_metadata(world);
        }

        fn apply_bonus(
            ref self: ContractState, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_metadata: TokenMetadata = world.read_model(game_id);
            token_metadata.lifecycle.assert_is_playable(game_id, starknet::get_block_timestamp());

            let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);

            let mut game: Game = world.read_model(game_id);
            game.assert_owner(world);
            game.assert_not_over();
            game.assert_is_available(bonus);

            let difficulty: Difficulty = if game_settings.difficulty == Difficulty::Increasing {
                IIncreasingDifficultyUtilsTrait::get_difficulty_from_moves(game.moves)
            } else {
                game_settings.difficulty
            };

            let base_seed: GameSeed = world.read_model(game_id);
            game.apply_bonus(difficulty, base_seed.seed, bonus, row_index, line_index);

            world.write_model(@game);

            game.update_metadata(world);

            world
                .emit_event(
                    @UseBonus {
                        player: starknet::get_caller_address(),
                        timestamp: get_block_timestamp(),
                        game_id,
                        bonus,
                    }
                );
        }

        fn get_player_name(self: @ContractState, game_id: u64) -> felt252 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let token_metadata: TokenMetadata = world.read_model(game_id);
            token_metadata.player_name
        }

        fn get_score(self: @ContractState, game_id: u64) -> u16 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.score
        }

        fn get_game_data(
            self: @ContractState, game_id: u64
        ) -> (u16, u16, u8, u8, u8, u8, u16, bool) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            (
                game.moves,
                game.combo_counter,
                game.max_combo,
                game.hammer_bonus,
                game.wave_bonus,
                game.totem_bonus,
                game.score,
                game.over
            )
        }
    }

    #[abi(embed_v0)]
    impl ERC721Metadata of IERC721Metadata<ContractState> {
        /// Returns the NFT name.
        fn name(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_name.read()
        }

        /// Returns the NFT symbol.
        fn symbol(self: @ContractState) -> ByteArray {
            self.erc721.ERC721_symbol.read()
        }

        /// Returns the Uniform Resource Identifier (URI) for the `token_id` token.
        /// If the URI is not set, the return value will be an empty ByteArray.
        ///
        /// Requirements:
        ///
        /// - `token_id` exists.
        fn token_uri(self: @ContractState, token_id: u256) -> ByteArray {
            self.erc721._require_owned(token_id);

            let token_id_u64 = token_id.try_into().unwrap();

            let player_name = self.get_player_name(token_id_u64);
            let (
                moves, combo_counter, max_combo, hammer_bonus, wave_bonus, totem_bonus, score, over
            ) =
                self
                .get_game_data(token_id_u64);

            create_metadata(
                token_id_u64,
                player_name,
                over,
                score,
                moves,
                combo_counter,
                max_combo,
                hammer_bonus,
                wave_bonus,
                totem_bonus
            )
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        #[inline(always)]
        fn validate_start_conditions(
            self: @ContractState, token_id: u64, token_metadata: @TokenMetadata
        ) {
            self.assert_token_ownership(token_id);
            self.assert_game_not_started(token_id);
            token_metadata.lifecycle.assert_is_playable(token_id, starknet::get_block_timestamp());
        }

        #[inline(always)]
        fn assert_token_ownership(self: @ContractState, token_id: u64) {
            let token_owner = ERC721Impl::owner_of(self, token_id.into());
            assert!(
                token_owner == starknet::get_caller_address(),
                "Caller is not owner of token {}",
                token_id,
            );
        }

        #[inline(always)]
        fn assert_game_not_started(self: @ContractState, game_id: u64) {
            let game: Game = self.world(@DEFAULT_NS()).read_model(game_id);
            assert!(game.blocks == 0, "Game {} has already started", game_id);
        }

        fn handle_game_over(ref self: ContractState, game: Game) {
            let world = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let (contract_address, _) = world.dns(@"achievement_system").unwrap();
            let achievement_system = IAchievementSystemDispatcher { contract_address };
            achievement_system.update_progress_when_game_over(game, caller);
        }
    }
}
