use zkube::models::config::{GameSettingsMetadata, GameSettings};
use zkube::types::difficulty::Difficulty;

#[starknet::interface]
trait IConfigSystem<T> {
    fn add_game_settings(
        ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty,
    ) -> u32;

    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn get_game_settings_metadata(self: @T, settings_id: u32) -> GameSettingsMetadata;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}

#[dojo::contract]
mod config_system {
    use super::IConfigSystem;

    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use zkube::models::config::{GameSettingsMetadata, GameSettings, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::constants::{DEFAULT_NS};
    use zkube::constants::DEFAULT_SETTINGS::{
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA,
    };

    use zkube::helpers::encoding::U256BytesUsedTraitImpl;

    use game_components_minigame::extensions::settings::interface::{
        IMinigameSettings, IMinigameSettingsDetails,
    };
    use game_components_minigame::extensions::settings::settings::SettingsComponent;
    use game_components_minigame::extensions::settings::structs::{GameSetting, GameSettingDetails};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};

    use openzeppelin_introspection::src5::SRC5Component;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        settings_counter: u32,
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GameSettingsCreated: GameSettingsCreated,
        #[flat]
        SettingsEvent: SettingsComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct GameSettingsCreated {
        settings_id: u32,
        name: felt252,
        difficulty: Difficulty,
        created_by: ContractAddress,
    }

    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        self.settings.initializer();

        let current_timestamp = get_block_timestamp();
        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA(
                    current_timestamp, creator_address,
                ),
            );

        self.settings_counter.write(2);

        let (game_systems_address, _) = world.dns(@"game_system").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
        let minigame_token_address = minigame_dispatcher.token_address();

        self
            .settings
            .create_settings(
                game_systems_address,
                0,
                "Fixed Difficulty - Expert",
                "Difficulty is fixed at expert level throughout your gameplay session.",
                array![GameSetting { name: "Difficulty", value: "Expert" }].span(),
                minigame_token_address,
            );

        self
            .settings
            .create_settings(
                game_systems_address,
                1,
                "Progressive Difficulty",
                "Starts easy and gradually becomes more challenging as you progress through the game.",
                array![GameSetting { name: "Difficulty", value: "Progressive" }].span(),
                minigame_token_address,
            );

        self
            .settings
            .create_settings(
                game_systems_address,
                2,
                "Fixed Difficulty - Very Hard",
                "Difficulty is fixed at very hard level throughout your gameplay session.",
                array![GameSetting { name: "Difficulty", value: "Very Hard" }].span(),
                minigame_token_address,
            );
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings.exists()
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
        fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            let metadata: GameSettingsMetadata = world.read_model(settings_id);

            GameSettingDetails {
                name: felt_to_bytearray(metadata.name),
                description: metadata.description.clone(),
                settings: generate_settings_array(settings),
            }
        }
    }

    #[abi(embed_v0)]
    impl ConfigSystemImpl of IConfigSystem<ContractState> {
        fn add_game_settings(
            ref self: ContractState, name: felt252, description: ByteArray, difficulty: Difficulty,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');

            // Get the world dispatcher
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Increment settings counter
            let mut settings_id = self.settings_counter.read();
            settings_id += 1;
            self.settings_counter.write(settings_id);

            // Create the game settings
            let game_settings = GameSettings { settings_id, difficulty };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
            };

            // Save to world
            world.write_model(@game_settings);
            world.write_model(@metadata);

            // Emit event
            self
                .emit(
                    GameSettingsCreated {
                        settings_id, name, difficulty, created_by: get_caller_address(),
                    },
                );

            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher {
                contract_address: game_systems_address,
            };
            let minigame_token_address = minigame_dispatcher.token_address();

            self
                .settings
                .create_settings(
                    game_systems_address,
                    settings_id,
                    felt_to_bytearray(name),
                    description.clone(),
                    array![GameSetting { name: "Difficulty", value: difficulty_label(difficulty) }]
                        .span(),
                    minigame_token_address,
                );

            settings_id
        }

        fn get_game_settings(self: @ContractState, settings_id: u32) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn get_game_settings_metadata(
            self: @ContractState, settings_id: u32,
        ) -> GameSettingsMetadata {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings = world.read_model(settings_id);
            settings.exists()
        }
    }

    fn felt_to_bytearray(word: felt252) -> ByteArray {
        let mut bytes = Default::default();
        if word != 0 {
            bytes.append_word(word, U256BytesUsedTraitImpl::bytes_used(word.into()).into());
        }
        bytes
    }

    fn generate_settings_array(game_settings: GameSettings) -> Span<GameSetting> {
        let difficulty_value = difficulty_label(game_settings.difficulty);
        array![GameSetting { name: "Difficulty", value: difficulty_value }].span()
    }

    fn difficulty_label(difficulty: Difficulty) -> ByteArray {
        match difficulty {
            Difficulty::None => "Unspecified",
            Difficulty::Increasing => "Increasing",
            Difficulty::VeryEasy => "Very Easy",
            Difficulty::Easy => "Easy",
            Difficulty::Medium => "Medium",
            Difficulty::MediumHard => "Medium Hard",
            Difficulty::Hard => "Hard",
            Difficulty::VeryHard => "Very Hard",
            Difficulty::Expert => "Expert",
            Difficulty::Master => "Master",
        }
    }
}
