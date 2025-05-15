use zkube::elements::trophies::interface::TrophyTrait;
use zkube::types::task::{Task, TaskTrait};
use achievement::types::task::{Task as BushidoTask};

pub impl CumulativeScorer of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CUMULATIVE_SCORER_I',
            1 => 'CUMULATIVE_SCORER_II',
            2 => 'CUMULATIVE_SCORER_III',
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
            1 => 70,
            2 => 100,
            _ => 0,
        }
    }

    #[inline]
    fn group() -> felt252 {
        'Cumulative Score'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-chart-line'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Score Collector',
            1 => 'Score Accumulator',
            2 => 'Score Legend',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "The journey of a thousand miles begins with one step", // Lao Tzu
            1 => "Little by little, a little becomes a lot", // Tanzanian Proverb
            2 => "Great things are not done by impulse, but by a series of small things brought together", // Vincent Van Gogh
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 10000,
            1 => 50000,
            2 => 100000,
            _ => 0,
        }
    }

    #[inline]
    fn assess(level: u8, value: u32) -> bool {
        value > 0
    }

    #[inline]
    fn tasks(level: u8) -> Span<BushidoTask> {
        let count: u32 = Self::count(level);
        Task::CumulativeScoring.tasks(level, count, count)
    }
}
