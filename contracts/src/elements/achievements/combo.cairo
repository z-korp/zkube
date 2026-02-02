/// Combo achievements - 3+ line combo milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Combo achievement levels: 10/50/100 combos of 3+ lines
pub impl Combo of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'COMBO_I',
            1 => 'COMBO_II',
            2 => 'COMBO_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 10  // Offset after Clearer achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 15,
            1 => 30,
            2 => 50,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Combo'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-bolt',
            1 => 'fa-bolt',
            2 => 'fa-bolt-lightning',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Combo Starter',
            1 => 'Combo Master',
            2 => 'Combo Legend',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Achieve 10 combos of 3+ lines. Learning the basics!",
            1 => "Achieve 50 combos of 3+ lines. Combo mastery!",
            2 => "Achieve 100 combos of 3+ lines. Legendary combos!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 10,
            1 => 50,
            2 => 100,
            _ => 0,
        };
        Task::ComboThree.tasks(count)
    }
}
