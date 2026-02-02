/// Player quests - Daily quests for playing games
use quest::types::reward::RewardTrait;
use quest::types::task::{Task as QuestTask, TaskTrait as QuestTaskTrait};
use starknet::ContractAddress;
use crate::elements::tasks::grinder::Grinder;
use super::index::{ICON, ONE_DAY, QuestMetadataTrait, QuestProps, QuestTrait};

/// DailyPlayerOne - Play 1 game (rewards 5 CUBE)
pub impl DailyPlayerOne of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_PLAYER_ONE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 1;
        let reward = RewardTrait::new("Quest Reward", "5 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Warm-Up",
            description: "Play 1 game to start your day.",
            icon: "fa-play",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(Grinder::identifier(), total.into(), Grinder::description(total)),
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

/// DailyPlayerTwo - Play 3 games (rewards 10 CUBE)
pub impl DailyPlayerTwo of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_PLAYER_TWO'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 3;
        let reward = RewardTrait::new("Quest Reward", "10 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Getting Started",
            description: "Play 3 games to get in the zone.",
            icon: "fa-dice-three",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(Grinder::identifier(), total.into(), Grinder::description(total)),
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

/// DailyPlayerThree - Play 5 games (rewards 20 CUBE)
pub impl DailyPlayerThree of QuestTrait {
    fn identifier() -> felt252 {
        'DAILY_PLAYER_THREE'
    }

    fn props(registry: ContractAddress) -> QuestProps {
        let total = 5;
        let reward = RewardTrait::new("Quest Reward", "20 CUBE", ICON());
        let metadata = QuestMetadataTrait::new(
            name: "Dedicated",
            description: "Play 5 games to prove your dedication.",
            icon: "fa-fire",
            registry: registry,
            rewards: array![reward].span(),
        );
        let tasks: Array<QuestTask> = array![
            QuestTaskTrait::new(Grinder::identifier(), total.into(), Grinder::description(total)),
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
