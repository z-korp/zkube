/// Level task - tracks highest level reached (zone-based: 1-10 for zone, 11+ for endless)
use crate::elements::tasks::interface::TaskTrait;

pub impl LevelReacher of TaskTrait {
    fn identifier() -> felt252 {
        'LEVEL_REACHER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            10 => "Clear Zone 1 (Level 10)",
            15 => "Reach Endless 5",
            20 => "Reach Endless 10",
            30 => "Reach Endless 20",
            50 => "Reach Endless 50",
            _ => format!("Reach level {}", count),
        }
    }
}
