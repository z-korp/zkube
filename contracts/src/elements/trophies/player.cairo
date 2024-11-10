use zkube::elements::trophies::interface::{TrophyTrait, BushidoTask, Task, TaskTrait};

impl Player of TrophyTrait {
    #[inline]
    fn identifier(level: u8) -> felt252 {
        match level {
            0 => 'PLAYER_I',
            1 => 'PLAYER_II',
            2 => 'PLAYER_III',
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
        'Playing'
    }

    #[inline]
    fn icon(level: u8) -> felt252 {
        match level {
            0 => 'fa-joystick',
            1 => 'fa-gamepad',
            2 => 'fa-gamepad-modern',
            _ => '',
        }
    }

    #[inline]
    fn title(level: u8) -> felt252 {
        match level {
            0 => 'Game Beginner',
            1 => 'Game Experienced',
            2 => 'Game Veteran',
            _ => '',
        }
    }

    #[inline]
    fn description(level: u8) -> ByteArray {
        match level {
            0 => "You miss 100% of the shots you do not take", // Wayne Gretzky
            1 => "It always seems impossible until it is done", // Nelson Mandela
            2 => "The only way to do great work is to love what you do", // Steve Jobs
            _ => "",
        }
    }

    #[inline]
    fn count(level: u8) -> u32 {
        match level {
            0 => 10,
            1 => 100,
            2 => 500,
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
        Task::Playing.tasks(level, total, total)
    }
}
