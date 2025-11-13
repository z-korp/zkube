use zkube::models::config::{GameSettings, GameSettingsMetadata};
use zkube::types::difficulty::Difficulty;

#[starknet::interface]
pub trait ISettingsSystems<T> {
    fn add_settings(
        ref self: T,
        name: felt252,
        description: ByteArray,
        difficulty: Difficulty,
    ) -> u32;
    fn setting_details(self: @T, settings_id: u32) -> GameSettings;
    fn game_settings(self: @T, game_id: u64) -> GameSettings;
    fn settings_count(self: @T) -> u32;
    fn sync_default_settings(ref self: T);
}

#[dojo::contract]
mod settings_system {
    use super::ISettingsSystems;
    use core::clone::Clone;
    use core::traits::Into;
    use core::option::Option;

    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use game_components_minigame::extensions::settings::interface::{
        IMinigameSettings,
        IMinigameSettingsDetails,
    };
    use game_components_minigame::extensions::settings::settings::SettingsComponent;
    use game_components_minigame::extensions::settings::structs::{GameSetting, GameSettingDetails};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};

    use openzeppelin_introspection::src5::SRC5Component;

    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    use zkube::constants::DEFAULT_NS;
    use zkube::constants::DEFAULT_SETTINGS::{
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD,
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA,
    };
    use zkube::helpers::encoding::U256BytesUsedTraitImpl;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        settings_counter: u32,
        defaults_synced: bool,
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        SettingsEvent: SettingsComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        GameSettingsCreated: GameSettingsCreated,
    }

    #[derive(Drop, starknet::Event)]
    struct GameSettingsCreated {
        settings_id: u32,
        name: felt252,
        difficulty: Difficulty,
        created_by: ContractAddress,
    }

    fn dojo_init(ref self: ContractState) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        self.settings.initializer();

        let creator = get_caller_address();
        let timestamp = get_block_timestamp();

        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA(
                    timestamp,
                    creator,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
                    timestamp,
                    creator,
                ),
            );

        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD());
        world
            .write_model(
                GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA(
                    timestamp,
                    creator,
                ),
            );

        // Default settings cover ids [0, 2], so the next created id should start at 3.
        self.settings_counter.write(2);
        self.defaults_synced.write(false);
    }

    #[abi(embed_v0)]
    impl SettingsSystemImpl of ISettingsSystems<ContractState> {
        fn add_settings(
            ref self: ContractState,
            name: felt252,
            description: ByteArray,
            difficulty: Difficulty,
        ) -> u32 {
            assert(difficulty != Difficulty::None, 'Invalid difficulty');

            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let mut counter = self.settings_counter.read();
            counter += 1;
            self.settings_counter.write(counter);

            let component_description = description.clone();
            let game_settings = GameSettings { settings_id: counter, difficulty };
            let metadata = GameSettingsMetadata {
                settings_id: counter,
                name,
                description,
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
            };

            world.write_model(@game_settings);
            world.write_model(@metadata);

            let (game_system_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_system_address };
            let minigame_token_address = minigame_dispatcher.token_address();

            let component_name = felt_to_bytearray(name);
            let settings_payload = generate_settings_array(game_settings);
            self
                .settings
                .create_settings(
                    game_system_address,
                    counter,
                    component_name,
                    component_description,
                    settings_payload,
                    minigame_token_address,
                );

            self
                .emit(
                    GameSettingsCreated {
                        settings_id: counter,
                        name,
                        difficulty,
                        created_by: metadata.created_by,
                    },
                );

            counter
        }

        fn setting_details(self: @ContractState, settings_id: u32) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn game_settings(self: @ContractState, game_id: u64) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let (game_system_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_system_address };
            let minigame_token_address = minigame_dispatcher.token_address();
            let settings_id = self.settings.get_settings_id(game_id, minigame_token_address);
            world.read_model(settings_id)
        }

        fn settings_count(self: @ContractState) -> u32 {
            self.settings_counter.read()
        }

        fn sync_default_settings(ref self: ContractState) {
            if self.defaults_synced.read() {
                return;
            }

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let (game_system_address, _) = match world.dns(@"game_system") {
            Option::Some(value) => value,
            Option::None(()) => panic!("Settings: game_system DNS missing"),
        };

            let minigame_dispatcher = IMinigameDispatcher { contract_address: game_system_address };
            let minigame_token_address = minigame_dispatcher.token_address();

            self.register_existing_setting(world, 0, game_system_address, minigame_token_address);
            self.register_existing_setting(world, 1, game_system_address, minigame_token_address);
            self.register_existing_setting(world, 2, game_system_address, minigame_token_address);

            self.defaults_synced.write(true);
        }
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

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn register_existing_setting(
            ref self: ContractState,
            mut world: WorldStorage,
            settings_id: u32,
            game_address: ContractAddress,
            minigame_token_address: ContractAddress,
        ) {
            let game_settings = world.read_model(settings_id);
            if !game_settings.exists() {
                return;
            }
            let game_settings = world.read_model(settings_id);

            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            let component_name = felt_to_bytearray(metadata.name);
            let settings_payload = generate_settings_array(game_settings);

            self
                .settings
                .create_settings(
                    game_address,
                    settings_id,
                    component_name,
                    metadata.description.clone(),
                    settings_payload,
                    minigame_token_address,
                );
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
        array![
            GameSetting {
                name: "Difficulty",
                value: difficulty_value,
            },
        ]
            .span()
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
