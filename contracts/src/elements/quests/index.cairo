use quest::types::metadata::{QuestMetadata, QuestMetadataTrait};
use quest::types::reward::{QuestReward, RewardTrait};
use quest::types::task::{Task, TaskTrait};
use starknet::ContractAddress;
use zkube::elements::tasks::index::Task as ZTask;
use zkube::elements::tasks::interface::TaskTrait as ZTaskTrait;

pub const QUEST_LINE_CLEAR_I: felt252 = 'QUEST_LINE_CLEAR_I';
pub const QUEST_LINE_CLEAR_II: felt252 = 'QUEST_LINE_CLEAR_II';
pub const QUEST_LINE_CLEAR_III: felt252 = 'QUEST_LINE_CLEAR_III';
pub const QUEST_COMBO_I: felt252 = 'QUEST_COMBO_I';
pub const QUEST_COMBO_II: felt252 = 'QUEST_COMBO_II';
pub const QUEST_COMBO_III: felt252 = 'QUEST_COMBO_III';
pub const QUEST_BONUS_I: felt252 = 'QUEST_BONUS_I';
pub const QUEST_BONUS_II: felt252 = 'QUEST_BONUS_II';
pub const QUEST_DAILY_CHALLENGER: felt252 = 'QUEST_DAILY_CHALLENGER';
pub const QUEST_DAILY_FINISHER: felt252 = 'QUEST_DAILY_FINISHER';
pub const QUEST_WEEKLY_GRINDER: felt252 = 'QUEST_WEEKLY_GRINDER';
pub const QUEST_WEEKLY_CHALLENGER: felt252 = 'QUEST_WEEKLY_CHALLENGER';

const DAY: u64 = 86400;
const THREE_DAYS: u64 = 259200;
const WEEK: u64 = 604800;

#[derive(Drop)]
pub struct QuestDefinitionProps {
    pub id: felt252,
    pub start: u64,
    pub end: u64,
    pub duration: u64,
    pub interval: u64,
    pub tasks: Span<Task>,
    pub conditions: Span<felt252>,
    pub metadata: QuestMetadata,
}

#[generate_trait]
pub impl QuestDefsImpl of QuestDefsTrait {
    fn all(registry: ContractAddress) -> Array<QuestDefinitionProps> {
        array![
            Self::line_clear_i(registry), Self::line_clear_ii(registry),
            Self::line_clear_iii(registry), Self::combo_i(registry), Self::combo_ii(registry),
            Self::combo_iii(registry), Self::bonus_i(registry), Self::bonus_ii(registry),
            Self::daily_challenger(registry), Self::daily_finisher(registry),
            Self::weekly_grinder(registry), Self::weekly_challenger(registry),
        ]
    }

    fn line_clear_i(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_LINE_CLEAR_I,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::LineClear, 30)].span(),
            array![].span(),
            metadata(registry, "Line Clear I", "Clear 30 lines", 1),
        )
    }

    fn line_clear_ii(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_LINE_CLEAR_II,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::LineClear, 60)].span(),
            array![].span(),
            metadata(registry, "Line Clear II", "Clear 60 lines", 1),
        )
    }

    fn line_clear_iii(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_LINE_CLEAR_III,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::LineClear, 100)].span(),
            array![].span(),
            metadata(registry, "Line Clear III", "Clear 100 lines", 2),
        )
    }

    fn combo_i(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_COMBO_I,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo3, 5)].span(),
            array![].span(),
            metadata(registry, "Combo I", "Hit 3+ combo 5 times", 1),
        )
    }

    fn combo_ii(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_COMBO_II,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo4, 3)].span(),
            array![].span(),
            metadata(registry, "Combo II", "Hit 4+ combo 3 times", 1),
        )
    }

    fn combo_iii(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_COMBO_III,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo5, 1)].span(),
            array![].span(),
            metadata(registry, "Combo III", "Hit 5+ combo once", 2),
        )
    }

    fn bonus_i(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_BONUS_I,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::BonusUsed, 3)].span(),
            array![].span(),
            metadata(registry, "Bonus I", "Use 3 bonuses", 1),
        )
    }

    fn bonus_ii(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_BONUS_II,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::BonusUsed, 8)].span(),
            array![].span(),
            metadata(registry, "Bonus II", "Use 8 bonuses", 2),
        )
    }

    fn daily_challenger(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_DAILY_CHALLENGER,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::DailyPlay, 1)].span(),
            array![].span(),
            metadata(registry, "Daily Challenger", "Play one daily challenge", 2),
        )
    }

    fn daily_finisher(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_DAILY_FINISHER,
            0,
            DAY,
            DAY,
            array![task(ZTask::DailyQuestDone, 3)].span(),
            array![].span(),
            metadata(registry, "Daily Finisher", "Finish 3 daily quests", 2),
        )
    }

    fn weekly_grinder(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_WEEKLY_GRINDER,
            0,
            WEEK,
            WEEK,
            array![task(ZTask::LevelComplete, 30)].span(),
            array![].span(),
            metadata(registry, "Weekly Grinder", "Complete 30 levels this week", 5),
        )
    }

    fn weekly_challenger(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_WEEKLY_CHALLENGER,
            0,
            WEEK,
            WEEK,
            array![task(ZTask::DailyPlay, 3)].span(),
            array![].span(),
            metadata(registry, "Weekly Challenger", "Play daily challenge 7 times", 5),
        )
    }
}

fn task(task: ZTask, total: u128) -> Task {
    let count: u32 = total.try_into().unwrap();
    TaskTrait::new(task.identifier(), total, task.description(count))
}

fn make_quest(
    id: felt252,
    start: u64,
    duration: u64,
    interval: u64,
    tasks: Span<Task>,
    conditions: Span<felt252>,
    metadata: QuestMetadata,
) -> QuestDefinitionProps {
    QuestDefinitionProps { id, start, end: 0, duration, interval, tasks, conditions, metadata }
}

fn metadata(
    registry: ContractAddress, name: ByteArray, description: ByteArray, reward_stars: u8,
) -> QuestMetadata {
    let rewards: Span<QuestReward> = array![
        RewardTrait::new("Stars", format!("{} star reward", reward_stars), "fa-star"),
    ]
        .span();

    QuestMetadataTrait::new(name, description, "fa-list-check", registry, rewards)
}
