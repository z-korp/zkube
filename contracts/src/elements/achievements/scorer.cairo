/// Scorer achievements - High score milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Scorer achievement levels: Score 100/200/300 points in a single level
pub impl Scorer of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'SCORER_I',
            1 => 'SCORER_II',
            2 => 'SCORER_III',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 24 // Offset after Leveler achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 20,
            1 => 45,
            2 => 75,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Scorer'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-star',
            1 => 'fa-star',
            2 => 'fa-star',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Century',
            1 => 'Double Century',
            2 => 'Triple Century',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Score 100+ points in a single level. Great start!",
            1 => "Score 200+ points in a single level. Impressive!",
            2 => "Score 300+ points in a single level. Phenomenal!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 100,
            1 => 200,
            2 => 300,
            _ => 0,
        };
        Task::Scorer.tasks(count)
    }
}
