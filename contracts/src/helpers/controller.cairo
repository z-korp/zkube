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

use zkube::constants::{BLOCK_BIT_COUNT, ROW_BIT_COUNT, ROW_SIZE, BLOCK_SIZE, DEFAULT_GRID_WIDTH};
use zkube::helpers::packer::Packer;
use zkube::helpers::gravity::Gravity;
use zkube::types::width::Width;
use zkube::types::block::{Block, BlockTrait};
use zkube::types::difficulty::{Difficulty, DifficultyTrait};

// Errors

mod errors {
    const CONTROLLER_NOT_ENOUGH_ROOM: felt252 = 'Controller: not enough room';
    const CONTROLLER_NOT_COHERENT_LINE: felt252 = 'Controller: not coherent line';
    const CONTROLLER_NOT_COHERENT_GRID: felt252 = 'Controller: not coherent grid';
    const CONTROLLER_NOT_IN_BOUNDARIES: felt252 = 'Controller: not in boundaries';
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
        let mut block_rows: Array<u32> = Packer::unpack(blocks_u256, ROW_SIZE);
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

        let blocks: u256 = Packer::pack(new_block_rows, ROW_SIZE);
        let blocks: felt252 = blocks.try_into().unwrap();
        //assert(Self::check_grid_coherence(blocks), errors::CONTROLLER_NOT_COHERENT_GRID);

        blocks
    }

    /// Remove all full lines and return the new grid.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `counter` - The combo counter.
    /// * `points_earned` - The points earned.
    /// # Returns
    /// The new grid.
    fn assess_lines(
        bitmap: felt252, ref counter: u8, ref points_earned: u16, accountable: bool
    ) -> felt252 {
        let bitmap: u256 = bitmap.into();
        let mut new_rows: Array<u32> = array![];
        let mut rows: Array<u32> = Packer::unpack(bitmap, ROW_SIZE);
        loop {
            match rows.pop_front() {
                Option::Some(row) => {
                    if row == 0 {
                        continue;
                    }
                    let new_row = Self::assess_line(row);
                    if new_row != 0 {
                        new_rows.append(new_row);
                    } else if accountable {
                        counter += 1;
                        points_earned += counter.into();
                    };
                },
                Option::None => { break; },
            };
        };
        let result: u256 = Packer::pack(new_rows, ROW_SIZE);
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
        let exp: u32 = ROW_BIT_COUNT.into() - BLOCK_BIT_COUNT.into();
        let bound: u32 = fast_power(2, exp);
        if row < bound {
            return row;
        }
        // [Check] Each block must be not 0
        if Packer::contains(row, 0_u8, BLOCK_SIZE) {
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
        let shift: u256 = ROW_SIZE.into();
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

        while deck.remaining != 0 && size < DEFAULT_GRID_WIDTH {
            let block: Block = difficulty.reveal(deck.draw());
            let block_size: u8 = block.size().into();
            if block_size > (DEFAULT_GRID_WIDTH - size)
                || (block_size == (DEFAULT_GRID_WIDTH - size) && !validated) {
                continue;
            };
            let power: u32 = block_size.into() * BLOCK_BIT_COUNT.into();
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
        let shift_amount = BLOCK_BIT_COUNT * shift_rng.roll();
        //println!("shift_amount: {}", shift_amount);

        let blocks = Self::circular_shift_right(blocks, shift_amount, ROW_BIT_COUNT);

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
            new_blocks = Self::circular_shift_right(new_blocks, BLOCK_BIT_COUNT, ROW_BIT_COUNT);
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
        let mask_left: u256 = fast_power(2, ((row_index + 1) * ROW_BIT_COUNT).into()) - 1;
        let mask_right: u256 = fast_power(2, (row_index * ROW_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let row = bitmap & mask;
        (row / fast_power(2, (row_index * ROW_BIT_COUNT).into())).try_into().unwrap()
    }

    /// Get the block from the row.
    /// # Arguments
    /// * `row` - The row.
    /// * `block_index` - The block index.
    /// # Returns
    /// The block.
    #[inline(always)]
    fn get_block_from_row(row: u32, block_index: u8) -> u8 {
        let mask_left: u32 = fast_power(2, ((block_index + 1) * BLOCK_BIT_COUNT).into()) - 1;
        let mask_right: u32 = fast_power(2, (block_index * BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let block = row & mask;
        (block / fast_power(2, (block_index * BLOCK_BIT_COUNT).into())).try_into().unwrap()
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

    fn check_row_coherence(row: u32) -> bool {
        if (row == 0) {
            return true;
        }

        let mut index = 0;
        let mut valid = true;

        loop {
            if index >= 8 {
                break valid; // Return our accumulated result
            }

            let block = Self::get_block_from_row(row, index);

            if block == 0 {
                index += 1;
            } else if block == 1 {
                index += 1;
            } else if block == 2 {
                // Check size 2 block
                if index + 1 >= 8 || Self::get_block_from_row(row, index + 1) != 2 {
                    valid = false;
                    break valid;
                }
                index += 2;
            } else if block == 3 {
                // Check size 3 block
                if index
                    + 2 >= 8
                        || Self::get_block_from_row(row, index + 1) != 3
                        || Self::get_block_from_row(row, index + 2) != 3 {
                    valid = false;
                    break valid;
                }
                index += 3;
            } else if block == 4 {
                // Check size 4 block
                if index
                    + 3 >= 8
                        || Self::get_block_from_row(row, index + 1) != 4
                        || Self::get_block_from_row(row, index + 2) != 4
                        || Self::get_block_from_row(row, index + 3) != 4 {
                    valid = false;
                    break valid;
                }
                index += 4;
            } else {
                valid = false;
                break valid;
            }
        };

        //println!("check row coherence valid {}", valid);
        valid
    }

    fn check_grid_coherence(blocks: felt252) -> bool {
        // Convert to higher precision for bitwise operations
        let blocks: u256 = blocks.into();
        let mut row_index = 0;
        let mut coherent = true;

        loop {
            if row_index >= 8 {
                break coherent;
            }

            let row = Self::get_row(blocks.try_into().unwrap(), row_index);
            coherent = Self::check_row_coherence(row);
            if !coherent {
                break coherent;
            }

            row_index += 1;
        }
    }

    /// Swipe the blocks in the grid to the left.
    /// # Arguments
    /// * `bitmap` - The grid.
    /// * `row_index` - The row index.
    /// * `block_index` - The block index.
    /// * `count` - The count.
    /// # Returns
    /// The updated grid.
    fn swipe_left(blocks: felt252, row_index: u8, block_index: u8, mut count: u8) -> felt252 {
        // [Compute] Extract the row from the grid
        let mut block_row = Self::get_row(blocks, row_index);

        // [Compute] Extract the block size
        let block_size = Self::get_block_from_row(block_row, block_index); // 0, 1, 2, 3, 4

        // Check boundaries
        // For swipe left, we check if block_index + count would exceed 7
        if block_index + count + (block_size - 1) >= 8 { // Would exceed max index (7)
            assert(false, errors::CONTROLLER_NOT_IN_BOUNDARIES);
        }

        // [Compute] Block mask
        let left_shift: u32 = ((block_size + block_index) * BLOCK_BIT_COUNT).into();
        let mask_left: u32 = BitShift::shl(1, left_shift) - 1;

        let right_shift: u32 = (block_index * BLOCK_BIT_COUNT).into();
        let mask_right: u32 = BitShift::shl(1, right_shift) - 1;
        let mask = mask_left - mask_right;
        let full_block = block_row & mask;

        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;

        // Create path mask mathematically
        let end_pos = block_index + count + 1;
        let path_mask = BitShift::shl(1, (end_pos * BLOCK_BIT_COUNT).into())
            - BitShift::shl(1, right_shift);

        // [Compute] Path mask to check if there is any block in the path
        assert((block_row & path_mask) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);

        // [Compute] Shift amount in bits
        let shift_bits: u32 = (count * BLOCK_BIT_COUNT).into();

        // [Check] There is room for the block using bit shift
        let shifted_mask = BitShift::shl(mask, shift_bits);
        assert(block_row & shifted_mask == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);

        // [Compute] Add the shifted block to the row
        let shifted_full_block = BitShift::shl(full_block, shift_bits);
        block_row = block_row | shifted_full_block;

        assert(Self::check_row_coherence(block_row), errors::CONTROLLER_NOT_COHERENT_LINE);

        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, ROW_SIZE, block_row);
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
        // [Compute] Extract the row from the grid
        let mut block_row = Self::get_row(blocks, row_index);

        // [Compute] Extract the block size
        let block_size = Self::get_block_from_row(block_row, block_index); // 0, 1, 2, 3, 4

        // [Check] Boundaries
        // For swipe right, we check if block_index - count would go below 0
        assert(block_index >= count, errors::CONTROLLER_NOT_IN_BOUNDARIES);

        // [Compute] Block mask
        let left_shift: u32 = ((block_size + block_index) * BLOCK_BIT_COUNT).into();
        let mask_left: u32 = BitShift::shl(1, left_shift) - 1;

        let right_shift: u32 = (block_index * BLOCK_BIT_COUNT).into();
        let mask_right: u32 = BitShift::shl(1, right_shift) - 1;

        let mask = mask_left - mask_right;

        let full_block = block_row & mask;

        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;

        // [Compute] Path mask to check if there is any block in the path
        let end_pos = block_index - count;
        let start_pos = block_index; // Start checking right after our current position
        let path_mask = BitShift::shl(1, (start_pos * BLOCK_BIT_COUNT).into())
            - BitShift::shl(1, (end_pos * BLOCK_BIT_COUNT).into());

        // Check if any block exists in the path
        assert((block_row & path_mask) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);

        // [Compute] Add the shifted block to the row
        let shift_bits: u32 = (count * BLOCK_BIT_COUNT).into();
        let shifted_full_block = BitShift::shr(full_block, shift_bits);
        block_row = block_row | shifted_full_block;

        assert(Self::check_row_coherence(block_row), errors::CONTROLLER_NOT_COHERENT_LINE);

        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, ROW_SIZE, block_row);

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
    fn test_controller_apply_gravity() {
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
    fn test_controller_assess_lines() {
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
    fn test_controller_assess_lines_2() {
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
    fn test_controller_points_earned() {
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
        let blocks = Controller::apply_gravity(blocks);
        let _ = Controller::assess_lines(blocks, ref counter, ref points, true);
        assert_eq!(points, 3);
    }

    #[test]
    fn test_controller_are_block_aligned() {
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
    fn test_controller_circular_shift_right() {
        assert_eq!(
            Controller::circular_shift_right(0b000_000_000_001_000_000_000_001, 3, 24),
            0b001_000_000_000_001_000_000_000
        );
    }

    #[test]
    fn test_controller_circular_shift_right_2() {
        Controller::circular_shift_right(0b000_000_000_001_000_000_000_001, 3, 24);
    }

    #[test]
    fn test_controller_align_block() {
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
        Controller::swipe(bitmap, 1, 4, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_swipe_bug() {
        let bitmap: felt252 = 0b001_001_011_011_011_001_001_000;
        let blocks = Controller::swipe(bitmap, 0, 5, true, 2);

        println!("blocks: {}", blocks);
    // 001_001_011_000_000_011_011_001_001_000
    }

    #[test]
    fn test_controller_row_coherence_valid_rows() {
        // Empty row
        assert(
            Controller::check_row_coherence(0b000_000_000_000_000_000_000_000),
            'empty row should be valid'
        );

        // Single blocks (size 1) in different positions
        assert(Controller::check_row_coherence(0b001_000_000_000_000_000_000_000), 'single right');
        assert(Controller::check_row_coherence(0b000_001_000_000_000_000_000_000), 'single pos 6');
        assert(Controller::check_row_coherence(0b000_000_001_000_000_000_000_000), 'single pos 5');
        assert(Controller::check_row_coherence(0b000_000_000_001_000_000_000_000), 'single pos 4');
        assert(Controller::check_row_coherence(0b000_000_000_000_001_000_000_000), 'single pos 3');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_001_000_000), 'single pos 2');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_001_000), 'single pos 1');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_000_001), 'single left');

        // Size 2 blocks in different positions
        assert(Controller::check_row_coherence(0b010_010_000_000_000_000_000_000), 'size 2 right');
        assert(Controller::check_row_coherence(0b000_010_010_000_000_000_000_000), 'size 2 pos 5');
        assert(Controller::check_row_coherence(0b000_000_010_010_000_000_000_000), 'size 2 pos 4');
        assert(Controller::check_row_coherence(0b000_000_000_010_010_000_000_000), 'size 2 pos 3');
        assert(Controller::check_row_coherence(0b000_000_000_000_010_010_000_000), 'size 2 pos 2');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_010_010_000), 'size 2 pos 1');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_010_010), 'size 2 left');

        // Size 3 blocks in different positions
        assert(Controller::check_row_coherence(0b011_011_011_000_000_000_000_000), 'size 3 right');
        assert(Controller::check_row_coherence(0b000_011_011_011_000_000_000_000), 'size 3 pos 4');
        assert(Controller::check_row_coherence(0b000_000_011_011_011_000_000_000), 'size 3 pos 3');
        assert(Controller::check_row_coherence(0b000_000_000_011_011_011_000_000), 'size 3 pos 2');
        assert(Controller::check_row_coherence(0b000_000_000_000_011_011_011_000), 'size 3 pos 1');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_011_011_011), 'size 3 left');

        // Size 4 blocks in different positions
        assert(Controller::check_row_coherence(0b100_100_100_100_000_000_000_000), 'size 4 right');
        assert(Controller::check_row_coherence(0b000_100_100_100_100_000_000_000), 'size 4 pos 3');
        assert(Controller::check_row_coherence(0b000_000_100_100_100_100_000_000), 'size 4 pos 2');
        assert(Controller::check_row_coherence(0b000_000_000_100_100_100_100_000), 'size 4 pos 1');
        assert(Controller::check_row_coherence(0b000_000_000_000_100_100_100_100), 'size 4 left');

        // Multiple blocks combinations
        // Size 1 + Size 1
        assert(Controller::check_row_coherence(0b001_000_001_000_000_000_000_000), 'two size 1');
        assert(
            Controller::check_row_coherence(0b001_000_000_000_001_000_000_000), 'two size 1 spaced'
        );

        // Size 1 + Size 2
        assert(
            Controller::check_row_coherence(0b001_010_010_000_000_000_000_000), 'size 1,2 right'
        );
        assert(
            Controller::check_row_coherence(0b010_010_001_000_000_000_000_000), 'size 2,1 right'
        );
        assert(
            Controller::check_row_coherence(0b000_000_001_000_010_010_000_000), 'size 1,2 middle'
        );

        // Size 1 + Size 3
        assert(
            Controller::check_row_coherence(0b001_011_011_011_000_000_000_000), 'size 1,3 right'
        );
        assert(
            Controller::check_row_coherence(0b011_011_011_001_000_000_000_000), 'size 3,1 right'
        );

        // Size 2 + Size 2
        assert(
            Controller::check_row_coherence(0b010_010_010_010_000_000_000_000), 'two size 2 right'
        );
        assert(
            Controller::check_row_coherence(0b010_010_000_000_010_010_000_000), 'two size 2 spaced'
        );

        // Size 2 + Size 3
        assert(
            Controller::check_row_coherence(0b010_010_011_011_011_000_000_000), 'size 2,3 right'
        );
        assert(
            Controller::check_row_coherence(0b011_011_011_010_010_000_000_000), 'size 3,2 right'
        );

        // Maximum combinations filling the row
        assert(Controller::check_row_coherence(0b001_001_001_001_001_001_001_001), 'eight size 1');
        assert(Controller::check_row_coherence(0b010_010_010_010_010_010_010_010), 'four size 2');
        assert(Controller::check_row_coherence(0b001_010_010_011_011_011_000_000), 'size 1,2,3');
        assert(Controller::check_row_coherence(0b010_010_001_011_011_011_000_000), 'size 2,1,3');
    }

    #[test]
    fn test_controller_row_coherence_invalid_rows() {
        // Invalid single block values
        assert(
            !Controller::check_row_coherence(0b100_000_000_000_000_000_000_000),
            'invalid block value 4'
        );
        assert(
            !Controller::check_row_coherence(0b101_000_000_000_000_000_000_000),
            'invalid block value 5'
        );
        assert(
            !Controller::check_row_coherence(0b110_000_000_000_000_000_000_000),
            'invalid block value 6'
        );
        assert(
            !Controller::check_row_coherence(0b111_000_000_000_000_000_000_000),
            'invalid block value 7'
        );

        // Incomplete Size 2 blocks
        assert(
            !Controller::check_row_coherence(0b010_000_000_000_000_000_000_000),
            'incomplete size 2 right'
        );
        assert(
            !Controller::check_row_coherence(0b000_010_000_000_000_000_000_000),
            'incomplete size 2 pos 6'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_010_000_000_000_000_000),
            'incomplete size 2 pos 5'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_010_000_000_000_000),
            'incomplete size 2 middle'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_010_000_000_000),
            'incomplete size 2 pos 3'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_000_010_000_000),
            'incomplete size 2 pos 2'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_000_000_010_000),
            'incomplete size 2 left'
        );

        // Incomplete Size 3 blocks
        assert(
            !Controller::check_row_coherence(0b011_000_000_000_000_000_000_000),
            'incomplete size 3 right single'
        );
        assert(
            !Controller::check_row_coherence(0b011_011_000_000_000_000_000_000),
            'incomplete size 3 right double'
        );
        assert(
            !Controller::check_row_coherence(0b000_011_011_000_000_000_000_000),
            'incomplete size 3 pos 5'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_011_011_000_000_000_000),
            'incomplete size 3 pos 4'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_011_011_000_000_000),
            'incomplete size 3 pos 3'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_011_011_000_000),
            'incomplete size 3 pos 2'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_000_011_011_000),
            'incomplete size 3 pos 1'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_000_000_011_011),
            'incomplete size 3 left'
        );

        // Incomplete Size 4 blocks
        assert(
            !Controller::check_row_coherence(0b100_000_000_000_000_000_000_000),
            'incomplete size 4 right single'
        );
        assert(
            !Controller::check_row_coherence(0b100_100_000_000_000_000_000_000),
            'incomplete size 4 right double'
        );
        assert(
            !Controller::check_row_coherence(0b100_100_100_000_000_000_000_000),
            'incomplete size 4 right triple'
        );
        assert(
            !Controller::check_row_coherence(0b000_100_100_100_000_000_000_000),
            'incomplete size 4 pos 4'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_100_100_100_000_000_000),
            'incomplete size 4 pos 3'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_100_100_100_000_000),
            'incomplete size 4 pos 2'
        );
        assert(
            !Controller::check_row_coherence(0b000_000_000_000_100_100_100_000),
            'incomplete size 4 pos 1'
        );

        // Invalid mixed patterns
        assert(
            !Controller::check_row_coherence(0b010_011_000_000_000_000_000_000), 'invalid mix 2,3'
        );
        assert(
            !Controller::check_row_coherence(0b011_010_000_000_000_000_000_000), 'invalid mix 3,2'
        );
        assert(
            !Controller::check_row_coherence(0b010_001_010_000_000_000_000_000), 'invalid mix 2,1,2'
        );
        assert(
            !Controller::check_row_coherence(0b011_001_011_000_000_000_000_000), 'invalid mix 3,1,3'
        );

        // Invalid continuations
        assert(
            !Controller::check_row_coherence(0b010_010_011_000_000_000_000_000),
            'invalid continuation 2->3'
        );
        assert(
            !Controller::check_row_coherence(0b011_011_010_000_000_000_000_000),
            'invalid continuation 3->2'
        );
        assert(
            !Controller::check_row_coherence(0b010_011_010_000_000_000_000_000),
            'invalid mix middle'
        );

        // Row overflow tests
        assert(
            !Controller::check_row_coherence(0b010_010_010_000_000_000_000_000), 'overflow size 2'
        );
        assert(
            !Controller::check_row_coherence(0b011_011_011_011_011_000_000_000), 'overflow size 3'
        );
        assert(
            !Controller::check_row_coherence(0b100_100_100_100_100_000_000_000), 'overflow size 4'
        );

        // Wrong block order
        assert(
            !Controller::check_row_coherence(0b010_011_010_011_000_000_000_000),
            'wrong block order 1'
        );
        assert(
            !Controller::check_row_coherence(0b011_010_011_010_000_000_000_000),
            'wrong block order 2'
        );
        assert(
            !Controller::check_row_coherence(0b001_010_001_010_000_000_000_000),
            'wrong block order 3'
        );
    }

    #[test]
    fn test_controller_grid_coherence_valid() {
        // Test case 1: Empty grid
        assert(Controller::check_grid_coherence(0), 'empty grid should be coherent');

        // Test case 2: Single valid row with mixed blocks
        let single_row = 0b001_010_010_011_011_011_000_000;
        assert(Controller::check_grid_coherence(single_row), 'grid should be coherent (1)');

        // Test case 3: Multiple valid rows
        // Row 2: Valid single blocks
        // Row 1: Valid size 2 and size 4 blocks
        // Row 0: Valid mixed blocks
        let multi_row: felt252 =
            0b000_000_000_001_000_000_000_001__010_010_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(Controller::check_grid_coherence(multi_row), 'grid should be coherent (2)');
    }

    #[test]
    fn test_controller_grid_coherence_invalid() {
        // Test case 1: Single invalid row (incomplete size 2 block)
        let single_invalid = 0b010_000_000_000_000_000_000_000;
        assert(!Controller::check_grid_coherence(single_invalid), 'grid should be incoherent (1)');

        // Test case 2: Multiple rows with one invalid
        // Row 2: Valid
        // Row 1: Invalid (incomplete size 2)
        // Row 0: Valid
        let multi_row_one_invalid: felt252 =
            0b000_000_000_001_000_000_000_001__010_000_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(
            !Controller::check_grid_coherence(multi_row_one_invalid),
            'grid should be incoherent (2)'
        );

        // Test case 3: Invalid block value
        // Row 2: Valid
        // Row 1: Invalid block value
        // Row 0: Valid
        let invalid_block: felt252 =
            0b000_000_000_001_000_000_000_001__111_000_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(!Controller::check_grid_coherence(invalid_block), 'grid should be incoherent (3)');

        // Test case 4: Mixed issues
        // Row 2: Incomplete size 2
        // Row 1: Incomplete size 3
        // Row 0: Invalid sequence
        let mixed_issues: felt252 =
            0b010_000_000_001_000_000_000_001__011_011_010_010_100_100_100_100__001_010_100_000_011_011_011_000;
        assert(!Controller::check_grid_coherence(mixed_issues), 'grid should be incoherent (4)');
    }

    #[test]
    fn test_controller_grid_coherence_edge_cases() {
        // Test case 1: Grid full of size 1 blocks
        let all_ones: felt252 =
            0b001_001_001_001_001_001_001_001__001_001_001_001_001_001_001_001__001_001_001_001_001_001_001_001;
        assert(Controller::check_grid_coherence(all_ones), 'grid should be coherent (1)');

        // Test case 2: Grid with maximum valid blocks
        // 4 size 4 blocks
        // 3 size 3 blocks
        // 8 size 2 blocks
        let max_blocks: felt252 =
            0b100_100_100_100_000_000_000_000__011_011_011_010_010_000_000_000__001_001_001_001_001_001_001_001;
        assert(Controller::check_grid_coherence(max_blocks), 'grid should be coherent (2)');

        // Test case 3: Grid with alternating patterns
        // Alternating 1 and 2
        // 3, 1, 2
        // 2, 3
        let alternating: felt252 =
            0b001_010_010_001_010_010_001_000__011_011_011_001_010_010_000_000__010_010_011_011_011_000_000_000;
        assert(Controller::check_grid_coherence(alternating), 'grid should be coherent (3)');
    }
    // RIGHT
    #[test]
    fn test_controller_swipe_right_single_block() {
        // Initial grid
        // 000_000_000_001_000_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_000_000_001_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 3);
        assert_eq!(blocks, 0b000_000_000_000_000_000_001_000);
    }

    #[test]
    fn test_controller_swipe_right_single_1_block() {
        // Initial grid
        // 000_000_000_001_000_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_000_000_001_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 3);
        assert_eq!(blocks, 0b000_000_000_000_000_000_001_000);
    }

    #[test]
    fn test_controller_swipe_right_single_2_block() {
        // Initial grid
        // 000_000_000_010_010_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_000_000_100_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_010_010_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, false, 3);
        assert_eq!(blocks, 0b000_000_000_000_000_000_010_010);
    }

    #[test]
    fn test_controller_swipe_right_single_3_block() {
        // Initial grid
        // 000_000_011_011_011_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_011_011_011_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, false, 2);
        assert_eq!(blocks, 0b000_000_000_000_011_011_011_000);
    }


    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_single_3_block_not_first_elem_selected_1() {
        // Initial grid
        // 000_000_011_011_011_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_011_011_011_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 3);
        assert_eq!(blocks, 0b000_000_000_011_011_011_000_000);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_single_3_block_not_first_elem_selected_2() {
        // Initial grid
        // 000_000_011_011_011_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_000_011_011_011 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 4);
        assert_eq!(blocks, 0b000_000_000_000_000_011_011_011);
    }

    #[test]
    fn test_controller_swipe_right_single_4_block() {
        // Initial grid
        // 100_100_100_100_000_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_100_100_100_100 (moved to rightmost position)
        let bitmap: felt252 = 0b100_100_100_100_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 4);
        assert_eq!(blocks, 0b000_000_000_000_100_100_100_100);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_single_4_block_not_first_element_selected() {
        // Initial grid
        // 100_100_100_100_000_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_100_100_100_100 (moved to rightmost position)
        let bitmap: felt252 = 0b000_100_100_100_100_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 5, false, 4);
        assert_eq!(blocks, 0b000_000_000_000_100_100_100_100);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_blocked_by_single() {
        // Initial grid:
        // 000_000_001_001_000_000_000_000
        //           ^   ^
        //    moving |   | blocking
        let bitmap: felt252 = 0b000_000_001_001_000_000_000_000;
        Controller::swipe(bitmap, 0, 5, false, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_blocked_by_size_2() {
        // Initial grid:
        // 000_001_000_010_010_000_000_000
        //      ^        ^   ^
        // block         |   | blocking block
        let bitmap: felt252 = 0b000_001_000_010_010_000_000_000;
        Controller::swipe(bitmap, 0, 6, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_blocked_by_size_3() {
        // Initial grid:
        // 000_001_011_011_011_000_000_000
        //      ^   ^   ^   ^
        // block|   | size 3 blocking block
        let bitmap: felt252 = 0b000_001_011_011_011_000_000_000;
        Controller::swipe(bitmap, 0, 6, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_size_2_blocked() {
        // Initial grid:
        // 000_010_010_001_000_000_000_000
        //      ^   ^   ^
        //              | blocking block
        let bitmap: felt252 = 0b000_010_010_001_000_000_000_000;
        Controller::swipe(bitmap, 0, 5, false, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_size_2_from_middle_2() {
        // Initial grid:
        // 000_010_010_001_000_000_000_000
        //      ^   ^   ^
        //              | blocking block
        let bitmap: felt252 = 0b000_010_010_001_000_000_000_000;
        Controller::swipe(bitmap, 0, 6, false, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_size_3_blocked() {
        // Initial grid:
        // 000_011_011_011_001_000_000_000
        //      ^   ^   ^   ^
        //                  | blocking block
        let bitmap: felt252 = 0b000_011_011_011_001_000_000_000;
        Controller::swipe(bitmap, 0, 4, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_size_3_from_middle() {
        // Initial grid:
        // 000_011_011_011_001_000_000_000
        //      ^   ^   ^   ^
        //                  | blocking block
        let bitmap: felt252 = 0b000_011_011_011_001_000_000_000;
        Controller::swipe(bitmap, 0, 5, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_multiple_blocks() {
        // Initial grid:
        // 000_001_001_001_000_000_000_000
        //      ^   ^   ^
        //              | trying to move through multiple blocks
        let bitmap: felt252 = 0b000_001_001_001_000_000_000_000;
        Controller::swipe(bitmap, 0, 6, false, 4);
    }

    #[test]
    fn test_controller_swipe_right_valid_with_space() {
        // Initial grid:
        // 000_000_001_000_000_000_000_000
        //           ^
        //           | moving right 2 spaces
        let bitmap: felt252 = 0b000_000_001_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 5, false, 2);
        assert_eq!(blocks, 0b000_000_000_000_001_000_000_000);
    }

    #[test]
    fn test_controller_swipe_right_size_2_valid() {
        // Initial grid:
        // 000_010_010_000_000_000_000_000
        //      ^   ^
        //      | moving size 2 right
        let bitmap: felt252 = 0b000_010_010_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 5, false, 2);
        assert_eq!(blocks, 0b000_000_000_010_010_000_000_000);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_size_2_from_middle_1() {
        // Initial grid:
        // 000_010_010_000_000_000_000_000
        //      ^   ^
        //      | moving size 2 right
        let bitmap: felt252 = 0b000_010_010_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 6, false, 2);
        assert_eq!(blocks, 0b000_000_000_010_010_000_000_000);
    }

    #[test]
    fn test_controller_swipe_right_valid_near_blocks() {
        // Initial grid:
        // 000_000_001_000_010_010_000_000
        //           ^       ^   ^
        //           | move  | existing blocks
        let bitmap: felt252 = 0b000_000_001_000_010_010_000_000;
        let blocks = Controller::swipe(bitmap, 0, 5, false, 1);
        assert_eq!(blocks, 0b000_000_000_001_010_010_000_000);
    }

    #[test]
    fn test_controller_swipe_right_to_boundary() {
        // Initial grid:
        // 001_000_000_000_000_000_000_000
        // ^
        // | moving to rightmost available position
        let bitmap: felt252 = 0b001_000_000_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 7, false, 7);
        assert_eq!(blocks, 0b000_000_000_000_000_000_000_001);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_right_mixed_blocking() {
        // Initial grid:
        // 000_001_010_010_011_011_011_000
        //      ^   ^   ^   ^   ^   ^
        //      |       | mixed blocks blocking path
        let bitmap: felt252 = 0b000_001_010_010_011_011_011_000;
        Controller::swipe(bitmap, 0, 6, false, 6);
    }

    // LEFT
    #[test]
    fn test_controller_swipe_left_single_block() {
        // Initial grid
        // 000_000_000_001_000_000_000_000 (single block in middle)
        // Final expected:
        // 001_000_000_000_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_001_000_000_010_010;
        let blocks = Controller::swipe(bitmap, 0, 4, true, 3);
        assert_eq!(blocks, 0b001_000_000_000_000_000_010_010);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_single_block_with_block_in_the_way() {
        // Initial grid
        // 000_000_000_001_000_000_000_000 (single block in middle)
        // Final expected:
        // 001_000_000_000_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_001_001_000_000_010_010;
        let blocks = Controller::swipe(bitmap, 0, 4, true, 3);
        assert_eq!(blocks, 0b001_000_001_000_000_000_010_010);
    }

    #[test]
    fn test_controller_swipe_left_size_2_block() {
        // Initial grid
        // 000_000_000_010_010_000_000_000 (size 2 block in middle)
        // Final expected:
        // 010_010_000_000_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_010_010_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 3);
        assert_eq!(blocks, 0b010_010_000_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_size_3_block() {
        // Initial grid
        // 000_000_011_011_011_000_000_000 (size 3 block in middle)
        // Final expected:
        // 011_011_011_000_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 2);
        assert_eq!(blocks, 0b011_011_011_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_single_3_block_over_itself() {
        // Initial grid
        // 000_000_011_011_011_000_000_000 (single block in middle)
        // Final expected:
        // 000_000_000_000_011_011_011_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 1);
        assert_eq!(blocks, 0b000_011_011_011_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_size_4_block() {
        // Initial grid
        // 000_100_100_100_100_000_000_000 (size 4 block in middle)
        // Final expected:
        // 100_100_100_100_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_100_100_100_100_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 1);
        assert_eq!(blocks, 0b100_100_100_100_000_000_000_000);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_with_gaps() {
        // Initial grid
        // 000_001_000_010_010_000_000_000 (size 1 and 2 blocks with gaps)
        let bitmap: felt252 = 0b000_001_000_010_010_000_000_000;
        Controller::swipe(bitmap, 0, 4, true, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_no_room() {
        // Initial grid
        // 001_000_000_010_010_000_000_000 (no room to move right)
        // Should panic when trying to move size 2 block to occupied space
        let bitmap: felt252 = 0b000_001_000_010_010_000_000_000;
        Controller::swipe(bitmap, 0, 3, true, 3); // Trying to move into occupied space
    }

    #[test]
    fn test_controller_swipe_left_maximum_distance() {
        // Initial grid
        // 000_000_000_000_000_000_001_000 (single block near left)
        // Final expected:
        // 001_000_000_000_000_000_000_000 (moved to rightmost position)
        let bitmap: felt252 = 0b000_000_000_000_000_000_001_000;
        let blocks = Controller::swipe(bitmap, 0, 1, true, 6);
        assert_eq!(blocks, 0b001_000_000_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_mixed_blocks() {
        // Initial grid
        // 000_001_010_010_011_011_011_000 (mixed size blocks)
        // Final expected:
        // 001_000_010_010_011_011_011_000 (size 1 block moved right)
        let bitmap: felt252 = 0b000_001_010_010_011_011_011_000;
        let blocks = Controller::swipe(bitmap, 0, 6, true, 1);
        assert_eq!(blocks, 0b001_000_010_010_011_011_011_000);
    }

    #[test]
    fn test_controller_swipe_left_valid_with_space() {
        // Initial grid:
        // 000_000_000_001_000_000_000_000
        //               ^
        //               | moving left 2 spaces
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, true, 2);
        assert_eq!(blocks, 0b000_001_000_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_size_2_valid() {
        // Initial grid:
        // 000_000_000_010_010_000_000_000
        //               ^   ^
        //               | moving size 2 left
        let bitmap: felt252 = 0b000_000_000_010_010_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 2);
        assert_eq!(blocks, 0b000_010_010_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_size_3_valid() {
        // Initial grid:
        // 000_000_011_011_011_000_000_000
        //           ^   ^   ^
        //           | moving size 3 left
        let bitmap: felt252 = 0b000_000_011_011_011_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 2);
        assert_eq!(blocks, 0b011_011_011_000_000_000_000_000);
    }

    #[test]
    fn test_controller_swipe_left_valid_near_blocks() {
        // Initial grid:
        // 010_010_000_001_000_000_000_000
        //           ^   ^
        //           |   | moving to gap
        let bitmap: felt252 = 0b010_010_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, true, 1);
        assert_eq!(blocks, 0b010_010_001_000_000_000_000_000);
    }
    #[test]
    fn test_controller_swipe_left_to_edge() {
        // Initial grid:
        // 000_000_000_000_001_000_000_000
        //                   ^
        //                   | moving to leftmost position
        let bitmap: felt252 = 0b000_000_000_000_001_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 3, true, 4);
        assert_eq!(blocks, 0b001_000_000_000_000_000_000_000);
    }

    // ------------------------------
    // LEFT with block on path
    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_blocked_by_single() {
        // Initial grid:
        // 000_000_001_001_000_000_000_000
        //           ^   ^
        //  blocking |   | moving block
        // Trying to move size 1 block over another size 1 block
        let bitmap: felt252 = 0b000_000_001_001_000_000_000_000;
        Controller::swipe(bitmap, 0, 4, true, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_blocked_by_size_2() {
        // Initial grid:
        // 000_010_010_000_001_000_000_000
        //      ^   ^        ^
        // block    |        | moving block
        let bitmap: felt252 = 0b000_010_010_000_001_000_000_000;
        Controller::swipe(bitmap, 0, 3, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_blocked_by_size_3() {
        // Initial grid:
        // 000_011_011_011_000_001_000_000
        //      ^   ^   ^       ^
        // block            |   | moving block
        let bitmap: felt252 = 0b000_011_011_011_000_001_000_000;
        Controller::swipe(bitmap, 0, 2, true, 5);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_size_2_blocked() {
        // Initial grid:
        // 000_000_001_010_010_000_000_000
        //          ^    ^   ^
        // block         | size 2 moving block
        let bitmap: felt252 = 0b000_000_001_010_010_000_000_000;
        Controller::swipe(bitmap, 0, 3, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_size_3_blocked() {
        // Initial grid:
        // 000_001_000_001_011_011_011_000
        //              ^   ^   ^   ^
        // block        |   | size 3 moving block
        let bitmap: felt252 = 0b000_001_000_001_011_011_011_000;
        Controller::swipe(bitmap, 0, 1, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_multiple_blocks() {
        // Initial grid:
        // 000_001_001_000_001_000_000_000
        //      ^   ^       ^
        // blocks           | moving block
        let bitmap: felt252 = 0b000_001_001_000_001_000_000_000;
        Controller::swipe(bitmap, 0, 3, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_swipe_left_above_into_mixed_blocks() {
        // Initial grid:
        // 010_010_011_011_011_001_000_000
        //                       ^
        //                       | trying to move through mixed blocks
        let bitmap: felt252 = 0b010_010_011_011_011_001_000_000;
        Controller::swipe(bitmap, 0, 2, true, 4);
    }

    // BOUNDARIES
    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_1_1() {
        // Initial grid:
        // 000_000_000_000_000_000_000_001 (single block at index 0)
        // Trying to move beyond rightmost valid position (0)
        let bitmap: felt252 = 0b000_000_000_000_000_000_000_001;
        Controller::swipe(bitmap, 0, 0, false, 1); // Should fail - can't move beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_1_2() {
        // Initial grid:
        // 000_000_000_000_000_000_001_000 (single block at index 0)
        // Trying to move beyond rightmost valid position (0)
        let bitmap: felt252 = 0b000_000_000_000_000_000_001_000;
        Controller::swipe(bitmap, 0, 1, false, 2); // Should fail - can't move beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_1_3() {
        // Initial grid:
        // 001_000_000_000_000_000_000_000 (single block at index 0)
        // Trying to move beyond rightmost valid position (0)
        let bitmap: felt252 = 0b001_000_000_000_000_000_000_000;
        Controller::swipe(bitmap, 0, 7, false, 8); // Should fail - can't move beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_2_1() {
        // Initial grid:
        // 000_000_000_000_000_000_010_010 (size 2 block near boundary)
        // Trying to move beyond rightmost valid position
        let bitmap: felt252 = 0b000_000_000_000_000_000_010_010;
        Controller::swipe(
            bitmap, 0, 0, false, 1
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_2_2() {
        // Initial grid:
        // 010_010_000_000_000_000_000_000
        // Trying to move beyond rightmost valid position
        let bitmap: felt252 = 0b010_010_000_000_000_000_000_000;
        Controller::swipe(
            bitmap, 0, 6, false, 7
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_3() {
        // Initial grid:
        // 000_000_000_000_000_011_011_011 (size 3 block near boundary)
        // Trying to move beyond rightmost valid position
        let bitmap: felt252 = 0b000_000_000_000_000_011_011_011;
        Controller::swipe(
            bitmap, 0, 0, false, 1
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_4() {
        // Initial grid:
        // 000_000_000_000_100_100_100_100 (size 4 block near boundary)
        // Trying to move beyond rightmost valid position
        let bitmap: felt252 = 0b000_000_000_000_100_100_100_100;
        Controller::swipe(
            bitmap, 0, 0, false, 1
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_boundaries_swipe_right_beyond_boundary_size_4_taken_from_middle() {
        // Initial grid:
        // 000_000_000_000_100_100_100_100 (size 4 block near boundary)
        // Trying to move beyond rightmost valid position
        let bitmap: felt252 = 0b000_000_000_000_100_100_100_100;
        Controller::swipe(
            bitmap, 0, 1, false, 1
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_left_beyond_boundary_size_1() {
        // Initial grid:
        // 001_000_000_000_000_000_000_000 (single block at leftmost position)
        // Trying to move beyond leftmost valid position (7)
        let bitmap: felt252 = 0b001_000_000_000_000_000_000_000;
        Controller::swipe(bitmap, 0, 7, true, 1); // Should fail - can't move beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_left_beyond_boundary_size_2() {
        // Initial grid:
        // 010_010_000_000_000_000_000_000 (size 2 block near boundary)
        // Trying to move beyond leftmost valid position
        let bitmap: felt252 = 0b010_010_000_000_000_000_000_000;
        Controller::swipe(
            bitmap, 0, 6, true, 1
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_left_beyond_boundary_size_3() {
        // Initial grid:
        // 011_011_011_000_000_000_000_000 (size 3 block near boundary)
        // Trying to move beyond leftmost valid position
        let bitmap: felt252 = 0b011_011_011_000_000_000_000_000;
        Controller::swipe(
            bitmap, 0, 5, true, 3
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_boundaries_swipe_left_beyond_boundary_size_4() {
        // Initial grid:
        // 100_100_100_100_000_000_000_000 (size 4 block near boundary)
        // Trying to move beyond leftmost valid position
        let bitmap: felt252 = 0b100_100_100_100_000_000_000_000;
        Controller::swipe(
            bitmap, 0, 4, true, 5
        ); // Should fail - would push part of block beyond boundary
    }

    #[test]
    fn test_controller_boundaries_swipe_right_to_boundary_valid() {
        // Initial grid:
        // 000_000_000_001_000_000_000_000 (single block)
        // Moving to leftmost valid position (should work)
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, true, 3);
        assert_eq!(blocks, 0b001_000_000_000_000_000_000_000);
    }

    #[test]
    fn test_controller_boundaries_swipe_left_to_boundary_valid() {
        // Initial grid:
        // 000_000_000_001_000_000_000_000 (single block)
        // Moving to leftmost valid position (should work)
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 0, 4, false, 4);
        assert_eq!(blocks, 0b000_000_000_000_000_000_000_001);
    }

    #[test]
    fn test_controller_multiple_row_swipe_left_second_row() {
        // Initial grid:
        // Row 2: 000_000_000_000_000_000_000_000
        // Row 1: 000_000_000_001_000_000_000_000 (moving this block)
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_000_000_000_000_000__000_000_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 1, 4, true, 3);
        assert_eq!(
            blocks,
            0b000_000_000_000_000_000_000_000__001_000_000_000_000_000_000_000__010_010_000_000_000_000_000_000
        );
    }

    #[test]
    fn test_controller_multiple_row_swipe_right_second_row() {
        // Initial grid:
        // Row 2: 000_000_000_000_000_000_000_000
        // Row 1: 000_000_000_001_000_000_000_000 (moving this block)
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_000_000_000_000_000__000_000_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 1, 4, false, 3);
        assert_eq!(
            blocks,
            0b000_000_000_000_000_000_000_000__000_000_000_000_000_000_001_000__010_010_000_000_000_000_000_000
        );
    }

    #[test]
    fn test_controller_multiple_row_swipe_left_third_row() {
        // Initial grid:
        // Row 2: 000_000_000_010_010_000_000_000 (moving this size 2 block)
        // Row 1: 000_000_001_000_000_000_000_000
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_010_010_000_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 2, 3, true, 3);
        assert_eq!(
            blocks,
            0b010_010_000_000_000_000_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000
        );
    }

    #[test]
    fn test_controller_multiple_row_swipe_right_third_row() {
        // Initial grid:
        // Row 2: 000_000_000_011_011_011_000_000 (moving this size 3 block)
        // Row 1: 000_000_001_000_000_000_000_000
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_011_011_011_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        let blocks = Controller::swipe(bitmap, 2, 2, false, 2);
        assert_eq!(
            blocks,
            0b000_000_000_000_000_011_011_011__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000
        );
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_multiple_row_swipe_left_second_row_blocked() {
        // Initial grid:
        // Row 2: 000_000_000_000_000_000_000_000
        // Row 1: 000_001_000_001_000_000_000_000 (trying to move rightmost block)
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_000_000_000_000_000__000_001_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 1, 4, true, 3); // Should fail - block in path
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_controller_multiple_row_swipe_right_third_row_blocked() {
        // Initial grid:
        // Row 2: 000_000_001_000_000_001_000_000 (trying to move leftmost block)
        // Row 1: 000_000_001_000_000_000_000_000
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_001_000_000_001_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 2, 5, false, 4); // Should fail - block in path
    }

    #[test]
    fn test_controller_multiple_row_swipe_multiple_rows_different_directions() {
        // Initial grid:
        // Row 2: 000_000_000_001_000_000_000_000 (will move right)
        // Row 1: 000_000_000_001_000_000_000_000 (will move left)
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_000__000_000_000_001_000_000_000_000__010_010_000_000_000_000_000_000;

        // Move block in row 2 right
        let blocks = Controller::swipe(bitmap, 2, 4, false, 3);
        // Move block in row 1 left
        let blocks = Controller::swipe(blocks, 1, 4, true, 3);

        assert_eq!(
            blocks,
            0b000_000_000_000_000_000_001_000__001_000_000_000_000_000_000_000__010_010_000_000_000_000_000_000
        );
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_controller_multiple_row_swipe_third_row_boundary() {
        // Initial grid:
        // Row 2: 001_000_000_000_000_000_000_000 (trying to move left beyond boundary)
        // Row 1: 000_000_001_000_000_000_000_000
        // Row 0: 010_010_000_000_000_000_000_000
        let bitmap: felt252 =
            0b001_000_000_000_000_000_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 2, 7, true, 1); // Should fail - beyond boundary
    }
}
