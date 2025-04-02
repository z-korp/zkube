// Internal imports
use zkube::elements::difficulties::{
    veryeasy, easy, medium, mediumhard, hard, veryhard, expert, master
};
use zkube::types::block::Block;

#[derive(Introspect, Copy, Drop, Serde, PartialEq)]
enum Difficulty {
    None,
    Increasing,
    VeryEasy,
    Easy,
    Medium,
    MediumHard,
    Hard,
    VeryHard,
    Expert,
    Master,
}

#[generate_trait]
impl DifficultyImpl of DifficultyTrait {
    fn count(self: Difficulty) -> u32 {
        match self {
            Difficulty::None => 0,
            Difficulty::Increasing => 0,
            Difficulty::VeryEasy => veryeasy::DifficultyImpl::count(),
            Difficulty::Easy => easy::DifficultyImpl::count(),
            Difficulty::Medium => medium::DifficultyImpl::count(),
            Difficulty::MediumHard => mediumhard::DifficultyImpl::count(),
            Difficulty::Hard => hard::DifficultyImpl::count(),
            Difficulty::VeryHard => veryhard::DifficultyImpl::count(),
            Difficulty::Expert => expert::DifficultyImpl::count(),
            Difficulty::Master => master::DifficultyImpl::count(),
        }
    }

    fn reveal(self: Difficulty, id: u8) -> Block {
        match self {
            Difficulty::None => Block::None,
            Difficulty::Increasing => Block::None,
            Difficulty::VeryEasy => veryeasy::DifficultyImpl::reveal(id),
            Difficulty::Easy => easy::DifficultyImpl::reveal(id),
            Difficulty::Medium => medium::DifficultyImpl::reveal(id),
            Difficulty::MediumHard => mediumhard::DifficultyImpl::reveal(id),
            Difficulty::Hard => hard::DifficultyImpl::reveal(id),
            Difficulty::VeryHard => veryhard::DifficultyImpl::reveal(id),
            Difficulty::Expert => expert::DifficultyImpl::reveal(id),
            Difficulty::Master => master::DifficultyImpl::reveal(id),
        }
    }
}

impl U8IntoDifficulty of core::Into<u8, Difficulty> {
    #[inline(always)]
    fn into(self: u8) -> Difficulty {
        match self {
            0 => Difficulty::None,
            1 => Difficulty::Increasing,
            2 => Difficulty::VeryEasy,
            3 => Difficulty::Easy,
            4 => Difficulty::Medium,
            5 => Difficulty::MediumHard,
            6 => Difficulty::Hard,
            7 => Difficulty::VeryHard,
            8 => Difficulty::Expert,
            9 => Difficulty::Master,
            _ => Difficulty::None,
        }
    }
}

impl DifficultyIntoU8 of core::Into<Difficulty, u8> {
    #[inline(always)]
    fn into(self: Difficulty) -> u8 {
        match self {
            Difficulty::None => 0,
            Difficulty::Increasing => 1,
            Difficulty::VeryEasy => 2,
            Difficulty::Easy => 3,
            Difficulty::Medium => 4,
            Difficulty::MediumHard => 5,
            Difficulty::Hard => 6,
            Difficulty::VeryHard => 7,
            Difficulty::Expert => 8,
            Difficulty::Master => 9,
        }
    }
}

#[generate_trait]
impl IncreasingDifficultyUtils of IIncreasingDifficultyUtilsTrait {
    /// Returns the appropriate difficulty level based on the number of moves
    /// This is used for the Increasing difficulty mode
    #[inline(always)]
    fn get_difficulty_from_moves(moves: u16) -> Difficulty {
        if moves < 20 {
            Difficulty::MediumHard
        } else if moves < 40 {
            Difficulty::Hard
        } else if moves < 80 {
            Difficulty::VeryHard
        } else if moves < 120 {
            Difficulty::Expert
        } else {
            Difficulty::Master
        }
    }
}
