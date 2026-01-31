use starknet::ContractAddress;
use crate::types::bonus::Bonus;
use crate::types::constraint::ConstraintType;
use crate::types::consumable::ConsumableType;

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct StartGame {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct UseBonus {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: u64,
    pub bonus: Bonus,
}

/// Emitted when a new level starts
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct LevelStarted {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub level: u8,
    pub points_required: u16,
    pub max_moves: u16,
    pub constraint_type: ConstraintType,
    pub constraint_value: u8,
    pub constraint_required: u8,
}

/// Emitted when a level is completed
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct LevelCompleted {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub level: u8,
    pub cubes: u8,
    pub moves_used: u16,
    pub score: u16,
    pub total_score: u16,
    pub bonuses_earned: u8,
}

/// Emitted when a game run ends (game over - failed)
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct RunEnded {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub final_level: u8,
    pub final_score: u16,
    pub total_cubes: u16,
    pub started_at: u64,
    pub ended_at: u64,
}

/// Emitted when a game run is completed (victory - cleared level 50)
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct RunCompleted {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub final_score: u16,
    pub total_cubes: u16,
    pub started_at: u64,
    pub completed_at: u64,
}

/// Emitted when constraint progress is updated
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct ConstraintProgress {
    #[key]
    pub game_id: u64,
    pub constraint_type: ConstraintType,
    pub current: u8,
    pub required: u8,
}

/// Emitted when a consumable is purchased from the in-game shop
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct ConsumablePurchased {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub consumable: ConsumableType,
    pub cost: u16,
    pub cubes_remaining: u16,
}

/// Emitted when a bonus is leveled up after boss clear
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct BonusLevelUp {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub bonus_slot: u8,      // 0, 1, or 2 (which of the 3 selected)
    pub bonus_type: u8,      // The bonus type (1=Hammer, 2=Totem, etc.)
    pub new_level: u8,       // New level (1, 2, or 3)
}

/// Emitted when a bonus type is unlocked in the permanent shop
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct BonusUnlocked {
    #[key]
    pub player: ContractAddress,
    pub bonus_type: u8,      // 4=Shrink, 5=Shuffle
    pub cost: u16,           // CUBE spent
}
