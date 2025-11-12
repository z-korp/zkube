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
    use zkube::constants::DEFAULT_NS;
    use zkube::models::config::{GameSettings, GameSettingsTrait};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::game::GameSeed;
    use zkube::types::difficulty::{Difficulty, IIncreasingDifficultyUtilsTrait};
    use zkube::helpers::config::ConfigUtilsImpl;
    use zkube::helpers::random::RandomImpl;
    use zkube::types::bonus::Bonus;
    use zkube::events::{StartGame, UseBonus};
    use zkube::systems::achievement::{
        IAchievementSystemDispatcher, IAchievementSystemDispatcherTrait
    };

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use dojo::event::EventStorage;

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};
    use starknet::storage::{StoragePointerReadAccess};

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
                "zKube is an onchain puzzle game mixing block-stacking strategy with VRF-powered randomness.",
                "zKorp",
                "zKorp",
                "Puzzle",
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                Option::None,
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
            game.score.into()
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

            post_action(token_address, game_id);

            world
                .emit_event(
                    @StartGame {
                        player: get_caller_address(), timestamp: get_block_timestamp(), game_id,
                    }
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
                game_id
            );

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
            game.assert_not_over();

            game.over = true;
            world.write_model(@game);

            self.handle_game_over(game);

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
                game_id
            );

            let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
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

            post_action(token_address, game_id);
        }

        fn apply_bonus(
            ref self: ContractState, game_id: u64, bonus: Bonus, row_index: u8, line_index: u8
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let token_address = self.token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert!(
                token_metadata.lifecycle.is_playable(starknet::get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id
            );

            let game_settings: GameSettings = ConfigUtilsImpl::get_game_settings(world, game_id);

            let mut game: Game = world.read_model(game_id);
            assert_token_ownership(token_address, game_id);
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
            post_action(token_address, game_id);

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
            let token_address = self.token_address();
            get_token_player_name(token_address, game_id)
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

    #[generate_trait]
pub    impl InternalImpl of InternalTrait {
    

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
                token_id
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
