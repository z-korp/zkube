/// Scorer task - tracks highest score achieved in a run (zone-based gameplay)
use crate::elements::tasks::interface::TaskTrait;

pub impl Scorer of TaskTrait {
    fn identifier() -> felt252 {
        'SCORER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            50 => "Score 50 points in a run",
            100 => "Score 100 points in a run",
            200 => "Score 200 points in a run",
            500 => "Score 500 points in a run",
            1000 => "Score 1000 points in a run",
            _ => format!("Score {} points in a run", count),
        }
    }
}
