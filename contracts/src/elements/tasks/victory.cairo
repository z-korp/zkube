/// Victory task - tracks full run wins (level 50 clears)
use crate::elements::tasks::interface::TaskTrait;

pub impl Victory of TaskTrait {
    fn identifier() -> felt252 {
        'VICTORY'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Win 1 full game (complete level 50)",
            _ => format!("Win {} full games (complete level 50)", count),
        }
    }
}
