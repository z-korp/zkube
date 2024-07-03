// Internal imports

use zkube::elements::bonuses::interface::{BonusTrait};
use zkube::types::bonus::Bonus;

impl BonusImpl of BonusTrait {
    fn apply_bonus(mut bitmap: felt252, bonus: Bonus, row_index: u8, index: u8) -> felt252 {
        let return_value: felt252 = 'return';

        return_value
    }
}
