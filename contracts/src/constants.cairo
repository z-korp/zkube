// Game
pub const DEFAULT_GRID_WIDTH: u8 = 8;
pub const DEFAULT_GRID_HEIGHT: u8 = 10;

// Packing
pub const BLOCK_SIZE: u8 = 8;
pub const BLOCK_BIT_COUNT: u8 = 3;
pub const ROW_SIZE: u32 = 16777216; // 2^24 - used for row shifting
pub const ROW_BIT_COUNT: u8 = 24;
pub const LINE_FULL_BOUND: u32 =
    2097152; // 2^21 - minimum value for a full row (leftmost block != 0)
pub const CARDS_IN_DECK: u32 = 14;
pub const TWO_POW_1: u128 = 0x2;
pub const MASK_1: u128 = 0x1;
pub const MASK_7: u32 = 0x7;

// Version
pub const VERSION: felt252 = 'v1.3.0';

// Tournament / Namespace
pub fn DEFAULT_NS() -> ByteArray {
    "zkube_v2_1_0"
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
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;

    /// The official default settings ID used for standard map gameplay and leaderboards
    pub const DEFAULT_SETTINGS_ID: u32 = 0;

    /// Check if a settings_id is the official default settings
    /// Only games using default settings count for standard progression
    pub fn is_default_settings(settings_id: u32) -> bool {
        settings_id == DEFAULT_SETTINGS_ID
    }

    pub fn GET_DEFAULT_SETTINGS() -> @GameSettings {
        @GameSettingsTrait::new_with_defaults(DEFAULT_SETTINGS_ID, Difficulty::Increasing)
    }

    pub fn GET_DEFAULT_SETTINGS_METADATA(
        current_timestamp: u64, creator_address: ContractAddress,
    ) -> @GameSettingsMetadata {
        @GameSettingsMetadata {
            settings_id: DEFAULT_SETTINGS_ID,
            name: 'Polynesian',
            description: "The free Polynesian map - progressive difficulty for core progression.",
            created_by: creator_address,
            created_at: current_timestamp,
            theme_id: 1,
            is_free: true,
            enabled: true,
            price: 0,
            payment_token: core::num::traits::Zero::zero(),
            star_cost: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::DEFAULT_SETTINGS;

    #[test]
    fn test_is_default_settings() {
        assert!(DEFAULT_SETTINGS::is_default_settings(0), "0 is default");
        assert!(!DEFAULT_SETTINGS::is_default_settings(1), "1 is not default");
        assert!(!DEFAULT_SETTINGS::is_default_settings(100), "100 is not default");
    }
}
