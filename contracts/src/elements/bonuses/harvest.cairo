use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;
use zkube::types::width::Width;

// Errors
pub mod errors {
    pub const INVALID_BLOCK_WIDTH: felt252 = 'Harvest: invalid block width';
}

pub impl BonusImpl of BonusTrait {
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252 {
        // [Check] Color of the block is valid
        let block_size = Controller::get_block(blocks, row_index, index);
        let block: Width = block_size.into();
        assert(block != Width::None, errors::INVALID_BLOCK_WIDTH);
        // [Compute] Mask of the block
        let mut packed: u256 = blocks.into();
        let block_mask: u256 = (constants::BLOCK_SIZE - 1).into();
        let mut mask: u256 = 0;
        let mut shift: u256 = 1;
        let modulo: u256 = constants::BLOCK_SIZE.into();
        loop {
            if packed.low == 0_u128 && packed.high == 0_u128 {
                break;
            }
            let block: u8 = (packed % modulo).try_into().unwrap();
            if block == block_size {
                mask += block_mask * shift;
            }
            packed = packed / modulo;
            // [Check] Additional check to avoid overflow
            if packed.low == 0_u128 && packed.high == 0_u128 {
                break;
            }
            shift *= modulo;
        }
        let new_blocks: u256 = blocks.into() & ~mask;
        new_blocks.try_into().unwrap()
    }
}

/// Count how many blocks of the target size exist on the grid.
/// Used to calculate CUBE rewards for Harvest bonus.
pub fn count_blocks_of_size(blocks: felt252, row_index: u8, index: u8) -> u8 {
    let block_size = Controller::get_block(blocks, row_index, index);
    let mut packed: u256 = blocks.into();
    let modulo: u256 = constants::BLOCK_SIZE.into();
    let mut count: u8 = 0;
    loop {
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        let block: u8 = (packed % modulo).try_into().unwrap();
        if block == block_size {
            count += 1;
        }
        packed = packed / modulo;
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
    }
    count
}
