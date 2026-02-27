use zkube::constants;
use zkube::helpers::controller::Controller;
use core::poseidon::PoseidonTrait;
use core::hash::HashStateTrait;

// =============================================================================
// Harvest (vNext): Destroy N random non-empty visual blocks.
// Returns (new_blocks, cubes_earned) where cubes = sum of destroyed block sizes.
// =============================================================================

/// Destroy `count` random visual blocks from the grid.
/// A "visual block" is identified by its leftmost cell — a block of width W
/// occupies W consecutive cells, each storing value W.
///
/// `seed` should be unique per use (e.g. poseidon(game_seed, 'HARVEST', use_count)).
/// Returns (new_blocks, cubes_earned).
pub fn harvest_random_blocks(blocks: felt252, seed: felt252, count: u8) -> (felt252, u16) {
    if count == 0 {
        return (blocks, 0);
    }

    let mut new_blocks = blocks;
    let mut cubes_earned: u16 = 0;
    let mut destroyed: u8 = 0;
    let mut current_seed = seed;

    loop {
        if destroyed >= count {
            break;
        }

        // Collect all non-empty visual block positions
        let mut positions: Array<(u8, u8, u8)> = array![]; // (row, col, size)
        let mut row: u8 = 0;
        loop {
            if row >= 10 {
                break;
            }
            let mut col: u8 = 0;
            loop {
                if col >= 8 {
                    break;
                }
                let bv = Controller::get_block(new_blocks, row, col);
                if bv > 0 {
                    // Check if this is the leftmost cell of the block
                    let is_leftmost = if col == 0 {
                        true
                    } else {
                        Controller::get_block(new_blocks, row, col - 1) != bv
                    };
                    if is_leftmost {
                        positions.append((row, col, bv));
                    }
                }
                col += 1;
            };
            row += 1;
        };

        let current_count = positions.len();
        if current_count == 0 {
            break; // No more blocks to destroy
        }

        // Hash for this pick
        let mut state = PoseidonTrait::new();
        state = state.update(current_seed);
        state = state.update('HARVEST');
        state = state.update(destroyed.into());
        let h = state.finalize();
        let h_u256: u256 = h.into();
        let pick_idx: u32 = (h_u256 % current_count.into()).try_into().unwrap();

        let (br, bc, bsize) = *positions.at(pick_idx);

        // Zero out the block (all cells of this visual block)
        new_blocks = zero_block(new_blocks, br, bc, bsize);
        cubes_earned += bsize.into();

        current_seed = h;
        destroyed += 1;
    };

    (new_blocks, cubes_earned)
}

/// Zero out a single visual block at (row, col) of given size.
/// The block occupies `size` consecutive cells starting at col.
fn zero_block(blocks: felt252, row: u8, col: u8, size: u8) -> felt252 {
    let mut packed: u256 = blocks.into();
    let cell_mask: u256 = 0x7; // 3-bit mask

    let mut i: u8 = 0;
    loop {
        if i >= size || (col + i) >= 8 {
            break;
        }
        let bit_pos: u256 = (row * constants::ROW_BIT_COUNT + (col + i) * constants::BLOCK_BIT_COUNT).into();
        let mask = cell_mask * pow2(bit_pos);
        packed = packed & ~mask;
        i += 1;
    };

    packed.try_into().unwrap()
}

/// Fast power of 2 using left shift.
fn pow2(exp: u256) -> u256 {
    if exp == 0 {
        return 1;
    }
    let mut result: u256 = 1;
    let mut i: u256 = 0;
    loop {
        if i >= exp {
            break;
        }
        result = result * 2;
        i += 1;
    };
    result
}

/// Count how many visual blocks of the target size exist on the grid.
/// Used for old compatibility - may be useful for UI display.
pub fn count_blocks_of_size(blocks: felt252, row_index: u8, index: u8) -> u8 {
    let block_size = Controller::get_block(blocks, row_index, index);
    if block_size == 0 {
        return 0;
    }
    let mut packed: u256 = blocks.into();
    let modulo: u256 = constants::BLOCK_SIZE.into();
    let mut count: u8 = 0;
    loop {
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        let block: u8 = (packed % modulo).try_into().unwrap();
        if block == block_size {
            count += 1;
        }
        packed = packed / modulo;
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
    };
    // Divide by block width: each visual block of width N has N cells with value N
    count / block_size
}
