//! Shared scoring and combo logic.
//! Consolidates duplicate scoring code for move resolution.

use zkube::helpers::packing::RunData;
use zkube::models::mutator::MutatorDef;

/// Saturating add for u8 (caps at 255)
#[inline(always)]
pub fn saturating_add_u8(lhs: u8, rhs: u8) -> u8 {
    let sum: u16 = lhs.into() + rhs.into();
    if sum > 255 {
        255_u8
    } else {
        sum.try_into().unwrap()
    }
}

/// Saturating add for u16 (caps at 65535)
#[inline(always)]
pub fn saturating_add_u16(lhs: u16, rhs: u16) -> u16 {
    let sum: u32 = lhs.into() + rhs.into();
    if sum > 65535 {
        65535_u16
    } else {
        sum.try_into().unwrap()
    }
}

/// Add with a maximum cap (for fields with limited bit space like free_moves)
#[inline(always)]
pub fn saturating_add_u8_capped(lhs: u8, rhs: u8, max: u8) -> u8 {
    let sum: u16 = lhs.into() + rhs.into();
    if sum > max.into() {
        max
    } else {
        sum.try_into().unwrap()
    }
}

/// Update combo tracking after lines are cleared.
/// Updates combo_counter, max_combo (per-level), and max_combo_run (per-run).
#[inline(always)]
pub fn update_combo_tracking(
    ref combo_counter: u8, ref max_combo: u8, ref run_data: RunData, lines_cleared: u8,
) {
    if lines_cleared > 1 {
        combo_counter = saturating_add_u8(combo_counter, lines_cleared);
        if lines_cleared > max_combo {
            max_combo = lines_cleared;
        }
        if lines_cleared > run_data.max_combo_run {
            run_data.max_combo_run = lines_cleared;
        }
    }
}

/// Process lines cleared after a move.
/// This is the main entry point that combines:
/// - Combo tracking (combo_counter, max_combo, max_combo_run)
/// - No external reward side-effects (pure run_data/combo mutation)
pub fn process_lines_cleared(
    ref run_data: RunData, ref combo_counter: u8, ref max_combo: u8, lines_cleared: u8,
) {
    // Update combo tracking
    update_combo_tracking(ref combo_counter, ref max_combo, ref run_data, lines_cleared);
}

/// Multiply the move's subtotal by `combo_bonus_mult_x100 / 100` when the
/// move cleared multiple lines (lines_cleared > 1). At neutral (100) this
/// is ×1.0 = no change. At 200 it doubles the move's points, etc.
/// Single-line clears always return the subtotal unchanged.
#[inline(always)]
pub fn apply_combo_mult(move_subtotal: u32, lines_cleared: u8, mutator_def: @MutatorDef) -> u16 {
    if lines_cleared <= 1 {
        return if move_subtotal > 0xFFFF {
            0xFFFF
        } else {
            move_subtotal.try_into().unwrap()
        };
    }
    let mut mult_x100: u16 = *mutator_def.combo_bonus_mult_x100;
    if mult_x100 == 0 {
        mult_x100 = 100;
    }
    let scaled: u64 = move_subtotal.into() * mult_x100.into() / 100_u64;
    if scaled > 0xFFFF {
        0xFFFF
    } else {
        scaled.try_into().unwrap()
    }
}

/// Update score after points earned from line clearing.
/// Handles both level_score (u16, max 65535) and total_score (u32).
#[inline(always)]
pub fn update_score(ref run_data: RunData, points: u16) {
    // Update level score (cap at u16 max)
    let new_score: u32 = run_data.level_score.into() + points.into();
    run_data.level_score = if new_score > 0xFFFF {
        0xFFFF
    } else {
        new_score.try_into().unwrap()
    };

    // Accumulate total score (cap at max u32)
    let new_total: u64 = run_data.total_score.into() + points.into();
    run_data
        .total_score =
            if new_total > 0xFFFFFFFF {
                0xFFFFFFFF
            } else {
                new_total.try_into().unwrap()
            };
}
