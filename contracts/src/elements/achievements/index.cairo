/// Achievement index - Enumerates all achievements for zKube
use achievement::types::metadata::{AchievementMetadata, MetadataTrait};
use achievement::types::task::Task as AchievementTask;
use crate::elements::achievements;

// Total number of achievements
// Grinder: 5 + Clearer: 5 + Combo: 3 + Chain: 3 + SuperChain: 3 + Leveler: 5 + Scorer: 3 + Master: 1 = 28
pub const ACHIEVEMENT_COUNT: u8 = 28;

/// Achievement enum representing all achievements
#[derive(Copy, Drop)]
pub enum Achievement {
    None,
    // Grinder (Games Played): 10/25/50/100/250
    GrinderI,
    GrinderII,
    GrinderIII,
    GrinderIV,
    GrinderV,
    // Clearer (Lines Cleared): 100/500/1000/5000/10000
    ClearerI,
    ClearerII,
    ClearerIII,
    ClearerIV,
    ClearerV,
    // Combo (3+ combos): 10/50/100
    ComboI,
    ComboII,
    ComboIII,
    // Chain (5+ combos): 5/25/50
    ChainI,
    ChainII,
    ChainIII,
    // SuperChain (7+ combos): 1/10/25
    SuperChainI,
    SuperChainII,
    SuperChainIII,
    // Leveler (Reach levels): 10/20/30/40/50
    LevelerI,
    LevelerII,
    LevelerIII,
    LevelerIV,
    LevelerV,
    // Scorer (High score in level): 100/200/300
    ScorerI,
    ScorerII,
    ScorerIII,
    // Master (Complete all daily quests)
    DailyMaster,
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
            Achievement::ChainI => achievements::chain::Chain::identifier(0),
            Achievement::ChainII => achievements::chain::Chain::identifier(1),
            Achievement::ChainIII => achievements::chain::Chain::identifier(2),
            Achievement::SuperChainI => achievements::superchain::SuperChain::identifier(0),
            Achievement::SuperChainII => achievements::superchain::SuperChain::identifier(1),
            Achievement::SuperChainIII => achievements::superchain::SuperChain::identifier(2),
            Achievement::LevelerI => achievements::leveler::Leveler::identifier(0),
            Achievement::LevelerII => achievements::leveler::Leveler::identifier(1),
            Achievement::LevelerIII => achievements::leveler::Leveler::identifier(2),
            Achievement::LevelerIV => achievements::leveler::Leveler::identifier(3),
            Achievement::LevelerV => achievements::leveler::Leveler::identifier(4),
            Achievement::ScorerI => achievements::scorer::Scorer::identifier(0),
            Achievement::ScorerII => achievements::scorer::Scorer::identifier(1),
            Achievement::ScorerIII => achievements::scorer::Scorer::identifier(2),
            Achievement::DailyMaster => achievements::master::Master::identifier(0),
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
            Achievement::ChainI => achievements::chain::Chain::tasks(0),
            Achievement::ChainII => achievements::chain::Chain::tasks(1),
            Achievement::ChainIII => achievements::chain::Chain::tasks(2),
            Achievement::SuperChainI => achievements::superchain::SuperChain::tasks(0),
            Achievement::SuperChainII => achievements::superchain::SuperChain::tasks(1),
            Achievement::SuperChainIII => achievements::superchain::SuperChain::tasks(2),
            Achievement::LevelerI => achievements::leveler::Leveler::tasks(0),
            Achievement::LevelerII => achievements::leveler::Leveler::tasks(1),
            Achievement::LevelerIII => achievements::leveler::Leveler::tasks(2),
            Achievement::LevelerIV => achievements::leveler::Leveler::tasks(3),
            Achievement::LevelerV => achievements::leveler::Leveler::tasks(4),
            Achievement::ScorerI => achievements::scorer::Scorer::tasks(0),
            Achievement::ScorerII => achievements::scorer::Scorer::tasks(1),
            Achievement::ScorerIII => achievements::scorer::Scorer::tasks(2),
            Achievement::DailyMaster => achievements::master::Master::tasks(0),
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
            Achievement::ChainI => Self::_metadata(achievements::chain::Chain::title(0), achievements::chain::Chain::description(0), achievements::chain::Chain::icon(0), achievements::chain::Chain::points(0), achievements::chain::Chain::hidden(0), achievements::chain::Chain::index(0), achievements::chain::Chain::group()),
            Achievement::ChainII => Self::_metadata(achievements::chain::Chain::title(1), achievements::chain::Chain::description(1), achievements::chain::Chain::icon(1), achievements::chain::Chain::points(1), achievements::chain::Chain::hidden(1), achievements::chain::Chain::index(1), achievements::chain::Chain::group()),
            Achievement::ChainIII => Self::_metadata(achievements::chain::Chain::title(2), achievements::chain::Chain::description(2), achievements::chain::Chain::icon(2), achievements::chain::Chain::points(2), achievements::chain::Chain::hidden(2), achievements::chain::Chain::index(2), achievements::chain::Chain::group()),
            Achievement::SuperChainI => Self::_metadata(achievements::superchain::SuperChain::title(0), achievements::superchain::SuperChain::description(0), achievements::superchain::SuperChain::icon(0), achievements::superchain::SuperChain::points(0), achievements::superchain::SuperChain::hidden(0), achievements::superchain::SuperChain::index(0), achievements::superchain::SuperChain::group()),
            Achievement::SuperChainII => Self::_metadata(achievements::superchain::SuperChain::title(1), achievements::superchain::SuperChain::description(1), achievements::superchain::SuperChain::icon(1), achievements::superchain::SuperChain::points(1), achievements::superchain::SuperChain::hidden(1), achievements::superchain::SuperChain::index(1), achievements::superchain::SuperChain::group()),
            Achievement::SuperChainIII => Self::_metadata(achievements::superchain::SuperChain::title(2), achievements::superchain::SuperChain::description(2), achievements::superchain::SuperChain::icon(2), achievements::superchain::SuperChain::points(2), achievements::superchain::SuperChain::hidden(2), achievements::superchain::SuperChain::index(2), achievements::superchain::SuperChain::group()),
            Achievement::LevelerI => Self::_metadata(achievements::leveler::Leveler::title(0), achievements::leveler::Leveler::description(0), achievements::leveler::Leveler::icon(0), achievements::leveler::Leveler::points(0), achievements::leveler::Leveler::hidden(0), achievements::leveler::Leveler::index(0), achievements::leveler::Leveler::group()),
            Achievement::LevelerII => Self::_metadata(achievements::leveler::Leveler::title(1), achievements::leveler::Leveler::description(1), achievements::leveler::Leveler::icon(1), achievements::leveler::Leveler::points(1), achievements::leveler::Leveler::hidden(1), achievements::leveler::Leveler::index(1), achievements::leveler::Leveler::group()),
            Achievement::LevelerIII => Self::_metadata(achievements::leveler::Leveler::title(2), achievements::leveler::Leveler::description(2), achievements::leveler::Leveler::icon(2), achievements::leveler::Leveler::points(2), achievements::leveler::Leveler::hidden(2), achievements::leveler::Leveler::index(2), achievements::leveler::Leveler::group()),
            Achievement::LevelerIV => Self::_metadata(achievements::leveler::Leveler::title(3), achievements::leveler::Leveler::description(3), achievements::leveler::Leveler::icon(3), achievements::leveler::Leveler::points(3), achievements::leveler::Leveler::hidden(3), achievements::leveler::Leveler::index(3), achievements::leveler::Leveler::group()),
            Achievement::LevelerV => Self::_metadata(achievements::leveler::Leveler::title(4), achievements::leveler::Leveler::description(4), achievements::leveler::Leveler::icon(4), achievements::leveler::Leveler::points(4), achievements::leveler::Leveler::hidden(4), achievements::leveler::Leveler::index(4), achievements::leveler::Leveler::group()),
            Achievement::ScorerI => Self::_metadata(achievements::scorer::Scorer::title(0), achievements::scorer::Scorer::description(0), achievements::scorer::Scorer::icon(0), achievements::scorer::Scorer::points(0), achievements::scorer::Scorer::hidden(0), achievements::scorer::Scorer::index(0), achievements::scorer::Scorer::group()),
            Achievement::ScorerII => Self::_metadata(achievements::scorer::Scorer::title(1), achievements::scorer::Scorer::description(1), achievements::scorer::Scorer::icon(1), achievements::scorer::Scorer::points(1), achievements::scorer::Scorer::hidden(1), achievements::scorer::Scorer::index(1), achievements::scorer::Scorer::group()),
            Achievement::ScorerIII => Self::_metadata(achievements::scorer::Scorer::title(2), achievements::scorer::Scorer::description(2), achievements::scorer::Scorer::icon(2), achievements::scorer::Scorer::points(2), achievements::scorer::Scorer::hidden(2), achievements::scorer::Scorer::index(2), achievements::scorer::Scorer::group()),
            Achievement::DailyMaster => Self::_metadata(achievements::master::Master::title(0), achievements::master::Master::description(0), achievements::master::Master::icon(0), achievements::master::Master::points(0), achievements::master::Master::hidden(0), achievements::master::Master::index(0), achievements::master::Master::group()),
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
            14 => Achievement::ChainI,
            15 => Achievement::ChainII,
            16 => Achievement::ChainIII,
            17 => Achievement::SuperChainI,
            18 => Achievement::SuperChainII,
            19 => Achievement::SuperChainIII,
            20 => Achievement::LevelerI,
            21 => Achievement::LevelerII,
            22 => Achievement::LevelerIII,
            23 => Achievement::LevelerIV,
            24 => Achievement::LevelerV,
            25 => Achievement::ScorerI,
            26 => Achievement::ScorerII,
            27 => Achievement::ScorerIII,
            28 => Achievement::DailyMaster,
            _ => Achievement::None,
        }
    }
}
