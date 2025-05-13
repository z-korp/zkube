use starknet::ContractAddress;
use crate::types::bonus::Bonus;

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
