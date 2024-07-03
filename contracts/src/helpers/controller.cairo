use core::traits::TryInto;
// Core imports

use core::debug::PrintTrait;

// External imports

use origami::random::deck::{Deck, DeckTrait};

// External imports

use alexandria_math::fast_power::fast_power;

// Internal imports

use zkube::constants;
use zkube::elements::decks::easy;
use zkube::helpers::math::Math;
use zkube::helpers::packer::Packer;
use zkube::helpers::gravity::Gravity;
use zkube::helpers::math::Math;
use zkube::types::cards::Card;


mod errors {
    const CONTROLLER_NOT_ENOUGH_ROOM: felt252 = 'Controller: not enough room';
}

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

    fn create_line(seed: felt252) -> felt252 {
        let mut new_line: u32 = 0;
        let mut zero_location: u256 = seed.into() % constants::BLOCK_SIZE.into();
        zero_location *= constants::BLOCK_BIT_COUNT.try_into().unwrap();
        new_line = Math::two_power(zero_location.try_into().unwrap());

        let mut deck: Deck = DeckTrait::new(seed, easy::DeckDataImpl::count());

        while deck.remaining != 0 {
            let new_block: u8 = DeckTrait::draw(ref deck);
            let mut value_to_set: u32 = (new_block + 1).into();

            let mut i = 0;
            while constants::DEFAULT_GRID_HEIGHT != i {
                let block_pos = i * constants::BLOCK_BIT_COUNT;
                let block_value = new_line * Math::two_power(block_pos.into());
            }
        };

        let x: felt252 = 'return';
        x
    }

    #[inline(always)]
    fn get_row(bitmap: felt252, row_index: u8) -> u32 {
        let bitmap: u256 = bitmap.into();
        let mask_left: u256 = fast_power(2, ((row_index + 1) * constants::ROW_BIT_COUNT).into())
            - 1;
        let mask_right: u256 = fast_power(2, (row_index * constants::ROW_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let row = bitmap & mask;
        (row / fast_power(2, (row_index * constants::ROW_BIT_COUNT).into())).try_into().unwrap()
    }

    #[inline(always)]
    fn get_block_from_row(row: u32, block_index: u8) -> u8 {
        let mask_left: u32 = fast_power(2, ((block_index + 1) * constants::BLOCK_BIT_COUNT).into())
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let block = row & mask;
        (block / fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()))
            .try_into()
            .unwrap()
    }

    #[inline(always)]
    fn get_block(bitmap: felt252, row_index: u8, block_index: u8) -> u8 {
        let row = Self::get_row(bitmap, row_index);
        Self::get_block_from_row(row, block_index)
    }

    #[inline(always)]
    fn swipe_left(bitmap: felt252, row_index: u8, block_index: u8, mut count: u8) -> felt252 {
        let mut row = Self::get_row(bitmap, row_index);
        let block = Self::get_block_from_row(row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = row & mask;
        // [Compute] Remove the block from the row
        row = row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(row & (mask * shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        row = row | (full_block * shift);
        // [Return] Updated bitmap
        let bitmap: u256 = bitmap.into();
        Packer::replace(bitmap, row_index, constants::ROW_SIZE, row).try_into().unwrap()
    }

    #[inline(always)]
    fn swipe_right(bitmap: felt252, row_index: u8, block_index: u8, mut count: u8) -> felt252 {
        let mut row = Self::get_row(bitmap, row_index);
        let block = Self::get_block_from_row(row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = row & mask;
        // [Compute] Remove the block from the row
        row = row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(row & (mask / shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        row = row | (full_block / shift);
        // [Return] Updated bitmap
        let bitmap: u256 = bitmap.into();
        Packer::replace(bitmap, row_index, constants::ROW_SIZE, row).try_into().unwrap()
    }

    #[inline(always)]
    fn swipe(
        bitmap: felt252, row_index: u8, block_index: u8, direction: bool, mut count: u8
    ) -> felt252 {
        match direction {
            true => Self::swipe_left(bitmap, row_index, block_index, count),
            false => Self::swipe_right(bitmap, row_index, block_index, count),
        }
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

    #[test]
    fn test_controller_get_row() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_get_block_from_row() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let row: u32 = 0b001_010_010_000_011_011_011_000;
        assert_eq!(Controller::get_block_from_row(row, 0), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 1), 0b011);
        assert_eq!(Controller::get_block_from_row(row, 2), 0b011);
        assert_eq!(Controller::get_block_from_row(row, 3), 0b011);
        assert_eq!(Controller::get_block_from_row(row, 4), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 5), 0b010);
        assert_eq!(Controller::get_block_from_row(row, 6), 0b010);
        assert_eq!(Controller::get_block_from_row(row, 7), 0b001);
        let row: u32 = 0b010_010_010_010_100_100_100_100;
        assert_eq!(Controller::get_block_from_row(row, 0), 0b100);
        assert_eq!(Controller::get_block_from_row(row, 1), 0b100);
        assert_eq!(Controller::get_block_from_row(row, 2), 0b100);
        assert_eq!(Controller::get_block_from_row(row, 3), 0b100);
        assert_eq!(Controller::get_block_from_row(row, 4), 0b010);
        assert_eq!(Controller::get_block_from_row(row, 5), 0b010);
        assert_eq!(Controller::get_block_from_row(row, 6), 0b010);
        assert_eq!(Controller::get_block_from_row(row, 7), 0b010);
        let row: u32 = 0b000_000_000_001_000_000_000_001;
        assert_eq!(Controller::get_block_from_row(row, 0), 0b001);
        assert_eq!(Controller::get_block_from_row(row, 1), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 2), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 3), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 4), 0b001);
        assert_eq!(Controller::get_block_from_row(row, 5), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 6), 0b000);
        assert_eq!(Controller::get_block_from_row(row, 7), 0b000);
    }

    #[test]
    fn test_controller_get_single_block() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        assert_eq!(Controller::get_block(blocks, 1, 4), 0b010);
    }

    #[test]
    fn test_controller_swipe_left_01() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let new_blocks = Controller::swipe(blocks, 2, 0, true, 2);
        assert_eq!(Controller::get_row(new_blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(new_blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(new_blocks, 2), 0b000_000_000_001_000_001_000_000);
    }

    #[test]
    fn test_controller_swipe_left_02() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let new_blocks = Controller::swipe(blocks, 0, 1, true, 1);
        assert_eq!(Controller::get_row(new_blocks, 0), 0b001_010_010_011_011_011_000_000);
        assert_eq!(Controller::get_row(new_blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(new_blocks, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_swipe_right_01() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let new_blocks = Controller::swipe(blocks, 0, 1, false, 1);
        assert_eq!(Controller::get_row(new_blocks, 0), 0b001_010_010_000_000_011_011_011);
        assert_eq!(Controller::get_row(new_blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(new_blocks, 2), 0b000_000_000_001_000_000_000_001);
    }
}
