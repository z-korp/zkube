use zkube::elements::tasks::interface::TaskTrait;

pub mod TaskId {
    pub const LINE_CLEAR: felt252 = 'LINE_CLEAR';
    pub const COMBO_3: felt252 = 'COMBO_3';
    pub const COMBO_4: felt252 = 'COMBO_4';
    pub const COMBO_5: felt252 = 'COMBO_5';
    pub const BONUS_USED: felt252 = 'BONUS_USED';
    pub const GAME_START: felt252 = 'GAME_START';
    pub const LEVEL_COMPLETE: felt252 = 'LEVEL_COMPLETE';
    pub const PERFECT_LEVEL: felt252 = 'PERFECT_LEVEL';
    pub const BOSS_DEFEAT: felt252 = 'BOSS_DEFEAT';
    pub const ZONE_COMPLETE: felt252 = 'ZONE_COMPLETE';
    pub const DAILY_PLAY: felt252 = 'DAILY_PLAY';
}

#[derive(Copy, Drop)]
pub enum Task {
    LineClear,
    Combo3,
    Combo4,
    Combo5,
    BonusUsed,
    GameStart,
    LevelComplete,
    PerfectLevel,
    BossDefeat,
    ZoneComplete,
    DailyPlay,
}

impl TaskImpl of TaskTrait<Task> {
    fn identifier(self: @Task) -> felt252 {
        match self {
            Task::LineClear => TaskId::LINE_CLEAR,
            Task::Combo3 => TaskId::COMBO_3,
            Task::Combo4 => TaskId::COMBO_4,
            Task::Combo5 => TaskId::COMBO_5,
            Task::BonusUsed => TaskId::BONUS_USED,
            Task::GameStart => TaskId::GAME_START,
            Task::LevelComplete => TaskId::LEVEL_COMPLETE,
            Task::PerfectLevel => TaskId::PERFECT_LEVEL,
            Task::BossDefeat => TaskId::BOSS_DEFEAT,
            Task::ZoneComplete => TaskId::ZONE_COMPLETE,
            Task::DailyPlay => TaskId::DAILY_PLAY,
        }
    }

    fn description(self: @Task, count: u32) -> ByteArray {
        match self {
            Task::LineClear => format!("Clear {} lines", count),
            Task::Combo3 => format!("Reach {} combos of 3+", count),
            Task::Combo4 => format!("Reach {} combos of 4+", count),
            Task::Combo5 => format!("Reach {} combos of 5+", count),
            Task::BonusUsed => format!("Use bonus {} times", count),
            Task::GameStart => format!("Start {} game runs", count),
            Task::LevelComplete => format!("Complete {} levels", count),
            Task::PerfectLevel => format!("Get {} perfect levels", count),
            Task::BossDefeat => format!("Defeat {} bosses", count),
            Task::ZoneComplete => format!("Complete {} zones", count),
            Task::DailyPlay => format!("Play daily challenge {} times", count),
        }
    }
}
