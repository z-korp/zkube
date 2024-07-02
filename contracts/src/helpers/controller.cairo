use core::array::ArrayTrait;
use core::traits::TryInto;
// Core imports

use zkube::constants;
use zkube::helpers::packer::Packer;

mod errors {
}

#[generate_trait]
impl Controller of ControllerTrait {
    fn apply_gravity(bitmap: felt252) -> felt252 {
        let value: u256 = bitmap.into();
        let mut rows: Array<u32> = Packer::unpack(value, constants::ROW_SIZE);
        let mut bottom = match rows.pop_front() {
            Option::Some(row) => row,
            Option::None => { return bitmap; },
        };
        let mut bottom_blocks: Array<u32> = Packer::unpack(bottom, constants::BLOCK_SIZE);
        loop {
            let top = match rows.pop_front() {
                Option::Some(row) => row,
                Option::None => { rows.append(bottom); break; },
            };
            let mut top_blocks: Array<u32> = Packer::unpack(top, constants::BLOCK_SIZE);
            let mut pointer: u32 = 0;
            let mut index: u32 = 0;
            let mut new_top_blocks: Array<u32> = array![];
            let mut new_bottom_blocks: Array<u32> = array![];
            loop {
                if pointer >= constants::DEFAULT_GRID_WIDTH.into() || pointer >= constants::DEFAULT_GRID_WIDTH.into() {
                    break;
                }
                let top_block = *top_blocks.at(pointer.into());
                let bottom_block = *bottom_blocks.at(pointer.into());
                if bottom_block == 0 {
                    index += 1;
                    pointer += 1;

                    if index == top_block {
                        loop {
                            if pointer == new_bottom_blocks.len() {
                                break;
                            }
                            new_top_blocks.append(0);
                            new_bottom_blocks.append(top_block);
                            index = 0;
                        };
                    };
                } else {
                    pointer += top_block - index;
                    loop {
                        if pointer == new_bottom_blocks.len() {
                            break;
                        }
                        new_top_blocks.append(top_block);
                        new_bottom_blocks.append(bottom_block);
                        index = 0;
                    };
                }
            };
        };

        




        let result: u256 = Packer::pack(rows, constants::ROW_SIZE);
        result.try_into().unwrap()
    }

    fn assess_lines(bitmap: felt252) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let mut new_rows: Array<u32> = array![];
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
        loop {
            match rows.pop_front() {
                Option::Some(row) => {
                    if row != 0 {
                        new_rows.append(row);
                    }
                },
                Option::None => {
                    break;
                },
            };
        };
        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
        result.try_into().unwrap()
    }

    fn add_line(bitmap: felt252, line: u32) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let mut new_rows: Array<u32> = array![line];
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
        loop {
            match rows.pop_front() {
                Option::Some(row) => {
                    new_rows.append(row);
                },
                Option::None => {
                    break;
                },
            };
        };
        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
        result.try_into().unwrap()
    }
}
