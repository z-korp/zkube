/// Combo streak tasks - tracks combo streak milestones within a level
use crate::elements::tasks::interface::TaskTrait;

/// ComboStreakFifteen - reach a 15+ combo streak in a level
pub impl ComboStreakFifteen of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_STREAK_FIFTEEN'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach a 15+ combo streak",
            _ => format!("Reach a 15+ combo streak {} times", count),
        }
    }
}

/// ComboStreakTwenty - reach a 20+ combo streak in a level
pub impl ComboStreakTwenty of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_STREAK_TWENTY'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach a 20+ combo streak",
            _ => format!("Reach a 20+ combo streak {} times", count),
        }
    }
}

/// ComboStreakTwentyFive - reach a 25+ combo streak in a level
pub impl ComboStreakTwentyFive of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_STREAK_TWENTY_FIVE'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach a 25+ combo streak",
            _ => format!("Reach a 25+ combo streak {} times", count),
        }
    }
}

/// ComboStreakFifty - reach a 50+ combo streak in a level
pub impl ComboStreakFifty of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_STREAK_FIFTY'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach a 50+ combo streak",
            _ => format!("Reach a 50+ combo streak {} times", count),
        }
    }
}

/// ComboStreakHundred - reach a 100+ combo streak in a level
pub impl ComboStreakHundred of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_STREAK_HUNDRED'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Reach a 100+ combo streak",
            _ => format!("Reach a 100+ combo streak {} times", count),
        }
    }
}
