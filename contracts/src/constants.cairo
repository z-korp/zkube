// Game
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;

// Packing
pub const BLOCK_SIZE: u8 = 8;
pub const BLOCK_BIT_COUNT: u8 = 3;
pub const ROW_SIZE: u32 = 16777216;
pub const ROW_BIT_COUNT: u8 = 24;
pub const CARDS_IN_DECK: u32 = 14;
pub const TWO_POW_1: u128 = 0x2;
pub const MASK_1: u128 = 0x1;
pub const MASK_7: u32 = 0x7;

// Tournament
pub fn DEFAULT_NS() -> ByteArray {
    "zkube_budo_v1_1_2"
}

pub fn SCORE_MODEL() -> ByteArray {
    "Game"
}

pub fn SCORE_ATTRIBUTE() -> ByteArray {
    "score"
}

pub fn SETTINGS_MODEL() -> ByteArray {
    "GameSettings"
}

// SETTINGS
pub mod DEFAULT_SETTINGS {
    use starknet::ContractAddress;
    use zkube::types::difficulty::Difficulty;
    use zkube::models::config::{GameSettings, GameSettingsMetadata};

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT() -> @GameSettings {
        @GameSettings { settings_id: 0, difficulty: Difficulty::Expert.into(), }
    }

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_EXPERT_METADATA(
        current_timestamp: u64, creator_address: ContractAddress
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 0,
            name: 'Fixed Difficulty - Expert',
            description: "Difficulty is fixed at expert level throughout your gameplay session.",
            created_by: creator_address,
            created_at: current_timestamp,
        }
    }

    pub fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY() -> @GameSettings {
        @GameSettings { settings_id: 1, difficulty: Difficulty::Increasing.into(), }
    }

    pub fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
        current_timestamp: u64, creator_address: ContractAddress
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 1,
            name: 'Progressive Difficulty',
            description: "Starts easy and gradually becomes more challenging as you progress through the game",
            created_by: creator_address,
            created_at: current_timestamp,
        }
    }

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD() -> @GameSettings {
        @GameSettings { settings_id: 2, difficulty: Difficulty::VeryHard.into(), }
    }

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_VERY_HARD_METADATA(
        current_timestamp: u64, creator_address: ContractAddress
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 2,
            name: 'Fixed Difficulty - Very Hard',
            description: "Difficulty is fixed at very hard level throughout your gameplay session",
            created_by: creator_address,
            created_at: current_timestamp,
        }
    }
}
