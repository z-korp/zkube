// External imports

use arcade_trophy::types::task::{Task as BushidoTask, TaskTrait as BushidoTaskTrait};

// Internal imports

use zkube::elements::tasks;

// Types

#[derive(Copy, Drop)]
enum Task {
    None,
    Breaking,
    Mastering,
    Chaining,
    Playing,
    Streaking,
    Leveling,
}

// Implementations

#[generate_trait]
impl TaskImpl of TaskTrait {
    #[inline]
    fn identifier(self: Task, level: u8) -> felt252 {
        match self {
            Task::None => 0,
            Task::Breaking => tasks::breaking::Breaking::identifier(level),
            Task::Mastering => tasks::mastering::Mastering::identifier(level),
            Task::Chaining => tasks::chaining::Chaining::identifier(level),
            Task::Playing => tasks::playing::Playing::identifier(level),
            Task::Streaking => tasks::streaking::Streaking::identifier(level),
            Task::Leveling => tasks::leveling::Leveling::identifier(level),
        }
    }

    #[inline]
    fn description(self: Task, count: u32) -> ByteArray {
        match self {
            Task::None => "",
            Task::Breaking => tasks::breaking::Breaking::description(count),
            Task::Mastering => tasks::mastering::Mastering::description(count),
            Task::Chaining => tasks::chaining::Chaining::description(count),
            Task::Playing => tasks::playing::Playing::description(count),
            Task::Streaking => tasks::streaking::Streaking::description(count),
            Task::Leveling => tasks::leveling::Leveling::description(count),
        }
    }

    #[inline]
    fn tasks(self: Task, level: u8, count: u32, total: u32) -> Span<BushidoTask> {
        let task_id: felt252 = self.identifier(level);
        let description: ByteArray = self.description(count);
        array![BushidoTaskTrait::new(task_id, total, description)].span()
    }
}

impl IntoTaskU8 of core::Into<Task, u8> {
    #[inline]
    fn into(self: Task) -> u8 {
        match self {
            Task::None => 0,
            Task::Breaking => 1,
            Task::Mastering => 2,
            Task::Chaining => 3,
            Task::Playing => 4,
            Task::Streaking => 5,
            Task::Leveling => 6,
        }
    }
}

impl IntoU8Task of core::Into<u8, Task> {
    #[inline]
    fn into(self: u8) -> Task {
        let card: felt252 = self.into();
        match card {
            0 => Task::None,
            1 => Task::Breaking,
            2 => Task::Mastering,
            3 => Task::Chaining,
            4 => Task::Playing,
            5 => Task::Streaking,
            6 => Task::Leveling,
            _ => Task::None,
        }
    }
}
