/// Finisher quest - Complete all daily quests
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::master::DailyMaster;
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyFinisher - Complete all 9 daily quests (rewards 25 CUBE)
pub impl DailyFinisher of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_FINISHER'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 9;
        let reward = RewardTrait::new("Quest Reward", "25 CUBE + Achievement", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Daily Champion",
            description: "Complete all daily quests to prove your dedication.",
            icon: "fa-trophy",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(
                DailyMaster::identifier(), total.into(), DailyMaster::description(total),
            ),
        ];
        // No conditions - unlocked from start, but requires all 9 other quests to complete
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
