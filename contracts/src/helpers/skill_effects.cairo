use zkube::helpers::packing::{RunData, RunDataHelpersTrait, RunDataPackingTrait, SkillTreeDataPackingTrait};

// =============================================================================
// Skill IDs (vNext: 12 skills, 4 archetypes)
// =============================================================================

mod SkillIds {
    // Active skills (consume charges, IDs 1-4)
    pub const COMBO_SURGE: u8 = 1;       // Tempo
    pub const MOMENTUM_SCALING: u8 = 2;   // Scaling
    pub const HARVEST: u8 = 3;            // Risk
    pub const TSUNAMI: u8 = 4;            // Control

    // Passive skills (always-on, IDs 5-12)
    pub const RHYTHM: u8 = 5;             // Tempo
    pub const CASCADE_MASTERY: u8 = 6;    // Tempo
    pub const OVERDRIVE: u8 = 7;          // Scaling
    pub const ENDGAME_FOCUS: u8 = 8;      // Scaling
    pub const HIGH_STAKES: u8 = 9;        // Risk
    pub const GAMBIT: u8 = 10;            // Risk
    pub const STRUCTURAL_INTEGRITY: u8 = 11; // Control
    pub const GRID_HARMONY: u8 = 12;      // Control
}

mod BranchIds {
    pub const NONE: u8 = 0;
    pub const A: u8 = 0;
    pub const B: u8 = 1;
}

// =============================================================================
// ActiveEffect — returned when using an active skill charge (IDs 1-4)
// =============================================================================

#[derive(Copy, Drop, Debug, Default, Serde)]
pub struct ActiveEffect {
    // Combo Surge (ID 1)
    pub combo_add: u8,              // Immediate combo depth to add
    pub combo_surge_flow: bool,     // Branch B: set level-wide combo depth flag
    pub combo_surge_flow_depth: u8, // Branch B: combo depth for the rest of the level

    // Momentum Scaling (ID 2)
    pub score_add: u16,             // Flat score to add
    pub score_per_zone: u8,         // Score per zone cleared (×zones_cleared)

    // Harvest (ID 3)
    pub blocks_to_destroy: u8,      // Random blocks to destroy (Extraction)
    pub cubes_per_block_size: bool, // true = cubes earned = sum of block sizes
    pub lines_to_add: u8,           // Lines to inject (Injection branch B)
    pub cubes_flat: u16,            // Flat cubes for injection

    // Tsunami (ID 4)
    pub blocks_to_clear: u8,        // Targeted blocks to clear (Branch A: Wide)
    pub clear_by_size: bool,        // L5A: clear all blocks of targeted size
    pub rows_to_clear: u8,          // Targeted rows to clear (Branch B: Target)
}

// =============================================================================
// PassiveEffect — aggregated from all passive skills in loadout
// =============================================================================

#[derive(Copy, Drop, Debug, Default, Serde)]
pub struct PassiveEffect {
    // Rhythm (ID 5): combo_streak → combo depth
    pub rhythm_streak_threshold: u8,  // Every N combo_streak → bonus
    pub rhythm_combo_add: u8,         // +N combo depth per proc

    // Cascade Mastery (ID 6): cascade_depth → combo depth
    pub cascade_depth_threshold: u8,  // If cascade_depth >= N → bonus
    pub cascade_combo_add: u8,        // +N combo depth

    // Overdrive (ID 7): charge cadence reduction
    pub overdrive_cadence: u8,        // Charge refill every N levels (0 = use default 5)
    pub overdrive_starting_charges: u8, // Extra starting charges for all actives

    // Endgame Focus (ID 8): late-run score injection
    pub endgame_score: u16,           // Flat score at level start
    pub endgame_min_level: u8,        // Only on levels >= this (0 = per-level scaling)
    pub endgame_per_level_x10: u8,    // Score = (value * levels_cleared) / 10 (Branch A)

    // High Stakes (ID 9): grid height → cubes per clear
    pub high_stakes_height: u8,       // Grid height threshold (rows)
    pub high_stakes_cubes: u8,        // Cubes per line clear when above threshold

    // Gambit (ID 10): survive high grid → cubes (once per level)
    pub gambit_height: u8,            // Grid must reach >= this height
    pub gambit_cubes: u16,            // Cubes awarded on level complete

    // Structural Integrity (ID 11): high grid → extra row removal
    pub si_height: u8,                // Grid height threshold
    pub si_extra_rows: u8,            // Extra rows destroyed on first line clear

    // Grid Harmony (ID 12): high grid → extra row removal (every/next clear)
    pub gh_height: u8,                // Grid height threshold
    pub gh_extra_rows: u8,            // Extra rows removed
    pub gh_every_clear: bool,         // true = every clear, false = next clear only
}

// =============================================================================
// Public API
// =============================================================================

/// Get the active effect for a skill (IDs 1-4) at a given level and branch.
/// Level is 1-indexed (1-5). Branch: 0=A, 1=B (only matters at level >= 3).
pub fn active_effect_for_skill(skill_id: u8, level: u8, branch_id: u8) -> ActiveEffect {
    match skill_id {
        1 => combo_surge_effect(level, branch_id),
        2 => momentum_scaling_effect(level, branch_id),
        3 => harvest_effect(level, branch_id),
        4 => tsunami_effect(level, branch_id),
        _ => Default::default(),
    }
}

/// Get the passive effect for a single skill (IDs 5-12) at a given level and branch.
pub fn passive_effect_for_skill(skill_id: u8, level: u8, branch_id: u8) -> PassiveEffect {
    match skill_id {
        5 => rhythm_effect(level, branch_id),
        6 => cascade_mastery_effect(level, branch_id),
        7 => overdrive_effect(level, branch_id),
        8 => endgame_focus_effect(level, branch_id),
        9 => high_stakes_effect(level, branch_id),
        10 => gambit_effect(level, branch_id),
        11 => structural_integrity_effect(level, branch_id),
        12 => grid_harmony_effect(level, branch_id),
        _ => Default::default(),
    }
}

/// Aggregate all passive effects from all passive skills in the run loadout.
pub fn get_passive_effects(run_data: @RunData) -> PassiveEffect {
    let mut result: PassiveEffect = Default::default();
    let slot_count = *run_data.active_slot_count;
    let mut slot: u8 = 0;

    loop {
        if slot >= 3 || slot >= slot_count {
            break;
        }

        let skill_id = run_data.get_slot_skill(slot);
        let level = run_data.get_slot_level(slot);
        let branch = run_data.get_slot_branch(slot);

        if skill_id >= 5 && skill_id <= 12 && level > 0 {
            let pe = passive_effect_for_skill(skill_id, level, branch);
            result = merge_passive_effects(result, pe);
        }

        slot += 1;
    };

    result
}

/// Get branch_id for a skill from the player's packed skill_data.
/// Returns 0 (Branch A) if skill not found or below branch point.
pub fn get_branch_id_for_skill(skill_data: felt252, skill_id: u8) -> u8 {
    let tree = SkillTreeDataPackingTrait::unpack(skill_data);
    let info = tree.get_skill(skill_id);
    info.branch_id
}

// =============================================================================
// Merge helper
// =============================================================================

fn merge_passive_effects(mut base: PassiveEffect, add: PassiveEffect) -> PassiveEffect {
    // Rhythm: take whichever is set (only one Rhythm per run)
    if add.rhythm_streak_threshold > 0 {
        base.rhythm_streak_threshold = add.rhythm_streak_threshold;
        base.rhythm_combo_add = add.rhythm_combo_add;
    }
    // Cascade Mastery: take whichever is set
    if add.cascade_depth_threshold > 0 {
        base.cascade_depth_threshold = add.cascade_depth_threshold;
        base.cascade_combo_add = add.cascade_combo_add;
    }
    // Overdrive: take whichever is set (only one Overdrive per run)
    if add.overdrive_cadence > 0 {
        base.overdrive_cadence = add.overdrive_cadence;
        base.overdrive_starting_charges = add.overdrive_starting_charges;
    }
    // Endgame Focus: take whichever is set
    if add.endgame_score > 0 || add.endgame_per_level_x10 > 0 {
        base.endgame_score = add.endgame_score;
        base.endgame_min_level = add.endgame_min_level;
        base.endgame_per_level_x10 = add.endgame_per_level_x10;
    }
    // High Stakes: take whichever is set
    if add.high_stakes_height > 0 {
        base.high_stakes_height = add.high_stakes_height;
        base.high_stakes_cubes = add.high_stakes_cubes;
    }
    // Gambit: take whichever is set
    if add.gambit_height > 0 {
        base.gambit_height = add.gambit_height;
        base.gambit_cubes = add.gambit_cubes;
    }
    // Structural Integrity: take whichever is set
    if add.si_height > 0 {
        base.si_height = add.si_height;
        base.si_extra_rows = add.si_extra_rows;
    }
    // Grid Harmony: take whichever is set
    if add.gh_height > 0 {
        base.gh_height = add.gh_height;
        base.gh_extra_rows = add.gh_extra_rows;
        base.gh_every_clear = add.gh_every_clear;
    }
    base
}

// =============================================================================
// Active Skill Effect Tables (IDs 1-4)
// =============================================================================

// -----------------------------------------------------------------------------
// ID 1: Combo Surge (Tempo)
// Branch A: Burst (explosive spike)
// Branch B: Flow (level-wide combo depth, once per level)
// -----------------------------------------------------------------------------
fn combo_surge_effect(level: u8, branch_id: u8) -> ActiveEffect {
    let mut e: ActiveEffect = Default::default();
    match level {
        1 => { e.combo_add = 1; },
        2 => { e.combo_add = 2; },
        3 => {
            if branch_id == 0 {
                // A — Burst: +3
                e.combo_add = 3;
            } else {
                // B — Flow: +1 for the full level
                e.combo_surge_flow = true;
                e.combo_surge_flow_depth = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.combo_add = 5;
            } else {
                e.combo_surge_flow = true;
                e.combo_surge_flow_depth = 2;
            }
        },
        5 => {
            if branch_id == 0 {
                e.combo_add = 7;
            } else {
                e.combo_surge_flow = true;
                e.combo_surge_flow_depth = 4;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 2: Momentum Scaling (Scaling)
// Branch A: Late Bloom (score per zone cleared)
// Branch B: Stable Growth (flat score)
// -----------------------------------------------------------------------------
fn momentum_scaling_effect(level: u8, branch_id: u8) -> ActiveEffect {
    let mut e: ActiveEffect = Default::default();
    match level {
        1 => { e.score_per_zone = 1; },
        2 => { e.score_per_zone = 2; },
        3 => {
            if branch_id == 0 {
                // A — Late Bloom: +3 per zone
                e.score_per_zone = 3;
            } else {
                // B — Stable Growth: +5 flat
                e.score_add = 5;
            }
        },
        4 => {
            if branch_id == 0 {
                e.score_per_zone = 5;
            } else {
                e.score_add = 10;
            }
        },
        5 => {
            if branch_id == 0 {
                e.score_per_zone = 10;
            } else {
                e.score_add = 20;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 3: Harvest (Risk)
// Branch A: Extraction (random blocks, cubes = block sizes)
// Branch B: Injection (add lines + flat cubes)
// -----------------------------------------------------------------------------
fn harvest_effect(level: u8, branch_id: u8) -> ActiveEffect {
    let mut e: ActiveEffect = Default::default();
    e.cubes_per_block_size = true; // Always true for extraction
    match level {
        1 => { e.blocks_to_destroy = 2; },
        2 => { e.blocks_to_destroy = 3; },
        3 => {
            if branch_id == 0 {
                // A — Extraction: 5 blocks
                e.blocks_to_destroy = 5;
            } else {
                // B — Injection: 1 line, +10 cubes
                e.blocks_to_destroy = 0;
                e.cubes_per_block_size = false;
                e.lines_to_add = 1;
                e.cubes_flat = 10;
            }
        },
        4 => {
            if branch_id == 0 {
                e.blocks_to_destroy = 7;
            } else {
                e.blocks_to_destroy = 0;
                e.cubes_per_block_size = false;
                e.lines_to_add = 2;
                e.cubes_flat = 20;
            }
        },
        5 => {
            if branch_id == 0 {
                e.blocks_to_destroy = 10;
            } else {
                e.blocks_to_destroy = 0;
                e.cubes_per_block_size = false;
                e.lines_to_add = 3;
                e.cubes_flat = 40;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 4: Tsunami (Control)
// Branch A: Wide (clear N targeted blocks; L5 = clear all of targeted size)
// Branch B: Target (clear N targeted rows)
// -----------------------------------------------------------------------------
fn tsunami_effect(level: u8, branch_id: u8) -> ActiveEffect {
    let mut e: ActiveEffect = Default::default();
    match level {
        1 => { e.blocks_to_clear = 1; },
        2 => { e.blocks_to_clear = 2; },
        3 => {
            if branch_id == 0 {
                // A — Wide: 3 blocks
                e.blocks_to_clear = 3;
            } else {
                // B — Target: 1 row
                e.rows_to_clear = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.blocks_to_clear = 5;
            } else {
                e.rows_to_clear = 2;
            }
        },
        5 => {
            if branch_id == 0 {
                // Clear all blocks of targeted size
                e.clear_by_size = true;
            } else {
                e.rows_to_clear = 3;
            }
        },
        _ => {},
    }
    e
}

// =============================================================================
// Passive Skill Effect Tables (IDs 5-12)
// =============================================================================

// -----------------------------------------------------------------------------
// ID 5: Rhythm (Tempo)
// Branch A: Acceleration (lower threshold)
// Branch B: Stability (higher combo_add per proc)
// -----------------------------------------------------------------------------
fn rhythm_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.rhythm_streak_threshold = 12; e.rhythm_combo_add = 1; },
        2 => { e.rhythm_streak_threshold = 10; e.rhythm_combo_add = 1; },
        3 => {
            if branch_id == 0 {
                // A — Acceleration: every 8 → +1
                e.rhythm_streak_threshold = 8;
                e.rhythm_combo_add = 1;
            } else {
                // B — Stability: every 10 → +2
                e.rhythm_streak_threshold = 10;
                e.rhythm_combo_add = 2;
            }
        },
        4 => {
            if branch_id == 0 {
                e.rhythm_streak_threshold = 6;
                e.rhythm_combo_add = 1;
            } else {
                e.rhythm_streak_threshold = 10;
                e.rhythm_combo_add = 3;
            }
        },
        5 => {
            if branch_id == 0 {
                e.rhythm_streak_threshold = 4;
                e.rhythm_combo_add = 1;
            } else {
                e.rhythm_streak_threshold = 10;
                e.rhythm_combo_add = 4;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 6: Cascade Mastery (Tempo)
// Branch A: Amplify (high depth threshold, big combo)
// Branch B: Extend (low depth threshold, moderate combo)
// -----------------------------------------------------------------------------
fn cascade_mastery_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.cascade_depth_threshold = 5; e.cascade_combo_add = 1; },
        2 => { e.cascade_depth_threshold = 4; e.cascade_combo_add = 1; },
        3 => {
            if branch_id == 0 {
                // A — Amplify: depth >= 4 → +2
                e.cascade_depth_threshold = 4;
                e.cascade_combo_add = 2;
            } else {
                // B — Extend: depth >= 3 → +1
                e.cascade_depth_threshold = 3;
                e.cascade_combo_add = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.cascade_depth_threshold = 4;
                e.cascade_combo_add = 3;
            } else {
                e.cascade_depth_threshold = 2;
                e.cascade_combo_add = 1;
            }
        },
        5 => {
            if branch_id == 0 {
                e.cascade_depth_threshold = 4;
                e.cascade_combo_add = 4;
            } else {
                e.cascade_depth_threshold = 2;
                e.cascade_combo_add = 2;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 7: Overdrive (Scaling)
// Branch A: Amplify (maximum charge throughput)
// Branch B: Overflow (starting charges + steady cadence)
// -----------------------------------------------------------------------------
fn overdrive_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.overdrive_cadence = 4; e.overdrive_starting_charges = 0; },
        2 => { e.overdrive_cadence = 3; e.overdrive_starting_charges = 0; },
        3 => {
            if branch_id == 0 {
                // A — Amplify: cadence 2
                e.overdrive_cadence = 2;
                e.overdrive_starting_charges = 0;
            } else {
                // B — Overflow: cadence 3, +1 starting
                e.overdrive_cadence = 3;
                e.overdrive_starting_charges = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.overdrive_cadence = 2;
                e.overdrive_starting_charges = 1;
            } else {
                e.overdrive_cadence = 3;
                e.overdrive_starting_charges = 2;
            }
        },
        5 => {
            if branch_id == 0 {
                // Cadence every 1 level!
                e.overdrive_cadence = 1;
                e.overdrive_starting_charges = 0;
            } else {
                e.overdrive_cadence = 2;
                e.overdrive_starting_charges = 2;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 8: Endgame Focus (Scaling)
// Branch A: Deep End (per-level scaling: +X score per level cleared)
// Branch B: Smooth Ramp (flat score above level threshold)
// -----------------------------------------------------------------------------
fn endgame_focus_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => {
            // +1 score at level start on levels >= 10
            e.endgame_score = 1;
            e.endgame_min_level = 10;
        },
        2 => {
            // +2 score on levels >= 20
            e.endgame_score = 2;
            e.endgame_min_level = 20;
        },
        3 => {
            if branch_id == 0 {
                // A — Deep End: +0.2 per level cleared (stored as x10 = 2)
                e.endgame_per_level_x10 = 2;
                e.endgame_min_level = 0; // always active
            } else {
                // B — Smooth Ramp: +5 on levels >= 25
                e.endgame_score = 5;
                e.endgame_min_level = 25;
            }
        },
        4 => {
            if branch_id == 0 {
                e.endgame_per_level_x10 = 3;
                e.endgame_min_level = 0;
            } else {
                e.endgame_score = 10;
                e.endgame_min_level = 30;
            }
        },
        5 => {
            if branch_id == 0 {
                e.endgame_per_level_x10 = 5;
                e.endgame_min_level = 0;
            } else {
                e.endgame_score = 20;
                e.endgame_min_level = 40;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 9: High Stakes (Risk)
// Branch A: Edge (high threshold, high cubes)
// Branch B: Threshold (lower threshold, moderate cubes)
// -----------------------------------------------------------------------------
fn high_stakes_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.high_stakes_height = 9; e.high_stakes_cubes = 1; },
        2 => { e.high_stakes_height = 8; e.high_stakes_cubes = 1; },
        3 => {
            if branch_id == 0 {
                // A — Edge: height >= 8, +3 cubes
                e.high_stakes_height = 8;
                e.high_stakes_cubes = 3;
            } else {
                // B — Threshold: height >= 7, +1 cube
                e.high_stakes_height = 7;
                e.high_stakes_cubes = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.high_stakes_height = 8;
                e.high_stakes_cubes = 5;
            } else {
                e.high_stakes_height = 6;
                e.high_stakes_cubes = 1;
            }
        },
        5 => {
            if branch_id == 0 {
                e.high_stakes_height = 8;
                e.high_stakes_cubes = 10;
            } else {
                e.high_stakes_height = 5;
                e.high_stakes_cubes = 1;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 10: Gambit (Risk)
// Branch A: Survivor (high threshold, high cubes)
// Branch B: Momentum (lower threshold, moderate cubes)
// -----------------------------------------------------------------------------
fn gambit_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.gambit_height = 9; e.gambit_cubes = 3; },
        2 => { e.gambit_height = 9; e.gambit_cubes = 5; },
        3 => {
            if branch_id == 0 {
                // A — Survivor: height >= 9, +10 cubes
                e.gambit_height = 9;
                e.gambit_cubes = 10;
            } else {
                // B — Momentum: height >= 8, +5 cubes
                e.gambit_height = 8;
                e.gambit_cubes = 5;
            }
        },
        4 => {
            if branch_id == 0 {
                e.gambit_height = 9;
                e.gambit_cubes = 15;
            } else {
                e.gambit_height = 7;
                e.gambit_cubes = 5;
            }
        },
        5 => {
            if branch_id == 0 {
                e.gambit_height = 9;
                e.gambit_cubes = 30;
            } else {
                e.gambit_height = 6;
                e.gambit_cubes = 5;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 11: Structural Integrity (Control)
// Branch A: Aggressive (high threshold, many extra rows)
// Branch B: Safe (lower threshold, +1 extra row)
// -----------------------------------------------------------------------------
fn structural_integrity_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.si_height = 9; e.si_extra_rows = 1; },
        2 => { e.si_height = 8; e.si_extra_rows = 1; },
        3 => {
            if branch_id == 0 {
                // A — Aggressive: height >= 8, +2 extra rows
                e.si_height = 8;
                e.si_extra_rows = 2;
            } else {
                // B — Safe: height >= 7, +1 extra row
                e.si_height = 7;
                e.si_extra_rows = 1;
            }
        },
        4 => {
            if branch_id == 0 {
                e.si_height = 8;
                e.si_extra_rows = 3;
            } else {
                e.si_height = 6;
                e.si_extra_rows = 1;
            }
        },
        5 => {
            if branch_id == 0 {
                e.si_height = 8;
                e.si_extra_rows = 4;
            } else {
                e.si_height = 5;
                e.si_extra_rows = 1;
            }
        },
        _ => {},
    }
    e
}

// -----------------------------------------------------------------------------
// ID 12: Grid Harmony (Control)
// Branch A: Stabilize (every clear, lower threshold at higher levels)
// Branch B: Precision (next clear only, more rows removed)
// -----------------------------------------------------------------------------
fn grid_harmony_effect(level: u8, branch_id: u8) -> PassiveEffect {
    let mut e: PassiveEffect = Default::default();
    match level {
        1 => { e.gh_height = 9; e.gh_extra_rows = 1; e.gh_every_clear = false; },
        2 => { e.gh_height = 8; e.gh_extra_rows = 1; e.gh_every_clear = false; },
        3 => {
            if branch_id == 0 {
                // A — Stabilize: height >= 8, every clear +1
                e.gh_height = 8;
                e.gh_extra_rows = 1;
                e.gh_every_clear = true;
            } else {
                // B — Precision: height >= 8, next clear +2
                e.gh_height = 8;
                e.gh_extra_rows = 2;
                e.gh_every_clear = false;
            }
        },
        4 => {
            if branch_id == 0 {
                e.gh_height = 7;
                e.gh_extra_rows = 1;
                e.gh_every_clear = true;
            } else {
                e.gh_height = 8;
                e.gh_extra_rows = 3;
                e.gh_every_clear = false;
            }
        },
        5 => {
            if branch_id == 0 {
                e.gh_height = 6;
                e.gh_extra_rows = 1;
                e.gh_every_clear = true;
            } else {
                e.gh_height = 8;
                e.gh_extra_rows = 4;
                e.gh_every_clear = false;
            }
        },
        _ => {},
    }
    e
}


#[cfg(test)]
mod tests {
    use super::{
        ActiveEffect, PassiveEffect, SkillIds, active_effect_for_skill,
        get_branch_id_for_skill, get_passive_effects, passive_effect_for_skill,
    };
    use zkube::helpers::packing::{
        RunData, RunDataHelpersTrait, RunDataPackingTrait, SkillInfo,
        SkillTreeDataPackingTrait,
    };

    // =========================================================================
    // Active skills — grouped by archetype
    // =========================================================================

    #[test]
    fn test_tempo_skills() {
        // --- ComboSurge L1 ---
        let e = active_effect_for_skill(SkillIds::COMBO_SURGE, 1, 0);
        assert!(e.combo_add == 1, "ComboSurge L1 should add 1 combo");
        assert!(!e.combo_surge_flow, "L1 should not have flow");

        // --- ComboSurge Branch A L5 ---
        let e = active_effect_for_skill(SkillIds::COMBO_SURGE, 5, 0);
        assert!(e.combo_add == 7, "ComboSurge L5A should add 7 combo");
        assert!(!e.combo_surge_flow, "Branch A should not have flow");

        // --- ComboSurge Branch B L3 ---
        let e = active_effect_for_skill(SkillIds::COMBO_SURGE, 3, 1);
        assert!(e.combo_surge_flow, "Branch B L3 should set flow");
        assert!(e.combo_surge_flow_depth == 1, "Flow depth should be 1");

        // --- Rhythm L1 (passive) ---
        let e = passive_effect_for_skill(SkillIds::RHYTHM, 1, 0);
        assert!(e.rhythm_streak_threshold == 12, "Rhythm L1 threshold should be 12");
        assert!(e.rhythm_combo_add == 1, "Rhythm L1 combo_add should be 1");
    }

    #[test]
    fn test_scaling_skills() {
        // --- Momentum L1 ---
        let e = active_effect_for_skill(SkillIds::MOMENTUM_SCALING, 1, 0);
        assert!(e.score_per_zone == 1, "Momentum L1 should have score_per_zone=1");

        // --- Overdrive L1 ---
        let e = passive_effect_for_skill(SkillIds::OVERDRIVE, 1, 0);
        assert!(e.overdrive_cadence == 4, "Overdrive L1 cadence should be 4");
        assert!(e.overdrive_starting_charges == 0, "Overdrive L1 should have 0 starting charges");

        // --- Overdrive Branch A L5 ---
        let e = passive_effect_for_skill(SkillIds::OVERDRIVE, 5, 0);
        assert!(e.overdrive_cadence == 1, "Overdrive L5A cadence should be 1 (every level)");

        // --- Overdrive Branch B L5 ---
        let e = passive_effect_for_skill(SkillIds::OVERDRIVE, 5, 1);
        assert!(e.overdrive_cadence == 2, "Overdrive L5B cadence should be 2");
        assert!(e.overdrive_starting_charges == 2, "Overdrive L5B should have 2 starting charges");

        // --- Endgame Focus L1 ---
        let e = passive_effect_for_skill(SkillIds::ENDGAME_FOCUS, 1, 0);
        assert!(e.endgame_score == 1, "Endgame L1 score should be 1");
        assert!(e.endgame_min_level == 10, "Endgame L1 min_level should be 10");

        // --- Endgame Focus Branch A L3 (Deep End) ---
        let e = passive_effect_for_skill(SkillIds::ENDGAME_FOCUS, 3, 0);
        assert!(e.endgame_per_level_x10 == 2, "Deep End L3 should be 2 (=0.2 per level)");
        assert!(e.endgame_min_level == 0, "Deep End should have min_level 0");
    }

    #[test]
    fn test_risk_skills() {
        // --- Gambit L1 ---
        let e = passive_effect_for_skill(SkillIds::GAMBIT, 1, 0);
        assert!(e.gambit_height == 9, "Gambit L1 height should be 9");
        assert!(e.gambit_cubes == 3, "Gambit L1 cubes should be 3");

        // --- Gambit Branch B L5 (Momentum) ---
        let e = passive_effect_for_skill(SkillIds::GAMBIT, 5, 1);
        assert!(e.gambit_height == 6, "Gambit L5B height should be 6");
        assert!(e.gambit_cubes == 5, "Gambit L5B cubes should be 5");

        // --- High Stakes L1 ---
        let e = passive_effect_for_skill(SkillIds::HIGH_STAKES, 1, 0);
        assert!(e.high_stakes_height == 9, "HS L1 height should be 9");
        assert!(e.high_stakes_cubes == 1, "HS L1 cubes should be 1");
    }

    #[test]
    fn test_control_skills() {
        // --- Harvest L1 ---
        let e = active_effect_for_skill(SkillIds::HARVEST, 1, 0);
        assert!(e.blocks_to_destroy == 2, "Harvest L1 should destroy 2 blocks");
        assert!(e.cubes_per_block_size, "Harvest L1 should earn cubes per block size");

        // --- Harvest Branch B L3 (Injection) ---
        let e = active_effect_for_skill(SkillIds::HARVEST, 3, 1);
        assert!(e.lines_to_add == 1, "Injection L3B should add 1 line");
        assert!(e.cubes_flat == 10, "Injection L3B should give 10 flat cubes");

        // --- Tsunami L1 ---
        let e = active_effect_for_skill(SkillIds::TSUNAMI, 1, 0);
        assert!(e.blocks_to_clear == 1, "Tsunami L1 should clear 1 block");
        assert!(e.rows_to_clear == 0, "Tsunami L1 should not clear rows");

        // --- Tsunami Branch B L3 (Row Clear) ---
        let e = active_effect_for_skill(SkillIds::TSUNAMI, 3, 1);
        assert!(e.rows_to_clear == 1, "Tsunami L3B should clear 1 row");
        assert!(e.blocks_to_clear == 0, "Tsunami L3B should not clear individual blocks");

        // --- Structural Integrity L1 ---
        let e = passive_effect_for_skill(SkillIds::STRUCTURAL_INTEGRITY, 1, 0);
        assert!(e.si_height == 9, "SI L1 height should be 9");
        assert!(e.si_extra_rows == 1, "SI L1 extra_rows should be 1");

        // --- Grid Harmony L1 ---
        let e = passive_effect_for_skill(SkillIds::GRID_HARMONY, 1, 0);
        assert!(e.gh_height == 9, "GH L1 height should be 9");
        assert!(e.gh_extra_rows == 1, "GH L1 extra_rows should be 1");
        assert!(!e.gh_every_clear, "GH L1 should not be every_clear");
    }

    #[test]
    fn test_unknown_active_returns_default() {
        let e = active_effect_for_skill(99, 3, 0);
        assert!(e.combo_add == 0, "Unknown skill should return default");
        assert!(e.score_add == 0, "Unknown skill should return default");
    }

    // =========================================================================
    // Aggregation tests
    // =========================================================================

    #[test]
    fn test_get_passive_effects() {
        // --- Empty loadout ---
        let data = RunDataPackingTrait::new();
        let passives = get_passive_effects(@data);
        assert!(passives.rhythm_streak_threshold == 0, "Empty loadout should have no rhythm");
        assert!(passives.overdrive_cadence == 0, "Empty loadout should have no overdrive");
        assert!(passives.gambit_height == 0, "Empty loadout should have no gambit");

        // --- Single passive (Overdrive L2) ---
        let mut data = RunDataPackingTrait::new();
        data.add_skill(7, 2, 0);
        let passives = get_passive_effects(@data);
        assert!(passives.overdrive_cadence == 3, "Should pick up Overdrive L2 cadence=3");

        // --- Active skills ignored ---
        let mut data = RunDataPackingTrait::new();
        data.add_skill(1, 3, 0);
        let passives = get_passive_effects(@data);
        assert!(passives.rhythm_streak_threshold == 0, "Active should not affect passives");
        assert!(passives.overdrive_cadence == 0, "Active should not affect passives");

        // --- Multiple passives ---
        let mut data = RunDataPackingTrait::new();
        data.add_skill(5, 1, 0);
        data.add_skill(10, 2, 0);
        data.add_skill(7, 1, 0);
        let passives = get_passive_effects(@data);
        assert!(passives.rhythm_streak_threshold == 12, "Should have Rhythm L1");
        assert!(passives.gambit_height == 9, "Should have Gambit L2 height=9");
        assert!(passives.gambit_cubes == 5, "Should have Gambit L2 cubes=5");
        assert!(passives.overdrive_cadence == 4, "Should have Overdrive L1 cadence=4");
    }

    // =========================================================================
    // Branch ID lookup
    // =========================================================================

    #[test]
    fn test_get_branch_id_for_skill() {
        let mut tree = SkillTreeDataPackingTrait::new();
        tree.set_skill(3, SkillInfo { level: 4, branch_chosen: true, branch_id: 1 });
        tree.set_skill(7, SkillInfo { level: 5, branch_chosen: true, branch_id: 0 });
        let packed = tree.pack();

        assert!(get_branch_id_for_skill(packed, 3) == 1, "Skill 3 should be branch B");
        assert!(get_branch_id_for_skill(packed, 7) == 0, "Skill 7 should be branch A");
        assert!(get_branch_id_for_skill(packed, 1) == 0, "Unset skill should be branch 0");
    }
}