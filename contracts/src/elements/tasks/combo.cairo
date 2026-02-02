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

/// ComboSeven - achieve a 7+ line combo
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
