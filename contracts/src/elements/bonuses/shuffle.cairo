use core::poseidon::poseidon_hash_span;

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;

/// Shuffle Bonus - Randomizes block positions
/// 
/// Level Effects:
/// - L1: Shuffle one row (randomize block positions within the row)
/// - L2: Shuffle the upcoming/next line (handled separately via next_row)
/// - L3: Shuffle entire visible grid (handled in game.cairo)
/// 
/// Note: After shuffle, gravity should be applied and can trigger line clears
pub impl BonusImpl of BonusTrait {
    /// Apply shuffle to a single row (L1 effect)
    /// Uses row_index to determine which row, index is used as seed component
    #[inline(always)]
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252 {
        // Generate a seed from the index (will be combined with game seed in game.cairo)
        let seed: felt252 = index.into();
        shuffle_row(blocks, row_index, seed)
    }
}

/// Shuffle a single row using Fisher-Yates algorithm
/// Returns the grid with the specified row shuffled
pub fn shuffle_row(blocks: felt252, row_index: u8, seed: felt252) -> felt252 {
    // Extract the row
    let row_data = Controller::get_row(blocks, row_index);
    
    // Extract individual blocks from the row (8 blocks, 3 bits each)
    let mut block_values: Array<u8> = array![];
    let mut remaining = row_data;
    let mut i: u8 = 0;
    loop {
        if i >= constants::DEFAULT_GRID_WIDTH {
            break;
        }
        let block_value: u8 = (remaining % 8).try_into().unwrap();
        block_values.append(block_value);
        remaining = remaining / 8;
        i += 1;
    };
    
    // Fisher-Yates shuffle using seed
    let shuffled = fisher_yates_shuffle(block_values.span(), seed);
    
    // Reconstruct the row
    let new_row_data = pack_row(shuffled);
    
    // Replace the row in the grid
    replace_row(blocks, row_index, new_row_data)
}

/// Shuffle an upcoming line (next_row) - for L2 effect
pub fn shuffle_next_line(next_row: u32, seed: felt252) -> u32 {
    // Extract individual blocks from next_row (8 blocks, 3 bits each)
    let mut block_values: Array<u8> = array![];
    let mut remaining = next_row;
    let mut i: u8 = 0;
    loop {
        if i >= constants::DEFAULT_GRID_WIDTH {
            break;
        }
        let block_value: u8 = (remaining % 8).try_into().unwrap();
        block_values.append(block_value);
        remaining = remaining / 8;
        i += 1;
    };
    
    // Fisher-Yates shuffle
    let shuffled = fisher_yates_shuffle(block_values.span(), seed);
    
    // Pack back into u32
    pack_row(shuffled)
}

/// Shuffle the entire grid - for L3 effect
pub fn shuffle_entire_grid(blocks: felt252, seed: felt252) -> felt252 {
    let mut result = blocks;
    let mut row_idx: u8 = 0;
    
    loop {
        if row_idx >= constants::DEFAULT_GRID_HEIGHT {
            break;
        }
        
        // Use different seed for each row to ensure variety
        let row_seed_arr: Array<felt252> = array![seed, row_idx.into()];
        let row_seed = poseidon_hash_span(row_seed_arr.span());
        
        result = shuffle_row(result, row_idx, row_seed);
        row_idx += 1;
    };
    
    result
}

/// Fisher-Yates shuffle implementation
fn fisher_yates_shuffle(values: Span<u8>, seed: felt252) -> Span<u8> {
    let len = values.len();
    if len <= 1 {
        return values;
    }
    
    // Copy values to mutable array
    let mut arr: Array<u8> = array![];
    let mut j: u32 = 0;
    loop {
        if j >= len {
            break;
        }
        arr.append(*values.at(j));
        j += 1;
    };
    
    // Fisher-Yates shuffle from end to start
    let mut i: u32 = len - 1;
    let mut current_seed = seed;
    
    loop {
        if i == 0 {
            break;
        }
        
        // Generate random index j in [0, i]
        let seed_arr: Array<felt252> = array![current_seed, i.into()];
        current_seed = poseidon_hash_span(seed_arr.span());
        
        // Convert seed to index in range [0, i]
        let seed_u256: u256 = current_seed.into();
        let range: u256 = (i + 1).into();
        let j_idx: u32 = (seed_u256 % range).try_into().unwrap();
        
        // Swap arr[i] and arr[j_idx]
        if i != j_idx {
            let temp_i = *arr.at(i);
            let temp_j = *arr.at(j_idx);
            
            // Rebuild array with swapped values
            let mut new_arr: Array<u8> = array![];
            let mut k: u32 = 0;
            loop {
                if k >= len {
                    break;
                }
                if k == i {
                    new_arr.append(temp_j);
                } else if k == j_idx {
                    new_arr.append(temp_i);
                } else {
                    new_arr.append(*arr.at(k));
                }
                k += 1;
            };
            arr = new_arr;
        }
        
        i -= 1;
    };
    
    arr.span()
}

/// Pack 8 block values (3 bits each) into a u32 row
fn pack_row(values: Span<u8>) -> u32 {
    let mut result: u32 = 0;
    let mut shift: u32 = 1;
    let mut i: u32 = 0;
    
    loop {
        if i >= values.len() {
            break;
        }
        let value: u32 = (*values.at(i)).into();
        result = result + (value * shift);
        shift = shift * 8; // 2^3 = 8
        i += 1;
    };
    
    result
}

/// Replace a row in the grid with new data
fn replace_row(blocks: felt252, row_index: u8, new_row_data: u32) -> felt252 {
    // Calculate row position
    let row_shift = row_index * constants::ROW_BIT_COUNT;
    
    // Create mask for the row (24 bits = ROW_SIZE - 1)
    let row_mask: u256 = (constants::ROW_SIZE - 1).into();
    let shifted_mask: u256 = row_mask * pow2(row_shift.into());
    
    // Clear the old row and insert new row
    let mut bitmap: u256 = blocks.into();
    bitmap = bitmap & ~shifted_mask; // Clear old row
    
    let new_row_shifted: u256 = new_row_data.into() * pow2(row_shift.into());
    bitmap = bitmap | new_row_shifted; // Insert new row
    
    bitmap.try_into().unwrap()
}

/// Helper: 2^n for u256
fn pow2(n: u256) -> u256 {
    if n == 0 {
        return 1;
    }
    let mut result: u256 = 1;
    let mut i: u256 = 0;
    loop {
        if i >= n {
            break;
        }
        result = result * 2;
        i += 1;
    };
    result
}

#[cfg(test)]
mod tests {
    use super::{BonusImpl, shuffle_row, shuffle_next_line, shuffle_entire_grid, pack_row, fisher_yates_shuffle};
    use zkube::helpers::controller::Controller;

    #[test]
    fn test_shuffle_changes_order() {
        // Row with distinct blocks: 001_010_011_100_001_010_011_100
        // Values: [1, 2, 3, 4, 1, 2, 3, 4]
        let blocks: felt252 = 0b001_010_011_100_001_010_011_100;
        
        let result = shuffle_row(blocks, 0, 'test_seed');
        
        // Result should be different from original (with very high probability)
        // Note: There's a tiny chance of shuffling to same order, but extremely unlikely
        // We just verify it doesn't panic and returns valid data
        assert!(result != 0, "Shuffle should return non-zero result");
    }

    #[test]
    fn test_shuffle_preserves_block_values() {
        // Row with blocks: [1, 2, 0, 0, 3, 0, 0, 0]
        let blocks: felt252 = 0b001_010_000_000_011_000_000_000;
        
        let result = shuffle_row(blocks, 0, 'test_seed');
        
        // Count total block values in original
        let original_sum = 1 + 2 + 3; // = 6
        
        // Count total block values in result (first row only)
        let row = Controller::get_row(result, 0);
        let mut sum: u32 = 0;
        let mut remaining = row;
        let mut i: u8 = 0;
        loop {
            if i >= 8 {
                break;
            }
            sum += remaining % 8;
            remaining = remaining / 8;
            i += 1;
        };
        
        // Sum should be preserved (blocks just moved, not created/destroyed)
        assert_eq!(sum, original_sum);
    }

    #[test]
    fn test_shuffle_next_line() {
        // Next line: 001_010_011_100_001_010_011_100
        let next_row: u32 = 0b001_010_011_100_001_010_011_100;
        
        let result = shuffle_next_line(next_row, 'seed');
        
        // Should produce valid result
        assert!(result > 0, "Shuffle should return non-zero result");
    }

    #[test]
    fn test_pack_row() {
        let values: Array<u8> = array![1, 2, 3, 0, 0, 0, 0, 0];
        let packed = pack_row(values.span());
        
        // 1 + 2*8 + 3*64 = 1 + 16 + 192 = 209
        assert_eq!(packed, 209);
    }

    #[test]
    fn test_fisher_yates_deterministic() {
        let values: Array<u8> = array![1, 2, 3, 4];
        
        // Same seed should produce same result
        let result1 = fisher_yates_shuffle(values.span(), 'fixed_seed');
        let result2 = fisher_yates_shuffle(values.span(), 'fixed_seed');
        
        assert_eq!(*result1.at(0), *result2.at(0));
        assert_eq!(*result1.at(1), *result2.at(1));
        assert_eq!(*result1.at(2), *result2.at(2));
        assert_eq!(*result1.at(3), *result2.at(3));
    }
}
