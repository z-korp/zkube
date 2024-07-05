// Core imports

use core::debug::PrintTrait;
use core::Zeroable;

// External imports

use alexandria_math::fast_power::fast_power;

// Internal imports

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;
use zkube::models::game::Game;
use zkube::types::bonus::Bonus;
use zkube::types::color::Color;

// Errors

mod errors {
    const INVALID_BLOCK_COLOR: felt252 = 'Totem: invalid block color';
}

impl BonusImpl of BonusTrait {
    fn apply(blocks: felt252, colors: felt252, row_index: u8, index: u8) -> (felt252, felt252) {
        // [Check] Color of the block is valid
        let block_color = Controller::get_block(colors, row_index, index);
        let color: Color = block_color.into();
        assert(color != Color::None, errors::INVALID_BLOCK_COLOR);
        // [Compute] Mask of the block
        let mut packed: u256 = colors.into();
        let block_mask: u256 = (constants::BLOCK_SIZE - 1).into();
        let mut mask: u256 = 0;
        let mut shift: u256 = 1;
        let modulo: u256 = constants::BLOCK_SIZE.into();
        loop {
            if packed.is_zero() {
                break;
            }
            let color: u8 = (packed % modulo).try_into().unwrap();
            if color == block_color {
                mask += block_mask * shift;
            }
            packed = packed / modulo;
            // [Check] Additional check to avoid overflow
            if packed.is_zero() {
                break;
            }
            shift *= modulo;
        };
        let new_blocks: u256 = blocks.into() & ~mask;
        let new_colors: u256 = colors.into() & ~mask;
        (new_blocks.try_into().unwrap(), new_colors.try_into().unwrap())
    }

    #[inline(always)]
    fn get_count(score: u32, combo_count: u8) -> u8 {
        return 0;
    }
}
