use zkube::elements::trophies::interface::TrophyTrait;
use zkube::types::task::{Task, TaskTrait};
use achievement::types::task::{Task as BushidoTask};

pub impl Mastery of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'MASTERY_I',
            1 => 'MASTERY_II',
            2 => 'MASTERY_III',
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
            1 => 40,
            2 => 80,
            _ => 0,
        }
    }

    #[inline]
    fn group() -> felt252 {
        'Mastery'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-brain-circuit'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Combo Initiate',
            1 => 'Combo Expert',
            2 => 'Combo Master',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "Start where you are. Use what you have. Do what you can", // Arthur Ashe
            1 => "Excellence is not an act, but a habit", // Aristotle
            2 => "You have power over your mind not outside events. Realize this, and you will find strength", // Marcus Aurelius
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 50,
            1 => 150,
            2 => 250,
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
        Task::Mastering.tasks(level, count, total)
    }
}
