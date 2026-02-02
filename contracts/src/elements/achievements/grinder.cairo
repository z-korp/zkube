/// Grinder achievements - Games played milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Grinder achievement levels: 10/25/50/100/250 games
pub impl Grinder of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'GRINDER_I',
            1 => 'GRINDER_II',
            2 => 'GRINDER_III',
            3 => 'GRINDER_IV',
            4 => 'GRINDER_V',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 10,
            1 => 15,
            2 => 25,
            3 => 40,
            4 => 60,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Grinder'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-gamepad',
            1 => 'fa-gamepad',
            2 => 'fa-fire',
            3 => 'fa-fire-flame-curved',
            4 => 'fa-crown',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Novice',
            1 => 'Apprentice',
            2 => 'Dedicated',
            3 => 'Veteran',
            4 => 'Legend',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Play 10 games. Every journey begins with a single step.",
            1 => "Play 25 games. Practice makes perfect.",
            2 => "Play 50 games. Dedication is key.",
            3 => "Play 100 games. A true veteran emerges.",
            4 => "Play 250 games. Legendary status achieved.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 10,
            1 => 25,
            2 => 50,
            3 => 100,
            4 => 250,
            _ => 0,
        };
        Task::Grinder.tasks(count)
    }
}
