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
    use dojo::world::WorldStorage;

    use zkube::models::config::{GameSettingsMetadata, GameSettings, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::constants::{DEFAULT_NS};
    use zkube::constants::DEFAULT_SETTINGS::{
        GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY, GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_METADATA,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY,
        GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA
    };

    #[storage]
    struct Storage {
        settings_counter: u32,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
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

        let current_timestamp = get_block_timestamp();
        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY());
        world.write_model(GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_METADATA(current_timestamp));

        world.write_model(GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY());
        world.write_model(GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(current_timestamp));
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
            let game_settings = GameSettings { settings_id, difficulty, };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description,
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
                    }
                );

            settings_id
        }

        fn get_game_settings(self: @ContractState, settings_id: u32) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn get_game_settings_metadata(
            self: @ContractState, settings_id: u32
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
}
