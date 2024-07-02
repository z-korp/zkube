// Core imports

use core::debug::PrintTrait;

// Internal imports

use zkube::constants;
use zkube::helpers::packer::Packer;
use zkube::helpers::gravity::Gravity;

mod errors {}

#[generate_trait]
impl Controller of ControllerTrait {
    fn apply_gravity(bitmap: felt252) -> felt252 {
        let value: u256 = bitmap.into();
        let mut rows: Array<u32> = Packer::unpack(value, constants::ROW_SIZE);
        let mut new_rows: Array<u32> = array![];
        let mut bottom = match rows.pop_front() {
            Option::Some(row) => row,
            Option::None => { return bitmap; },
        };
        loop {
            let top = match rows.pop_front() {
                Option::Some(row) => row,
                Option::None => {
                    new_rows.append(bottom);
                    break;
                },
            };
            let (new_top, new_bottom) = Gravity::apply(top, bottom);
            bottom = new_top;
            new_rows.append(new_bottom);
        };

        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
        result.try_into().unwrap()
    }

    fn assess_lines(bitmap: felt252) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let mut new_rows: Array<u32> = array![];
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
        loop {
            match rows.pop_front() {
                Option::Some(row) => {
                    let mut blocks: Array<u8> = Packer::unpack(row, constants::BLOCK_SIZE);
                    loop {
                        match blocks.pop_front() {
                            Option::Some(block) => {
                                if block == 0 {
                                    new_rows.append(row);
                                    break;
                                }
                            },
                            Option::None => { break; },
                        };
                    };
                },
                Option::None => { break; },
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
                Option::Some(row) => { new_rows.append(row); },
                Option::None => { break; },
            };
        };
        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
        result.try_into().unwrap()
    }
}

#[cfg(test)]
mod tests {
    // Local imports

    use super::Controller;

    #[test]
    fn test_apply_gravity() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::apply_gravity(blocks);
        let blocks = Controller::assess_lines(blocks);
        let blocks = Controller::apply_gravity(blocks);
        let blocks = Controller::assess_lines(blocks);
        assert_eq!(blocks, 0);
    }

    #[test]
    fn test_assess_lines() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 000_000_000_001_000_000_000_001
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::assess_lines(blocks);
        assert_eq!(blocks, 0b000_000_000_001_000_000_000_001_001_010_010_000_011_011_011_000);
    }
}
