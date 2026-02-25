/// Line Sweep achievements - Lines cleared milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Line Sweep achievement levels: 100/500/1000/5000/10000 lines
pub impl Clearer of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CLEARER_I',
            1 => 'CLEARER_II',
            2 => 'CLEARER_III',
            3 => 'CLEARER_IV',
            4 => 'CLEARER_V',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 5 // Offset after Grinder achievements
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
        'Line Sweep'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-minus',
            1 => 'fa-bars',
            2 => 'fa-layer-group',
            3 => 'fa-bars-staggered',
            4 => 'fa-mountain',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Line Breaker',
            1 => 'Line Cleaner',
            2 => 'Line Master',
            3 => 'Line Expert',
            4 => 'Line Legend',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Clear 100 lines total.",
            1 => "Clear 500 lines total.",
            2 => "Clear 1,000 lines total.",
            3 => "Clear 5,000 lines total.",
            4 => "Clear 10,000 lines total.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 100,
            1 => 500,
            2 => 1000,
            3 => 5000,
            4 => 10000,
            _ => 0,
        };
        Task::LineClearer.tasks(count)
    }
}
