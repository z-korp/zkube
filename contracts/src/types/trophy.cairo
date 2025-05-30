use achievement::types::task::{Task as BushidoTask};
use zkube::elements::trophies;

pub const TROPHY_COUNT: u8 = 15;

#[derive(Copy, Drop)]
pub enum Trophy {
    None,
    ComboInitiator,
    ComboExpert,
    ComboMaster,
    TripleThreat,
    SixShooter,
    NineLives,
    GameBeginner,
    GameExperienced,
    GameVeteran,
    ScoreApprentice,
    ScoreExpert,
    ScoreMaster,
    ScoreCollector,
    ScoreAccumulator,
    ScoreLegend,
}

#[generate_trait]
pub impl TrophyImpl of TrophyTrait {
    #[inline]
    fn level(self: Trophy) -> u8 {
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => 0,
            Trophy::ComboExpert => 1,
            Trophy::ComboMaster => 2,
            Trophy::TripleThreat => 0,
            Trophy::SixShooter => 1,
            Trophy::NineLives => 2,
            Trophy::GameBeginner => 0,
            Trophy::GameExperienced => 1,
            Trophy::GameVeteran => 2,
            Trophy::ScoreApprentice => 0,
            Trophy::ScoreExpert => 1,
            Trophy::ScoreMaster => 2,
            Trophy::ScoreCollector => 0,
            Trophy::ScoreAccumulator => 1,
            Trophy::ScoreLegend => 2,
        }
    }

    #[inline]
    fn identifier(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::identifier(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::identifier(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::identifier(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::identifier(level),
            Trophy::SixShooter => trophies::chainer::Chainer::identifier(level),
            Trophy::NineLives => trophies::chainer::Chainer::identifier(level),
            Trophy::GameBeginner => trophies::player::Player::identifier(level),
            Trophy::GameExperienced => trophies::player::Player::identifier(level),
            Trophy::GameVeteran => trophies::player::Player::identifier(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::identifier(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::identifier(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::identifier(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::identifier(
                level
            ),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::identifier(
                level
            ),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::identifier(level),
        }
    }

    #[inline]
    fn hidden(self: Trophy) -> bool {
        let level = self.level();
        match self {
            Trophy::None => true,
            Trophy::ComboInitiator => trophies::mastery::Mastery::hidden(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::hidden(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::hidden(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::hidden(level),
            Trophy::SixShooter => trophies::chainer::Chainer::hidden(level),
            Trophy::NineLives => trophies::chainer::Chainer::hidden(level),
            Trophy::GameBeginner => trophies::player::Player::hidden(level),
            Trophy::GameExperienced => trophies::player::Player::hidden(level),
            Trophy::GameVeteran => trophies::player::Player::hidden(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::hidden(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::hidden(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::hidden(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::hidden(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::hidden(
                level
            ),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::hidden(level),
        }
    }

    #[inline]
    fn index(self: Trophy) -> u8 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::index(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::index(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::index(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::index(level),
            Trophy::SixShooter => trophies::chainer::Chainer::index(level),
            Trophy::NineLives => trophies::chainer::Chainer::index(level),
            Trophy::GameBeginner => trophies::player::Player::index(level),
            Trophy::GameExperienced => trophies::player::Player::index(level),
            Trophy::GameVeteran => trophies::player::Player::index(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::index(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::index(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::index(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::index(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::index(level),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::index(level),
        }
    }

    #[inline]
    fn points(self: Trophy) -> u16 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::points(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::points(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::points(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::points(level),
            Trophy::SixShooter => trophies::chainer::Chainer::points(level),
            Trophy::NineLives => trophies::chainer::Chainer::points(level),
            Trophy::GameBeginner => trophies::player::Player::points(level),
            Trophy::GameExperienced => trophies::player::Player::points(level),
            Trophy::GameVeteran => trophies::player::Player::points(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::points(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::points(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::points(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::points(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::points(
                level
            ),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::points(level),
        }
    }

    #[inline]
    fn start(self: Trophy) -> u64 {
        // TODO: Update start time if you want to create ephemeral trophies
        0
    }

    #[inline]
    fn end(self: Trophy) -> u64 {
        // TODO: Update end time if you want to create ephemeral trophies
        // Note: End time must be greater than start time
        0
    }

    #[inline]
    fn group(self: Trophy) -> felt252 {
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::group(),
            Trophy::ComboExpert => trophies::mastery::Mastery::group(),
            Trophy::ComboMaster => trophies::mastery::Mastery::group(),
            Trophy::TripleThreat => trophies::chainer::Chainer::group(),
            Trophy::SixShooter => trophies::chainer::Chainer::group(),
            Trophy::NineLives => trophies::chainer::Chainer::group(),
            Trophy::GameBeginner => trophies::player::Player::group(),
            Trophy::GameExperienced => trophies::player::Player::group(),
            Trophy::GameVeteran => trophies::player::Player::group(),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::group(),
            Trophy::ScoreExpert => trophies::scorer::Scorer::group(),
            Trophy::ScoreMaster => trophies::scorer::Scorer::group(),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::group(),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::group(),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::group(),
        }
    }

    #[inline]
    fn icon(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::icon(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::icon(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::icon(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::icon(level),
            Trophy::SixShooter => trophies::chainer::Chainer::icon(level),
            Trophy::NineLives => trophies::chainer::Chainer::icon(level),
            Trophy::GameBeginner => trophies::player::Player::icon(level),
            Trophy::GameExperienced => trophies::player::Player::icon(level),
            Trophy::GameVeteran => trophies::player::Player::icon(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::icon(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::icon(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::icon(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::icon(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::icon(level),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::icon(level),
        }
    }

    #[inline]
    fn title(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::title(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::title(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::title(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::title(level),
            Trophy::SixShooter => trophies::chainer::Chainer::title(level),
            Trophy::NineLives => trophies::chainer::Chainer::title(level),
            Trophy::GameBeginner => trophies::player::Player::title(level),
            Trophy::GameExperienced => trophies::player::Player::title(level),
            Trophy::GameVeteran => trophies::player::Player::title(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::title(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::title(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::title(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::title(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::title(level),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::title(level),
        }
    }

    #[inline]
    fn description(self: Trophy) -> ByteArray {
        let level = self.level();
        match self {
            Trophy::None => "",
            Trophy::ComboInitiator => trophies::mastery::Mastery::description(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::description(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::description(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::description(level),
            Trophy::SixShooter => trophies::chainer::Chainer::description(level),
            Trophy::NineLives => trophies::chainer::Chainer::description(level),
            Trophy::GameBeginner => trophies::player::Player::description(level),
            Trophy::GameExperienced => trophies::player::Player::description(level),
            Trophy::GameVeteran => trophies::player::Player::description(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::description(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::description(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::description(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::description(
                level
            ),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::description(
                level
            ),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::description(
                level
            ),
        }
    }

    #[inline]
    fn count(self: Trophy, level: u8) -> u32 {
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => trophies::mastery::Mastery::count(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::count(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::count(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::count(level),
            Trophy::SixShooter => trophies::chainer::Chainer::count(level),
            Trophy::NineLives => trophies::chainer::Chainer::count(level),
            Trophy::GameBeginner => trophies::player::Player::count(level),
            Trophy::GameExperienced => trophies::player::Player::count(level),
            Trophy::GameVeteran => trophies::player::Player::count(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::count(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::count(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::count(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::count(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::count(level),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::count(level),
        }
    }

    #[inline]
    fn assess(self: Trophy, value: u32) -> bool {
        let level = self.level();
        match self {
            Trophy::None => false,
            Trophy::ComboInitiator => trophies::mastery::Mastery::assess(level, value),
            Trophy::ComboExpert => trophies::mastery::Mastery::assess(level, value),
            Trophy::ComboMaster => trophies::mastery::Mastery::assess(level, value),
            Trophy::TripleThreat => trophies::chainer::Chainer::assess(level, value),
            Trophy::SixShooter => trophies::chainer::Chainer::assess(level, value),
            Trophy::NineLives => trophies::chainer::Chainer::assess(level, value),
            Trophy::GameBeginner => trophies::player::Player::assess(level, value),
            Trophy::GameExperienced => trophies::player::Player::assess(level, value),
            Trophy::GameVeteran => trophies::player::Player::assess(level, value),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::assess(level, value),
            Trophy::ScoreExpert => trophies::scorer::Scorer::assess(level, value),
            Trophy::ScoreMaster => trophies::scorer::Scorer::assess(level, value),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::assess(
                level, value
            ),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::assess(
                level, value
            ),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::assess(
                level, value
            ),
        }
    }

    #[inline]
    fn tasks(self: Trophy) -> Span<BushidoTask> {
        let level = self.level();
        match self {
            Trophy::None => [].span(),
            Trophy::ComboInitiator => trophies::mastery::Mastery::tasks(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::tasks(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::tasks(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::tasks(level),
            Trophy::SixShooter => trophies::chainer::Chainer::tasks(level),
            Trophy::NineLives => trophies::chainer::Chainer::tasks(level),
            Trophy::GameBeginner => trophies::player::Player::tasks(level),
            Trophy::GameExperienced => trophies::player::Player::tasks(level),
            Trophy::GameVeteran => trophies::player::Player::tasks(level),
            Trophy::ScoreApprentice => trophies::scorer::Scorer::tasks(level),
            Trophy::ScoreExpert => trophies::scorer::Scorer::tasks(level),
            Trophy::ScoreMaster => trophies::scorer::Scorer::tasks(level),
            Trophy::ScoreCollector => trophies::cumulative_scorer::CumulativeScorer::tasks(level),
            Trophy::ScoreAccumulator => trophies::cumulative_scorer::CumulativeScorer::tasks(level),
            Trophy::ScoreLegend => trophies::cumulative_scorer::CumulativeScorer::tasks(level),
        }
    }

    #[inline]
    fn data(self: Trophy) -> ByteArray {
        ""
    }
}

impl IntoTrophyU8 of Into<Trophy, u8> {
    #[inline]
    fn into(self: Trophy) -> u8 {
        match self {
            Trophy::None => 0,
            Trophy::ComboInitiator => 1,
            Trophy::ComboExpert => 2,
            Trophy::ComboMaster => 3,
            Trophy::TripleThreat => 4,
            Trophy::SixShooter => 5,
            Trophy::NineLives => 6,
            Trophy::GameBeginner => 7,
            Trophy::GameExperienced => 8,
            Trophy::GameVeteran => 9,
            Trophy::ScoreApprentice => 10,
            Trophy::ScoreExpert => 11,
            Trophy::ScoreMaster => 12,
            Trophy::ScoreCollector => 13,
            Trophy::ScoreAccumulator => 14,
            Trophy::ScoreLegend => 15,
        }
    }
}

impl IntoU8Trophy of Into<u8, Trophy> {
    #[inline]
    fn into(self: u8) -> Trophy {
        let card: felt252 = self.into();
        match card {
            0 => Trophy::None,
            1 => Trophy::ComboInitiator,
            2 => Trophy::ComboExpert,
            3 => Trophy::ComboMaster,
            4 => Trophy::TripleThreat,
            5 => Trophy::SixShooter,
            6 => Trophy::NineLives,
            7 => Trophy::GameBeginner,
            8 => Trophy::GameExperienced,
            9 => Trophy::GameVeteran,
            10 => Trophy::ScoreApprentice,
            11 => Trophy::ScoreExpert,
            12 => Trophy::ScoreMaster,
            13 => Trophy::ScoreCollector,
            14 => Trophy::ScoreAccumulator,
            15 => Trophy::ScoreLegend,
            _ => Trophy::None,
        }
    }
}
