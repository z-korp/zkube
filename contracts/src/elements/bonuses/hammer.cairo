// External imports

use alexandria_math::fast_power::fast_power;

// Internal imports

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;
use zkube::helpers::packer::Packer;
use zkube::types::bonus::Bonus;

use core::BitNot;

impl BonusImpl of BonusTrait {
    fn apply_bonus(mut bitmap: felt252, bonus: Bonus, row_index: u8, index: u8) -> felt252 {
        let start_block_index_in_bitmap = row_index * constants::ROW_BIT_COUNT
            + index * constants::BLOCK_BIT_COUNT;
        let block = Controller::get_block(bitmap, row_index, index);

        let inversed_mask: u256 = fast_power(2, ((block * constants::BLOCK_BIT_COUNT).into())) - 1;
        let shifted_inversed_mask: u256 = inversed_mask
            * fast_power(2, start_block_index_in_bitmap.into());
        let mask: u256 = BitNot::bitnot(shifted_inversed_mask);

        let mut bitmap: u256 = bitmap.into();
        bitmap = bitmap & mask;

        bitmap.try_into().unwrap()
    }
}
