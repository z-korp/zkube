//! Minimal bonus dispatch helper - for test use only.
//!
//! This module provides a simple `apply_bonus_effect` function that routes
//! to the appropriate bonus implementation for grid-modifying bonuses.
//!
//! The full bonus application logic (with leveling, inventory tracking, etc.)
//! lives in grid_system.cairo. Do NOT import this in production systems as it
//! will duplicate bonus implementations and bloat contract size.
//!
//! vNext Bonus System:
//! - ComboSurge: Non-grid (adds combo) — returns blocks unchanged
//! - Momentum: Non-grid (adds score) — returns blocks unchanged
//! - Harvest: Grid-modifying (random block destruction + CUBE reward)
//! - Tsunami: Grid-modifying (targeted block/row clearing)

// Import grid-modifying bonus implementations
use zkube::elements::bonuses::tsunami;
use zkube::types::bonus::Bonus;

/// Apply a bonus effect to the grid and return the updated blocks.
/// Only Harvest and Tsunami modify the grid directly.
/// ComboSurge and Momentum are handled via run_data in grid_system.
///
/// Note: Harvest now uses random destruction (harvest_random_blocks),
/// so this legacy targeted apply is only useful for Tsunami.
/// For Harvest, grid_system calls harvest_random_blocks directly.
#[inline(always)]
pub fn apply_bonus_effect(bonus: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
    match bonus {
        Bonus::None => blocks,
        Bonus::ComboSurge => blocks, // Non-grid: combo bonus applied via run_data
        Bonus::Momentum => blocks, // Non-grid: score added via run_data
        Bonus::Harvest => blocks, // Grid-modifying but now random — handled by grid_system
        Bonus::Tsunami => tsunami::clear_row(blocks, row_index), // Row clearing
    }
}
