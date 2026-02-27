use alexandria_math::BitShift;
use core::hash::HashStateTrait;
use core::poseidon::PoseidonTrait;
use core::traits::{Into, TryInto};
use origami_random::deck::{Deck, DeckTrait};
use origami_random::dice::{Dice, DiceTrait};
use zkube::constants::{
    BLOCK_BIT_COUNT, BLOCK_SIZE, DEFAULT_GRID_WIDTH, LINE_FULL_BOUND, ROW_BIT_COUNT, ROW_SIZE,
};
use zkube::helpers::gravity::Gravity;
use zkube::helpers::packer::Packer;
use zkube::models::config::{GameSettings, GameSettingsTrait};
use zkube::types::block::{Block, BlockTrait};
use zkube::types::difficulty::{Difficulty, DifficultyTrait};

pub mod errors {
    pub const CONTROLLER_NOT_ENOUGH_ROOM: felt252 = 'Controller: not enough room';
    pub const CONTROLLER_NOT_COHERENT_LINE: felt252 = 'Controller: not coherent line';
    pub const CONTROLLER_NOT_COHERENT_GRID: felt252 = 'Controller: not coherent grid';
    pub const CONTROLLER_NOT_IN_BOUNDARIES: felt252 = 'Controller: not in boundaries';
}

#[generate_trait]
pub impl Controller of ControllerTrait {
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
        }

        let blocks: u256 = Packer::pack(new_block_rows, ROW_SIZE);
        let blocks: felt252 = blocks.try_into().unwrap();

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
        bitmap: felt252, ref counter: u8, ref points_earned: u16, accountable: bool,
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
        }
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
        // [Check] Left block is not empty (row must be >= 2^21 for leftmost block to be non-zero)
        if row < LINE_FULL_BOUND {
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

    /// Create a new line with configurable block weights from GameSettings.
    /// Uses the interpolated block weights based on difficulty.
    /// # Arguments
    /// * `seed` - The seed for randomness
    /// * `difficulty` - The difficulty level (used for weight interpolation)
    /// * `settings` - The game settings containing block weight configuration
    /// # Returns
    /// The new line as a packed u32.
    fn create_line(seed: felt252, difficulty: Difficulty, settings: GameSettings) -> u32 {
        let mut validated: bool = false;
        let mut size: u8 = 0;
        let mut blocks: u32 = 0;

        // Get interpolated weights for this difficulty
        let (zero_w, one_w, two_w, three_w, four_w) = settings
            .get_block_weights_for_difficulty(difficulty);
        let total_weight: u16 = zero_w.into()
            + one_w.into()
            + two_w.into()
            + three_w.into()
            + four_w.into();

        // Use a deterministic but properly randomized roll for block selection
        let mut roll_counter: felt252 = 0;

        let mut attempts: u16 = 0;
        while size < DEFAULT_GRID_WIDTH {
            attempts += 1;
            if attempts > 512 {
                // Fallback to deck-based generator if settings are pathological.
                return Self::create_line_fallback(seed, difficulty);
            }

            // Generate a random value for block selection using Poseidon hash
            // This ensures each roll is properly randomized, not sequential
            let roll_hash: felt252 = PoseidonTrait::new()
                .update(seed)
                .update(roll_counter)
                .finalize();
            roll_counter += 1;
            let roll_u256: u256 = roll_hash.into();
            let roll: u16 = (roll_u256 % total_weight.into()).try_into().unwrap();

            // Select block based on cumulative weights
            let block: Block = Self::select_block_by_weight(
                roll, zero_w, one_w, two_w, three_w, four_w,
            );
            let block_size: u8 = block.size().into();

            // Check if block fits. If this is the final segment, allow a hole (bits == 0)
            // to satisfy the "at least one empty cell" invariant.
            let remaining = DEFAULT_GRID_WIDTH - size;
            if block_size > remaining
                || (block_size == remaining && !validated && block.get_bits() != 0) {
                continue;
            }

            let power: u32 = block_size.into() * BLOCK_BIT_COUNT.into();
            let exp: u32 = BitShift::shl(1_u32, power);
            validated = validated || block.get_bits() == 0;
            blocks = blocks * exp + block.get_bits();
            size += block_size;
        }

        // Shuffle because often the hole is at the end of the line
        Self::shuffle_line(blocks, seed)
    }

    /// Fallback line generator using the original deck-based logic.
    /// Used when settings-based generation fails (e.g., pathological weights).
    fn create_line_fallback(seed: felt252, difficulty: Difficulty) -> u32 {
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
            }
            let power: u32 = block_size.into() * BLOCK_BIT_COUNT.into();
            let exp: u32 = BitShift::shl(1_u32, power);
            validated = validated || block.get_bits() == 0;
            blocks = blocks * exp + block.get_bits();
            size += block_size;
        }

        // Shuffle because often the hole is at the end of the line
        Self::shuffle_line(blocks, seed)
    }

    /// Select a block type based on weighted random selection.
    /// # Arguments
    /// * `roll` - Random value (0 to total_weight-1)
    /// * weights for each block type
    /// # Returns
    /// The selected Block type.
    fn select_block_by_weight(
        roll: u16, zero_w: u8, one_w: u8, two_w: u8, three_w: u8, four_w: u8,
    ) -> Block {
        let zero_threshold: u16 = zero_w.into();
        let one_threshold: u16 = zero_threshold + one_w.into();
        let two_threshold: u16 = one_threshold + two_w.into();
        let three_threshold: u16 = two_threshold + three_w.into();
        // four_threshold would be total, but we use else for it

        if roll < zero_threshold {
            Block::Zero
        } else if roll < one_threshold {
            Block::One
        } else if roll < two_threshold {
            Block::Two
        } else if roll < three_threshold {
            Block::Three
        } else {
            Block::Four
        }
    }

    /// Shuffle the line
    /// # Arguments
    /// * `blocks` - The row
    /// # Returns
    /// The new row.
    fn shuffle_line(blocks: u32, seed: felt252) -> u32 {
        let mut shift_rng: Dice = DiceTrait::new(10, seed);
        let shift_amount = BLOCK_BIT_COUNT * shift_rng.roll();

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
        }
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
            bitmap & (BitShift::shl(1, shift.into()) - 1), (total_bits - shift).into(),
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
        let mask_left: u256 = BitShift::shl(1_u256, ((row_index + 1) * ROW_BIT_COUNT).into()) - 1;
        let mask_right: u256 = BitShift::shl(1_u256, (row_index * ROW_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let row = bitmap & mask;
        (row / BitShift::shl(1_u256, (row_index * ROW_BIT_COUNT).into())).try_into().unwrap()
    }

    /// Get the block from the row.
    /// # Arguments
    /// * `row` - The row.
    /// * `block_index` - The block index.
    /// # Returns
    /// The block.
    #[inline(always)]
    fn get_block_from_row(row: u32, block_index: u8) -> u8 {
        let mask_left: u32 = BitShift::shl(1_u32, ((block_index + 1) * BLOCK_BIT_COUNT).into()) - 1;
        let mask_right: u32 = BitShift::shl(1_u32, (block_index * BLOCK_BIT_COUNT).into()) - 1;
        let mask = mask_left - mask_right;
        let block = row & mask;
        (block / BitShift::shl(1_u32, (block_index * BLOCK_BIT_COUNT).into())).try_into().unwrap()
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
        }

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
        blocks: felt252, row_index: u8, block_index: u8, direction: bool, mut count: u8,
    ) -> felt252 {
        match direction {
            true => Self::swipe_left(blocks, row_index, block_index, count),
            false => Self::swipe_right(blocks, row_index, block_index, count),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Controller, Difficulty};

    // =========================================================================
    // GRAVITY, LINES, POINTS (merged from 4 tests)
    // =========================================================================

    #[test]
    fn test_gravity_and_lines() {
        let mut counter = 0;
        let mut points = 0;
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        // apply_gravity collapses rows, assess_lines clears full rows
        let blocks = Controller::apply_gravity(bitmap);
        let blocks = Controller::assess_lines(blocks, ref counter, ref points, true);
        let blocks = Controller::apply_gravity(blocks);
        let _ = Controller::assess_lines(blocks, ref counter, ref points, true);
        assert_eq!(points, 3);

        // assess_lines standalone: removes full row, keeps partial rows
        let mut c2 = 0;
        let mut p2 = 0;
        let blocks2: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let result = Controller::assess_lines(blocks2, ref c2, ref p2, true);
        assert_eq!(result, 0b000_000_000_001_000_000_000_001_001_010_010_000_011_011_011_000);

        // assess_lines with non-bottom full row
        let mut c3 = 0;
        let mut p3 = 0;
        let blocks3: felt252 =
            0b100_100_100_100_000_000_000_000_000_000_001_000_000_000_000_000_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let result3 = Controller::assess_lines(blocks3, ref c3, ref p3, true);
        assert_eq!(
            result3,
            0b100_100_100_100_000_000_000_000_000_000_001_000_000_000_000_000_001_010_010_000_011_011_011_000,
        );
    }

    // =========================================================================
    // BLOCK ALIGNMENT (kept compact)
    // =========================================================================

    #[test]
    fn test_block_alignment() {
        assert_eq!(Controller::are_block_aligned(0b000_010_010_000_011_011_011_000), true);
        assert_eq!(Controller::are_block_aligned(0b001_010_010_000_011_011_011_000), true);
        assert_eq!(Controller::are_block_aligned(0b010_010_000_000_100_100_100_100), true);
        assert_eq!(Controller::are_block_aligned(0b010_000_011_011_011_000_000_010), false);
        assert_eq!(Controller::are_block_aligned(0b011_011_011_000_001_010_010_000), true);
        assert_eq!(Controller::are_block_aligned(0b011_011_000_001_010_010_000_011), false);
        assert_eq!(Controller::are_block_aligned(0b100_100_100_100_001_010_010_000), true);
        assert_eq!(Controller::are_block_aligned(0b100_100_100_001_010_010_000_100), false);
    }

    // =========================================================================
    // CIRCULAR SHIFT + ALIGN (merged from 3 tests)
    // =========================================================================

    #[test]
    fn test_circular_shift_and_align() {
        assert_eq!(
            Controller::circular_shift_right(0b000_000_000_001_000_000_000_001, 3, 24),
            0b001_000_000_000_001_000_000_000,
        );
        // align_line
        assert_eq!(
            Controller::align_line(0b000_010_010_000_011_011_011_000),
            0b000_010_010_000_011_011_011_000,
        );
        assert_eq!(
            Controller::align_line(0b000_010_010_000_011_011_011_001),
            0b000_010_010_000_011_011_011_001,
        );
        assert_eq!(
            Controller::align_line(0b010_000_000_011_011_011_000_010),
            0b010_010_000_000_011_011_011_000,
        );
        assert_eq!(
            Controller::align_line(0b011_011_000_001_010_010_000_011),
            0b011_011_011_000_001_010_010_000,
        );
        assert_eq!(
            Controller::align_line(0b100_100_100_001_010_010_000_100),
            0b100_100_100_100_001_010_010_000,
        );
    }

    // =========================================================================
    // ROW/BLOCK ACCESSORS (merged from 3 tests)
    // =========================================================================

    #[test]
    fn test_row_and_block_accessors() {
        let blocks: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        // get_row
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_000_000_001);
        // get_block_from_row (row 0)
        let row0: u32 = 0b001_010_010_000_011_011_011_000;
        assert_eq!(Controller::get_block_from_row(row0, 0), 0b000);
        assert_eq!(Controller::get_block_from_row(row0, 1), 0b011);
        assert_eq!(Controller::get_block_from_row(row0, 2), 0b011);
        assert_eq!(Controller::get_block_from_row(row0, 3), 0b011);
        assert_eq!(Controller::get_block_from_row(row0, 4), 0b000);
        assert_eq!(Controller::get_block_from_row(row0, 5), 0b010);
        assert_eq!(Controller::get_block_from_row(row0, 6), 0b010);
        assert_eq!(Controller::get_block_from_row(row0, 7), 0b001);
        // get_block_from_row (row 1) - spot checks
        let row1: u32 = 0b010_010_010_010_100_100_100_100;
        assert_eq!(Controller::get_block_from_row(row1, 0), 0b100);
        assert_eq!(Controller::get_block_from_row(row1, 4), 0b010);
        assert_eq!(Controller::get_block_from_row(row1, 7), 0b010);
        // get_block_from_row (row 2) - spot checks
        let row2: u32 = 0b000_000_000_001_000_000_000_001;
        assert_eq!(Controller::get_block_from_row(row2, 0), 0b001);
        assert_eq!(Controller::get_block_from_row(row2, 4), 0b001);
        assert_eq!(Controller::get_block_from_row(row2, 7), 0b000);
        // get_block
        assert_eq!(Controller::get_block(blocks, 1, 4), 0b010);
    }

    // =========================================================================
    // CREATE LINE FALLBACK (merged 2 tests)
    // =========================================================================

    #[test]
    fn test_create_line_fallback() {
        let easy: Difficulty = Difficulty::Easy;
        assert_eq!(Controller::create_line_fallback('SEED', easy), 0b001_010_010_001_001_001_000_000);
        assert_eq!(Controller::create_line_fallback('DEES', easy), 0b010_010_001_001_000_001_010_010);
    }

    // =========================================================================
    // ASSESS LINE (kept as-is)
    // =========================================================================

    #[test]
    fn test_assess_line() {
        let mut counter = 0;
        let mut points = 0;
        let blocks =
            0b100_100_100_100_000_000_000_001__010_010_010_010_010_010_010_010__010_010_010_010_010_010_010_000__010_010_010_100_100_100_000_000__000_100_100_100_100_100_100_001;
        let result = Controller::assess_lines(blocks, ref counter, ref points, false);
        assert_eq!(
            result,
            0b100_100_100_100_000_000_000_001__010_010_010_010_010_010_010_000__010_010_010_100_100_100_000_000__000_100_100_100_100_100_100_001,
        );
    }

    // =========================================================================
    // NOT ENOUGH ROOM (non-panicking test)
    // =========================================================================

    #[test]
    fn test_not_enough_room_front() {
        let bitmap: felt252 =
            0b100_100_100_100_000_000_010_010__100_100_100_100_011_011_011_000__001_001_000_010_010_000_010_010__011_011_011_000_011_011_011_000__010_010_010_010_000_011_011_011__001_000_001_011_011_011_010_010__100_100_100_100_000_001_010_010__010_010_010_010_001_010_010_000;
        Controller::swipe(bitmap, 1, 4, false, 1);
    }

    // =========================================================================
    // SWIPE LEFT BASIC (merged 2 tests)
    // =========================================================================

    #[test]
    fn test_swipe_left_basic() {
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        // swipe_left_01: row 2, index 0, left 2
        let blocks = Controller::swipe(bitmap, 2, 0, true, 2);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_011_011_011_000);
        assert_eq!(Controller::get_row(blocks, 1), 0b010_010_010_010_100_100_100_100);
        assert_eq!(Controller::get_row(blocks, 2), 0b000_000_000_001_000_001_000_000);
        // swipe_left_02: row 0, index 1, left 1
        let blocks2 = Controller::swipe(bitmap, 0, 1, true, 1);
        assert_eq!(Controller::get_row(blocks2, 0), 0b001_010_010_011_011_011_000_000);
    }

    // =========================================================================
    // SWIPE RIGHT BASIC (kept as-is)
    // =========================================================================

    #[test]
    fn test_swipe_right_basic() {
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_010_010_010_010_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = Controller::swipe(bitmap, 0, 1, false, 1);
        assert_eq!(Controller::get_row(blocks, 0), 0b001_010_010_000_000_011_011_011);
    }

    // =========================================================================
    // ROW COHERENCE (merged valid + invalid)
    // =========================================================================

    #[test]
    fn test_row_coherence() {
        // --- Valid rows ---
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_000_000), 'empty');
        assert(Controller::check_row_coherence(0b001_000_000_000_000_000_000_000), 's1 right');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_000_001), 's1 left');
        assert(Controller::check_row_coherence(0b010_010_000_000_000_000_000_000), 's2 right');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_000_010_010), 's2 left');
        assert(Controller::check_row_coherence(0b011_011_011_000_000_000_000_000), 's3 right');
        assert(Controller::check_row_coherence(0b000_000_000_000_000_011_011_011), 's3 left');
        assert(Controller::check_row_coherence(0b100_100_100_100_000_000_000_000), 's4 right');
        assert(Controller::check_row_coherence(0b000_000_000_000_100_100_100_100), 's4 left');
        assert(Controller::check_row_coherence(0b001_000_001_000_000_000_000_000), 'two s1');
        assert(Controller::check_row_coherence(0b001_010_010_011_011_011_000_000), 's1,s2,s3');
        assert(Controller::check_row_coherence(0b001_001_001_001_001_001_001_001), 'eight s1');
        assert(Controller::check_row_coherence(0b010_010_010_010_010_010_010_010), 'four s2');

        // --- Invalid rows ---
        assert(!Controller::check_row_coherence(0b101_000_000_000_000_000_000_000), 'val 5');
        assert(!Controller::check_row_coherence(0b110_000_000_000_000_000_000_000), 'val 6');
        assert(!Controller::check_row_coherence(0b111_000_000_000_000_000_000_000), 'val 7');
        assert(!Controller::check_row_coherence(0b010_000_000_000_000_000_000_000), 'inc s2');
        assert(!Controller::check_row_coherence(0b000_000_000_010_000_000_000_000), 'inc s2 mid');
        assert(!Controller::check_row_coherence(0b011_000_000_000_000_000_000_000), 'inc s3 1');
        assert(!Controller::check_row_coherence(0b011_011_000_000_000_000_000_000), 'inc s3 2');
        assert(!Controller::check_row_coherence(0b000_000_000_000_000_000_011_011), 'inc s3 left');
        assert(!Controller::check_row_coherence(0b100_000_000_000_000_000_000_000), 'inc s4 1');
        assert(!Controller::check_row_coherence(0b100_100_000_000_000_000_000_000), 'inc s4 2');
        assert(!Controller::check_row_coherence(0b100_100_100_000_000_000_000_000), 'inc s4 3');
        assert(!Controller::check_row_coherence(0b010_011_000_000_000_000_000_000), 'mix 2,3');
        assert(!Controller::check_row_coherence(0b010_010_011_000_000_000_000_000), 'cont 2->3');
        assert(!Controller::check_row_coherence(0b011_011_010_000_000_000_000_000), 'cont 3->2');
        assert(!Controller::check_row_coherence(0b010_010_010_000_000_000_000_000), 'overflow s2');
        assert(
            !Controller::check_row_coherence(0b011_011_011_011_011_000_000_000), 'overflow s3',
        );
        assert(
            !Controller::check_row_coherence(0b100_100_100_100_100_000_000_000), 'overflow s4',
        );
    }

    // =========================================================================
    // GRID COHERENCE (merged valid + invalid + edge cases)
    // =========================================================================

    #[test]
    fn test_grid_coherence() {
        // --- Valid ---
        assert(Controller::check_grid_coherence(0), 'empty grid');
        assert(Controller::check_grid_coherence(0b001_010_010_011_011_011_000_000), 'single row');
        let multi_row: felt252 =
            0b000_000_000_001_000_000_000_001__010_010_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(Controller::check_grid_coherence(multi_row), 'multi row');
        let all_ones: felt252 =
            0b001_001_001_001_001_001_001_001__001_001_001_001_001_001_001_001__001_001_001_001_001_001_001_001;
        assert(Controller::check_grid_coherence(all_ones), 'all ones');
        let max_blocks: felt252 =
            0b100_100_100_100_000_000_000_000__011_011_011_010_010_000_000_000__001_001_001_001_001_001_001_001;
        assert(Controller::check_grid_coherence(max_blocks), 'max blocks');
        let alternating: felt252 =
            0b001_010_010_001_010_010_001_000__011_011_011_001_010_010_000_000__010_010_011_011_011_000_000_000;
        assert(Controller::check_grid_coherence(alternating), 'alternating');

        // --- Invalid ---
        assert(!Controller::check_grid_coherence(0b010_000_000_000_000_000_000_000), 'single inv');
        let multi_inv: felt252 =
            0b000_000_000_001_000_000_000_001__010_000_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(!Controller::check_grid_coherence(multi_inv), 'multi inv');
        let inv_block: felt252 =
            0b000_000_000_001_000_000_000_001__111_000_010_010_100_100_100_100__001_010_010_000_011_011_011_000;
        assert(!Controller::check_grid_coherence(inv_block), 'inv block val');
        let mixed: felt252 =
            0b010_000_000_001_000_000_000_001__011_011_010_010_100_100_100_100__001_010_100_000_011_011_011_000;
        assert(!Controller::check_grid_coherence(mixed), 'mixed issues');
    }

    // =========================================================================
    // SWIPE RIGHT VALID MOVES (merged 8 tests — removed duplicate)
    // =========================================================================

    #[test]
    fn test_swipe_right_valid_moves() {
        // Size 1 right 3
        assert_eq!(
            Controller::swipe(0b000_000_000_001_000_000_000_000, 0, 4, false, 3),
            0b000_000_000_000_000_000_001_000,
        );
        // Size 2 right 3
        assert_eq!(
            Controller::swipe(0b000_000_000_010_010_000_000_000, 0, 3, false, 3),
            0b000_000_000_000_000_000_010_010,
        );
        // Size 3 right 2
        assert_eq!(
            Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 3, false, 2),
            0b000_000_000_000_011_011_011_000,
        );
        // Size 4 right 4
        assert_eq!(
            Controller::swipe(0b100_100_100_100_000_000_000_000, 0, 4, false, 4),
            0b000_000_000_000_100_100_100_100,
        );
        // Valid with space
        assert_eq!(
            Controller::swipe(0b000_000_001_000_000_000_000_000, 0, 5, false, 2),
            0b000_000_000_000_001_000_000_000,
        );
        // Size 2 valid
        assert_eq!(
            Controller::swipe(0b000_010_010_000_000_000_000_000, 0, 5, false, 2),
            0b000_000_000_010_010_000_000_000,
        );
        // Valid near existing blocks
        assert_eq!(
            Controller::swipe(0b000_000_001_000_010_010_000_000, 0, 5, false, 1),
            0b000_000_000_001_010_010_000_000,
        );
        // To boundary
        assert_eq!(
            Controller::swipe(0b001_000_000_000_000_000_000_000, 0, 7, false, 7),
            0b000_000_000_000_000_000_000_001,
        );
    }

    // =========================================================================
    // SWIPE LEFT VALID MOVES (merged 12 tests)
    // =========================================================================

    #[test]
    fn test_swipe_left_valid_moves() {
        // Single block left 3 (with existing blocks on right)
        assert_eq!(
            Controller::swipe(0b000_000_000_001_000_000_010_010, 0, 4, true, 3),
            0b001_000_000_000_000_000_010_010,
        );
        // Size 2 left 3
        assert_eq!(
            Controller::swipe(0b000_000_000_010_010_000_000_000, 0, 3, true, 3),
            0b010_010_000_000_000_000_000_000,
        );
        // Size 3 left 2
        assert_eq!(
            Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 3, true, 2),
            0b011_011_011_000_000_000_000_000,
        );
        // Size 3 over itself left 1
        assert_eq!(
            Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 3, true, 1),
            0b000_011_011_011_000_000_000_000,
        );
        // Size 4 left 1
        assert_eq!(
            Controller::swipe(0b000_100_100_100_100_000_000_000, 0, 3, true, 1),
            0b100_100_100_100_000_000_000_000,
        );
        // Maximum distance
        assert_eq!(
            Controller::swipe(0b000_000_000_000_000_000_001_000, 0, 1, true, 6),
            0b001_000_000_000_000_000_000_000,
        );
        // Mixed blocks, move size 1
        assert_eq!(
            Controller::swipe(0b000_001_010_010_011_011_011_000, 0, 6, true, 1),
            0b001_000_010_010_011_011_011_000,
        );
        // Valid with space left 2
        assert_eq!(
            Controller::swipe(0b000_000_000_001_000_000_000_000, 0, 4, true, 2),
            0b000_001_000_000_000_000_000_000,
        );
        // Size 2 valid left 2
        assert_eq!(
            Controller::swipe(0b000_000_000_010_010_000_000_000, 0, 3, true, 2),
            0b000_010_010_000_000_000_000_000,
        );
        // Size 3 valid left 2
        assert_eq!(
            Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 3, true, 2),
            0b011_011_011_000_000_000_000_000,
        );
        // Valid near blocks
        assert_eq!(
            Controller::swipe(0b010_010_000_001_000_000_000_000, 0, 4, true, 1),
            0b010_010_001_000_000_000_000_000,
        );
        // To edge
        assert_eq!(
            Controller::swipe(0b000_000_000_000_001_000_000_000, 0, 3, true, 4),
            0b001_000_000_000_000_000_000_000,
        );
    }

    // =========================================================================
    // MULTI-ROW SWIPE VALID (merged 5 tests)
    // =========================================================================

    #[test]
    fn test_multi_row_swipe_valid() {
        let bitmap: felt252 =
            0b000_000_000_000_000_000_000_000__000_000_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        // Row 1 left 3
        let r1 = Controller::swipe(bitmap, 1, 4, true, 3);
        assert_eq!(Controller::get_row(r1, 1), 0b001_000_000_000_000_000_000_000);
        assert_eq!(Controller::get_row(r1, 0), 0b010_010_000_000_000_000_000_000);
        // Row 1 right 3
        let r2 = Controller::swipe(bitmap, 1, 4, false, 3);
        assert_eq!(Controller::get_row(r2, 1), 0b000_000_000_000_000_000_001_000);
        // Row 2 size 2 left 3
        let bitmap2: felt252 =
            0b000_000_000_010_010_000_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        let r3 = Controller::swipe(bitmap2, 2, 3, true, 3);
        assert_eq!(Controller::get_row(r3, 2), 0b010_010_000_000_000_000_000_000);
        // Row 2 size 3 right 2
        let bitmap3: felt252 =
            0b000_000_000_011_011_011_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        let r4 = Controller::swipe(bitmap3, 2, 2, false, 2);
        assert_eq!(Controller::get_row(r4, 2), 0b000_000_000_000_000_011_011_011);
        // Multiple rows different directions
        let bitmap4: felt252 =
            0b000_000_000_001_000_000_000_000__000_000_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        let b = Controller::swipe(bitmap4, 2, 4, false, 3);
        let b = Controller::swipe(b, 1, 4, true, 3);
        assert_eq!(
            b,
            0b000_000_000_000_000_000_001_000__001_000_000_000_000_000_000_000__010_010_000_000_000_000_000_000,
        );
    }

    // =========================================================================
    // BOUNDARY VALID MOVES (merged 2 tests)
    // =========================================================================

    #[test]
    fn test_boundary_valid_moves() {
        let bitmap: felt252 = 0b000_000_000_001_000_000_000_000;
        assert_eq!(
            Controller::swipe(bitmap, 0, 4, true, 3), 0b001_000_000_000_000_000_000_000,
        );
        assert_eq!(
            Controller::swipe(bitmap, 0, 4, false, 4), 0b000_000_000_000_000_000_000_001,
        );
    }

    // =========================================================================
    // SWIPE BUG REGRESSION (should_panic - not in boundaries)
    // =========================================================================

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_swipe_bug() {
        let bitmap: felt252 = 0b001_001_011_011_011_001_001_000;
        let blocks = Controller::swipe(bitmap, 0, 5, true, 2);
        println!("blocks: {}", blocks);
    }

    // =========================================================================
    // SWIPE RIGHT - NOT ENOUGH ROOM (should_panic tests)
    // =========================================================================

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_s3_not_first_elem_1() {
        Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 4, false, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_s3_not_first_elem_2() {
        Controller::swipe(0b000_000_011_011_011_000_000_000, 0, 4, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_s4_not_first_elem() {
        Controller::swipe(0b000_100_100_100_100_000_000_000, 0, 5, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_blocked_by_single() {
        Controller::swipe(0b000_000_001_001_000_000_000_000, 0, 5, false, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_blocked_by_size_2() {
        Controller::swipe(0b000_001_000_010_010_000_000_000, 0, 6, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_blocked_by_size_3() {
        Controller::swipe(0b000_001_011_011_011_000_000_000, 0, 6, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_size_2_blocked() {
        Controller::swipe(0b000_010_010_001_000_000_000_000, 0, 5, false, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_size_2_from_middle() {
        Controller::swipe(0b000_010_010_001_000_000_000_000, 0, 6, false, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_size_3_blocked() {
        Controller::swipe(0b000_011_011_011_001_000_000_000, 0, 4, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_size_3_from_middle() {
        Controller::swipe(0b000_011_011_011_001_000_000_000, 0, 5, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_multiple_blocks() {
        Controller::swipe(0b000_001_001_001_000_000_000_000, 0, 6, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_size_2_from_middle_1() {
        Controller::swipe(0b000_010_010_000_000_000_000_000, 0, 6, false, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_right_mixed_blocking() {
        Controller::swipe(0b000_001_010_010_011_011_011_000, 0, 6, false, 6);
    }

    // =========================================================================
    // SWIPE LEFT - NOT ENOUGH ROOM (should_panic tests)
    // =========================================================================

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_blocked_by_adjacent() {
        Controller::swipe(0b000_000_001_001_000_000_010_010, 0, 4, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_with_gaps() {
        Controller::swipe(0b000_001_000_010_010_000_000_000, 0, 4, true, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_no_room() {
        Controller::swipe(0b000_001_000_010_010_000_000_000, 0, 3, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_blocked_by_single() {
        Controller::swipe(0b000_000_001_001_000_000_000_000, 0, 4, true, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_blocked_by_size_2() {
        Controller::swipe(0b000_010_010_000_001_000_000_000, 0, 3, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_blocked_by_size_3() {
        Controller::swipe(0b000_011_011_011_000_001_000_000, 0, 2, true, 5);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_size_2_blocked() {
        Controller::swipe(0b000_000_001_010_010_000_000_000, 0, 3, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_size_3_blocked() {
        Controller::swipe(0b000_001_000_001_011_011_011_000, 0, 1, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_multiple_blocks() {
        Controller::swipe(0b000_001_001_000_001_000_000_000, 0, 3, true, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_swipe_left_into_mixed_blocks() {
        Controller::swipe(0b010_010_011_011_011_001_000_000, 0, 2, true, 4);
    }

    // =========================================================================
    // BOUNDARY - NOT IN BOUNDARIES (should_panic tests)
    // =========================================================================

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s1_at_edge_1() {
        Controller::swipe(0b000_000_000_000_000_000_000_001, 0, 0, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s1_at_edge_2() {
        Controller::swipe(0b000_000_000_000_000_000_001_000, 0, 1, false, 2);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s1_at_edge_3() {
        Controller::swipe(0b001_000_000_000_000_000_000_000, 0, 7, false, 8);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s2_at_edge_1() {
        Controller::swipe(0b000_000_000_000_000_000_010_010, 0, 0, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s2_at_edge_2() {
        Controller::swipe(0b010_010_000_000_000_000_000_000, 0, 6, false, 7);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s3() {
        Controller::swipe(0b000_000_000_000_000_011_011_011, 0, 0, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_right_s4() {
        Controller::swipe(0b000_000_000_000_100_100_100_100, 0, 0, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_boundary_right_s4_from_middle() {
        Controller::swipe(0b000_000_000_000_100_100_100_100, 0, 1, false, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_left_s1() {
        Controller::swipe(0b001_000_000_000_000_000_000_000, 0, 7, true, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_left_s2() {
        Controller::swipe(0b010_010_000_000_000_000_000_000, 0, 6, true, 1);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_left_s3() {
        Controller::swipe(0b011_011_011_000_000_000_000_000, 0, 5, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_boundary_left_s4() {
        Controller::swipe(0b100_100_100_100_000_000_000_000, 0, 4, true, 5);
    }

    // =========================================================================
    // MULTI-ROW SWIPE - BLOCKED (should_panic tests)
    // =========================================================================

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_multi_row_swipe_left_blocked() {
        let bitmap: felt252 =
            0b000_000_000_000_000_000_000_000__000_001_000_001_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 1, 4, true, 3);
    }

    #[test]
    #[should_panic(expected: ('Controller: not enough room',))]
    fn test_multi_row_swipe_right_blocked() {
        let bitmap: felt252 =
            0b000_000_001_000_000_001_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 2, 5, false, 4);
    }

    #[test]
    #[should_panic(expected: ('Controller: not in boundaries',))]
    fn test_multi_row_swipe_boundary() {
        let bitmap: felt252 =
            0b001_000_000_000_000_000_000_000__000_000_001_000_000_000_000_000__010_010_000_000_000_000_000_000;
        Controller::swipe(bitmap, 2, 7, true, 1);
    }
}
