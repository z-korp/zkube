use alexandria_math::BitShift;
use zkube::constants;
use zkube::helpers::controller::Controller;

// =============================================================================
// Tsunami (vNext): Targeted block/row destruction.
//
// Branch A (Wide): Clear N targeted individual blocks.
// Branch B (Target): Clear N targeted rows.
// =============================================================================

/// Clear a single targeted visual block at (row, col).
/// Zeroes out all cells belonging to the block at that position.
/// Returns new blocks.
pub fn clear_targeted_block(blocks: felt252, row: u8, col: u8) -> felt252 {
    let block_size = Controller::get_block(blocks, row, col);
    if block_size == 0 {
        return blocks;
    }

    // Find the leftmost cell of this block
    let mut leftmost: u8 = col;
    loop {
        if leftmost == 0 {
            break;
        }
        if Controller::get_block(blocks, row, leftmost - 1) != block_size {
            break;
        }
        leftmost -= 1;
    };

    // Zero out all cells of this block
    let mut packed: u256 = blocks.into();
    let cell_mask: u256 = 0x7; // 3-bit mask
    let mut i: u8 = 0;
    loop {
        if i >= block_size || (leftmost + i) >= 8 {
            break;
        }
        let bit_pos: u32 = (row * constants::ROW_BIT_COUNT + (leftmost + i) * constants::BLOCK_BIT_COUNT).into();
        let shift: u256 = BitShift::shl(1_u256, bit_pos.into());
        let mask = cell_mask * shift;
        packed = packed & ~mask;
        i += 1;
    };

    packed.try_into().unwrap()
}

/// Clear all blocks of the same size as the targeted block at (row, col).
/// Used by Tsunami Branch A Level 5.
/// Returns new blocks.
pub fn clear_all_of_size(blocks: felt252, row: u8, col: u8) -> felt252 {
    let block_size = Controller::get_block(blocks, row, col);
    if block_size == 0 {
        return blocks;
    }

    // Clear every cell that has this value
    let mut packed: u256 = blocks.into();
    let modulo: u256 = constants::BLOCK_SIZE.into();
    let block_mask: u256 = (constants::BLOCK_SIZE - 1).into();
    let mut mask: u256 = 0;
    let mut temp: u256 = packed;
    let mut shift: u256 = 1;
    loop {
        if temp.low == 0_u128 && temp.high == 0_u128 {
            break;
        }
        let cell: u8 = (temp % modulo).try_into().unwrap();
        if cell == block_size {
            mask = mask | (block_mask * shift);
        }
        temp = temp / modulo;
        if temp.low == 0_u128 && temp.high == 0_u128 {
            break;
        }
        shift = shift * modulo;
    };

    let new_blocks: u256 = packed & ~mask;
    new_blocks.try_into().unwrap()
}

/// Clear an entire row at row_index. Zeroes all 8 blocks in that row.
/// Returns new blocks.
pub fn clear_row(blocks: felt252, row_index: u8) -> felt252 {
    let base_mask = constants::ROW_SIZE - 1;
    let exp = row_index * constants::ROW_BIT_COUNT;
    let shift: u256 = BitShift::shl(1_u256, exp.into());
    let mask: u256 = base_mask.into() * shift;
    let mut bitmap: u256 = blocks.into();
    bitmap = bitmap & ~mask;
    bitmap.try_into().unwrap()
}
