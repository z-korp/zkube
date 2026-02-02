/// Level task - tracks highest level reached
use crate::elements::tasks::interface::TaskTrait;

pub impl LevelReacher of TaskTrait {
    fn identifier() -> felt252 {
        'LEVEL_REACHER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach level 1",
            _ => format!("Reach level {}", count),
        }
    }
}
