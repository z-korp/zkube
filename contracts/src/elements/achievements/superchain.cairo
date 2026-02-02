/// SuperChain achievements - 7+ line combo milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// SuperChain achievement levels: 1/10/25 combos of 7+ lines
pub impl SuperChain of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'SUPERCHAIN_I',
            1 => 'SUPERCHAIN_II',
            2 => 'SUPERCHAIN_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 16  // Offset after Chain achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 25,
            1 => 50,
            2 => 80,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'SuperChain'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-fire',
            1 => 'fa-fire-flame-curved',
            2 => 'fa-meteor',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Super Combo',
            1 => 'Ultra Combo',
            2 => 'Mega Combo',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Achieve your first 7+ line combo. Incredible!",
            1 => "Achieve 10 combos of 7+ lines. Ultra impressive!",
            2 => "Achieve 25 combos of 7+ lines. Absolutely mega!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 1,
            1 => 10,
            2 => 25,
            _ => 0,
        };
        Task::ComboSeven.tasks(count)
    }
}
