use zkube::elements::trophies::interface::TrophyTrait;
use zkube::types::task::{Task, TaskTrait};
use achievement::types::task::{Task as BushidoTask};

pub impl Scorer of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'SCORER_I',
            1 => 'SCORER_II',
            2 => 'SCORER_III',
            _ => '',
        }
    }

    #[inline]
    fn hidden(level: u8) -> bool {
        false
    }

    #[inline]
    fn index(level: u8) -> u8 {
        level
    }

    #[inline]
    fn points(level: u8) -> u16 {
        match level {
            0 => 30,
            1 => 60,
            2 => 110,
            _ => 0,
        }
    }

    #[inline]
    fn group() -> felt252 {
        'Scorer'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-cubes'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Score Apprentice',
            1 => 'Score Expert',
            2 => 'Score Master',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "The secret of getting ahead is getting started", // Mark Twain
            1 => "Success is the sum of small efforts, repeated day in and day out", // Robert Collier
            2 => "Perseverance is not a long race; it is many short races one after the other", // Walter
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 100,
            1 => 300,
            2 => 800,
            _ => 0,
        }
    }

    #[inline]
    fn assess(level: u8, value: u32) -> bool {
        value >= Self::count(level)
    }

    #[inline]
    fn tasks(level: u8) -> Span<BushidoTask> {
        let count: u32 = Self::count(level);
        let total: u32 = 1;
        Task::Scoring.tasks(level, count, total)
    }
}
