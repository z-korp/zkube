use core::traits::TryInto;
// Core imports

use core::debug::PrintTrait;

// External imports

use alexandria_math::fast_power::fast_power;
use origami::random::deck::{Deck, DeckTrait};
use origami::random::dice::{Dice, DiceTrait};

// Internal imports

use zkube::constants;
use zkube::helpers::packer::Packer;
use zkube::helpers::gravity::Gravity;
use zkube::types::width::Width;
use zkube::types::block::{Block, BlockTrait};
use zkube::types::color::{Color, ColorTrait, COLOR_COUNT};
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
    fn apply_gravity(mut blocks: felt252, mut colors: felt252) -> (felt252, felt252) {
        let blocks_u256: u256 = blocks.into();
        let colors_u256: u256 = colors.into();
        let mut new_block_rows: Array<u32> = array![];
        let mut new_color_rows: Array<u32> = array![];
        let mut block_rows: Array<u32> = Packer::unpack(blocks_u256, constants::ROW_SIZE);
        let mut bottom = match block_rows.pop_front() {
            Option::Some(row) => row,
            Option::None => { return (blocks, colors); },
        };
        let mut color_rows: Array<u32> = Packer::unpack(colors_u256, constants::ROW_SIZE);
        let mut bottom_colors = match color_rows.pop_front() {
            Option::Some(row) => row,
            Option::None => { return (blocks, colors); },
        };
        loop {
            let top = match block_rows.pop_front() {
                Option::Some(row) => row,
                Option::None => {
                    new_block_rows.append(bottom);
                    new_color_rows.append(bottom_colors);
                    break;
                },
            };
            let top_colors = match color_rows.pop_front() {
                Option::Some(row) => row,
                Option::None => {
                    new_block_rows.append(bottom);
                    new_color_rows.append(bottom_colors);
                    break;
                },
            };
            let (new_top, new_bottom, new_top_colors, new_bottom_colors) = Gravity::apply(
                top, bottom, top_colors, bottom_colors
            );
            bottom = new_top;
            bottom_colors = new_top_colors;
            new_block_rows.append(new_bottom);
            new_color_rows.append(new_bottom_colors);
        };

        let blocks: u256 = Packer::pack(new_block_rows, constants::ROW_SIZE);
        let colors: u256 = Packer::pack(new_color_rows, constants::ROW_SIZE);
        (blocks.try_into().unwrap(), colors.try_into().unwrap())
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
        let mut new_rows: Array<u32> = array![];
        let mut rows: Array<u32> = Packer::unpack(bitmap, constants::ROW_SIZE);
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
        let result: u256 = Packer::pack(new_rows, constants::ROW_SIZE);
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
    fn create_line(seed: felt252, difficulty: Difficulty) -> (u32, u32) {
        let mut validated: bool = false;
        let mut size: u8 = 0;
        let mut blocks: u32 = 0;
        let mut colors: u32 = 0;
        let mut deck: Deck = DeckTrait::new(seed, difficulty.count());
        let mut dice: Dice = DiceTrait::new(COLOR_COUNT, seed);
        while deck.remaining != 0
            && size < constants::DEFAULT_GRID_WIDTH {
                let block: Block = difficulty.reveal(deck.draw());
                let block_size: u8 = block.size().into();
                if block_size > (constants::DEFAULT_GRID_WIDTH - size)
                    || (block_size == (constants::DEFAULT_GRID_WIDTH - size) && !validated) {
                    continue;
                };
                let color: u32 = dice.roll().into();
                let power: u32 = block_size.into() * constants::BLOCK_BIT_COUNT.into();
                let exp: u32 = fast_power(2, power);
                // [Compute] Update validated flag
                validated = validated || block.get_bits() == 0;
                // [Compute] Update blocks and colors bitmaps
                blocks = blocks * exp;
                blocks += block.get_bits();
                colors = colors * exp;
                colors += color;
                size += block_size;
            };
        (blocks, colors)
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
    fn swipe_left(
        blocks: felt252, colors: felt252, row_index: u8, block_index: u8, mut count: u8
    ) -> (felt252, felt252) {
        let mut block_row = Self::get_row(blocks, row_index);
        let mut color_row = Self::get_row(colors, row_index);
        let block = Self::get_block_from_row(block_row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = block_row & mask;
        let full_color = color_row & mask;
        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;
        color_row = color_row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(block_row & (mask * shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        block_row = block_row | (full_block * shift);
        color_row = color_row | (full_color * shift);
        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, constants::ROW_SIZE, block_row);
        let bitmap: u256 = colors.into();
        let new_colors = Packer::replace(bitmap, row_index, constants::ROW_SIZE, color_row);
        (new_blocks.try_into().unwrap(), new_colors.try_into().unwrap())
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
    fn swipe_right(
        blocks: felt252, colors: felt252, row_index: u8, block_index: u8, mut count: u8
    ) -> (felt252, felt252) {
        let mut block_row = Self::get_row(blocks, row_index);
        let mut color_row = Self::get_row(colors, row_index);
        let block = Self::get_block_from_row(block_row, block_index);
        // [Compute] Block mask
        let mask_left: u32 = fast_power(
            2, ((block + block_index) * constants::BLOCK_BIT_COUNT).into()
        )
            - 1;
        let mask_right: u32 = fast_power(2, (block_index * constants::BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let full_block = block_row & mask;
        let full_color = color_row & mask;
        // [Compute] Remove the block from the row
        block_row = block_row & ~mask;
        color_row = color_row & ~mask;
        // [Check] There is room for the block
        let shift: u32 = fast_power(2, (count * constants::BLOCK_BIT_COUNT).into());
        assert(block_row & (mask / shift) == 0, errors::CONTROLLER_NOT_ENOUGH_ROOM);
        // [Compute] Add the shifted block to the row
        block_row = block_row | (full_block / shift);
        color_row = color_row | (full_color / shift);
        // [Return] Updated bitmap
        let bitmap: u256 = blocks.into();
        let new_blocks = Packer::replace(bitmap, row_index, constants::ROW_SIZE, block_row);
        let bitmap: u256 = colors.into();
        let new_colors = Packer::replace(bitmap, row_index, constants::ROW_SIZE, color_row);
        (new_blocks.try_into().unwrap(), new_colors.try_into().unwrap())
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
        blocks: felt252,
        colors: felt252,
        row_index: u8,
        block_index: u8,
        direction: bool,
        mut count: u8
    ) -> (felt252, felt252) {
        match direction {
            true => Self::swipe_left(blocks, colors, row_index, block_index, count),
            false => Self::swipe_right(blocks, colors, row_index, block_index, count),
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
        let (blocks, colors) = Controller::apply_gravity(bitmap, bitmap);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let colors = Controller::assess_lines(colors, ref counter, ref points, false);
        let (blocks, colors) = Controller::apply_gravity(blocks, colors);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let colors = Controller::assess_lines(colors, ref counter, ref points, false);
        assert_eq!(blocks, 0);
        assert_eq!(colors, 0);
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
        let (blocks, colors) = Controller::apply_gravity(bitmap, bitmap);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let colors = Controller::assess_lines(colors, ref counter, ref points, false);
        let (blocks, colors) = Controller::apply_gravity(blocks, colors);
        let _ = Controller::assess_lines(blocks, ref counter, ref points, true);
        let _ = Controller::assess_lines(colors, ref counter, ref points, false);
        assert_eq!(points, 3);
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
        let (blocks, colors) = Controller::swipe(bitmap, bitmap, 2, 0, true, 2);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(colors, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(colors, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_001_000_000);
        assert_eq!(Controller::get_row(colors, 2), 0b000_000_000_001_000_001_000_000);
    }

    #[test]
    fn test_controller_swipe_left_02() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let (blocks, colors) = Controller::swipe(bitmap, bitmap, 0, 1, true, 1);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_011_011_011_000_000);
        assert_eq!(Controller::get_row(colors, 0), 0b001_010_010_011_011_011_000_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(colors, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
        assert_eq!(Controller::get_row(colors, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_swipe_right_01() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let (blocks, colors) = Controller::swipe(bitmap, bitmap, 0, 1, false, 1);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_000_011_011_011);
        assert_eq!(Controller::get_row(colors, 0), 0b001_010_010_000_000_011_011_011);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(colors, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
        assert_eq!(Controller::get_row(colors, 2), 0b000_000_000_001_000_000_000_001);
    }

    #[test]
    fn test_controller_create_line_01() {
        let seed: felt252 = 'SEED';
        let easy: Difficulty = Difficulty::Easy;
        let (blocks, _colors) = Controller::create_line(seed, easy);
        assert_eq!(blocks, 0b010_010_001_001_001_000_000_001);
    }

    #[test]
    fn test_controller_create_line_02() {
        let seed: felt252 = 'DEES';
        let easy: Difficulty = Difficulty::Easy;
        let (blocks, _colors) = Controller::create_line(seed, easy);
        assert_eq!(blocks, 0b001_001_000_001_010_010_010_010);
    }
}
