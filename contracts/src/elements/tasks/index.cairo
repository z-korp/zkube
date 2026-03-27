/// Task index - enumerates all trackable tasks for quests

// Internal imports
use crate::elements::tasks;

/// Task enum representing all trackable actions for quests and achievements
#[derive(Copy, Drop, PartialEq)]
pub enum Task {
    None,
    // Daily gameplay tasks
    Grinder, // Play X games
    LineClearer, // Clear X lines
    ComboTwo, // Achieve 2+ line combos
    ComboThree, // Achieve 3+ line combos (achievements)
    ComboFour, // Achieve 4+ line combos (quests)
    ComboFive, // Achieve 5+ line combos
    ComboSix, // Achieve 6+ line combos (quests)
    ComboSeven, // Achieve 7+ line combos (achievements)
    ComboEight, // Achieve 8+ line combos
    ComboNine, // Achieve 9+ line combos
    ComboStreakFifteen, // Reach 15+ combo streak
    ComboStreakTwenty, // Reach 20+ combo streak
    ComboStreakTwentyFive, // Reach 25+ combo streak
    ComboStreakFifty, // Reach 50+ combo streak
    ComboStreakHundred, // Reach 100+ combo streak
    // Meta task
    DailyMaster, // Complete X daily quests
    // Achievement-only tasks
    LevelReacher, // Reach level X
    Scorer, // Score X points in a level
    Victory // Complete level 50 (full win)
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
            Task::ComboTwo => tasks::combo::ComboTwo::identifier(),
            Task::ComboThree => tasks::combo::ComboThree::identifier(),
            Task::ComboFour => tasks::combo::ComboFour::identifier(),
            Task::ComboFive => tasks::combo::ComboFive::identifier(),
            Task::ComboSix => tasks::combo::ComboSix::identifier(),
            Task::ComboSeven => tasks::combo::ComboSeven::identifier(),
            Task::ComboEight => tasks::combo::ComboEight::identifier(),
            Task::ComboNine => tasks::combo::ComboNine::identifier(),
            Task::ComboStreakFifteen => tasks::combo_streak::ComboStreakFifteen::identifier(),
            Task::ComboStreakTwenty => tasks::combo_streak::ComboStreakTwenty::identifier(),
            Task::ComboStreakTwentyFive => tasks::combo_streak::ComboStreakTwentyFive::identifier(),
            Task::ComboStreakFifty => tasks::combo_streak::ComboStreakFifty::identifier(),
            Task::ComboStreakHundred => tasks::combo_streak::ComboStreakHundred::identifier(),
            Task::DailyMaster => tasks::master::DailyMaster::identifier(),
            Task::LevelReacher => tasks::level::LevelReacher::identifier(),
            Task::Scorer => tasks::scorer::Scorer::identifier(),
            Task::Victory => tasks::victory::Victory::identifier(),
        }
    }

    /// Get the description for this task with a given count
    fn description(self: Task, count: u32) -> ByteArray {
        match self {
            Task::None => "",
            Task::Grinder => tasks::grinder::Grinder::description(count),
            Task::LineClearer => tasks::clearer::LineClearer::description(count),
            Task::ComboTwo => tasks::combo::ComboTwo::description(count),
            Task::ComboThree => tasks::combo::ComboThree::description(count),
            Task::ComboFour => tasks::combo::ComboFour::description(count),
            Task::ComboFive => tasks::combo::ComboFive::description(count),
            Task::ComboSix => tasks::combo::ComboSix::description(count),
            Task::ComboSeven => tasks::combo::ComboSeven::description(count),
            Task::ComboEight => tasks::combo::ComboEight::description(count),
            Task::ComboNine => tasks::combo::ComboNine::description(count),
            Task::ComboStreakFifteen => tasks::combo_streak::ComboStreakFifteen::description(count),
            Task::ComboStreakTwenty => tasks::combo_streak::ComboStreakTwenty::description(count),
            Task::ComboStreakTwentyFive => tasks::combo_streak::ComboStreakTwentyFive::description(
                count,
            ),
            Task::ComboStreakFifty => tasks::combo_streak::ComboStreakFifty::description(count),
            Task::ComboStreakHundred => tasks::combo_streak::ComboStreakHundred::description(count),
            Task::DailyMaster => tasks::master::DailyMaster::description(count),
            Task::LevelReacher => tasks::level::LevelReacher::description(count),
            Task::Scorer => tasks::scorer::Scorer::description(count),
            Task::Victory => tasks::victory::Victory::description(count),
        }
    }

}

// Into<Task, u8>
impl IntoTaskU8 of core::traits::Into<Task, u8> {
    fn into(self: Task) -> u8 {
        match self {
            Task::None => 0,
            Task::Grinder => 1,
            Task::LineClearer => 2,
            Task::ComboTwo => 3,
            Task::ComboThree => 4,
            Task::ComboFour => 5,
            Task::ComboFive => 6,
            Task::ComboSix => 7,
            Task::ComboSeven => 8,
            Task::ComboEight => 9,
            Task::ComboNine => 10,
            Task::ComboStreakFifteen => 11,
            Task::ComboStreakTwenty => 12,
            Task::ComboStreakTwentyFive => 13,
            Task::ComboStreakFifty => 14,
            Task::ComboStreakHundred => 15,
            Task::DailyMaster => 16,
            Task::LevelReacher => 17,
            Task::Scorer => 18,
            Task::Victory => 19,
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
            3 => Task::ComboTwo,
            4 => Task::ComboThree,
            5 => Task::ComboFour,
            6 => Task::ComboFive,
            7 => Task::ComboSix,
            8 => Task::ComboSeven,
            9 => Task::ComboEight,
            10 => Task::ComboNine,
            11 => Task::ComboStreakFifteen,
            12 => Task::ComboStreakTwenty,
            13 => Task::ComboStreakTwentyFive,
            14 => Task::ComboStreakFifty,
            15 => Task::ComboStreakHundred,
            16 => Task::DailyMaster,
            17 => Task::LevelReacher,
            18 => Task::Scorer,
            19 => Task::Victory,
            _ => Task::None,
        }
    }
}
