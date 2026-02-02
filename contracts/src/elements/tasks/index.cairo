/// Task index - enumerates all trackable tasks for quests

// External imports
use achievement::types::task::{Task as AchievementTask, TaskTrait as AchievementTaskTrait};

// Internal imports
use crate::elements::tasks;

/// Task enum representing all trackable actions for quests and achievements
#[derive(Copy, Drop, PartialEq)]
pub enum Task {
    None,
    // Daily gameplay tasks
    Grinder,        // Play X games
    LineClearer,    // Clear X lines
    ComboThree,     // Achieve 3+ line combos
    ComboFive,      // Achieve 5+ line combos
    ComboSeven,     // Achieve 7+ line combos
    // Meta task
    DailyMaster,    // Complete X daily quests
    // Achievement-only tasks
    LevelReacher,   // Reach level X
    Scorer,         // Score X points in a level
}

// Implementations

#[generate_trait]
pub impl TaskImpl of TaskTrait {
    /// Get the unique identifier for this task
    fn identifier(self: Task) -> felt252 {
        match self {
            Task::None => 0,
            Task::Grinder => tasks::grinder::Grinder::identifier(),
            Task::LineClearer => tasks::clearer::LineClearer::identifier(),
            Task::ComboThree => tasks::combo::ComboThree::identifier(),
            Task::ComboFive => tasks::combo::ComboFive::identifier(),
            Task::ComboSeven => tasks::combo::ComboSeven::identifier(),
            Task::DailyMaster => tasks::master::DailyMaster::identifier(),
            Task::LevelReacher => tasks::level::LevelReacher::identifier(),
            Task::Scorer => tasks::scorer::Scorer::identifier(),
        }
    }

    /// Get the description for this task with a given count
    fn description(self: Task, count: u32) -> ByteArray {
        match self {
            Task::None => "",
            Task::Grinder => tasks::grinder::Grinder::description(count),
            Task::LineClearer => tasks::clearer::LineClearer::description(count),
            Task::ComboThree => tasks::combo::ComboThree::description(count),
            Task::ComboFive => tasks::combo::ComboFive::description(count),
            Task::ComboSeven => tasks::combo::ComboSeven::description(count),
            Task::DailyMaster => tasks::master::DailyMaster::description(count),
            Task::LevelReacher => tasks::level::LevelReacher::description(count),
            Task::Scorer => tasks::scorer::Scorer::description(count),
        }
    }

    /// Convert to achievement tasks array (for quest registration)
    fn tasks(self: Task, count: u32) -> Span<AchievementTask> {
        let task_id: felt252 = self.identifier();
        let description: ByteArray = self.description(count);
        array![AchievementTaskTrait::new(task_id, count.into(), description)].span()
    }
}

// Into<Task, u8>
impl IntoTaskU8 of core::traits::Into<Task, u8> {
    fn into(self: Task) -> u8 {
        match self {
            Task::None => 0,
            Task::Grinder => 1,
            Task::LineClearer => 2,
            Task::ComboThree => 3,
            Task::ComboFive => 4,
            Task::ComboSeven => 5,
            Task::DailyMaster => 6,
            Task::LevelReacher => 7,
            Task::Scorer => 8,
        }
    }
}

// Into<u8, Task>
impl IntoU8Task of core::traits::Into<u8, Task> {
    fn into(self: u8) -> Task {
        match self {
            0 => Task::None,
            1 => Task::Grinder,
            2 => Task::LineClearer,
            3 => Task::ComboThree,
            4 => Task::ComboFive,
            5 => Task::ComboSeven,
            6 => Task::DailyMaster,
            7 => Task::LevelReacher,
            8 => Task::Scorer,
            _ => Task::None,
        }
    }
}
