use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
use zkube::models::config::{GameSettingsMetadata, GameSettings, GameSettingsTrait};
use zkube::types::difficulty::Difficulty;
use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

#[starknet::interface]
trait IConfigSystems<T> {
    fn add_game_settings(
        ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty,
    ) -> u32;

    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn get_game_settings_metadata(self: @T, settings_id: u32) -> GameSettingsMetadata;
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}

#[dojo::contract]
mod config_systems {
    use super::IConfigSystems;
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use zkube::models::config::{GameSettingsMetadata, GameSettings, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;
    use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

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

    #[abi(embed_v0)]
    impl ConfigSystemsImpl of IConfigSystems<ContractState> {
        fn add_game_settings(
            ref self: ContractState, name: felt252, description: ByteArray, difficulty: Difficulty,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');

            // Get the world dispatcher
            let world = self.world();

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
            world.set_game_settings(game_settings);
            world.set_game_settings_metadata(metadata);

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
            let world = self.world();
            world.get_game_settings(settings_id)
        }

        fn get_game_settings_metadata(
            self: @ContractState, settings_id: u32
        ) -> GameSettingsMetadata {
            let world = self.world();
            world.get_game_settings_metadata(settings_id)
        }

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let world = self.world();
            let settings = world.get_game_settings(settings_id);
            settings.exists()
        }
    }
}
