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
pub const VERSION: felt252 = 'v1.2.0';

// Tournament / Namespace
pub fn DEFAULT_NS() -> ByteArray {
    "zkube_jc_sepolia_v1"
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

// DAILY CHALLENGE
pub mod DAILY_CHALLENGE {
    /// Daily challenge settings IDs range: 100-109
    pub const MIN_SETTINGS_ID: u32 = 100;
    pub const MAX_SETTINGS_ID: u32 = 109;

    /// Check if a settings_id is a daily challenge preset
    pub fn is_daily_challenge_settings(settings_id: u32) -> bool {
        settings_id >= MIN_SETTINGS_ID && settings_id <= MAX_SETTINGS_ID
    }
}

// SETTINGS
pub mod DEFAULT_SETTINGS {
    use starknet::ContractAddress;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::types::difficulty::Difficulty;

    /// The official default settings ID used for cube minting, quests, and leaderboards
    pub const DEFAULT_SETTINGS_ID: u32 = 0;

    /// Check if a settings_id is the official default settings
    /// Only games using default settings can mint cubes and track quest progress
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
            name: 'Default',
            description: "The official zKube settings - progressive difficulty with cube rewards and quest tracking.",
            created_by: creator_address,
            created_at: current_timestamp,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::DAILY_CHALLENGE;
    use super::DEFAULT_SETTINGS;

    #[test]
    fn test_is_daily_challenge_settings() {
        // Valid range: 100-109
        assert!(DAILY_CHALLENGE::is_daily_challenge_settings(100), "100 is daily");
        assert!(DAILY_CHALLENGE::is_daily_challenge_settings(105), "105 is daily");
        assert!(DAILY_CHALLENGE::is_daily_challenge_settings(109), "109 is daily");
    }

    #[test]
    fn test_not_daily_challenge_settings() {
        assert!(!DAILY_CHALLENGE::is_daily_challenge_settings(0), "0 is not daily");
        assert!(!DAILY_CHALLENGE::is_daily_challenge_settings(1), "1 is not daily");
        assert!(!DAILY_CHALLENGE::is_daily_challenge_settings(99), "99 is not daily");
        assert!(!DAILY_CHALLENGE::is_daily_challenge_settings(110), "110 is not daily");
    }

    #[test]
    fn test_is_default_settings() {
        assert!(DEFAULT_SETTINGS::is_default_settings(0), "0 is default");
        assert!(!DEFAULT_SETTINGS::is_default_settings(1), "1 is not default");
        assert!(!DEFAULT_SETTINGS::is_default_settings(100), "100 is not default");
    }
}
