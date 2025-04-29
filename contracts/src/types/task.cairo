use achievement::types::task::{Task as BushidoTask, TaskTrait as BushidoTaskTrait};

use zkube::elements::tasks;

#[derive(Copy, Drop)]
enum Task {
    None,
    Mastering,
    Chaining,
    Playing,
}

#[generate_trait]
impl TaskImpl of TaskTrait {
    #[inline]
    fn identifier(self: Task, level: u8) -> felt252 {
        match self {
            Task::None => 0,
            Task::Mastering => tasks::mastering::Mastering::identifier(level),
            Task::Chaining => tasks::chaining::Chaining::identifier(level),
            Task::Playing => tasks::playing::Playing::identifier(level),
        }
    }

    #[inline]
    fn description(self: Task, count: u32) -> ByteArray {
        match self {
            Task::None => "",
            Task::Mastering => tasks::mastering::Mastering::description(count),
            Task::Chaining => tasks::chaining::Chaining::description(count),
            Task::Playing => tasks::playing::Playing::description(count),
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
            Task::Mastering => 1,
            Task::Chaining => 2,
            Task::Playing => 3,
        }
    }
}

impl IntoU8Task of core::Into<u8, Task> {
    #[inline]
    fn into(self: u8) -> Task {
        let card: felt252 = self.into();
        match card {
            0 => Task::None,
            1 => Task::Mastering,
            2 => Task::Chaining,
            3 => Task::Playing,
            _ => Task::None,
        }
    }
}
