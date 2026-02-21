/// Combo quests - Daily quests for achieving combos
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::combo::{ComboFour, ComboFive, ComboSix};
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyComboOne - Achieve a 4+ line combo (rewards 3 CUBE)
pub impl DailyComboOne of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_ONE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "3 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Combo Starter",
            description: "Achieve a 4+ line combo.",
            icon: "fa-bolt",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboFour::identifier(), total.into(), ComboFour::description(total),
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

/// DailyComboTwo - Achieve a 5+ line combo (rewards 5 CUBE)
pub impl DailyComboTwo of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_TWO'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "5 CUBE", ICON());
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

/// DailyComboThree - Achieve a 6+ line combo (rewards 10 CUBE)
pub impl DailyComboThree of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_THREE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "10 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Combo Expert",
            description: "Achieve a 6+ line combo.",
            icon: "fa-fire-flame-curved",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboSix::identifier(), total.into(), ComboSix::description(total),
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
