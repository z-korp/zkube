/// Achievement index - Enumerates all achievements for zKube
use achievement::types::metadata::{AchievementMetadata, MetadataTrait};
use achievement::types::task::Task as AchievementTask;
use crate::elements::achievements;

// Total number of achievements
// Play Rhythm: 5 + Line Sweep: 5 + Combo Flow: 5 + Streak Spark: 3 +
// Cascade Ladder: 8 + Victory Path: 4 + Daily Delusion: 3 = 33
pub const ACHIEVEMENT_COUNT: u8 = 33;

/// Achievement enum representing all achievements
#[derive(Copy, Drop)]
pub enum Achievement {
    None,
    // Play Rhythm (Games Played): 10/25/50/100/250
    GrinderI,
    GrinderII,
    GrinderIII,
    GrinderIV,
    GrinderV,
    // Line Sweep (Lines Cleared): 100/500/1000/5000/10000
    ClearerI,
    ClearerII,
    ClearerIII,
    ClearerIV,
    ClearerV,
    // Combo Flow (3+ combos): 10/25/50/100/200
    ComboI,
    ComboII,
    ComboIII,
    ComboIV,
    ComboV,
    // Streak Spark (combo streak): 15/50/100
    StreakI,
    StreakII,
    StreakIII,
    // Cascade Ladder (one-move clears): 2+/3+/4+/5+/6+/7+/8+/9+
    CascadeI,
    CascadeII,
    CascadeIII,
    CascadeIV,
    CascadeV,
    CascadeVI,
    CascadeVII,
    CascadeVIII,
    // Victory Path (level 50 completions): 1/3/10/50
    ChampionI,
    ChampionII,
    ChampionIII,
    ChampionIV,
    // Daily Delusion (daily finisher completions): 1/3/10
    DailyMasterI,
    DailyMasterII,
    DailyMasterIII,
}

#[generate_trait]
pub impl AchievementImpl of AchievementTrait {
    fn identifier(self: Achievement) -> felt252 {
        match self {
            Achievement::None => 0,
            Achievement::GrinderI => achievements::grinder::Grinder::identifier(0),
            Achievement::GrinderII => achievements::grinder::Grinder::identifier(1),
            Achievement::GrinderIII => achievements::grinder::Grinder::identifier(2),
            Achievement::GrinderIV => achievements::grinder::Grinder::identifier(3),
            Achievement::GrinderV => achievements::grinder::Grinder::identifier(4),
            Achievement::ClearerI => achievements::clearer::Clearer::identifier(0),
            Achievement::ClearerII => achievements::clearer::Clearer::identifier(1),
            Achievement::ClearerIII => achievements::clearer::Clearer::identifier(2),
            Achievement::ClearerIV => achievements::clearer::Clearer::identifier(3),
            Achievement::ClearerV => achievements::clearer::Clearer::identifier(4),
            Achievement::ComboI => achievements::combo::Combo::identifier(0),
            Achievement::ComboII => achievements::combo::Combo::identifier(1),
            Achievement::ComboIII => achievements::combo::Combo::identifier(2),
            Achievement::ComboIV => achievements::combo::Combo::identifier(3),
            Achievement::ComboV => achievements::combo::Combo::identifier(4),
            Achievement::StreakI => achievements::streak::Streak::identifier(0),
            Achievement::StreakII => achievements::streak::Streak::identifier(1),
            Achievement::StreakIII => achievements::streak::Streak::identifier(2),
            Achievement::CascadeI => achievements::cascade::Cascade::identifier(0),
            Achievement::CascadeII => achievements::cascade::Cascade::identifier(1),
            Achievement::CascadeIII => achievements::cascade::Cascade::identifier(2),
            Achievement::CascadeIV => achievements::cascade::Cascade::identifier(3),
            Achievement::CascadeV => achievements::cascade::Cascade::identifier(4),
            Achievement::CascadeVI => achievements::cascade::Cascade::identifier(5),
            Achievement::CascadeVII => achievements::cascade::Cascade::identifier(6),
            Achievement::CascadeVIII => achievements::cascade::Cascade::identifier(7),
            Achievement::ChampionI => achievements::champion::Champion::identifier(0),
            Achievement::ChampionII => achievements::champion::Champion::identifier(1),
            Achievement::ChampionIII => achievements::champion::Champion::identifier(2),
            Achievement::ChampionIV => achievements::champion::Champion::identifier(3),
            Achievement::DailyMasterI => achievements::master::Master::identifier(0),
            Achievement::DailyMasterII => achievements::master::Master::identifier(1),
            Achievement::DailyMasterIII => achievements::master::Master::identifier(2),
        }
    }

    fn tasks(self: Achievement) -> Span<AchievementTask> {
        match self {
            Achievement::None => [].span(),
            Achievement::GrinderI => achievements::grinder::Grinder::tasks(0),
            Achievement::GrinderII => achievements::grinder::Grinder::tasks(1),
            Achievement::GrinderIII => achievements::grinder::Grinder::tasks(2),
            Achievement::GrinderIV => achievements::grinder::Grinder::tasks(3),
            Achievement::GrinderV => achievements::grinder::Grinder::tasks(4),
            Achievement::ClearerI => achievements::clearer::Clearer::tasks(0),
            Achievement::ClearerII => achievements::clearer::Clearer::tasks(1),
            Achievement::ClearerIII => achievements::clearer::Clearer::tasks(2),
            Achievement::ClearerIV => achievements::clearer::Clearer::tasks(3),
            Achievement::ClearerV => achievements::clearer::Clearer::tasks(4),
            Achievement::ComboI => achievements::combo::Combo::tasks(0),
            Achievement::ComboII => achievements::combo::Combo::tasks(1),
            Achievement::ComboIII => achievements::combo::Combo::tasks(2),
            Achievement::ComboIV => achievements::combo::Combo::tasks(3),
            Achievement::ComboV => achievements::combo::Combo::tasks(4),
            Achievement::StreakI => achievements::streak::Streak::tasks(0),
            Achievement::StreakII => achievements::streak::Streak::tasks(1),
            Achievement::StreakIII => achievements::streak::Streak::tasks(2),
            Achievement::CascadeI => achievements::cascade::Cascade::tasks(0),
            Achievement::CascadeII => achievements::cascade::Cascade::tasks(1),
            Achievement::CascadeIII => achievements::cascade::Cascade::tasks(2),
            Achievement::CascadeIV => achievements::cascade::Cascade::tasks(3),
            Achievement::CascadeV => achievements::cascade::Cascade::tasks(4),
            Achievement::CascadeVI => achievements::cascade::Cascade::tasks(5),
            Achievement::CascadeVII => achievements::cascade::Cascade::tasks(6),
            Achievement::CascadeVIII => achievements::cascade::Cascade::tasks(7),
            Achievement::ChampionI => achievements::champion::Champion::tasks(0),
            Achievement::ChampionII => achievements::champion::Champion::tasks(1),
            Achievement::ChampionIII => achievements::champion::Champion::tasks(2),
            Achievement::ChampionIV => achievements::champion::Champion::tasks(3),
            Achievement::DailyMasterI => achievements::master::Master::tasks(0),
            Achievement::DailyMasterII => achievements::master::Master::tasks(1),
            Achievement::DailyMasterIII => achievements::master::Master::tasks(2),
        }
    }

    fn metadata(self: Achievement) -> AchievementMetadata {
        match self {
            Achievement::None => MetadataTrait::new(
                title: '',
                description: "",
                icon: '',
                points: 0,
                hidden: false,
                index: 0,
                group: '',
                rewards: array![].span(),
                data: "",
            ),
            Achievement::GrinderI => Self::_metadata(achievements::grinder::Grinder::title(0), achievements::grinder::Grinder::description(0), achievements::grinder::Grinder::icon(0), achievements::grinder::Grinder::points(0), achievements::grinder::Grinder::hidden(0), achievements::grinder::Grinder::index(0), achievements::grinder::Grinder::group()),
            Achievement::GrinderII => Self::_metadata(achievements::grinder::Grinder::title(1), achievements::grinder::Grinder::description(1), achievements::grinder::Grinder::icon(1), achievements::grinder::Grinder::points(1), achievements::grinder::Grinder::hidden(1), achievements::grinder::Grinder::index(1), achievements::grinder::Grinder::group()),
            Achievement::GrinderIII => Self::_metadata(achievements::grinder::Grinder::title(2), achievements::grinder::Grinder::description(2), achievements::grinder::Grinder::icon(2), achievements::grinder::Grinder::points(2), achievements::grinder::Grinder::hidden(2), achievements::grinder::Grinder::index(2), achievements::grinder::Grinder::group()),
            Achievement::GrinderIV => Self::_metadata(achievements::grinder::Grinder::title(3), achievements::grinder::Grinder::description(3), achievements::grinder::Grinder::icon(3), achievements::grinder::Grinder::points(3), achievements::grinder::Grinder::hidden(3), achievements::grinder::Grinder::index(3), achievements::grinder::Grinder::group()),
            Achievement::GrinderV => Self::_metadata(achievements::grinder::Grinder::title(4), achievements::grinder::Grinder::description(4), achievements::grinder::Grinder::icon(4), achievements::grinder::Grinder::points(4), achievements::grinder::Grinder::hidden(4), achievements::grinder::Grinder::index(4), achievements::grinder::Grinder::group()),
            Achievement::ClearerI => Self::_metadata(achievements::clearer::Clearer::title(0), achievements::clearer::Clearer::description(0), achievements::clearer::Clearer::icon(0), achievements::clearer::Clearer::points(0), achievements::clearer::Clearer::hidden(0), achievements::clearer::Clearer::index(0), achievements::clearer::Clearer::group()),
            Achievement::ClearerII => Self::_metadata(achievements::clearer::Clearer::title(1), achievements::clearer::Clearer::description(1), achievements::clearer::Clearer::icon(1), achievements::clearer::Clearer::points(1), achievements::clearer::Clearer::hidden(1), achievements::clearer::Clearer::index(1), achievements::clearer::Clearer::group()),
            Achievement::ClearerIII => Self::_metadata(achievements::clearer::Clearer::title(2), achievements::clearer::Clearer::description(2), achievements::clearer::Clearer::icon(2), achievements::clearer::Clearer::points(2), achievements::clearer::Clearer::hidden(2), achievements::clearer::Clearer::index(2), achievements::clearer::Clearer::group()),
            Achievement::ClearerIV => Self::_metadata(achievements::clearer::Clearer::title(3), achievements::clearer::Clearer::description(3), achievements::clearer::Clearer::icon(3), achievements::clearer::Clearer::points(3), achievements::clearer::Clearer::hidden(3), achievements::clearer::Clearer::index(3), achievements::clearer::Clearer::group()),
            Achievement::ClearerV => Self::_metadata(achievements::clearer::Clearer::title(4), achievements::clearer::Clearer::description(4), achievements::clearer::Clearer::icon(4), achievements::clearer::Clearer::points(4), achievements::clearer::Clearer::hidden(4), achievements::clearer::Clearer::index(4), achievements::clearer::Clearer::group()),
            Achievement::ComboI => Self::_metadata(achievements::combo::Combo::title(0), achievements::combo::Combo::description(0), achievements::combo::Combo::icon(0), achievements::combo::Combo::points(0), achievements::combo::Combo::hidden(0), achievements::combo::Combo::index(0), achievements::combo::Combo::group()),
            Achievement::ComboII => Self::_metadata(achievements::combo::Combo::title(1), achievements::combo::Combo::description(1), achievements::combo::Combo::icon(1), achievements::combo::Combo::points(1), achievements::combo::Combo::hidden(1), achievements::combo::Combo::index(1), achievements::combo::Combo::group()),
            Achievement::ComboIII => Self::_metadata(achievements::combo::Combo::title(2), achievements::combo::Combo::description(2), achievements::combo::Combo::icon(2), achievements::combo::Combo::points(2), achievements::combo::Combo::hidden(2), achievements::combo::Combo::index(2), achievements::combo::Combo::group()),
            Achievement::ComboIV => Self::_metadata(achievements::combo::Combo::title(3), achievements::combo::Combo::description(3), achievements::combo::Combo::icon(3), achievements::combo::Combo::points(3), achievements::combo::Combo::hidden(3), achievements::combo::Combo::index(3), achievements::combo::Combo::group()),
            Achievement::ComboV => Self::_metadata(achievements::combo::Combo::title(4), achievements::combo::Combo::description(4), achievements::combo::Combo::icon(4), achievements::combo::Combo::points(4), achievements::combo::Combo::hidden(4), achievements::combo::Combo::index(4), achievements::combo::Combo::group()),
            Achievement::StreakI => Self::_metadata(achievements::streak::Streak::title(0), achievements::streak::Streak::description(0), achievements::streak::Streak::icon(0), achievements::streak::Streak::points(0), achievements::streak::Streak::hidden(0), achievements::streak::Streak::index(0), achievements::streak::Streak::group()),
            Achievement::StreakII => Self::_metadata(achievements::streak::Streak::title(1), achievements::streak::Streak::description(1), achievements::streak::Streak::icon(1), achievements::streak::Streak::points(1), achievements::streak::Streak::hidden(1), achievements::streak::Streak::index(1), achievements::streak::Streak::group()),
            Achievement::StreakIII => Self::_metadata(achievements::streak::Streak::title(2), achievements::streak::Streak::description(2), achievements::streak::Streak::icon(2), achievements::streak::Streak::points(2), achievements::streak::Streak::hidden(2), achievements::streak::Streak::index(2), achievements::streak::Streak::group()),
            Achievement::CascadeI => Self::_metadata(achievements::cascade::Cascade::title(0), achievements::cascade::Cascade::description(0), achievements::cascade::Cascade::icon(0), achievements::cascade::Cascade::points(0), achievements::cascade::Cascade::hidden(0), achievements::cascade::Cascade::index(0), achievements::cascade::Cascade::group()),
            Achievement::CascadeII => Self::_metadata(achievements::cascade::Cascade::title(1), achievements::cascade::Cascade::description(1), achievements::cascade::Cascade::icon(1), achievements::cascade::Cascade::points(1), achievements::cascade::Cascade::hidden(1), achievements::cascade::Cascade::index(1), achievements::cascade::Cascade::group()),
            Achievement::CascadeIII => Self::_metadata(achievements::cascade::Cascade::title(2), achievements::cascade::Cascade::description(2), achievements::cascade::Cascade::icon(2), achievements::cascade::Cascade::points(2), achievements::cascade::Cascade::hidden(2), achievements::cascade::Cascade::index(2), achievements::cascade::Cascade::group()),
            Achievement::CascadeIV => Self::_metadata(achievements::cascade::Cascade::title(3), achievements::cascade::Cascade::description(3), achievements::cascade::Cascade::icon(3), achievements::cascade::Cascade::points(3), achievements::cascade::Cascade::hidden(3), achievements::cascade::Cascade::index(3), achievements::cascade::Cascade::group()),
            Achievement::CascadeV => Self::_metadata(achievements::cascade::Cascade::title(4), achievements::cascade::Cascade::description(4), achievements::cascade::Cascade::icon(4), achievements::cascade::Cascade::points(4), achievements::cascade::Cascade::hidden(4), achievements::cascade::Cascade::index(4), achievements::cascade::Cascade::group()),
            Achievement::CascadeVI => Self::_metadata(achievements::cascade::Cascade::title(5), achievements::cascade::Cascade::description(5), achievements::cascade::Cascade::icon(5), achievements::cascade::Cascade::points(5), achievements::cascade::Cascade::hidden(5), achievements::cascade::Cascade::index(5), achievements::cascade::Cascade::group()),
            Achievement::CascadeVII => Self::_metadata(achievements::cascade::Cascade::title(6), achievements::cascade::Cascade::description(6), achievements::cascade::Cascade::icon(6), achievements::cascade::Cascade::points(6), achievements::cascade::Cascade::hidden(6), achievements::cascade::Cascade::index(6), achievements::cascade::Cascade::group()),
            Achievement::CascadeVIII => Self::_metadata(achievements::cascade::Cascade::title(7), achievements::cascade::Cascade::description(7), achievements::cascade::Cascade::icon(7), achievements::cascade::Cascade::points(7), achievements::cascade::Cascade::hidden(7), achievements::cascade::Cascade::index(7), achievements::cascade::Cascade::group()),
            Achievement::ChampionI => Self::_metadata(achievements::champion::Champion::title(0), achievements::champion::Champion::description(0), achievements::champion::Champion::icon(0), achievements::champion::Champion::points(0), achievements::champion::Champion::hidden(0), achievements::champion::Champion::index(0), achievements::champion::Champion::group()),
            Achievement::ChampionII => Self::_metadata(achievements::champion::Champion::title(1), achievements::champion::Champion::description(1), achievements::champion::Champion::icon(1), achievements::champion::Champion::points(1), achievements::champion::Champion::hidden(1), achievements::champion::Champion::index(1), achievements::champion::Champion::group()),
            Achievement::ChampionIII => Self::_metadata(achievements::champion::Champion::title(2), achievements::champion::Champion::description(2), achievements::champion::Champion::icon(2), achievements::champion::Champion::points(2), achievements::champion::Champion::hidden(2), achievements::champion::Champion::index(2), achievements::champion::Champion::group()),
            Achievement::ChampionIV => Self::_metadata(achievements::champion::Champion::title(3), achievements::champion::Champion::description(3), achievements::champion::Champion::icon(3), achievements::champion::Champion::points(3), achievements::champion::Champion::hidden(3), achievements::champion::Champion::index(3), achievements::champion::Champion::group()),
            Achievement::DailyMasterI => Self::_metadata(achievements::master::Master::title(0), achievements::master::Master::description(0), achievements::master::Master::icon(0), achievements::master::Master::points(0), achievements::master::Master::hidden(0), achievements::master::Master::index(0), achievements::master::Master::group()),
            Achievement::DailyMasterII => Self::_metadata(achievements::master::Master::title(1), achievements::master::Master::description(1), achievements::master::Master::icon(1), achievements::master::Master::points(1), achievements::master::Master::hidden(1), achievements::master::Master::index(1), achievements::master::Master::group()),
            Achievement::DailyMasterIII => Self::_metadata(achievements::master::Master::title(2), achievements::master::Master::description(2), achievements::master::Master::icon(2), achievements::master::Master::points(2), achievements::master::Master::hidden(2), achievements::master::Master::index(2), achievements::master::Master::group()),
        }
    }

    fn _metadata(title: felt252, description: ByteArray, icon: felt252, points: u16, hidden: bool, index: u8, group: felt252) -> AchievementMetadata {
        MetadataTrait::new(
            title: title,
            description: description,
            icon: icon,
            points: points,
            hidden: hidden,
            index: index,
            group: group,
            rewards: array![].span(),
            data: "",
        )
    }
}

// Into<u8, Achievement>
impl IntoU8Achievement of core::traits::Into<u8, Achievement> {
    fn into(self: u8) -> Achievement {
        match self {
            0 => Achievement::None,
            1 => Achievement::GrinderI,
            2 => Achievement::GrinderII,
            3 => Achievement::GrinderIII,
            4 => Achievement::GrinderIV,
            5 => Achievement::GrinderV,
            6 => Achievement::ClearerI,
            7 => Achievement::ClearerII,
            8 => Achievement::ClearerIII,
            9 => Achievement::ClearerIV,
            10 => Achievement::ClearerV,
            11 => Achievement::ComboI,
            12 => Achievement::ComboII,
            13 => Achievement::ComboIII,
            14 => Achievement::ComboIV,
            15 => Achievement::ComboV,
            16 => Achievement::StreakI,
            17 => Achievement::StreakII,
            18 => Achievement::StreakIII,
            19 => Achievement::CascadeI,
            20 => Achievement::CascadeII,
            21 => Achievement::CascadeIII,
            22 => Achievement::CascadeIV,
            23 => Achievement::CascadeV,
            24 => Achievement::CascadeVI,
            25 => Achievement::CascadeVII,
            26 => Achievement::CascadeVIII,
            27 => Achievement::ChampionI,
            28 => Achievement::ChampionII,
            29 => Achievement::ChampionIII,
            30 => Achievement::ChampionIV,
            31 => Achievement::DailyMasterI,
            32 => Achievement::DailyMasterII,
            33 => Achievement::DailyMasterIII,
            _ => Achievement::None,
        }
    }
}
