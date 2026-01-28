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

/// Extended GameSettings with all configurable game parameters
/// Following the Death Mountain pattern for customizable game modes
#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct GameSettings {
    #[key]
    pub settings_id: u32,
    
    // === Difficulty ===
    pub difficulty: u8, // Difficulty mode (enum value)
    
    // === Level Scaling ===
    pub base_moves: u16,        // Moves at level 1 (default: 20)
    pub max_moves: u16,         // Moves at level 100 (default: 60)
    pub base_ratio_x100: u16,   // Points/move ratio at level 1 * 100 (default: 80 = 0.80)
    pub max_ratio_x100: u16,    // Points/move ratio at level 100 * 100 (default: 250 = 2.50)
    
    // === Cube Thresholds ===
    pub cube_3_percent: u8,     // 3 cubes if moves <= X% of max (default: 40)
    pub cube_2_percent: u8,     // 2 cubes if moves <= X% of max (default: 70)
    
    // === Consumable Costs ===
    pub hammer_cost: u8,        // Cost in cubes (default: 5)
    pub wave_cost: u8,          // Cost in cubes (default: 5)
    pub totem_cost: u8,         // Cost in cubes (default: 5)
    pub extra_moves_cost: u8,   // Cost in cubes (default: 10)
    
    // === Reward Multiplier ===
    pub cube_multiplier_x100: u16, // Cube reward multiplier * 100 (default: 100 = 1.0x)
}

/// Default values for GameSettings
pub mod GameSettingsDefaults {
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;
    pub const BASE_RATIO_X100: u16 = 80;   // 0.80
    pub const MAX_RATIO_X100: u16 = 250;   // 2.50
    pub const CUBE_3_PERCENT: u8 = 40;
    pub const CUBE_2_PERCENT: u8 = 70;
    pub const HAMMER_COST: u8 = 5;
    pub const WAVE_COST: u8 = 5;
    pub const TOTEM_COST: u8 = 5;
    pub const EXTRA_MOVES_COST: u8 = 10;
    pub const CUBE_MULTIPLIER_X100: u16 = 100; // 1.0x
}

#[generate_trait]
pub impl GameSettingsImpl of GameSettingsTrait {
    /// Check if settings exist (non-zero difficulty)
    fn exists(self: GameSettings) -> bool {
        self.difficulty != 0
    }

    /// Get difficulty as enum
    fn get_difficulty(self: GameSettings) -> Difficulty {
        self.difficulty.into()
    }
    
    /// Create default settings with a given difficulty
    fn new_with_defaults(settings_id: u32, difficulty: Difficulty) -> GameSettings {
        GameSettings {
            settings_id,
            difficulty: difficulty.into(),
            base_moves: GameSettingsDefaults::BASE_MOVES,
            max_moves: GameSettingsDefaults::MAX_MOVES,
            base_ratio_x100: GameSettingsDefaults::BASE_RATIO_X100,
            max_ratio_x100: GameSettingsDefaults::MAX_RATIO_X100,
            cube_3_percent: GameSettingsDefaults::CUBE_3_PERCENT,
            cube_2_percent: GameSettingsDefaults::CUBE_2_PERCENT,
            hammer_cost: GameSettingsDefaults::HAMMER_COST,
            wave_cost: GameSettingsDefaults::WAVE_COST,
            totem_cost: GameSettingsDefaults::TOTEM_COST,
            extra_moves_cost: GameSettingsDefaults::EXTRA_MOVES_COST,
            cube_multiplier_x100: GameSettingsDefaults::CUBE_MULTIPLIER_X100,
        }
    }
    
    /// Get consumable cost by type (0=Hammer, 1=Wave, 2=Totem, 3=ExtraMoves)
    fn get_consumable_cost(self: GameSettings, consumable_type: u8) -> u8 {
        match consumable_type {
            0 => self.hammer_cost,
            1 => self.wave_cost,
            2 => self.totem_cost,
            3 => self.extra_moves_cost,
            _ => 0,
        }
    }
    
    /// Apply cube multiplier to a cube amount
    fn apply_cube_multiplier(self: GameSettings, cubes: u16) -> u16 {
        let result: u32 = cubes.into() * self.cube_multiplier_x100.into() / 100;
        result.try_into().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::{GameSettings, GameSettingsTrait, GameSettingsDefaults};
    use zkube::types::difficulty::Difficulty;
    
    #[test]
    fn test_new_with_defaults() {
        let settings = GameSettingsTrait::new_with_defaults(1, Difficulty::Increasing);
        
        assert!(settings.settings_id == 1, "Settings ID should be 1");
        assert!(settings.base_moves == 20, "Base moves should be 20");
        assert!(settings.max_moves == 60, "Max moves should be 60");
        assert!(settings.base_ratio_x100 == 80, "Base ratio should be 80");
        assert!(settings.max_ratio_x100 == 250, "Max ratio should be 250");
        assert!(settings.cube_3_percent == 40, "Cube 3 percent should be 40");
        assert!(settings.cube_2_percent == 70, "Cube 2 percent should be 70");
        assert!(settings.hammer_cost == 5, "Hammer cost should be 5");
        assert!(settings.wave_cost == 5, "Wave cost should be 5");
        assert!(settings.totem_cost == 5, "Totem cost should be 5");
        assert!(settings.extra_moves_cost == 10, "Extra moves cost should be 10");
        assert!(settings.cube_multiplier_x100 == 100, "Multiplier should be 100");
    }
    
    #[test]
    fn test_get_consumable_cost() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        
        assert!(settings.get_consumable_cost(0) == 5, "Hammer should cost 5");
        assert!(settings.get_consumable_cost(1) == 5, "Wave should cost 5");
        assert!(settings.get_consumable_cost(2) == 5, "Totem should cost 5");
        assert!(settings.get_consumable_cost(3) == 10, "ExtraMoves should cost 10");
    }
    
    #[test]
    fn test_apply_cube_multiplier() {
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        
        // 1.0x multiplier
        assert!(settings.apply_cube_multiplier(10) == 10, "10 * 1.0 = 10");
        
        // 2.0x multiplier
        settings.cube_multiplier_x100 = 200;
        assert!(settings.apply_cube_multiplier(10) == 20, "10 * 2.0 = 20");
        
        // 0.5x multiplier
        settings.cube_multiplier_x100 = 50;
        assert!(settings.apply_cube_multiplier(10) == 5, "10 * 0.5 = 5");
    }
    
    #[test]
    fn test_exists() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        assert!(settings.exists(), "Settings with Increasing difficulty should exist");
        
        let empty = GameSettings {
            settings_id: 0,
            difficulty: 0,
            base_moves: 0,
            max_moves: 0,
            base_ratio_x100: 0,
            max_ratio_x100: 0,
            cube_3_percent: 0,
            cube_2_percent: 0,
            hammer_cost: 0,
            wave_cost: 0,
            totem_cost: 0,
            extra_moves_cost: 0,
            cube_multiplier_x100: 0,
        };
        assert!(!empty.exists(), "Empty settings should not exist");
    }
}
