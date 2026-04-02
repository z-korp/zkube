use starknet::ContractAddress;

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct WeeklyEndless {
    #[key]
    pub week_id: u32,
    pub total_participants: u32,
    pub settled: bool,
}

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct WeeklyEndlessLeaderboard {
    #[key]
    pub week_id: u32,
    #[key]
    pub rank: u32,
    pub player: ContractAddress,
    pub score: u32,
}

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct WeeklyEndlessEntry {
    #[key]
    pub week_id: u32,
    #[key]
    pub player: ContractAddress,
    pub best_score: u32,
    pub submitted: bool,
}

pub const SECONDS_PER_WEEK: u64 = 604800;
pub const EPOCH: u64 = 0;

pub fn current_week_id(timestamp: u64) -> u32 {
    ((timestamp - EPOCH) / SECONDS_PER_WEEK).try_into().unwrap()
}
