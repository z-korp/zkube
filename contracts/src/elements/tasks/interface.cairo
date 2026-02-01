/// Task interface for quest system
/// Each task represents an atomic trackable action

pub trait TaskTrait {
    /// Unique identifier for this task
    fn identifier() -> felt252;
    /// Human-readable description of the task
    fn description(count: u32) -> ByteArray;
}
