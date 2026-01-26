use starknet::ContractAddress;
use crate::types::bonus::Bonus;
use crate::types::constraint::ConstraintType;

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
    pub stars: u8,
    pub moves_used: u16,
    pub score: u16,
    pub bonuses_earned: u8,
}

/// Emitted when a game run ends (game over)
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct RunEnded {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub final_level: u8,
    pub final_score: u16,
    pub total_stars: u16,
    pub started_at: u64,
    pub ended_at: u64,
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
