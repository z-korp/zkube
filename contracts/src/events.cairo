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
    pub cubes: u8,
    pub moves_used: u16,
    pub score: u16,
    pub total_score: u32,
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
    pub final_score: u32,
    pub endless_depth: u8,
    pub zone_id: u8,
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
    pub final_score: u32,
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


#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct DraftOpened {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub event_slot: u8,
    pub event_type: u8,
    pub trigger_level: u8,
    pub zone: u8,
    pub choice_1: u8,
    pub choice_2: u8,
    pub choice_3: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct DraftRerolled {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub event_slot: u8,
    pub reroll_slot: u8,
    pub reroll_cost: u16,
    pub new_choice: u8,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event(historical: true)]
pub struct DraftSelected {
    #[key]
    pub game_id: u64,
    #[key]
    pub player: ContractAddress,
    pub event_slot: u8,
    pub selected_slot: u8,
    pub selected_choice: u8,
}
