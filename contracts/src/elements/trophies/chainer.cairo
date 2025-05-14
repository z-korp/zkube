use zkube::elements::trophies::interface::TrophyTrait;
use zkube::types::task::{Task, TaskTrait};
use achievement::types::task::{Task as BushidoTask};

pub impl Chainer of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'CHAINER_I',
            1 => 'CHAINER_II',
            2 => 'CHAINER_III',
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
            0 => 20,
            1 => 60,
            2 => 120,
            _ => 0,
        }
    }

    #[inline]
    fn group() -> felt252 {
        'Chainer'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-link-horizontal'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Triple Threat',
            1 => 'Six Shooter',
            2 => 'Nine Lives',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Small deeds done are better than great deeds planned", // Peter Marshall
            1 => "The only limit to our realization of tomorrow is our doubts of today", // Franklin D.
            2 => "If you can dream it, you can do it", // Walt Disney
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 3,
            1 => 6,
            2 => 9,
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
        Task::Chaining.tasks(level, count, total)
    }
}
