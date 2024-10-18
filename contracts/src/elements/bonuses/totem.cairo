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
use zkube::types::block::Block;
use zkube::types::width::Width;

// Errors
mod errors {
    const INVALID_BLOCK_COLOR: felt252 = 'Totem: invalid block color';
}

impl BonusImpl of BonusTrait {
    fn apply(blocks: felt252, colors: felt252, row_index: u8, index: u8) -> (felt252, felt252) {
        // [Check] Color of the block is valid
        let block_size = Controller::get_block(blocks, row_index, index);
        let block: Width = block_size.into();
        assert(block != Width::None, errors::INVALID_BLOCK_COLOR);
        // [Compute] Mask of the block
        let mut packed: u256 = blocks.into();
        let block_mask: u256 = (constants::BLOCK_SIZE - 1).into();
        let mut mask: u256 = 0;
        let mut shift: u256 = 1;
        let modulo: u256 = constants::BLOCK_SIZE.into();
        loop {
            if packed.is_zero() {
                break;
            }
            let block: u8 = (packed % modulo).try_into().unwrap();
            if block == block_size {
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
    fn get_count(score: u32, combo_count: u8, max_combo: u8) -> u8 {
        if max_combo >= 6 {
            return 3;
        }
        if max_combo >= 4 {
            return 2;
        }
        if max_combo >= 2 {
            return 1;
        }
        return 0;
    }
}
