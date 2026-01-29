/// Combo tasks - tracks combo achievements (3+, 5+, 8+ lines in one move)
use crate::elements::tasks::interface::TaskTrait;

/// ComboThree - achieve a 3+ line combo
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

/// ComboEight - achieve an 8+ line combo
pub impl ComboEight of TaskTrait {
    fn identifier() -> felt252 {
        'COMBO_EIGHT'
    }

    fn description(count: u32) -> ByteArray {
        match count {
            0 => "",
            1 => "Achieve an 8+ line combo",
            _ => format!("Achieve {} combos of 8+ lines", count),
        }
    }
}
