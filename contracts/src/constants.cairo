use starknet::ContractAddress;

// Game
const DEFAULT_GRID_WIDTH: u8 = 8;
const DEFAULT_GRID_HEIGHT: u8 = 10;

// Packing
const BLOCK_SIZE: u8 = 8;
const BLOCK_BIT_COUNT: u8 = 3;
const ROW_SIZE: u32 = 16777216;
const ROW_BIT_COUNT: u8 = 24;
const CARDS_IN_DECK: u32 = 14;
const TWO_POW_1: u128 = 0x2;
const MASK_1: u128 = 0x1;
const MASK_7: u32 = 0x7;

// MULTISIG ADDRESS
const ZKUBE_MULTISIG: felt252 =
    0x0589d37adc1e5cf9ef58da510ee904aa9428d6e9a1c0d5c822392664d063796b; // zKube Admin (alta bra)

// Tournament
fn DEFAULT_NS() -> ByteArray {
    "zkube_budo_v1_0_1"
}

fn SCORE_MODEL() -> ByteArray {
    "Game"
}

fn SCORE_ATTRIBUTE() -> ByteArray {
    "score"
}

fn SETTINGS_MODEL() -> ByteArray {
    "GameSettings"
}

// SETTINGS
pub mod DEFAULT_SETTINGS {
    use zkube::constants::ZKUBE_MULTISIG;
    use zkube::types::difficulty::Difficulty;
    use zkube::models::config::{GameSettings, GameSettingsMetadata};
    use starknet::{ContractAddress, contract_address_const};
    const difficulty: Difficulty = Difficulty::Expert;

    fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY() -> @GameSettings {
        @GameSettings { settings_id: 0, difficulty: difficulty.into(), }
    }

    fn GET_DEFAULT_SETTINGS_FIXED_DIFFICULTY_METADATA(
        current_timestamp: u64
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 0,
            name: 'Fixed Difficulty',
            description: "Difficulty is fixed at the start of the game",
            created_by: contract_address_const::<ZKUBE_MULTISIG>(),
            created_at: current_timestamp,
        }
    }

    fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY() -> @GameSettings {
        @GameSettings { settings_id: 1, difficulty: Difficulty::Increasing.into(), }
    }

    fn GET_DEFAULT_SETTINGS_INCREASING_DIFFICULTY_METADATA(
        current_timestamp: u64
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: 1,
            name: 'Increasing Difficulty',
            description: "Difficulty increases as the game progresses",
            created_by: contract_address_const::<ZKUBE_MULTISIG>(),
            created_at: current_timestamp,
        }
    }
}
