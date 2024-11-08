use zkube::elements::trophies::interface::{TrophyTrait, BushidoTask, Task, TaskTrait};

impl Leveler of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'LEVELER_I',
            1 => 'LEVELER_II',
            2 => 'LEVELER_III',
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
        'Leveling'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-bolt'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Beginners Luck',
            1 => 'Climbing High',
            2 => 'Sky is the Limit',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "The beginning is the most important part of the work", // Plato
            1 => "Shoot for the moon. Even if you miss, you will land among the stars", // Norman Vincent
            2 => "Success is not final, failure is not fatal: It is the courage to continue that counts", // Winston Churchill
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 2,
            1 => 10,
            2 => 20,
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
        Task::Leveling.tasks(level, count, total)
    }
}
