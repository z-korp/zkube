/// Quest interface for quest system
use starknet::ContractAddress;
use crate::elements::quests::index::QuestProps;

pub trait QuestTrait {
    /// Unique identifier for this quest
    fn identifier() -> felt252;
    /// Quest properties including tasks, timing, and metadata
    fn props(registry: ContractAddress) -> QuestProps;
}
