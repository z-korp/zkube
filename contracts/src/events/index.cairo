use starknet::ContractAddress;
use crate::types::constraint::ConstraintType;


/// Emitted when a new game starts
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct StartGame {
    #[key]
    pub player: ContractAddress,
    pub timestamp: u64,
    pub game_id: felt252,
}

/// Emitted when a new level starts
#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct LevelStarted {
    #[key]
    pub game_id: felt252,
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
    pub game_id: felt252,
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
    pub game_id: felt252,
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
    pub game_id: felt252,
    #[key]
    pub player: ContractAddress,
    pub final_score: u16,
    pub total_cubes: u16,
    pub started_at: u64,
    pub completed_at: u64,
}
