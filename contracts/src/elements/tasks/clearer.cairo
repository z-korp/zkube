/// Clearer task - tracks lines cleared
use crate::elements::tasks::interface::TaskTrait;

pub impl LineClearer of TaskTrait {
    fn identifier() -> felt252 {
        'LINE_CLEARER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Clear 1 line",
            _ => format!("Clear {} lines", count),
        }
    }
}
