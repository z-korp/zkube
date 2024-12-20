// External imports

use alexandria_math::fast_power::fast_power;

// Internal imports

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;
use zkube::models::game::Game;
use zkube::types::bonus::Bonus;
use zkube::types::width::Width;

// Errors

mod errors {
    const INVALID_BLOCK_VALUE: felt252 = 'Bonus: invalid block value';
}

impl BonusImpl of BonusTrait {
    #[inline(always)]
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252 {
        // [Check] Value of the block is valid
        let block = Controller::get_block(blocks, row_index, index);
        let width: Width = block.into();
        assert(width != Width::None, errors::INVALID_BLOCK_VALUE);
        // [Compute] Mask of the block
        let block = Controller::get_block(blocks, row_index, index);
        let base_mask: u256 = fast_power(2, ((block * constants::BLOCK_BIT_COUNT).into())) - 1;
        let exp = row_index * constants::ROW_BIT_COUNT + index * constants::BLOCK_BIT_COUNT;
        let shift: u256 = fast_power(2, exp.into());
        let mask: u256 = base_mask * shift;
        // [Compute] Apply negative mask on bitmap to remove the block
        let mut bitmap: u256 = blocks.into();
        bitmap = bitmap & ~mask;

        bitmap.try_into().unwrap()
    }

    #[inline(always)]
    fn get_count(score: u16, combo_count: u16, max_combo: u8) -> u8 {
        if score >= 120 {
            return 3;
        }
        if score >= 80 {
            return 2;
        }
        if score >= 40 {
            return 1;
        }
        return 0;
    }
}
