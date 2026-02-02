/// Achievement interface for zKube achievements
pub use achievement::types::task::{Task as AchievementTask, TaskTrait as AchievementTaskTrait};
pub use crate::elements::tasks::index::{Task, TaskTrait};

pub trait AchievementTrait {
    fn identifier(level: u8) -> felt252;
    fn index(level: u8) -> u8;
    fn hidden(level: u8) -> bool;
    fn points(level: u8) -> u16;
    fn group() -> felt252;
    fn icon(level: u8) -> felt252;
    fn title(level: u8) -> felt252;
    fn description(level: u8) -> ByteArray;
    fn tasks(level: u8) -> Span<AchievementTask>;
}
