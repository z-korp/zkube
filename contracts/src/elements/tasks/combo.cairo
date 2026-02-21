/// Combo tasks - tracks combo achievements and quests
use crate::elements::tasks::interface::TaskTrait;

/// ComboTwo - achieve a 2+ line combo (achievements)
pub impl ComboTwo of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_TWO'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 2+ line combo",
            _ => format!("Achieve {} combos of 2+ lines", count),
        }
    }
}

/// ComboThree - achieve a 3+ line combo (achievements)
pub impl ComboThree of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_THREE'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 3+ line combo",
            _ => format!("Achieve {} combos of 3+ lines", count),
        }
    }
}

/// ComboFour - achieve a 4+ line combo (quests)
pub impl ComboFour of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_FOUR'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 4+ line combo",
            _ => format!("Achieve {} combos of 4+ lines", count),
        }
    }
}

/// ComboFive - achieve a 5+ line combo
pub impl ComboFive of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_FIVE'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 5+ line combo",
            _ => format!("Achieve {} combos of 5+ lines", count),
        }
    }
}

/// ComboSix - achieve a 6+ line combo (quests)
pub impl ComboSix of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_SIX'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 6+ line combo",
            _ => format!("Achieve {} combos of 6+ lines", count),
        }
    }
}

/// ComboSeven - achieve a 7+ line combo (achievements)
pub impl ComboSeven of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_SEVEN'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 7+ line combo",
            _ => format!("Achieve {} combos of 7+ lines", count),
        }
    }
}

/// ComboEight - achieve a 8+ line combo (achievements)
pub impl ComboEight of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_EIGHT'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 8+ line combo",
            _ => format!("Achieve {} combos of 8+ lines", count),
        }
    }
}

/// ComboNine - achieve a 9+ line combo (achievements)
pub impl ComboNine of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_NINE'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve a 9+ line combo",
            _ => format!("Achieve {} combos of 9+ lines", count),
        }
    }
}
