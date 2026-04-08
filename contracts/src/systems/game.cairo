#[starknet::interface]
pub trait IGameSystem<T> {
    /// Create a new game
    /// @param game_id: NFT token ID for this game
    fn create(ref self: T, game_id: felt252, run_type: u8);
    /// Create a new game run
    /// @param game_id: NFT token ID for this game
    fn create_run(ref self: T, game_id: felt252, run_type: u8);
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
    use game_components_embeddable_game_standard::token::structs::TokenMetadata;
    use game_components_embeddable_game_standard::token::token::LifecycleTrait;
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::helpers::controller::Controller;
    use zkube::helpers::{game_creation, game_over};
    use zkube::models::daily::{DailyAttempt, DailyAttemptTrait};
    use zkube::models::game::{Game, GameAssert, GameTrait};
    use zkube::models::story::{
        ActiveStoryAttempt, ActiveStoryAttemptTrait, StoryAttempt, StoryAttemptTrait,
    };
    use zkube::systems::progress::{IProgressSystemDispatcher, IProgressSystemDispatcherTrait};
    use zkube::types::bonus::{Bonus, BonusTrait};
    use super::IGameSystem;

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
                match world.dns(@"renderer_systems") {
                    Option::Some((addr, _)) => addr,
                    Option::None => core::num::traits::Zero::zero(),
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
                    Option::None, // license
                    Option::None, // game_fee_bps
                );
        }

        self.vrf_address.write(vrf_address);
    }

    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: felt252) -> u64 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            game.get_level_score().into()
        }

        fn game_over(self: @ContractState, token_id: felt252) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            game.over
        }

        fn score_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<u64> {
            let mut scores = array![];
            let mut i: u32 = 0;
            loop {
                if i >= token_ids.len() {
                    break;
                }
                scores.append(self.score(*token_ids.at(i)));
                i += 1;
            }
            scores
        }

        fn game_over_batch(self: @ContractState, token_ids: Span<felt252>) -> Array<bool> {
            let mut statuses = array![];
            let mut i: u32 = 0;
            loop {
                if i >= token_ids.len() {
                    break;
                }
                statuses.append(self.game_over(*token_ids.at(i)));
                i += 1;
            }
            statuses
        }
    }

    #[abi(embed_v0)]
    impl GameSystemImpl of super::IGameSystem<ContractState> {
        fn create(ref self: ContractState, game_id: felt252, run_type: u8) {
            self.create_run(game_id, run_type);
        }

        fn create_run(ref self: ContractState, game_id: felt252, run_type: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let token_address = self.token_address();
            pre_action(token_address, game_id);

            let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
            let token_metadata: TokenMetadata = token_dispatcher.token_metadata(game_id);
            assert_token_ownership(token_address, game_id);
            InternalImpl::assert_game_not_started(@self, game_id);
            assert!(
                token_metadata.lifecycle.is_playable(get_block_timestamp()),
                "Game {} lifecycle is not playable",
                game_id,
            );

            let vrf_addr = self.vrf_address.read();
            game_creation::create_game(ref world, game_id, run_type, player, vrf_addr);

            post_action(token_address, game_id);
        }

        fn surrender(ref self: ContractState, game_id: felt252) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let mut effective_game_id = game_id;
            let active_story_attempt: ActiveStoryAttempt = world.read_model(player);
            if active_story_attempt.exists() {
                let active_story_game: Game = world.read_model(active_story_attempt.game_id);
                if active_story_game.is_non_zero() && !active_story_game.over {
                    effective_game_id = active_story_attempt.game_id;
                }
            }

            // Read StoryAttempt first; skip DailyAttempt when it's a story game.
            let story_attempt: StoryAttempt = world.read_model(effective_game_id);
            let is_story_attempt = story_attempt.exists();
            let (is_daily_game, daily_player) = if is_story_attempt {
                (false, Zero::zero())
            } else {
                let daily: DailyAttempt = world.read_model(effective_game_id);
                (daily.exists(), daily.player)
            };
            let is_non_token_game = is_story_attempt || is_daily_game;

            let token_address = self.token_address();
            let token_id_felt = effective_game_id;
            if !is_non_token_game {
                pre_action(token_address, token_id_felt);

                let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
                let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
                assert!(
                    token_metadata.lifecycle.is_playable(get_block_timestamp()),
                    "Game {} lifecycle is not playable",
                    effective_game_id,
                );
            }

            let mut game: Game = world.read_model(effective_game_id);
            if is_story_attempt {
                assert!(story_attempt.player == player, "not story owner");
            } else if is_daily_game {
                assert!(daily_player == player, "not daily owner");
            } else {
                assert_token_ownership(token_address, token_id_felt);
            }
            game.assert_not_over();

            game.over = true;
            world.write_model(@game);

            game_over::handle_game_over(ref world, game, player);

            if !is_non_token_game {
                post_action(token_address, token_id_felt);
            }
        }

        fn apply_bonus(ref self: ContractState, game_id: felt252, row_index: u8, block_index: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            // Read StoryAttempt first; skip DailyAttempt when it's a story game.
            let story_game: StoryAttempt = world.read_model(game_id);
            let is_story_game = story_game.exists();
            let (is_daily_game, daily_player) = if is_story_game {
                (false, Zero::zero())
            } else {
                let daily: DailyAttempt = world.read_model(game_id);
                (daily.exists(), daily.player)
            };
            let is_non_token_game = is_story_game || is_daily_game;

            let token_address = self.token_address();
            let token_id_felt = game_id;
            if !is_non_token_game {
                pre_action(token_address, token_id_felt);

                let token_dispatcher = IMinigameTokenDispatcher { contract_address: token_address };
                let token_metadata: TokenMetadata = token_dispatcher.token_metadata(token_id_felt);
                assert!(
                    token_metadata.lifecycle.is_playable(get_block_timestamp()),
                    "Game {} lifecycle is not playable",
                    game_id,
                );
            }

            let mut game: Game = world.read_model(game_id);
            if is_story_game {
                assert!(story_game.player == caller, "not story owner");
            } else if is_daily_game {
                assert!(daily_player == caller, "not daily owner");
            } else {
                assert_token_ownership(token_address, token_id_felt);
            }
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

            // Emit BonusUsed progress via progress_system
            match world.dns_address(@"progress_system") {
                Option::Some(progress_addr) => {
                    let progress = IProgressSystemDispatcher { contract_address: progress_addr };
                    let player_id: felt252 = caller.into();
                    progress.progress(player_id, Task::BonusUsed.identifier(), 1);
                },
                Option::None => {},
            }

            if !is_non_token_game {
                post_action(token_address, token_id_felt);
            }
        }

        fn get_player_name(self: @ContractState, game_id: felt252) -> felt252 {
            let token_address = self.token_address();
            get_token_player_name(token_address, game_id)
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
        #[inline(always)]
        fn assert_game_not_started(self: @ContractState, game_id: felt252) {
            let game: Game = self.world(@DEFAULT_NS()).read_model(game_id);
            assert!(game.blocks == 0, "Game {} has already started", game_id);
        }
    }
}
