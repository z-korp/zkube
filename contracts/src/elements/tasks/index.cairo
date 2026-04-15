use zkube::elements::tasks::interface::TaskTrait;

pub mod TaskId {
    pub const LINE_CLEAR: felt252 = 'LINE_CLEAR';
    pub const COMBO_2: felt252 = 'COMBO_2';
    pub const COMBO_3: felt252 = 'COMBO_3';
    pub const COMBO_4: felt252 = 'COMBO_4';
    pub const COMBO_5: felt252 = 'COMBO_5';
    pub const COMBO_6: felt252 = 'COMBO_6';
    pub const HIGH_COMBO: felt252 = 'HIGH_COMBO';
    pub const BONUS_USED: felt252 = 'BONUS_USED';
    pub const GAME_START: felt252 = 'GAME_START';
    pub const LEVEL_COMPLETE: felt252 = 'LEVEL_COMPLETE';
    pub const PERFECT_LEVEL: felt252 = 'PERFECT_LEVEL';
    pub const BOSS_DEFEAT: felt252 = 'BOSS_DEFEAT';
    pub const ZONE_COMPLETE: felt252 = 'ZONE_COMPLETE';
    pub const DAILY_PLAY: felt252 = 'DAILY_PLAY';
    /// Incremented when a daily rotating quest completes — used by DailyFinisher meta-quest
    pub const DAILY_QUEST_DONE: felt252 = 'DAILY_QUEST_DONE';
}

#[derive(Copy, Drop)]
pub enum Task {
    LineClear,
    Combo2,
    Combo3,
    Combo4,
    Combo5,
    Combo6,
    HighCombo,
    BonusUsed,
    GameStart,
    LevelComplete,
    PerfectLevel,
    BossDefeat,
    ZoneComplete,
    DailyPlay,
    DailyQuestDone,
}

impl TaskImpl of TaskTrait<Task> {
    fn identifier(self: @Task) -> felt252 {
        match self {
            Task::LineClear => TaskId::LINE_CLEAR,
            Task::Combo2 => TaskId::COMBO_2,
            Task::Combo3 => TaskId::COMBO_3,
            Task::Combo4 => TaskId::COMBO_4,
            Task::Combo5 => TaskId::COMBO_5,
            Task::Combo6 => TaskId::COMBO_6,
            Task::HighCombo => TaskId::HIGH_COMBO,
            Task::BonusUsed => TaskId::BONUS_USED,
            Task::GameStart => TaskId::GAME_START,
            Task::LevelComplete => TaskId::LEVEL_COMPLETE,
            Task::PerfectLevel => TaskId::PERFECT_LEVEL,
            Task::BossDefeat => TaskId::BOSS_DEFEAT,
            Task::ZoneComplete => TaskId::ZONE_COMPLETE,
            Task::DailyPlay => TaskId::DAILY_PLAY,
            Task::DailyQuestDone => TaskId::DAILY_QUEST_DONE,
        }
    }

    fn description(self: @Task, count: u32) -> ByteArray {
        match self {
            Task::LineClear => format!("Clear {} lines", count),
            Task::Combo2 => format!("Clear {} 2+ line moves", count),
            Task::Combo3 => format!("Clear {} 3+ line moves", count),
            Task::Combo4 => format!("Clear {} 4+ line moves", count),
            Task::Combo5 => format!("Clear {} 5+ line moves", count),
            Task::Combo6 => format!("Clear {} 6+ line moves", count),
            Task::HighCombo => format!("Reach {} combo streaks of 10+", count),
            Task::BonusUsed => format!("Use bonus {} times", count),
            Task::GameStart => format!("Start {} game runs", count),
            Task::LevelComplete => format!("Complete {} levels", count),
            Task::PerfectLevel => format!("Get {} perfect levels", count),
            Task::BossDefeat => format!("Defeat {} bosses", count),
            Task::ZoneComplete => format!("Complete {} zones", count),
            Task::DailyPlay => format!("Join {} daily challenges", count),
            Task::DailyQuestDone => format!("Complete {} daily quests", count),
        }
    }
}
