//! Minimal bonus dispatch helper - for test use only.
//! 
//! This module provides a simple `apply_bonus_effect` function that routes
//! to the appropriate bonus implementation. It exists primarily for unit tests
//! in types/bonus.cairo.
//! 
//! The full bonus application logic (with leveling, inventory tracking, etc.)
//! lives in grid_system.cairo. Do NOT import this in production systems as it
//! will duplicate bonus implementations and bloat contract size.

use zkube::types::bonus::Bonus;

// Import all bonus implementations
use zkube::elements::bonuses::hammer;
use zkube::elements::bonuses::totem;
use zkube::elements::bonuses::wave;
use zkube::elements::bonuses::shrink;
use zkube::elements::bonuses::shuffle;

/// Apply a bonus effect to the grid and return the updated blocks.
/// This is the core dispatch function that routes to the appropriate bonus implementation.
/// 
/// NOTE: This is a basic L1 application only. For leveled bonuses (L2/L3),
/// use grid_system.apply_bonus() instead.
#[inline(always)]
pub fn apply_bonus_effect(bonus: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
    match bonus {
        Bonus::None => blocks,
        Bonus::Hammer => hammer::BonusImpl::apply(blocks, row_index, index),
        Bonus::Totem => totem::BonusImpl::apply(blocks, row_index, index),
        Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
        Bonus::Shrink => shrink::BonusImpl::apply(blocks, row_index, index),
        Bonus::Shuffle => shuffle::BonusImpl::apply(blocks, row_index, index),
    }
}
