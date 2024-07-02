use core::traits::TryInto;
// Core imports

use zkube::constants;
use zkube::helpers::packer::Packer;

mod errors {
}

#[generate_trait]
impl Controller of ControllerTrait {
    #[inline(always)]
    fn apply_gravity(bitmap: felt252) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
        
        let bottom = rows.pop_front().unwrap();
        let bottom_blocks: Array<u8> = Packer::unpack(bottom, constants::BLOCK_SIZE);

        let top = rows.pop_front().unwrap();




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
