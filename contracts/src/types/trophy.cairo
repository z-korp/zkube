use achievement::types::task::{Task as BushidoTask};
use zkube::elements::trophies;

// Constants

pub const TROPHY_COUNT: u8 = 18;

// Typ

#[derive(Copy, Drop)]
enum Trophy {
    None,
    BreakIn,
    LineDestroyer,
    LineAnnihilator,
    ComboInitiator,
    ComboExpert,
    ComboMaster,
    TripleThreat,
    SixShooter,
    NineLives,
    GameBeginner,
    GameExperienced,
    GameVeteran,
    StreakStarter,
    StreakAchiever,
    StreakChampion,
    BeginnersLuck,
    ClimbingHigh,
    SkyIsTheLimit,
}

#[generate_trait]
impl TrophyImpl of TrophyTrait {
    #[inline]
    fn level(self: Trophy) -> u8 {
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => 0,
            Trophy::LineDestroyer => 1,
            Trophy::LineAnnihilator => 2,
            Trophy::ComboInitiator => 0,
            Trophy::ComboExpert => 1,
            Trophy::ComboMaster => 2,
            Trophy::TripleThreat => 0,
            Trophy::SixShooter => 1,
            Trophy::NineLives => 2,
            Trophy::GameBeginner => 0,
            Trophy::GameExperienced => 1,
            Trophy::GameVeteran => 2,
            Trophy::StreakStarter => 0,
            Trophy::StreakAchiever => 1,
            Trophy::StreakChampion => 2,
            Trophy::BeginnersLuck => 0,
            Trophy::ClimbingHigh => 1,
            Trophy::SkyIsTheLimit => 2,
        }
    }

    #[inline]
    fn identifier(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::identifier(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::identifier(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::identifier(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::identifier(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::identifier(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::identifier(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::identifier(level),
            Trophy::SixShooter => trophies::chainer::Chainer::identifier(level),
            Trophy::NineLives => trophies::chainer::Chainer::identifier(level),
            Trophy::GameBeginner => trophies::player::Player::identifier(level),
            Trophy::GameExperienced => trophies::player::Player::identifier(level),
            Trophy::GameVeteran => trophies::player::Player::identifier(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::identifier(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::identifier(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::identifier(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::identifier(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::identifier(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::identifier(level),
        }
    }

    #[inline]
    fn hidden(self: Trophy) -> bool {
        let level = self.level();
        match self {
            Trophy::None => true,
            Trophy::BreakIn => trophies::breaker::Breaker::hidden(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::hidden(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::hidden(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::hidden(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::hidden(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::hidden(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::hidden(level),
            Trophy::SixShooter => trophies::chainer::Chainer::hidden(level),
            Trophy::NineLives => trophies::chainer::Chainer::hidden(level),
            Trophy::GameBeginner => trophies::player::Player::hidden(level),
            Trophy::GameExperienced => trophies::player::Player::hidden(level),
            Trophy::GameVeteran => trophies::player::Player::hidden(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::hidden(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::hidden(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::hidden(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::hidden(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::hidden(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::hidden(level),
        }
    }

    #[inline]
    fn index(self: Trophy) -> u8 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::index(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::index(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::index(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::index(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::index(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::index(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::index(level),
            Trophy::SixShooter => trophies::chainer::Chainer::index(level),
            Trophy::NineLives => trophies::chainer::Chainer::index(level),
            Trophy::GameBeginner => trophies::player::Player::index(level),
            Trophy::GameExperienced => trophies::player::Player::index(level),
            Trophy::GameVeteran => trophies::player::Player::index(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::index(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::index(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::index(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::index(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::index(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::index(level),
        }
    }

    #[inline]
    fn points(self: Trophy) -> u16 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::points(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::points(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::points(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::points(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::points(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::points(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::points(level),
            Trophy::SixShooter => trophies::chainer::Chainer::points(level),
            Trophy::NineLives => trophies::chainer::Chainer::points(level),
            Trophy::GameBeginner => trophies::player::Player::points(level),
            Trophy::GameExperienced => trophies::player::Player::points(level),
            Trophy::GameVeteran => trophies::player::Player::points(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::points(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::points(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::points(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::points(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::points(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::points(level),
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
            Trophy::BreakIn => trophies::breaker::Breaker::group(),
            Trophy::LineDestroyer => trophies::breaker::Breaker::group(),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::group(),
            Trophy::ComboInitiator => trophies::mastery::Mastery::group(),
            Trophy::ComboExpert => trophies::mastery::Mastery::group(),
            Trophy::ComboMaster => trophies::mastery::Mastery::group(),
            Trophy::TripleThreat => trophies::chainer::Chainer::group(),
            Trophy::SixShooter => trophies::chainer::Chainer::group(),
            Trophy::NineLives => trophies::chainer::Chainer::group(),
            Trophy::GameBeginner => trophies::player::Player::group(),
            Trophy::GameExperienced => trophies::player::Player::group(),
            Trophy::GameVeteran => trophies::player::Player::group(),
            Trophy::StreakStarter => trophies::streaker::Streaker::group(),
            Trophy::StreakAchiever => trophies::streaker::Streaker::group(),
            Trophy::StreakChampion => trophies::streaker::Streaker::group(),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::group(),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::group(),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::group(),
        }
    }

    #[inline]
    fn icon(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::icon(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::icon(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::icon(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::icon(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::icon(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::icon(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::icon(level),
            Trophy::SixShooter => trophies::chainer::Chainer::icon(level),
            Trophy::NineLives => trophies::chainer::Chainer::icon(level),
            Trophy::GameBeginner => trophies::player::Player::icon(level),
            Trophy::GameExperienced => trophies::player::Player::icon(level),
            Trophy::GameVeteran => trophies::player::Player::icon(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::icon(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::icon(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::icon(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::icon(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::icon(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::icon(level),
        }
    }

    #[inline]
    fn title(self: Trophy) -> felt252 {
        let level = self.level();
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::title(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::title(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::title(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::title(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::title(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::title(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::title(level),
            Trophy::SixShooter => trophies::chainer::Chainer::title(level),
            Trophy::NineLives => trophies::chainer::Chainer::title(level),
            Trophy::GameBeginner => trophies::player::Player::title(level),
            Trophy::GameExperienced => trophies::player::Player::title(level),
            Trophy::GameVeteran => trophies::player::Player::title(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::title(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::title(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::title(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::title(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::title(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::title(level),
        }
    }

    #[inline]
    fn description(self: Trophy) -> ByteArray {
        let level = self.level();
        match self {
            Trophy::None => "",
            Trophy::BreakIn => trophies::breaker::Breaker::description(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::description(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::description(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::description(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::description(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::description(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::description(level),
            Trophy::SixShooter => trophies::chainer::Chainer::description(level),
            Trophy::NineLives => trophies::chainer::Chainer::description(level),
            Trophy::GameBeginner => trophies::player::Player::description(level),
            Trophy::GameExperienced => trophies::player::Player::description(level),
            Trophy::GameVeteran => trophies::player::Player::description(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::description(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::description(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::description(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::description(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::description(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::description(level),
        }
    }

    #[inline]
    fn count(self: Trophy, level: u8) -> u32 {
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => trophies::breaker::Breaker::count(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::count(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::count(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::count(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::count(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::count(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::count(level),
            Trophy::SixShooter => trophies::chainer::Chainer::count(level),
            Trophy::NineLives => trophies::chainer::Chainer::count(level),
            Trophy::GameBeginner => trophies::player::Player::count(level),
            Trophy::GameExperienced => trophies::player::Player::count(level),
            Trophy::GameVeteran => trophies::player::Player::count(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::count(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::count(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::count(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::count(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::count(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::count(level),
        }
    }

    #[inline]
    fn assess(self: Trophy, value: u32) -> bool {
        let level = self.level();
        match self {
            Trophy::None => false,
            Trophy::BreakIn => trophies::breaker::Breaker::assess(level, value),
            Trophy::LineDestroyer => trophies::breaker::Breaker::assess(level, value),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::assess(level, value),
            Trophy::ComboInitiator => trophies::mastery::Mastery::assess(level, value),
            Trophy::ComboExpert => trophies::mastery::Mastery::assess(level, value),
            Trophy::ComboMaster => trophies::mastery::Mastery::assess(level, value),
            Trophy::TripleThreat => trophies::chainer::Chainer::assess(level, value),
            Trophy::SixShooter => trophies::chainer::Chainer::assess(level, value),
            Trophy::NineLives => trophies::chainer::Chainer::assess(level, value),
            Trophy::GameBeginner => trophies::player::Player::assess(level, value),
            Trophy::GameExperienced => trophies::player::Player::assess(level, value),
            Trophy::GameVeteran => trophies::player::Player::assess(level, value),
            Trophy::StreakStarter => trophies::streaker::Streaker::assess(level, value),
            Trophy::StreakAchiever => trophies::streaker::Streaker::assess(level, value),
            Trophy::StreakChampion => trophies::streaker::Streaker::assess(level, value),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::assess(level, value),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::assess(level, value),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::assess(level, value),
        }
    }

    #[inline]
    fn tasks(self: Trophy) -> Span<BushidoTask> {
        let level = self.level();
        match self {
            Trophy::None => [].span(),
            Trophy::BreakIn => trophies::breaker::Breaker::tasks(level),
            Trophy::LineDestroyer => trophies::breaker::Breaker::tasks(level),
            Trophy::LineAnnihilator => trophies::breaker::Breaker::tasks(level),
            Trophy::ComboInitiator => trophies::mastery::Mastery::tasks(level),
            Trophy::ComboExpert => trophies::mastery::Mastery::tasks(level),
            Trophy::ComboMaster => trophies::mastery::Mastery::tasks(level),
            Trophy::TripleThreat => trophies::chainer::Chainer::tasks(level),
            Trophy::SixShooter => trophies::chainer::Chainer::tasks(level),
            Trophy::NineLives => trophies::chainer::Chainer::tasks(level),
            Trophy::GameBeginner => trophies::player::Player::tasks(level),
            Trophy::GameExperienced => trophies::player::Player::tasks(level),
            Trophy::GameVeteran => trophies::player::Player::tasks(level),
            Trophy::StreakStarter => trophies::streaker::Streaker::tasks(level),
            Trophy::StreakAchiever => trophies::streaker::Streaker::tasks(level),
            Trophy::StreakChampion => trophies::streaker::Streaker::tasks(level),
            Trophy::BeginnersLuck => trophies::leveler::Leveler::tasks(level),
            Trophy::ClimbingHigh => trophies::leveler::Leveler::tasks(level),
            Trophy::SkyIsTheLimit => trophies::leveler::Leveler::tasks(level),
        }
    }

    #[inline]
    fn data(self: Trophy) -> ByteArray {
        ""
    }
}

impl IntoTrophyU8 of core::Into<Trophy, u8> {
    #[inline]
    fn into(self: Trophy) -> u8 {
        match self {
            Trophy::None => 0,
            Trophy::BreakIn => 1,
            Trophy::LineDestroyer => 2,
            Trophy::LineAnnihilator => 3,
            Trophy::ComboInitiator => 4,
            Trophy::ComboExpert => 5,
            Trophy::ComboMaster => 6,
            Trophy::TripleThreat => 7,
            Trophy::SixShooter => 8,
            Trophy::NineLives => 9,
            Trophy::GameBeginner => 10,
            Trophy::GameExperienced => 11,
            Trophy::GameVeteran => 12,
            Trophy::StreakStarter => 13,
            Trophy::StreakAchiever => 14,
            Trophy::StreakChampion => 15,
            Trophy::BeginnersLuck => 16,
            Trophy::ClimbingHigh => 17,
            Trophy::SkyIsTheLimit => 18,
        }
    }
}

impl IntoU8Trophy of core::Into<u8, Trophy> {
    #[inline]
    fn into(self: u8) -> Trophy {
        let card: felt252 = self.into();
        match card {
            0 => Trophy::None,
            1 => Trophy::BreakIn,
            2 => Trophy::LineDestroyer,
            3 => Trophy::LineAnnihilator,
            4 => Trophy::ComboInitiator,
            5 => Trophy::ComboExpert,
            6 => Trophy::ComboMaster,
            7 => Trophy::TripleThreat,
            8 => Trophy::SixShooter,
            9 => Trophy::NineLives,
            10 => Trophy::GameBeginner,
            11 => Trophy::GameExperienced,
            12 => Trophy::GameVeteran,
            13 => Trophy::StreakStarter,
            14 => Trophy::StreakAchiever,
            15 => Trophy::StreakChampion,
            16 => Trophy::BeginnersLuck,
            17 => Trophy::ClimbingHigh,
            18 => Trophy::SkyIsTheLimit,
            _ => Trophy::None,
        }
    }
}

impl TrophyPrint of core::debug::PrintTrait<Trophy> {
    #[inline]
    fn print(self: Trophy) {
        self.identifier().print();
    }
}
