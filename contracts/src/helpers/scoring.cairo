//! Shared scoring and combo logic.
//! Consolidates duplicate scoring code from GameTrait::make_move() and apply_bonus().

use zkube::helpers::packing::RunData;

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

/// Process lines cleared after a move or bonus application.
/// This is the main entry point that combines:
/// - Combo tracking (combo_counter, max_combo, max_combo_run)
/// - No global combo-cube rewards (handled by charge system and explicit skill effects)
pub fn process_lines_cleared(
    ref run_data: RunData, ref combo_counter: u8, ref max_combo: u8, lines_cleared: u8,
) {
    // Update combo tracking
    update_combo_tracking(ref combo_counter, ref max_combo, ref run_data, lines_cleared);
}

/// Apply combo scoring offset: each line cleared earns bonus points equal to combo_counter.
/// This makes the Combo bonus directly affect the next move's scoring.
#[inline(always)]
pub fn apply_combo_scoring(ref run_data: RunData, combo_counter: u8, lines_cleared: u8) {
    if combo_counter > 0 && lines_cleared > 0 {
        let combo_bonus: u16 = combo_counter.into() * lines_cleared.into();
        update_score(ref run_data, combo_bonus);
    }
}

/// Update score after points earned from line clearing.
/// Handles both level_score (u8, max 255) and total_score (u16, max 65535).
#[inline(always)]
pub fn update_score(ref run_data: RunData, points: u16) {
    // Update level score (cap at 255 for u8)
    let new_score: u16 = run_data.level_score.into() + points;
    run_data.level_score = if new_score > 255 {
        255
    } else {
        new_score.try_into().unwrap()
    };

    // Accumulate total score (cap at 65535 for u16)
    let new_total: u32 = run_data.total_score.into() + points.into();
    run_data.total_score = if new_total > 65535 {
        65535
    } else {
        new_total.try_into().unwrap()
    };
}
