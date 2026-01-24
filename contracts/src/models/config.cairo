use zkube::types::difficulty::Difficulty;
use starknet::ContractAddress;

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettingsMetadata {
    #[key]
    pub settings_id: u32,
    pub name: felt252,
    pub description: ByteArray,
    pub created_by: ContractAddress,
    pub created_at: u64,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    pub difficulty: u8, // Store as u8, use get_difficulty() to convert to Difficulty enum
}

#[generate_trait]
pub impl GameSettingsImpl of GameSettingsTrait {
    fn exists(self: GameSettings) -> bool {
        self.difficulty != 0
    }

    fn get_difficulty(self: GameSettings) -> Difficulty {
        self.difficulty.into()
    }
}
