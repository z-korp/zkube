/// Master task - tracks daily quests completed (for DailyFinisher quest)
use crate::elements::tasks::interface::TaskTrait;

pub impl DailyMaster of TaskTrait {
    fn identifier() -> felt252 {
        'DAILY_MASTER'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Complete 1 daily quest",
            9 => "Complete all daily quests",
            _ => format!("Complete {} daily quests", count),
        }
    }
}
