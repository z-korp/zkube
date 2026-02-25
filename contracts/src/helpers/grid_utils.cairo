//! Minimal grid utilities for bonus_logic.
//!
//! This module contains ONLY the gravity and line assessment functions needed
//! by bonus_logic. It avoids importing the full Controller to reduce contract size.
//!
//! NOTE: Do NOT add swipe, line creation, or other heavy functions here.
//! Those should stay in controller.cairo.

use zkube::constants::{BLOCK_SIZE, LINE_FULL_BOUND, ROW_SIZE};
use zkube::helpers::gravity::Gravity;
use zkube::helpers::packer::Packer;

/// Apply gravity to the grid.
/// Drops all blocks down to fill empty spaces.
/// # Arguments
/// * `blocks` - The grid as a packed felt252.
/// # Returns
/// The updated grid.
pub fn apply_gravity(mut blocks: felt252) -> felt252 {
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
/// * `counter` - The combo counter (incremented for each line cleared).
/// * `points_earned` - The points earned (updated with combo scoring).
/// * `accountable` - Whether to count lines for scoring.
/// # Returns
/// The new grid.
pub fn assess_lines(
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
                let new_row = assess_line(row);
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

/// Returns the row if it is not full, otherwise returns 0.
/// A row is full when all 8 block positions are non-empty.
/// # Arguments
/// * `row` - The row.
/// # Returns
/// The row if not full, 0 if full.
#[inline(always)]
fn assess_line(row: u32) -> u32 {
    // Check if left block is not empty (row must be >= 2^21 for leftmost block to be non-zero)
    if row < LINE_FULL_BOUND {
        return row;
    }
    // Check each block is not 0
    if Packer::contains(row, 0_u8, BLOCK_SIZE) {
        return row;
    }
    0
}

/// Assess the game state (gravity + line clearing) in a loop until stable.
/// Returns points earned and updates lines_cleared counter.
pub fn assess_game(ref blocks: felt252, ref counter: u8) -> u16 {
    let mut points = 0;
    let mut upper_blocks = 0;
    loop {
        let mut inner_blocks = 0;
        loop {
            if inner_blocks == blocks {
                break;
            }
            inner_blocks = blocks;
            blocks = apply_gravity(blocks);
        }
        blocks = assess_lines(blocks, ref counter, ref points, true);
        if upper_blocks == blocks {
            break points;
        }
        upper_blocks = blocks;
    }
}
