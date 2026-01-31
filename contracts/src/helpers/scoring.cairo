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

/// Calculate combo cubes earned based on lines cleared in a single move.
/// 4 lines = +1, 5 lines = +3, 6 lines = +5, 7 lines = +10, 8 lines = +25, 9+ lines = +50
#[inline(always)]
pub fn calculate_combo_cubes(lines_cleared: u8) -> u16 {
    if lines_cleared >= 9 {
        50
    } else if lines_cleared >= 8 {
        25
    } else if lines_cleared >= 7 {
        10
    } else if lines_cleared >= 6 {
        5
    } else if lines_cleared >= 5 {
        3
    } else if lines_cleared >= 4 {
        1
    } else {
        0
    }
}

/// Update combo tracking after lines are cleared.
/// Updates combo_counter, max_combo (per-level), and max_combo_run (per-run).
#[inline(always)]
pub fn update_combo_tracking(
    ref combo_counter: u8,
    ref max_combo: u8,
    ref run_data: RunData,
    lines_cleared: u8,
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

/// Award combo cubes based on lines cleared.
/// Also checks and awards one-time combo achievements (5-line = +3, 10-line = +5).
pub fn award_combo_cubes(ref run_data: RunData, lines_cleared: u8) {
    // Award cubes for high combos (4+ lines)
    let combo_cubes = calculate_combo_cubes(lines_cleared);
    if combo_cubes > 0 {
        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, combo_cubes);
    }

    // One-time combo achievement bonuses
    if run_data.max_combo_run >= 5 && !run_data.combo_5_achieved {
        run_data.combo_5_achieved = true;
        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
    }
    if run_data.max_combo_run >= 10 && !run_data.combo_10_achieved {
        run_data.combo_10_achieved = true;
        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 5_u16);
    }
}

/// Process lines cleared after a move or bonus application.
/// This is the main entry point that combines:
/// - Combo tracking (combo_counter, max_combo, max_combo_run)
/// - Combo cube rewards (4+ lines)
/// - Combo achievement bonuses (5-line, 10-line first-time)
pub fn process_lines_cleared(
    ref run_data: RunData,
    ref combo_counter: u8,
    ref max_combo: u8,
    lines_cleared: u8,
) {
    // Update combo tracking
    update_combo_tracking(ref combo_counter, ref max_combo, ref run_data, lines_cleared);
    
    // Award cubes and achievements
    award_combo_cubes(ref run_data, lines_cleared);
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
