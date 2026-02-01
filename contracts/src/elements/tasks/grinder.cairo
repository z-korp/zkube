/// Grinder task - tracks games played
use crate::elements::tasks::interface::TaskTrait;

pub impl Grinder of TaskTrait {
    fn identifier() -> felt252 {
        'GRINDER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Play 1 game",
            _ => format!("Play {} games", count),
        }
    }
}
