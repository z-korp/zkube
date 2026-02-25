/// Combo streak quests - Daily quests for reaching combo streak milestones
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::combo_streak::{
    ComboStreakFifteen, ComboStreakTwenty, ComboStreakTwentyFive,
};
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyComboStreakOne - Reach a 15+ combo streak (rewards 3 CUBE)
pub impl DailyComboStreakOne of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_STREAK_ONE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "3 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Streak Starter",
            description: "Reach a 15+ combo streak.",
            icon: "fa-arrow-trend-up",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboStreakFifteen::identifier(),
                total.into(),
                ComboStreakFifteen::description(total),
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

/// DailyComboStreakTwo - Reach a 20+ combo streak (rewards 5 CUBE)
pub impl DailyComboStreakTwo of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_STREAK_TWO'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "5 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Streak Builder",
            description: "Reach a 20+ combo streak.",
            icon: "fa-arrow-trend-up",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboStreakTwenty::identifier(),
                total.into(),
                ComboStreakTwenty::description(total),
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

/// DailyComboStreakThree - Reach a 25+ combo streak (rewards 10 CUBE)
pub impl DailyComboStreakThree of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_COMBO_STREAK_THREE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "10 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Streak Master",
            description: "Reach a 25+ combo streak.",
            icon: "fa-arrow-trend-up",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                ComboStreakTwentyFive::identifier(),
                total.into(),
                ComboStreakTwentyFive::description(total),
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
