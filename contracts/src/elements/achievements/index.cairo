use achievement::types::metadata::{AchievementMetadata, MetadataTrait};
use achievement::types::reward::AchievementReward;
use achievement::types::task::{Task, TaskTrait};
use zkube::elements::tasks::index::Task as ZTask;
use zkube::elements::tasks::interface::TaskTrait as ZTaskTrait;

#[derive(Drop)]
pub struct AchievementDefinitionProps {
    pub id: felt252,
    pub start: u64,
    pub end: u64,
    pub tasks: Span<Task>,
    pub metadata: AchievementMetadata,
}

#[generate_trait]
pub impl AchievementDefsImpl of AchievementDefsTrait {
    fn all() -> Array<AchievementDefinitionProps> {
        array![
            Self::grinder_i(), Self::grinder_ii(), Self::grinder_iii(), Self::grinder_iv(),
            Self::sweeper_i(), Self::sweeper_ii(), Self::sweeper_iii(), Self::sweeper_iv(),
            Self::combo_master_i(), Self::combo_master_ii(), Self::combo_master_iii(),
            Self::combo_master_iv(), Self::boss_slayer_i(), Self::boss_slayer_ii(),
            Self::boss_slayer_iii(), Self::boss_slayer_iv(), Self::explorer_i(),
            Self::explorer_ii(), Self::explorer_iii(), Self::explorer_iv(), Self::challenger_i(),
            Self::challenger_ii(), Self::challenger_iii(), Self::challenger_iv(),
        ]
    }

    fn grinder_i() -> AchievementDefinitionProps {
        make_achievement(
            'GRINDER_I',
            array![task(ZTask::GameStart, 10)].span(),
            metadata('GRINDER', 1, "Grinder I", "Start 10 game runs", 500),
        )
    }
    fn grinder_ii() -> AchievementDefinitionProps {
        make_achievement(
            'GRINDER_II',
            array![task(ZTask::GameStart, 50)].span(),
            metadata('GRINDER', 2, "Grinder II", "Start 50 game runs", 1500),
        )
    }
    fn grinder_iii() -> AchievementDefinitionProps {
        make_achievement(
            'GRINDER_III',
            array![task(ZTask::GameStart, 200)].span(),
            metadata('GRINDER', 3, "Grinder III", "Start 200 game runs", 3000),
        )
    }
    fn grinder_iv() -> AchievementDefinitionProps {
        make_achievement(
            'GRINDER_IV',
            array![task(ZTask::GameStart, 1000)].span(),
            metadata('GRINDER', 4, "Grinder IV", "Start 1000 game runs", 5000),
        )
    }

    fn sweeper_i() -> AchievementDefinitionProps {
        make_achievement(
            'SWEEPER_I',
            array![task(ZTask::LineClear, 100)].span(),
            metadata('SWEEPER', 1, "Sweeper I", "Clear 100 lines", 500),
        )
    }
    fn sweeper_ii() -> AchievementDefinitionProps {
        make_achievement(
            'SWEEPER_II',
            array![task(ZTask::LineClear, 500)].span(),
            metadata('SWEEPER', 2, "Sweeper II", "Clear 500 lines", 1500),
        )
    }
    fn sweeper_iii() -> AchievementDefinitionProps {
        make_achievement(
            'SWEEPER_III',
            array![task(ZTask::LineClear, 2000)].span(),
            metadata('SWEEPER', 3, "Sweeper III", "Clear 2000 lines", 3000),
        )
    }
    fn sweeper_iv() -> AchievementDefinitionProps {
        make_achievement(
            'SWEEPER_IV',
            array![task(ZTask::LineClear, 10000)].span(),
            metadata('SWEEPER', 4, "Sweeper IV", "Clear 10000 lines", 5000),
        )
    }

    fn combo_master_i() -> AchievementDefinitionProps {
        make_achievement(
            'COMBO_MASTER_I',
            array![task(ZTask::Combo3, 1)].span(),
            metadata('COMBO_MASTER', 1, "Combo Master I", "Hit a 3+ combo", 500),
        )
    }
    fn combo_master_ii() -> AchievementDefinitionProps {
        make_achievement(
            'COMBO_MASTER_II',
            array![task(ZTask::Combo4, 1)].span(),
            metadata('COMBO_MASTER', 2, "Combo Master II", "Hit a 4+ combo", 1500),
        )
    }
    fn combo_master_iii() -> AchievementDefinitionProps {
        make_achievement(
            'COMBO_MASTER_III',
            array![task(ZTask::Combo5, 1)].span(),
            metadata('COMBO_MASTER', 3, "Combo Master III", "Hit a 5+ combo", 3000),
        )
    }
    fn combo_master_iv() -> AchievementDefinitionProps {
        make_achievement(
            'COMBO_MASTER_IV',
            array![task(ZTask::Combo5, 10)].span(),
            metadata('COMBO_MASTER', 4, "Combo Master IV", "Hit 10 combos of 5+", 5000),
        )
    }

    fn boss_slayer_i() -> AchievementDefinitionProps {
        make_achievement(
            'BOSS_SLAYER_I',
            array![task(ZTask::BossDefeat, 1)].span(),
            metadata('BOSS_SLAYER', 1, "Boss Slayer I", "Defeat 1 boss", 500),
        )
    }
    fn boss_slayer_ii() -> AchievementDefinitionProps {
        make_achievement(
            'BOSS_SLAYER_II',
            array![task(ZTask::BossDefeat, 5)].span(),
            metadata('BOSS_SLAYER', 2, "Boss Slayer II", "Defeat 5 bosses", 1500),
        )
    }
    fn boss_slayer_iii() -> AchievementDefinitionProps {
        make_achievement(
            'BOSS_SLAYER_III',
            array![task(ZTask::BossDefeat, 15)].span(),
            metadata('BOSS_SLAYER', 3, "Boss Slayer III", "Defeat 15 bosses", 3000),
        )
    }
    fn boss_slayer_iv() -> AchievementDefinitionProps {
        make_achievement(
            'BOSS_SLAYER_IV',
            array![task(ZTask::BossDefeat, 50)].span(),
            metadata('BOSS_SLAYER', 4, "Boss Slayer IV", "Defeat 50 bosses", 5000),
        )
    }

    fn explorer_i() -> AchievementDefinitionProps {
        make_achievement(
            'EXPLORER_I',
            array![task(ZTask::ZoneComplete, 1)].span(),
            metadata('EXPLORER', 1, "Explorer I", "Complete 1 zone", 1000),
        )
    }
    fn explorer_ii() -> AchievementDefinitionProps {
        make_achievement(
            'EXPLORER_II',
            array![task(ZTask::ZoneComplete, 3)].span(),
            metadata('EXPLORER', 2, "Explorer II", "Complete 3 zones", 2000),
        )
    }
    fn explorer_iii() -> AchievementDefinitionProps {
        make_achievement(
            'EXPLORER_III',
            array![task(ZTask::PerfectLevel, 30)].span(),
            metadata('EXPLORER', 3, "Explorer III", "Get 30 perfect levels", 4000),
        )
    }
    fn explorer_iv() -> AchievementDefinitionProps {
        make_achievement(
            'EXPLORER_IV',
            array![task(ZTask::ZoneComplete, 10)].span(),
            metadata('EXPLORER', 4, "Explorer IV", "Complete 10 zones", 10000),
        )
    }

    fn challenger_i() -> AchievementDefinitionProps {
        make_achievement(
            'CHALLENGER_I',
            array![task(ZTask::DailyPlay, 1)].span(),
            metadata('CHALLENGER', 1, "Challenger I", "Play 1 daily challenge", 500),
        )
    }
    fn challenger_ii() -> AchievementDefinitionProps {
        make_achievement(
            'CHALLENGER_II',
            array![task(ZTask::DailyPlay, 10)].span(),
            metadata('CHALLENGER', 2, "Challenger II", "Play 10 daily challenges", 1500),
        )
    }
    fn challenger_iii() -> AchievementDefinitionProps {
        make_achievement(
            'CHALLENGER_III',
            array![task(ZTask::DailyPlay, 50)].span(),
            metadata('CHALLENGER', 3, "Challenger III", "Play 50 daily challenges", 3000),
        )
    }
    fn challenger_iv() -> AchievementDefinitionProps {
        make_achievement(
            'CHALLENGER_IV',
            array![task(ZTask::DailyPlay, 200)].span(),
            metadata('CHALLENGER', 4, "Challenger IV", "Play 200 daily challenges", 5000),
        )
    }
}

#[generate_trait]
pub impl AchievementPointsImpl of AchievementPointsTrait {
    fn xp_for(id: felt252) -> u32 {
        match id {
            'GRINDER_I' => 50,
            'GRINDER_II' => 150,
            'GRINDER_III' => 300,
            'GRINDER_IV' => 500,
            'SWEEPER_I' => 50,
            'SWEEPER_II' => 150,
            'SWEEPER_III' => 300,
            'SWEEPER_IV' => 500,
            'COMBO_MASTER_I' => 50,
            'COMBO_MASTER_II' => 150,
            'COMBO_MASTER_III' => 300,
            'COMBO_MASTER_IV' => 500,
            'BOSS_SLAYER_I' => 50,
            'BOSS_SLAYER_II' => 150,
            'BOSS_SLAYER_III' => 300,
            'BOSS_SLAYER_IV' => 500,
            'EXPLORER_I' => 100,
            'EXPLORER_II' => 200,
            'EXPLORER_III' => 400,
            'EXPLORER_IV' => 1000,
            'CHALLENGER_I' => 50,
            'CHALLENGER_II' => 150,
            'CHALLENGER_III' => 300,
            'CHALLENGER_IV' => 500,
            _ => 0,
        }
    }
}

fn task(task: ZTask, total: u128) -> Task {
    let count: u32 = total.try_into().unwrap();
    TaskTrait::new(task.identifier(), total, task.description(count))
}

fn make_achievement(
    id: felt252, tasks: Span<Task>, metadata: AchievementMetadata,
) -> AchievementDefinitionProps {
    AchievementDefinitionProps { id, start: 0, end: 0, tasks, metadata }
}

fn metadata(
    group: felt252, index: u8, title: ByteArray, description: ByteArray, xp: u16,
) -> AchievementMetadata {
    let _ = title;
    let points: u16 = xp / 100;
    let rewards: Span<AchievementReward> = array![].span();
    MetadataTrait::new(
        'ACHIEVEMENT', description, 'fa-trophy', points, false, index, group, rewards, "",
    )
}
