use alexandria_math::fast_power::fast_power;

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::helpers::controller::Controller;
use zkube::types::width::Width;

// Errors
pub mod errors {
    pub const INVALID_BLOCK_VALUE: felt252 = 'Shrink: invalid block value';
}

/// Shrink Bonus - Reduces block size by 1
/// 
/// Level Effects:
/// - L1: Shrink one target block by 1 size
/// - L2: Shrink all blocks of the same size (handled in game.cairo)
/// - L3: Shrink one block by 2 sizes (handled in game.cairo)
/// 
/// Edge Case: Size-1 blocks shrunk become empty (disappear)
pub impl BonusImpl of BonusTrait {
    #[inline(always)]
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252 {
        // Get the target block value (size 1-4)
        let block_value = Controller::get_block(blocks, row_index, index);
        let width: Width = block_value.into();
        assert(width != Width::None, errors::INVALID_BLOCK_VALUE);
        
        // Calculate the new block value (shrink by 1)
        // Size 1 -> 0 (empty/disappear)
        // Size 2 -> 1
        // Size 3 -> 2
        // Size 4 -> 3
        let new_value: u8 = if block_value > 0 { block_value - 1 } else { 0 };
        
        // Replace the block value in the grid
        replace_block(blocks, row_index, index, block_value, new_value)
    }
}

/// Apply shrink to ALL blocks on the grid (for Level 3)
/// Shrinks every block by 1 size (except size 1 which cannot be shrunk)
pub fn apply_shrink_all(blocks: felt252) -> felt252 {
    // Iterate through all blocks and shrink those > 1
    let mut packed: u256 = blocks.into();
    let modulo: u256 = constants::BLOCK_SIZE.into();
    
    let mut result: u256 = 0;
    let mut shift: u256 = 1;
    
    loop {
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        
        let block: u8 = (packed % modulo).try_into().unwrap();
        
        // Shrink blocks > 1 by 1 size
        // Size 1 stays as 1 (cannot shrink)
        // Size 2 -> 1
        // Size 3 -> 2
        // Size 4 -> 3
        // Size 0 (empty) stays 0
        let output_value: u256 = if block > 1 {
            (block - 1).into()
        } else {
            block.into()
        };
        
        result = result + (output_value * shift);
        packed = packed / modulo;
        
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        shift *= modulo;
    };
    
    result.try_into().unwrap()
}

/// Apply shrink to all blocks of the same size (for Level 2)
pub fn apply_shrink_same_size(blocks: felt252, row_index: u8, index: u8) -> felt252 {
    let target_size = Controller::get_block(blocks, row_index, index);
    let width: Width = target_size.into();
    assert(width != Width::None, errors::INVALID_BLOCK_VALUE);
    
    // Calculate new size (shrink by 1)
    let new_size: u8 = if target_size > 0 { target_size - 1 } else { 0 };
    
    // Iterate through all blocks and shrink matching ones
    let mut packed: u256 = blocks.into();
    let _block_mask: u256 = (constants::BLOCK_SIZE - 1).into();
    let modulo: u256 = constants::BLOCK_SIZE.into();
    
    let mut result: u256 = 0;
    let mut shift: u256 = 1;
    
    loop {
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        
        let block: u8 = (packed % modulo).try_into().unwrap();
        
        // If this block matches target size, use new_size; otherwise keep original
        let output_value: u256 = if block == target_size {
            new_size.into()
        } else {
            block.into()
        };
        
        result = result + (output_value * shift);
        packed = packed / modulo;
        
        if packed.low == 0_u128 && packed.high == 0_u128 {
            break;
        }
        shift *= modulo;
    };
    
    result.try_into().unwrap()
}

/// Helper function to replace a single block value in the grid
fn replace_block(blocks: felt252, row_index: u8, index: u8, old_value: u8, new_value: u8) -> felt252 {
    // Calculate position
    let exp = row_index * constants::ROW_BIT_COUNT + index * constants::BLOCK_BIT_COUNT;
    let shift: u256 = fast_power(2, exp.into());
    
    // Create mask for the old block (3 bits)
    let old_mask: u256 = old_value.into() * shift;
    let new_mask: u256 = new_value.into() * shift;
    
    // Remove old value and add new value
    let mut bitmap: u256 = blocks.into();
    bitmap = bitmap - old_mask + new_mask;
    
    bitmap.try_into().unwrap()
}

#[cfg(test)]
mod tests {
    use super::{BonusImpl, apply_shrink_all, apply_shrink_same_size};
    use zkube::helpers::controller::Controller;

    #[test]
    fn test_shrink_single_block() {
        // Grid with a size-3 block at position (row=0, index=0)
        // Index 0 is the rightmost position (least significant bits)
        // Row 0: 000_000_000_000_000_000_000_011 (size 3 at index 0)
        let blocks: felt252 = 0b000_000_000_000_000_000_000_011;
        
        let result = BonusImpl::apply(blocks, 0, 0);
        
        // Should become size 2
        // Row 0: 000_000_000_000_000_000_000_010
        assert_eq!(result, 0b000_000_000_000_000_000_000_010);
    }

    #[test]
    fn test_shrink_size_1_disappears() {
        // Grid with a size-1 block at position (row=0, index=0)
        let blocks: felt252 = 0b000_000_000_000_000_000_000_001;
        
        let result = BonusImpl::apply(blocks, 0, 0);
        
        // Should become empty (0)
        assert_eq!(result, 0);
    }

    #[test]
    fn test_shrink_all() {
        // Grid with mixed blocks: size-4, size-3, size-2, size-1
        // Row 0: 100_011_010_001_000_000_000_000
        let blocks: felt252 = 0b100_011_010_001_000_000_000_000;
        
        let result = apply_shrink_all(blocks);
        
        // Size 4 -> 3, Size 3 -> 2, Size 2 -> 1, Size 1 stays 1
        // Row 0: 011_010_001_001_000_000_000_000
        assert_eq!(result, 0b011_010_001_001_000_000_000_000);
    }

    #[test]
    fn test_shrink_same_size() {
        // Grid with multiple size-2 blocks at indices 0, 2, and 4
        // Row 0: 000_000_000_010_000_010_000_010
        // Index:     7   6   5   4   3   2   1   0
        let blocks: felt252 = 0b000_000_000_010_000_010_000_010;
        
        // Shrink all size-2 blocks (targeting index 0)
        let result = apply_shrink_same_size(blocks, 0, 0);
        
        // All size-2 should become size-1
        // Row 0: 000_000_000_001_000_001_000_001
        assert_eq!(result, 0b000_000_000_001_000_001_000_001);
    }
}
