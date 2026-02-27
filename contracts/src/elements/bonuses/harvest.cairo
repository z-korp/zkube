use alexandria_math::fast_power::fast_power;
use core::hash::HashStateTrait;
use core::poseidon::PoseidonTrait;
use zkube::constants;
use zkube::helpers::controller::Controller;

pub mod errors {
    pub const NO_BLOCKS_TO_DESTROY: felt252 = 'Harvest: no blocks to destroy';
}

#[derive(Copy, Drop)]
struct VisualBlock {
    row: u8,
    col: u8,
    size: u8,
}

fn collect_visual_blocks(blocks: felt252) -> Array<VisualBlock> {
    let mut result: Array<VisualBlock> = array![];

    let mut row: u8 = 0;
    loop {
        if row >= constants::DEFAULT_GRID_HEIGHT {
            break;
        }

        let mut col: u8 = 0;
        loop {
            if col >= constants::DEFAULT_GRID_WIDTH {
                break;
            }

            let val = Controller::get_block(blocks, row, col);
            if val > 0 {
                let is_start = if col == 0 {
                    true
                } else {
                    Controller::get_block(blocks, row, col - 1) != val
                };

                if is_start {
                    result.append(VisualBlock { row, col, size: val });
                }
            }

            col += 1;
        };

        row += 1;
    };

    result
}

fn destroy_visual_block(blocks: felt252, row: u8, start_col: u8, size: u8) -> felt252 {
    let mut packed: u256 = blocks.into();
    let block_mask: u256 = 7;

    let mut i: u8 = 0;
    loop {
        if i >= size {
            break;
        }

        let bit_pos: u32 = row.into() * constants::ROW_BIT_COUNT.into()
            + (start_col + i).into() * constants::BLOCK_BIT_COUNT.into();
        let shift: u256 = fast_power(2_u256, bit_pos.into());
        packed = packed & ~(block_mask * shift);

        i += 1;
    };

    packed.try_into().unwrap()
}

pub fn harvest_random_blocks(blocks: felt252, seed: felt252, count: u8) -> (felt252, u16) {
    if count == 0 {
        return (blocks, 0);
    }

    let block_list = collect_visual_blocks(blocks);
    let total: u32 = block_list.len().try_into().unwrap();

    if total == 0 {
        return (blocks, 0);
    }

    let to_destroy: u32 = if count.into() > total { total } else { count.into() };

    let mut new_blocks = blocks;
    let mut cubes: u16 = 0;
    let mut picked: Array<u32> = array![];

    let mut i: u32 = 0;
    loop {
        if i >= to_destroy {
            break;
        }

        let h = PoseidonTrait::new().update(seed).update('HARVEST').update(i.into()).finalize();
        let h_u256: u256 = h.into();
        let remaining: u32 = total - i;
        let target_idx: u32 = (h_u256 % remaining.into()).try_into().unwrap();

        let actual_idx = find_unpicked_index(@block_list, @picked, target_idx);
        picked.append(actual_idx);

        let block = *block_list.at(actual_idx);
        new_blocks = destroy_visual_block(new_blocks, block.row, block.col, block.size);
        cubes += block.size.into();

        i += 1;
    };

    (new_blocks, cubes)
}

fn find_unpicked_index(blocks: @Array<VisualBlock>, picked: @Array<u32>, target: u32) -> u32 {
    let total: u32 = blocks.len().try_into().unwrap();

    let mut count: u32 = 0;
    let mut idx: u32 = 0;
    loop {
        if idx >= total {
            break;
        }

        if !is_picked(picked, idx) {
            if count == target {
                return idx;
            }
            count += 1;
        }

        idx += 1;
    };

    0
}

fn is_picked(picked: @Array<u32>, idx: u32) -> bool {
    let len: u32 = picked.len().try_into().unwrap();

    let mut i: u32 = 0;
    loop {
        if i >= len {
            return false;
        }

        if *picked.at(i) == idx {
            return true;
        }

        i += 1;
    };
}
