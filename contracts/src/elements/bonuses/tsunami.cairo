use alexandria_math::fast_power::fast_power;
use zkube::constants;
use zkube::helpers::controller::Controller;

pub fn clear_targeted_row(blocks: felt252, row_index: u8) -> felt252 {
    let base_mask = constants::ROW_SIZE - 1;
    let exp = row_index * constants::ROW_BIT_COUNT;
    let shift: u256 = fast_power(2_u256, exp.into());
    let mask: u256 = base_mask.into() * shift;
    let mut bitmap: u256 = blocks.into();
    bitmap = bitmap & ~mask;
    bitmap.try_into().unwrap()
}

pub fn clear_targeted_block(blocks: felt252, row: u8, col: u8) -> felt252 {
    let block_size = Controller::get_block(blocks, row, col);
    if block_size == 0 {
        return blocks;
    }

    let start_col = find_block_start(blocks, row, col, block_size);
    zero_cells(blocks, row, start_col, block_size)
}

pub fn clear_all_of_size(blocks: felt252, row: u8, col: u8) -> felt252 {
    let target_size = Controller::get_block(blocks, row, col);
    if target_size == 0 {
        return blocks;
    }

    let packed: u256 = blocks.into();
    let block_mask: u256 = 7;
    let mut new_packed: u256 = packed;

    let mut pos: u32 = 0;
    loop {
        if pos >= constants::DEFAULT_GRID_WIDTH.into() * constants::DEFAULT_GRID_HEIGHT.into() {
            break;
        }

        let bit_offset: u32 = pos * constants::BLOCK_BIT_COUNT.into();
        let shift: u256 = fast_power(2_u256, bit_offset.into());
        let cell_val: u8 = ((packed / shift) % constants::BLOCK_SIZE.into()).try_into().unwrap();

        if cell_val == target_size {
            new_packed = new_packed & ~(block_mask * shift);
        }

        pos += 1;
    };

    new_packed.try_into().unwrap()
}

fn find_block_start(blocks: felt252, row: u8, col: u8, size: u8) -> u8 {
    let mut start = col;

    loop {
        if start == 0 {
            break;
        }

        if Controller::get_block(blocks, row, start - 1) != size {
            break;
        }

        start -= 1;
    };

    start
}

fn zero_cells(blocks: felt252, row: u8, start_col: u8, count: u8) -> felt252 {
    let mut packed: u256 = blocks.into();
    let block_mask: u256 = 7;

    let mut i: u8 = 0;
    loop {
        if i >= count {
            break;
        }

        let bit_offset: u32 = row.into() * constants::ROW_BIT_COUNT.into()
            + (start_col + i).into() * constants::BLOCK_BIT_COUNT.into();
        let shift: u256 = fast_power(2_u256, bit_offset.into());
        packed = packed & ~(block_mask * shift);

        i += 1;
    };

    packed.try_into().unwrap()
}

pub fn clear_row(blocks: felt252, row_index: u8) -> felt252 {
    clear_targeted_row(blocks, row_index)
}
