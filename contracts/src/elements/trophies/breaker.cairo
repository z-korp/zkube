use zkube::elements::trophies::interface::{TrophyTrait, BushidoTask, Task, TaskTrait};

impl Breaker of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'BREAKER_I',
            1 => 'BREAKER_II',
            2 => 'BREAKER_III',
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
        'Breaker'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        'fa-cubes'
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Line Picker',
            1 => 'Line Destroyer',
            2 => 'Line Annihilator',
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
            1 => 1000,
            2 => 10000,
            _ => 0,
        }
    }

    #[inline]
    fn assess(level: u8, value: u32) -> bool {
        value > 0
    }

    #[inline]
    fn tasks(level: u8) -> Span<BushidoTask> {
        let total: u32 = Self::count(level);
        Task::Breaking.tasks(level, total, total)
    }
}
