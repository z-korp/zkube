/// Daily Delusion achievements - Complete all daily quests milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Daily Delusion achievement levels: Complete all daily quests 1/3/10 times
pub impl Master of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'DAILY_MASTER_I',
            1 => 'DAILY_MASTER_II',
            2 => 'DAILY_MASTER_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 30 // Offset after Victory Path achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 30,
            1 => 70,
            2 => 100,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Daily Delusion'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-calendar-check',
            1 => 'fa-calendar-days',
            2 => 'fa-calendar-week',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Checklist Enjoyer',
            1 => 'Calendar Cultist',
            2 => 'Chronically Online',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Complete all daily quests 1 time.",
            1 => "Complete all daily quests 3 times.",
            2 => "Complete all daily quests 10 times.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 1,
            1 => 3,
            2 => 10,
            _ => 0,
        };
        Task::DailyMaster.tasks(count)
    }
}
