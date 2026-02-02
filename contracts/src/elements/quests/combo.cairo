/// Combo quests - Daily quests for achieving combos
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::combo::{ComboThree, ComboFive, ComboSeven};
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyComboOne - Achieve a 3+ line combo (rewards 5 CUBE)
pub impl DailyComboOne of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_ONE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "5 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Combo Starter",
            description: "Achieve a 3+ line combo.",
            icon: "fa-bolt",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboThree::identifier(), total.into(), ComboThree::description(total),
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

/// DailyComboTwo - Achieve a 5+ line combo (rewards 10 CUBE)
pub impl DailyComboTwo of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_TWO'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "10 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Combo Builder",
            description: "Achieve a 5+ line combo.",
            icon: "fa-bolt-lightning",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboFive::identifier(), total.into(), ComboFive::description(total),
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

/// DailyComboThree - Achieve a 7+ line combo (rewards 20 CUBE)
pub impl DailyComboThree of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_THREE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "20 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Combo Expert",
            description: "Achieve a 7+ line combo.",
            icon: "fa-fire-flame-curved",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboSeven::identifier(), total.into(), ComboSeven::description(total),
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
