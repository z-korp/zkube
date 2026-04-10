use quest::types::metadata::{QuestMetadata, QuestMetadataTrait};
use quest::types::reward::{QuestReward, RewardTrait};
use quest::types::task::{Task, TaskTrait};
use starknet::ContractAddress;
use zkube::elements::tasks::index::Task as ZTask;
use zkube::elements::tasks::interface::TaskTrait as ZTaskTrait;

pub const QUEST_LINE_SWEEPER: felt252 = 'QUEST_LINE_SWEEPER';
pub const QUEST_COMBO_CHAIN: felt252 = 'QUEST_COMBO_CHAIN';
pub const QUEST_COMBO_STREAK: felt252 = 'QUEST_COMBO_STREAK';
pub const QUEST_BIG_COMBO: felt252 = 'QUEST_BIG_COMBO';
pub const QUEST_BONUS_USER: felt252 = 'QUEST_BONUS_USER';
pub const QUEST_DAILY_PLAYER: felt252 = 'QUEST_DAILY_PLAYER';
pub const QUEST_STREAK_HUNTER: felt252 = 'QUEST_STREAK_HUNTER';
pub const QUEST_ZONE_RUNNER: felt252 = 'QUEST_ZONE_RUNNER';
pub const QUEST_PERFECT_MOVE: felt252 = 'QUEST_PERFECT_MOVE';
pub const QUEST_DAILY_FINISHER: felt252 = 'QUEST_DAILY_FINISHER';
pub const QUEST_WEEKLY_GRINDER: felt252 = 'QUEST_WEEKLY_GRINDER';
pub const QUEST_WEEKLY_EXPLORER: felt252 = 'QUEST_WEEKLY_EXPLORER';

const DAY: u64 = 86400;
const THREE_DAYS: u64 = 259200;
const WEEK: u64 = 604800;
/// Monday-aligned offset (Unix epoch was Thursday; +4 days = Monday)
const MONDAY_OFFSET: u64 = 345600;

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
            Self::line_sweeper(registry), Self::bonus_user(registry), Self::streak_hunter(registry),
            Self::combo_streak(registry), Self::daily_player(registry),
            Self::perfect_move(registry), Self::big_combo(registry), Self::zone_runner(registry),
            Self::combo_chain(registry), Self::daily_finisher(registry),
            Self::weekly_grinder(registry), Self::weekly_explorer(registry),
        ]
    }

    // ── Group 1 daily (start=0, duration=DAY, interval=THREE_DAYS) ──

    fn line_sweeper(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_LINE_SWEEPER,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::LineClear, 20)].span(),
            array![].span(),
            metadata(registry, "Line Sweeper", "Clear 20 lines", 1),
        )
    }

    fn bonus_user(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_BONUS_USER,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::BonusUsed, 3)].span(),
            array![].span(),
            metadata(registry, "Bonus User", "Use 3 bonuses", 1),
        )
    }

    fn streak_hunter(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_STREAK_HUNTER,
            0,
            DAY,
            THREE_DAYS,
            array![task(ZTask::HighCombo, 1)].span(),
            array![].span(),
            metadata(registry, "Streak Hunter", "Reach a 10+ combo streak", 1),
        )
    }

    // ── Group 2 daily (start=DAY, duration=DAY, interval=THREE_DAYS) ──

    fn combo_streak(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_COMBO_STREAK,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo3, 2)].span(),
            array![].span(),
            metadata(registry, "Combo Streak", "Hit 3+ combo twice", 1),
        )
    }

    fn daily_player(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_DAILY_PLAYER,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::DailyPlay, 1)].span(),
            array![].span(),
            metadata(registry, "Daily Player", "Play a daily challenge", 1),
        )
    }

    fn perfect_move(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_PERFECT_MOVE,
            DAY,
            DAY,
            THREE_DAYS,
            array![task(ZTask::PerfectLevel, 1)].span(),
            array![].span(),
            metadata(registry, "Perfect Move", "3-star a level", 1),
        )
    }

    // ── Group 3 daily (start=DAY*2, duration=DAY, interval=THREE_DAYS) ──

    fn big_combo(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_BIG_COMBO,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo4, 1)].span(),
            array![].span(),
            metadata(registry, "Big Combo", "Hit a 4+ combo", 1),
        )
    }

    fn zone_runner(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_ZONE_RUNNER,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::GameStart, 2)].span(),
            array![].span(),
            metadata(registry, "Zone Runner", "Start 2 games", 1),
        )
    }

    fn combo_chain(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_COMBO_CHAIN,
            DAY * 2,
            DAY,
            THREE_DAYS,
            array![task(ZTask::Combo2, 5)].span(),
            array![].span(),
            metadata(registry, "Combo Chain", "Hit 2+ combo 5 times", 1),
        )
    }

    // ── Daily meta (start=0, duration=DAY, interval=DAY) ──

    fn daily_finisher(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_DAILY_FINISHER,
            0,
            DAY,
            DAY,
            array![task(ZTask::DailyQuestDone, 3)].span(),
            array![].span(),
            metadata(registry, "Daily Finisher", "Complete 3 daily quests", 2),
        )
    }

    // ── Weekly (start=MONDAY_OFFSET, duration=WEEK, interval=WEEK) ──

    fn weekly_grinder(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_WEEKLY_GRINDER,
            MONDAY_OFFSET,
            WEEK,
            WEEK,
            array![task(ZTask::LineClear, 150)].span(),
            array![].span(),
            metadata(registry, "Weekly Grinder", "Clear 150 lines this week", 5),
        )
    }

    fn weekly_explorer(registry: ContractAddress) -> QuestDefinitionProps {
        make_quest(
            QUEST_WEEKLY_EXPLORER,
            MONDAY_OFFSET,
            WEEK,
            WEEK,
            array![task(ZTask::DailyPlay, 3)].span(),
            array![].span(),
            metadata(registry, "Weekly Explorer", "Play daily challenge 3 times", 5),
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
