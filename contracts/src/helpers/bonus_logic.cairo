//! Minimal bonus dispatch helper - for test use only.
//!
//! This module provides a simple `apply_bonus_effect` function that routes
//! to the appropriate bonus implementation for grid-modifying bonuses.
//!
//! The full bonus application logic (with leveling, inventory tracking, etc.)
//! lives in grid_system.cairo. Do NOT import this in production systems as it
//! will duplicate bonus implementations and bloat contract size.
//!
//! V3.0 Bonus System:
//! - Combo: Non-grid (adds combo to next move) — returns blocks unchanged
//! - Score: Non-grid (adds direct score) — returns blocks unchanged
//! - Harvest: Grid-modifying (clears all blocks of chosen size + CUBE reward)
//! - Wave: Grid-modifying (clears horizontal lines)
//! - Supply: Non-grid here (adds lines via controller, handled in grid_system)

// Import grid-modifying bonus implementations
use zkube::elements::bonuses::{harvest, wave};
use zkube::types::bonus::Bonus;

/// Apply a bonus effect to the grid and return the updated blocks.
/// Only Harvest and Wave modify the grid directly.
/// Combo, Score, and Supply are handled via run_data in grid_system.
#[inline(always)]
pub fn apply_bonus_effect(bonus: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
    match bonus {
        Bonus::None => blocks,
        Bonus::Combo => blocks, // Non-grid: combo bonus applied via run_data
        Bonus::Score => blocks, // Non-grid: score added via run_data
        Bonus::Harvest => harvest::BonusImpl::apply(blocks, row_index, index),
        Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
        Bonus::Supply => blocks // Non-grid: lines added via controller in grid_system
    }
}
