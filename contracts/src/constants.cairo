use starknet::{ContractAddress, contract_address_const};

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

// MULTISIG ADDRESS
pub fn ZKUBE_MULTISIG() -> ContractAddress {
    //
    //
    //(contract_address_const::<0x0589d37adc1e5cf9ef58da510ee904aa9428d6e9a1c0d5c822392664d063796b>())
    contract_address_const::<0x6daf2a924fab727ae5409f0743de4869850f988b6f8545268016ad1107fd2cd>()
}

// Tournament
pub fn DEFAULT_NS() -> ByteArray {
    "zkube_budo_v1_1_0"
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
    use zkube::constants::ZKUBE_MULTISIG;
    use zkube::types::difficulty::Difficulty;
    use zkube::models::config::{GameSettings, GameSettingsMetadata};
    const difficulty: Difficulty = Difficulty::Expert;

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY() -> @GameSettings {
        @GameSettings { settings_id: 0, difficulty: difficulty.into(), }
    }

    pub fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_METADATA(
        current_timestamp: u64
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 0,
            name: 'Fixed Difficulty',
            description: "Difficulty is fixed at the start of the game",
            created_by: ZKUBE_MULTISIG(),
            created_at: current_timestamp,
        }
    }

    pub fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY() -> @GameSettings {
        @GameSettings { settings_id: 1, difficulty: Difficulty::Increasing.into(), }
    }

    pub fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
        current_timestamp: u64
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 1,
            name: 'Increasing Difficulty',
            description: "Difficulty increases as the game progresses",
            created_by: ZKUBE_MULTISIG(),
            created_at: current_timestamp,
        }
    }
}
