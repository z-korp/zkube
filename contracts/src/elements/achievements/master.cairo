/// Master achievement - Complete all daily quests
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Master achievement: Complete all daily quests (once)
pub impl Master of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'DAILY_MASTER',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        27  // Last achievement
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 50,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Master'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-trophy',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Daily Champion',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Complete all 9 daily quests in a single day. True dedication!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        // This tracks the DailyMaster task from quest completion
        Task::DailyMaster.tasks(9)
    }
}
