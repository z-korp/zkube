/// Clearer quests - Daily quests for clearing lines
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::clearer::LineClearer;
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyClearerOne - Clear 10 lines (rewards 3 CUBE)
pub impl DailyClearerOne of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_CLEARER_ONE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 10;
        let reward = RewardTrait::new("Quest Reward", "3 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Line Breaker",
            description: "Clear 10 lines to warm up.",
            icon: "fa-minus",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                LineClearer::identifier(), total.into(), LineClearer::description(total),
            ),
        ];
        QuestProps {
            id: Self::identifier(),
            start: 0,
            end: 0,
            duration: ONE_DAY,
            interval: ONE_DAY,
            tasks: tasks,
            conditions: array![],
            metadata: metadata,
        }
    }
}

/// DailyClearerTwo - Clear 30 lines (rewards 6 CUBE)
pub impl DailyClearerTwo of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_CLEARER_TWO'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 30;
        let reward = RewardTrait::new("Quest Reward", "6 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Line Crusher",
            description: "Clear 30 lines like a pro.",
            icon: "fa-layer-group",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                LineClearer::identifier(), total.into(), LineClearer::description(total),
            ),
        ];
        let conditions: Array<felt252> = array![DailyClearerOne::identifier()];
        QuestProps {
            id: Self::identifier(),
            start: 0,
            end: 0,
            duration: ONE_DAY,
            interval: ONE_DAY,
            tasks: tasks,
            conditions: conditions,
            metadata: metadata,
        }
    }
}

/// DailyClearerThree - Clear 50 lines (rewards 12 CUBE)
pub impl DailyClearerThree of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_CLEARER_THREE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 50;
        let reward = RewardTrait::new("Quest Reward", "12 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Line Master",
            description: "Clear 50 lines to prove mastery.",
            icon: "fa-bars-staggered",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                LineClearer::identifier(), total.into(), LineClearer::description(total),
            ),
        ];
        let conditions: Array<felt252> = array![DailyClearerTwo::identifier()];
        QuestProps {
            id: Self::identifier(),
            start: 0,
            end: 0,
            duration: ONE_DAY,
            interval: ONE_DAY,
            tasks: tasks,
            conditions: conditions,
            metadata: metadata,
        }
    }
}
