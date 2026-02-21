/// Play Rhythm achievements - Games played milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Play Rhythm achievement levels: 10/25/50/100/250 games
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
            0 => 5,
            1 => 5,
            2 => 10,
            3 => 15,
            4 => 25,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Play Rhythm'
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
            0 => 'Getting Started',
            1 => 'In the Groove',
            2 => 'Steady Player',
            3 => 'Weekend Warrior',
            4 => 'Puzzle Veteran',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Play 10 games.",
            1 => "Play 25 games.",
            2 => "Play 50 games.",
            3 => "Play 100 games.",
            4 => "Play 250 games.",
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
