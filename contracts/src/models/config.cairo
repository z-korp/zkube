use zkube::types::difficulty::Difficulty;
use starknet::ContractAddress;

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettingsMetadata {
    #[key]
    settings_id: u32,
    name: felt252,
    description: ByteArray,
    created_by: ContractAddress,
    created_at: u64,
}

#[derive(Introspect, Drop, Serde)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    settings_id: u32,
    difficulty: Difficulty,
}

#[generate_trait]
impl GameSettingsImpl of GameSettingsTrait {
    fn exists(self: GameSettings) -> bool {
        self.difficulty != Difficulty::None
    }
}
