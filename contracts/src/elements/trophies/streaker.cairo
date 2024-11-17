use zkube::elements::trophies::interface::{TrophyTrait, BushidoTask, Task, TaskTrait};

impl Streaker of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'STREAKER_I',
            1 => 'STREAKER_II',
            2 => 'STREAKER_III',
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
        'Daily Streak'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-rectangle-history'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Streak Starter',
            1 => 'Streak Achiever',
            2 => 'Streak Champion',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "What you do today can improve all your tomorrows", // Ralph Marston
            1 => "The future belongs to those who believe in the beauty of their dreams", // Eleanor
            2 => "Do not wait; the time will never be 'just right", // Napoleon Hill
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 5,
            1 => 10,
            2 => 30,
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
        Task::Streaking.tasks(level, count, total)
    }
}
