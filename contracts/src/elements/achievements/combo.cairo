/// Combo Flow achievements - 3+ line combo milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Combo Flow achievement levels: 10/25/50/100/200 combos of 3+ lines
pub impl Combo of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'COMBO_I',
            1 => 'COMBO_II',
            2 => 'COMBO_III',
            3 => 'COMBO_IV',
            4 => 'COMBO_V',
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
            0 => 5,
            1 => 10,
            2 => 15,
            3 => 25,
            4 => 45,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Combo Flow'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-bolt',
            1 => 'fa-bolt',
            2 => 'fa-bolt',
            3 => 'fa-bolt-lightning',
            4 => 'fa-wand-magic-sparkles',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Combo Rookie',
            1 => 'Combo Builder',
            2 => 'Combo Crafter',
            3 => 'Combo Pro',
            4 => 'Combo Sage',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Achieve 10 combos of 3+ lines.",
            1 => "Achieve 25 combos of 3+ lines.",
            2 => "Achieve 50 combos of 3+ lines.",
            3 => "Achieve 100 combos of 3+ lines.",
            4 => "Achieve 200 combos of 3+ lines.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 10,
            1 => 25,
            2 => 50,
            3 => 100,
            4 => 200,
            _ => 0,
        };
        Task::ComboThree.tasks(count)
    }
}
