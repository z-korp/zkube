/// Victory Path achievements - complete level 50 run milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Victory Path levels: 1/3/10/50 full wins
pub impl Champion of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CHAMPION_I',
            1 => 'CHAMPION_II',
            2 => 'CHAMPION_III',
            3 => 'CHAMPION_IV',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 26 // Offset after Cascade Ladder achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 20,
            1 => 40,
            2 => 60,
            3 => 100,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Victory Path'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-flag-checkered',
            1 => 'fa-trophy',
            2 => 'fa-crown',
            3 => 'fa-medal',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'First Crown',
            1 => 'Rising Champion',
            2 => 'Seasoned Champion',
            3 => 'Grand Champion',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Complete level 50 once.",
            1 => "Complete level 50 three times.",
            2 => "Complete level 50 ten times.",
            3 => "Complete level 50 fifty times.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 1,
            1 => 3,
            2 => 10,
            3 => 50,
            _ => 0,
        };
        Task::Victory.tasks(count)
    }
}
