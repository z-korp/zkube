/// Chain achievements - 5+ line combo milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Chain achievement levels: 5/25/50 combos of 5+ lines
pub impl Chain of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CHAIN_I',
            1 => 'CHAIN_II',
            2 => 'CHAIN_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 13  // Offset after Combo achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 20,
            1 => 40,
            2 => 65,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Chain'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-link',
            1 => 'fa-link',
            2 => 'fa-link-slash',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Chain Starter',
            1 => 'Chain Master',
            2 => 'Chain Legend',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Achieve 5 combos of 5+ lines. Chaining begins!",
            1 => "Achieve 25 combos of 5+ lines. Chain mastery!",
            2 => "Achieve 50 combos of 5+ lines. Legendary chains!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 5,
            1 => 25,
            2 => 50,
            _ => 0,
        };
        Task::ComboFive.tasks(count)
    }
}
