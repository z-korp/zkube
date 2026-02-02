/// Scorer task - tracks highest score achieved in a single level
use crate::elements::tasks::interface::TaskTrait;

pub impl Scorer of TaskTrait {
    fn identifier() -> felt252 {
        'SCORER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Score 1 point in a level",
            _ => format!("Score {} points in a level", count),
        }
    }
}
