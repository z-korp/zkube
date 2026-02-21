/// Cascade Ladder achievements - one-move line clear milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Cascade Ladder levels: clear 2+/3+/4+/5+/6+/7+/8+/9+ lines in one move
pub impl Cascade of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CASCADE_I',
            1 => 'CASCADE_II',
            2 => 'CASCADE_III',
            3 => 'CASCADE_IV',
            4 => 'CASCADE_V',
            5 => 'CASCADE_VI',
            6 => 'CASCADE_VII',
            7 => 'CASCADE_VIII',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 18  // Offset after Streak Spark achievements
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
            5 => 80,
            6 => 120,
            7 => 200,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Cascade Ladder'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-water',
            1 => 'fa-water',
            2 => 'fa-arrows-down-to-line',
            3 => 'fa-wave-square',
            4 => 'fa-burst',
            5 => 'fa-cloud-showers-heavy',
            6 => 'fa-cloud-bolt',
            7 => 'fa-mountain',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'First Cascade',
            1 => 'Clean Sweep',
            2 => 'Stack Breaker',
            3 => 'Board Shaker',
            4 => 'Grid Crusher',
            5 => 'Storm Chain',
            6 => 'Skyfall',
            7 => 'Perfect Avalanche',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Clear 2+ lines in one move.",
            1 => "Clear 3+ lines in one move.",
            2 => "Clear 4+ lines in one move.",
            3 => "Clear 5+ lines in one move.",
            4 => "Clear 6+ lines in one move.",
            5 => "Clear 7+ lines in one move.",
            6 => "Clear 8+ lines in one move.",
            7 => "Clear 9+ lines in one move.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        match level {
            0 => Task::ComboTwo.tasks(1),
            1 => Task::ComboThree.tasks(1),
            2 => Task::ComboFour.tasks(1),
            3 => Task::ComboFive.tasks(1),
            4 => Task::ComboSix.tasks(1),
            5 => Task::ComboSeven.tasks(1),
            6 => Task::ComboEight.tasks(1),
            7 => Task::ComboNine.tasks(1),
            _ => [].span(),
        }
    }
}
