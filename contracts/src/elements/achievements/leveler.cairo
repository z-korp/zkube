/// Leveler achievements - Level progress milestones
use crate::elements::achievements::interface::{AchievementTask, AchievementTrait, Task, TaskTrait};

/// Leveler achievement levels: Reach levels 10/20/30/40/50
pub impl Leveler of AchievementTrait {
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'LEVELER_I',
            1 => 'LEVELER_II',
            2 => 'LEVELER_III',
            3 => 'LEVELER_IV',
            4 => 'LEVELER_V',
            _ => '',
        }
    }

    fn index(level: u8) -> u8 {
        level + 19  // Offset after SuperChain achievements
    }

    fn hidden(level: u8) -> bool {
        false
    }

    fn points(level: u8) -> u16 {
        match level {
            0 => 15,
            1 => 30,
            2 => 50,
            3 => 75,
            4 => 100,
            _ => 0,
        }
    }

    fn group() -> felt252 {
        'Leveler'
    }

    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-stairs',
            1 => 'fa-stairs',
            2 => 'fa-mountain',
            3 => 'fa-mountain-sun',
            4 => 'fa-trophy',
            _ => '',
        }
    }

    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Level 10',
            1 => 'Level 20',
            2 => 'Level 30',
            3 => 'Level 40',
            4 => 'Level 50',
            _ => '',
        }
    }

    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Reach level 10. The journey begins!",
            1 => "Reach level 20. Halfway to greatness!",
            2 => "Reach level 30. Expert territory!",
            3 => "Reach level 40. Almost there!",
            4 => "Reach level 50. Ultimate mastery achieved!",
            _ => "",
        }
    }

    fn tasks(level: u8) -> Span<AchievementTask> {
        let count: u32 = match level {
            0 => 10,
            1 => 20,
            2 => 30,
            3 => 40,
            4 => 50,
            _ => 0,
        };
        Task::LevelReacher.tasks(count)
    }
}
