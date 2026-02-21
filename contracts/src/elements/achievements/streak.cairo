/// Streak Spark achievements - consecutive line-clearing move streak milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Streak Spark achievement levels: streak 15/50/100
pub impl Streak of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'STREAK_I',
            1 => 'STREAK_II',
            2 => 'STREAK_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 15  // Offset after Combo Flow achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 15,
            1 => 50,
            2 => 100,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Streak Spark'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-fire',
            1 => 'fa-fire-flame-curved',
            2 => 'fa-sun',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Warmed Up',
            1 => 'On a Roll',
            2 => 'Unstoppable',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Reach a combo streak of 15+.",
            1 => "Reach a combo streak of 50+.",
            2 => "Reach a combo streak of 100+.",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        match level {
            0 => Task::ComboStreakFifteen.tasks(1),
            1 => Task::ComboStreakFifty.tasks(1),
            2 => Task::ComboStreakHundred.tasks(1),
            _ => [].span(),
        }
    }
}
