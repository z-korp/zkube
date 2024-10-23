use core::traits::Into;
use core::traits::TryInto;

// Core imports

use core::debug::PrintTrait;

// External imports

use alexandria_math::fast_power::fast_power;
use alexandria_math::BitShift;
use origami_random::deck::{Deck, DeckTrait};
use origami_random::dice::{Dice, DiceTrait};

// Internal imports

use zkube::constants;
use zkube::helpers::packer::Packer;
use zkube::helpers::gravity::Gravity;
use zkube::types::width::Width;
use zkube::types::block::{Block, BlockTrait};
use zkube::types::difficulty::{Difficulty, DifficultyTrait};

// Errors

mod errors {
    const CONTROLLER_NOT_ENOUGH_ROOM: felt252 = 'Controller: not enough room';
}

#[generate_trait]
impl Controller of ControllerTrait {
    /// Apply gravity to the grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// # Returns
    /// The updated grid.
    fn apply_gravity(mut blocks: felt252) -> felt252 {
        let blocks_u256: u256 = blocks.into();
        let mut new_block_rows: Array<u32> = array![];
        let mut block_rows: Array<u32> = Packer::unpack(blocks_u256, constants::ROW_SIZE);
        let mut bottom = match block_rows.pop_front() {
            Option::Some(row) => row,
            Option::None => { return blocks; },
        };
        loop {
            let top = match block_rows.pop_front() {
                Option::Some(row) => row,
                Option::None => {
                    new_block_rows.append(bottom);
                    break;
                },
            };
            let (new_top, new_bottom) = Gravity::apply(top, bottom);
            bottom = new_top;
            new_block_rows.append(new_bottom);
        };

        let blocks: u256 = Packer::pack(new_block_rows, constants::ROW_SIZE);
        blocks.try_into().unwrap()
    }

    /// Remove all full lines and return the new grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `counter` - The combo counter.
    /// * `points_earned` - The points earned.
    /// # Returns
    /// The new grid.
    fn assess_lines(
        bitmap: felt252, ref counter: u8, ref points_earned: u32, accountable: bool
    ) -> felt252 {
        let bitmap: u256 = bitmap.into();
        println!("================================");
        println!("bitmap: {}", bitmap);
        let mut new_rows: Array<u32> = array![];
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
        loop {
            match rows.pop_front() {
                Option::Some(row) => {
                    println!("row: {}", row);
                    if row == 0 {
                        continue;
                    }
                    let new_row = Self::assess_line(row);
                    if new_row != 0 {
                        new_rows.append(new_row);
                        println!("new_row append: {}", new_row);
                    } else if accountable {
                        counter += 1;
                        points_earned += counter.into();
                    };
                },
                Option::None => { break; },
            };
        };
        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
        println!("result: {}", result);
        println!("================================");
        result.try_into().unwrap()
    }

    /// Returns the row if it is not full, otherwise returns 0
    /// # Arguments
    /// * `row` - The row.
    /// # Returns
    /// The updated row.
    #[inline(always)]
    fn assess_line(row: u32) -> u32 {
        // [Check] Left block is not empty
        let exp: u32 = constants::ROW_BIT_COUNT.into() - constants::BLOCK_BIT_COUNT.into();
        let bound: u32 = fast_power(2, exp);
        if row < bound {
            return row;
        }
        // [Check] Each block must be not 0
        if Packer::contains(row, 0_u8, constants::BLOCK_SIZE) {
            return row;
        }
        0
    }

    /// Add a line to the grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `line` - The new line.
    /// # Returns
    /// The updated grid.
    fn add_line(bitmap: felt252, line: u32) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let shift: u256 = constants::ROW_SIZE.into();
        let result: u256 = bitmap * shift + line.into();
        result.try_into().unwrap()
    }

    /// Create a new line.
    /// # Arguments
    /// * `seed` - The seed.
    /// * `difficulty` - The difficulty.
    /// # Returns
    /// The new line.
    fn create_line(seed: felt252, difficulty: Difficulty) -> u32 {
        let mut validated: bool = false;
        let mut size: u8 = 0;
        let mut blocks: u32 = 0;

        let mut deck: Deck = DeckTrait::new(seed, difficulty.count());
        let mut dice: Dice = DiceTrait::new(constants::BLOCK_SIZE, seed);

        while deck.remaining != 0 && size < constants::DEFAULT_GRID_WIDTH {
            let block: Block = difficulty.reveal(deck.draw());
            let block_size: u8 = block.size().into();
            if block_size > (constants::DEFAULT_GRID_WIDTH - size)
                || (block_size == (constants::DEFAULT_GRID_WIDTH - size) && !validated) {
                continue;
            };
            let power: u32 = block_size.into() * constants::BLOCK_BIT_COUNT.into();
            let exp: u32 = fast_power(2, power);
            validated = validated || block.get_bits() == 0;
            blocks = blocks * exp + block.get_bits();
            size += block_size;
        };

        // Shuffle because often the hole is at the end of the line
        Self::shuffle_line(blocks, seed)
    }

    /// Shuffle the line
    /// # Arguments
    /// * `blocks` - The row
    /// # Returns
    /// The new row.
    fn shuffle_line(blocks: u32, seed: felt252) -> u32 {
        let mut shift_rng: Dice = DiceTrait::new(10, seed);
        let shift_amount = constants::BLOCK_BIT_COUNT * shift_rng.roll();

        let blocks = Self::circular_shift_right(blocks, shift_amount, constants::ROW_BIT_COUNT);

        Self::align_line(blocks)
    }

    /// Align line while some blocks are not aligned (eg cut in half).
    /// # Arguments
    /// * `blocks` - The row
    /// # Returns
    /// The new row.
    fn align_line(blocks: u32) -> u32 {
        let mut new_blocks = blocks;
        while !Self::are_block_aligned(new_blocks) {
            new_blocks =
                Self::circular_shift_right(
                    new_blocks, constants::BLOCK_BIT_COUNT, constants::ROW_BIT_COUNT
                );
        };
        new_blocks
    }

    /// Shift the bits to the right.
    /// Bits shifted out are wrapped around.
    /// # Arguments
    /// * `bitmap` - The bitmap to shift
    /// * `shift` - The shift amount.
    /// * `total_bits` - The total bits.
    /// # Returns
    /// A bool indicating if the blocks are aligned.
    fn circular_shift_right(bitmap: u32, shift: u8, total_bits: u8) -> u32 {
        let shift = shift % total_bits;
        let mask = BitShift::shl(1, total_bits.into()) - 1;

        let right_shifted = BitShift::shr(bitmap, shift.into());

        // Get the bits that were shifted out
        let wrapped_bits = BitShift::shl(
            bitmap & (BitShift::shl(1, shift.into()) - 1), (total_bits - shift).into()
        );

        // Combine and mask
        (right_shifted | wrapped_bits) & mask
    }

    /// Check if the blocks are aligned.
    /// Call after the shuffling, to check if no blocks are cut in half.
    /// # Arguments
    /// * `blocks` - The row.
    /// # Returns
    /// A bool indicating if the blocks are aligned.
    fn are_block_aligned(blocks: u32) -> bool {
        let mask = 0b111;
        let first_block = blocks & mask;

        if (first_block == 0 || first_block == 1) {
            true
        } else if (first_block == 2) {
            let mask = 0b111_111;
            let b = blocks & mask;
            let mask2 = 0b111_000_000;
            let c = blocks & mask2;
            let mask3 = 0b111_000_000_000;
            let d = blocks & mask3;
            return b == 0b010_010 && (c != 0b010_000_000 && d != 0b010_000_000_000);
        } else if (first_block == 3) {
            let mask = 0b111_111_111;
            let b = blocks & mask;
            let mask2 = 0b111_111_111_111;
            let c = blocks & mask2;
            return b == 0b011_011_011 && c != 0b011_011_011_011;
        } else if (first_block == 4) {
            let mask = 0b111_111_111_111;
            let b = blocks & mask;
            return b == 0b100_100_100_100;
        } else {
            false
        }
    }

    /// Get the row from the grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// # Returns
    /// The row.
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

    /// Get the block from the row.
    /// # Arguments
    /// * `row` - The row.
    /// * `block_index` - The block index.
    /// # Returns
    /// The block.
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

    /// Get the block from the grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// * `block_index` - The block index.
    /// # Returns
    /// The block.
    #[inline(always)]
    fn get_block(bitmap: felt252, row_index: u8, block_index: u8) -> u8 {
        let row = Self::get_row(bitmap, row_index);
        Self::get_block_from_row(row, block_index)
    }

    /// Swipe the blocks in the grid to the left.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// * `block_index` - The block index.
    /// * `count` - The count.
    /// # Returns
    /// The updated grid.
    #[inline(always)]
    fn swipe_left(blocks: felt252, row_index: u8, block_index: u8, mut count: u8) -> felt252 {
        let mut block_row = Self::get_row(blocks, row_index);
        let block = Self::get_block_from_row(block_row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = block_row & mask;
        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(block_row & (mask * shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        block_row = block_row | (full_block * shift);
        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, constants::ROW_SIZE, block_row);
        new_blocks.try_into().unwrap()
    }

    /// Swipe the blocks in the grid to the right.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// * `block_index` - The block index.
    /// * `count` - The count.
    /// # Returns
    /// The updated grid.
    #[inline(always)]
    fn swipe_right(blocks: felt252, row_index: u8, block_index: u8, mut count: u8) -> felt252 {
        let mut block_row = Self::get_row(blocks, row_index);
        let block = Self::get_block_from_row(block_row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = block_row & mask;
        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(block_row & (mask / shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        block_row = block_row | (full_block / shift);
        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, constants::ROW_SIZE, block_row);

        new_blocks.try_into().unwrap()
    }

    /// Swipe the blocks in the grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// * `block_index` - The block index.
    /// * `direction` - The direction.
    /// * `count` - The count.
    /// # Returns
    /// The updated grid.
    #[inline(always)]
    fn swipe(
        blocks: felt252, row_index: u8, block_index: u8, direction: bool, mut count: u8
    ) -> felt252 {
        match direction {
            true => Self::swipe_left(blocks, row_index, block_index, count),
            false => Self::swipe_right(blocks, row_index, block_index, count),
        }
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{Controller, Difficulty};

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
        let mut counter = 0;
        let mut points = 0;
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::apply_gravity(bitmap);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let blocks = Controller::apply_gravity(blocks);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
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
        let mut counter = 0;
        let mut points = 0;
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        assert_eq!(blocks, 0b000_000_000_001_000_000_000_001_001_010_010_000_011_011_011_000);
    }

    #[test]
    fn test_assess_lines_2() {
        // Initial grid
        // 100_100_100_100_000_000_000_000
        // 000_000_001_000_000_000_000_000
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 100_100_100_100_000_000_000_000
        // 000_000_001_000_000_000_000_000
        // 001_010_010_000_011_011_011_000
        let mut counter = 0;
        let mut points = 0;
        let blocks: felt252 =
            0b100_100_100_100_000_000_000_000_000_000_001_000_000_000_000_000_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        assert_eq!(
            blocks,
            0b100_100_100_100_000_000_000_000_000_000_001_000_000_000_000_000_001_010_010_000_011_011_011_000
        );
    }

    #[test]
    fn test_points_earned() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        let mut counter = 0;
        let mut points = 0;
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::apply_gravity(bitmap);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let _ = Controller::assess_lines(blocks, ref counter, ref points, true);
        assert_eq!(points, 3);
    }

    #[test]
    fn test_are_block_aligned() {
        let mut blocks: u32 = 0b000_010_010_000_011_011_011_000;
        assert_eq!(Controller::are_block_aligned(blocks), true);
        blocks = 0b001_010_010_000_011_011_011_000;
        assert_eq!(Controller::are_block_aligned(blocks), true);
        blocks = 0b010_010_000_011_011_011_000_000;
        assert_eq!(Controller::are_block_aligned(blocks), true);
        blocks = 0b010_000_011_011_011_000_000_010;
        assert_eq!(Controller::are_block_aligned(blocks), false);
        blocks = 0b011_011_011_000_001_010_010_000;
        assert_eq!(Controller::are_block_aligned(blocks), true);
        blocks = 0b011_011_000_001_010_010_000_011;
        assert_eq!(Controller::are_block_aligned(blocks), false);
        blocks = 0b100_100_100_100_001_010_010_000;
        assert_eq!(Controller::are_block_aligned(blocks), true);
        blocks = 0b100_100_100_001_010_010_000_100;
        assert_eq!(Controller::are_block_aligned(blocks), false);
    }

    #[test]
    fn test_circular_shift_right() {
        assert_eq!(
            Controller::circular_shift_right(0b000_000_000_001_000_000_000_001, 3, 24),
            0b001_000_000_000_001_000_000_000
        );
    }

    #[test]
    fn test_align_block() {
        let mut blocks = 0b000_010_010_000_011_011_011_000;
        assert_eq!(Controller::align_line(blocks), 0b000_010_010_000_011_011_011_000);
        blocks = 0b000_010_010_000_011_011_011_001;
        assert_eq!(Controller::align_line(blocks), 0b000_010_010_000_011_011_011_001);
        blocks = 0b010_000_000_011_011_011_000_010;
        assert_eq!(Controller::align_line(blocks), 0b010_010_000_000_011_011_011_000);
        blocks = 0b011_011_000_001_010_010_000_011;
        assert_eq!(Controller::align_line(blocks), 0b011_011_011_000_001_010_010_000);
        blocks = 0b100_100_100_001_010_010_000_100;
        assert_eq!(Controller::align_line(blocks), 0b100_100_100_100_001_010_010_000);
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
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::swipe(bitmap, 2, 0, true, 2);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_001_000_000);
    }

    #[test]
    fn test_controller_swipe_left_02() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::swipe(bitmap, 0, 1, true, 1);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_011_011_011_000_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_swipe_right_01() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::swipe(bitmap, 0, 1, false, 1);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_000_011_011_011);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_create_line_01() {
        let seed: felt252 = 'SEED';
        let easy: Difficulty = Difficulty::Easy;
        let blocks = Controller::create_line(seed, easy);
        assert_eq!(blocks, 0b001_010_010_001_001_001_000_000);
    }

    #[test]
    fn test_controller_create_line_02() {
        let seed: felt252 = 'DEES';
        let easy: Difficulty = Difficulty::Easy;
        let blocks = Controller::create_line(seed, easy);
        assert_eq!(blocks, 0b010_010_001_001_000_001_010_010);
    }

    #[test]
    fn test_controller_assess_line() {
        // Initial grid
        // [0, 0, 0, 0, 0, 0, 0, 0] -> 000_000_000_000_000_000_000_000
        // [0, 0, 0, 0, 0, 0, 0, 0] -> 000_000_000_000_000_000_000_000
        // [0, 0, 0, 0, 0, 0, 0, 0] -> 000_000_000_000_000_000_000_000
        // [0, 0, 0, 0, 0, 0, 0, 0] -> 000_000_000_000_000_000_000_000
        // [0, 0, 0, 0, 0, 0, 0, 0] -> 000_000_000_000_000_000_000_000
        // [1, 0, 0, 0, 4, 4, 4, 4] -> 100_100_100_100_000_000_000_001
        // [2, 2, 2, 2, 2, 2, 2, 2] -> 010_010_010_010_010_010_010_010
        // [0, 3, 3, 3, 2, 2, 2, 2] -> 010_010_010_010_010_010_010_000
        // [0, 2, 2, 3, 3, 3, 2, 2] -> 010_010_010_100_100_100_000_000
        // [1, 3, 3, 3, 3, 3, 3, 0] -> 000_100_100_100_100_100_100_001

        let mut counter = 0;
        let mut points = 0;
        let blocks =
            0b100_100_100_100_000_000_000_001__010_010_010_010_010_010_010_010__010_010_010_010_010_010_010_000__010_010_010_100_100_100_000_000__000_100_100_100_100_100_100_001;
        let result = Controller::assess_lines(blocks, ref counter, ref points, false);
        assert_eq!(
            result,
            0b100_100_100_100_000_000_000_001__010_010_010_010_010_010_010_000__010_010_010_100_100_100_000_000__000_100_100_100_100_100_100_001
        );
    }


    #[test]
    fn test_controller_not_enough_room_front() {
        // Initial grid
        // 100_100_100_100_000_000_010_010
        // 100_100_100_100_011_011_011_000
        // 001_001_000_010_010_000_010_010
        // 011_011_011_000_011_011_011_000
        // 010_010_010_010_000_011_011_011
        // 001_000_001_011_011_011_010_010
        // 100_100_100_100_000_001_010_010
        // 010_010_010_010_001_010_010_000

        let bitmap: felt252 =
            0b100_100_100_100_000_000_010_010__100_100_100_100_011_011_011_000__001_001_000_010_010_000_010_010__011_011_011_000_011_011_011_000__010_010_010_010_000_011_011_011__001_000_001_011_011_011_010_010__100_100_100_100_000_001_010_010__010_010_010_010_001_010_010_000;
        let blocks = Controller::swipe(bitmap, 1, 4, false, 1);
    }
}
