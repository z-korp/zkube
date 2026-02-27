use zkube::helpers::packing::{RunData, RunDataHelpersTrait, SkillTreeDataPackingTrait};

pub mod SkillIds {
    pub const COMBO_SURGE: u8 = 1;
    pub const MOMENTUM: u8 = 2;
    pub const HARVEST: u8 = 3;
    pub const TSUNAMI: u8 = 4;
    pub const RHYTHM: u8 = 5;
    pub const CASCADE_MASTERY: u8 = 6;
    pub const OVERDRIVE: u8 = 7;
    pub const ENDGAME_FOCUS: u8 = 8;
    pub const HIGH_STAKES: u8 = 9;
    pub const GAMBIT: u8 = 10;
    pub const STRUCTURAL_INTEGRITY: u8 = 11;
    pub const GRID_HARMONY: u8 = 12;
}

pub mod BranchIds {
    pub const NONE: u8 = 0;
    pub const A: u8 = 1;
    pub const B: u8 = 2;
}

pub const SLOT_NOT_FOUND: u8 = 255;
pub const MAX_ACTIVE_SLOTS: u8 = 3;
pub const MAX_SKILL_ID: u8 = 12;

#[derive(Copy, Drop, Debug, Default, Serde)]
pub struct ActiveEffect {
    pub combo_add: u8,
    pub combo_surge_flow: bool,
    pub combo_surge_flow_depth: u8,
    pub score_add: u16,
    pub score_per_zone: u8,
    pub blocks_to_destroy: u8,
    pub cubes_per_block_size: bool,
    pub lines_to_add: u8,
    pub cubes_flat: u16,
    pub blocks_to_clear: u8,
    pub clear_by_size: bool,
    pub rows_to_clear: u8,
}

#[derive(Copy, Drop, Debug, Default, Serde)]
pub struct PassiveEffect {
    pub rhythm_streak_threshold: u8,
    pub rhythm_combo_add: u8,
    pub cascade_depth_threshold: u8,
    pub cascade_combo_add: u8,
    pub overdrive_cadence: u8,
    pub overdrive_starting_charges: u8,
    pub endgame_score: u16,
    pub endgame_min_level: u8,
    pub endgame_per_level_x10: u8,
    pub high_stakes_height: u8,
    pub high_stakes_cubes: u8,
    pub gambit_height: u8,
    pub gambit_cubes: u16,
    pub si_height: u8,
    pub si_extra_rows: u8,
    pub gh_height: u8,
    pub gh_extra_rows: u8,
    pub gh_every_clear: bool,
}

pub fn active_effect_for_skill(skill_id: u8, level: u8, branch_id: u8) -> ActiveEffect {
    match skill_id {
        1 => combo_surge_effect(level, branch_id),
        2 => momentum_effect(level, branch_id),
        3 => harvest_effect(level, branch_id),
        4 => tsunami_effect(level, branch_id),
        _ => Default::default(),
    }
}

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

fn active(
    combo_add: u8,
    combo_surge_flow: bool,
    combo_surge_flow_depth: u8,
    score_add: u16,
    score_per_zone: u8,
    blocks_to_destroy: u8,
    cubes_per_block_size: bool,
    lines_to_add: u8,
    cubes_flat: u16,
    blocks_to_clear: u8,
    clear_by_size: bool,
    rows_to_clear: u8,
) -> ActiveEffect {
    ActiveEffect {
        combo_add,
        combo_surge_flow,
        combo_surge_flow_depth,
        score_add,
        score_per_zone,
        blocks_to_destroy,
        cubes_per_block_size,
        lines_to_add,
        cubes_flat,
        blocks_to_clear,
        clear_by_size,
        rows_to_clear,
    }
}

fn passive(
    rhythm_streak_threshold: u8,
    rhythm_combo_add: u8,
    cascade_depth_threshold: u8,
    cascade_combo_add: u8,
    overdrive_cadence: u8,
    overdrive_starting_charges: u8,
    endgame_score: u16,
    endgame_min_level: u8,
    endgame_per_level_x10: u8,
    high_stakes_height: u8,
    high_stakes_cubes: u8,
    gambit_height: u8,
    gambit_cubes: u16,
    si_height: u8,
    si_extra_rows: u8,
    gh_height: u8,
    gh_extra_rows: u8,
    gh_every_clear: bool,
) -> PassiveEffect {
    PassiveEffect {
        rhythm_streak_threshold,
        rhythm_combo_add,
        cascade_depth_threshold,
        cascade_combo_add,
        overdrive_cadence,
        overdrive_starting_charges,
        endgame_score,
        endgame_min_level,
        endgame_per_level_x10,
        high_stakes_height,
        high_stakes_cubes,
        gambit_height,
        gambit_cubes,
        si_height,
        si_extra_rows,
        gh_height,
        gh_extra_rows,
        gh_every_clear,
    }
}

fn use_branch_b(branch_id: u8) -> bool {
    branch_id == BranchIds::B
}

fn combo_surge_effect(level: u8, branch_id: u8) -> ActiveEffect {
    match level {
        1 => active(1, false, 0, 0, 0, 0, false, 0, 0, 0, false, 0),
        2 => active(2, false, 0, 0, 0, 0, false, 0, 0, 0, false, 0),
        3 => {
            if use_branch_b(branch_id) {
                active(0, true, 1, 0, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(3, false, 0, 0, 0, 0, false, 0, 0, 0, false, 0)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                active(0, true, 2, 0, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(5, false, 0, 0, 0, 0, false, 0, 0, 0, false, 0)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                active(0, true, 4, 0, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(7, false, 0, 0, 0, 0, false, 0, 0, 0, false, 0)
            }
        },
        _ => Default::default(),
    }
}

fn momentum_effect(level: u8, branch_id: u8) -> ActiveEffect {
    match level {
        1 => active(0, false, 0, 0, 1, 0, false, 0, 0, 0, false, 0),
        2 => active(0, false, 0, 0, 2, 0, false, 0, 0, 0, false, 0),
        3 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 5, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(0, false, 0, 0, 3, 0, false, 0, 0, 0, false, 0)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 10, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(0, false, 0, 0, 5, 0, false, 0, 0, 0, false, 0)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 20, 0, 0, false, 0, 0, 0, false, 0)
            } else {
                active(0, false, 0, 0, 10, 0, false, 0, 0, 0, false, 0)
            }
        },
        _ => Default::default(),
    }
}

fn harvest_effect(level: u8, branch_id: u8) -> ActiveEffect {
    match level {
        1 => active(0, false, 0, 0, 0, 2, true, 0, 0, 0, false, 0),
        2 => active(0, false, 0, 0, 0, 3, true, 0, 0, 0, false, 0),
        3 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 1, 10, 0, false, 0)
            } else {
                active(0, false, 0, 0, 0, 5, true, 0, 0, 0, false, 0)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 2, 20, 0, false, 0)
            } else {
                active(0, false, 0, 0, 0, 7, true, 0, 0, 0, false, 0)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 3, 40, 0, false, 0)
            } else {
                active(0, false, 0, 0, 0, 10, true, 0, 0, 0, false, 0)
            }
        },
        _ => Default::default(),
    }
}

fn tsunami_effect(level: u8, branch_id: u8) -> ActiveEffect {
    match level {
        1 => active(0, false, 0, 0, 0, 0, false, 0, 0, 1, false, 0),
        2 => active(0, false, 0, 0, 0, 0, false, 0, 0, 2, false, 0),
        3 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 0, false, 1)
            } else {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 3, false, 0)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 0, false, 2)
            } else {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 5, false, 0)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 0, false, 3)
            } else {
                active(0, false, 0, 0, 0, 0, false, 0, 0, 0, true, 0)
            }
        },
        _ => Default::default(),
    }
}

fn rhythm_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(12, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        2 => passive(10, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(10, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(10, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(10, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn cascade_mastery_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        2 => passive(0, 0, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 4, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn overdrive_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        2 => passive(0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 3, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn endgame_focus_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        2 => passive(0, 0, 0, 0, 0, 0, 2, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 5, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 10, 30, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 20, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn high_stakes_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 0, 0, false),
        2 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 3, 0, 0, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 5, 0, 0, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 0, 0, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 10, 0, 0, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn gambit_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 3, 0, 0, 0, 0, false),
        2 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 5, 0, 0, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 5, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 10, 0, 0, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 5, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 15, 0, 0, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 5, 0, 0, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 30, 0, 0, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn structural_integrity_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1, 0, 0, false),
        2 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1, 0, 0, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 2, 0, 0, false)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 3, 0, 0, false)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 1, 0, 0, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 4, 0, 0, false)
            }
        },
        _ => Default::default(),
    }
}

fn grid_harmony_effect(level: u8, branch_id: u8) -> PassiveEffect {
    match level {
        1 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 1, false),
        2 => passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1, false),
        3 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 2, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 1, true)
            }
        },
        4 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 3, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1, true)
            }
        },
        5 => {
            if use_branch_b(branch_id) {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 4, false)
            } else {
                passive(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 1, true)
            }
        },
        _ => Default::default(),
    }
}

fn branch_for_skill(branch_ids: Span<u8>, skill_id: u8) -> u8 {
    if skill_id == 0 || skill_id > MAX_SKILL_ID {
        0
    } else {
        let index: usize = (skill_id - 1).into();
        if index >= branch_ids.len() {
            0
        } else {
            *branch_ids[index]
        }
    }
}

pub fn build_branch_ids(skill_data: felt252) -> Array<u8> {
    let tree = SkillTreeDataPackingTrait::unpack(skill_data);
    let mut result: Array<u8> = array![];
    let mut i: u8 = 1;
    loop {
        if i > 12 {
            break;
        }
        let info = tree.get_skill(i);
        let branch = if !info.branch_chosen {
            BranchIds::NONE
        } else if info.branch_id == 0 {
            BranchIds::A
        } else {
            BranchIds::B
        };
        result.append(branch);
        i += 1;
    };
    result
}

pub fn get_branch_id_for_skill(skill_data: felt252, skill_id: u8) -> u8 {
    let tree = SkillTreeDataPackingTrait::unpack(skill_data);
    let info = tree.get_skill(skill_id);
    if !info.branch_chosen {
        BranchIds::NONE
    } else if info.branch_id == 0 {
        BranchIds::A
    } else {
        BranchIds::B
    }
}

pub fn merge_passive_effects(mut base: PassiveEffect, add: PassiveEffect) -> PassiveEffect {
    base.rhythm_streak_threshold = if add.rhythm_streak_threshold > 0
        && (base.rhythm_streak_threshold == 0
            || add.rhythm_streak_threshold < base.rhythm_streak_threshold) {
        add.rhythm_streak_threshold
    } else {
        base.rhythm_streak_threshold
    };
    base.rhythm_combo_add = base.rhythm_combo_add + add.rhythm_combo_add;

    base.cascade_depth_threshold = if add.cascade_depth_threshold > 0
        && (base.cascade_depth_threshold == 0
            || add.cascade_depth_threshold < base.cascade_depth_threshold) {
        add.cascade_depth_threshold
    } else {
        base.cascade_depth_threshold
    };
    base.cascade_combo_add = base.cascade_combo_add + add.cascade_combo_add;

    base.overdrive_cadence = if add.overdrive_cadence > 0
        && (base.overdrive_cadence == 0 || add.overdrive_cadence < base.overdrive_cadence) {
        add.overdrive_cadence
    } else {
        base.overdrive_cadence
    };
    base.overdrive_starting_charges =
        base.overdrive_starting_charges + add.overdrive_starting_charges;

    base.endgame_score = base.endgame_score + add.endgame_score;
    base.endgame_min_level = if add.endgame_min_level > 0
        && (base.endgame_min_level == 0 || add.endgame_min_level < base.endgame_min_level) {
        add.endgame_min_level
    } else {
        base.endgame_min_level
    };
    base.endgame_per_level_x10 = base.endgame_per_level_x10 + add.endgame_per_level_x10;

    base.high_stakes_height = if add.high_stakes_height > 0
        && (base.high_stakes_height == 0 || add.high_stakes_height < base.high_stakes_height) {
        add.high_stakes_height
    } else {
        base.high_stakes_height
    };
    base.high_stakes_cubes = base.high_stakes_cubes + add.high_stakes_cubes;

    base.gambit_height = if add.gambit_height > 0
        && (base.gambit_height == 0 || add.gambit_height < base.gambit_height) {
        add.gambit_height
    } else {
        base.gambit_height
    };
    base.gambit_cubes = base.gambit_cubes + add.gambit_cubes;

    base.si_height = if add.si_height > 0 && (base.si_height == 0 || add.si_height < base.si_height)
    {
        add.si_height
    } else {
        base.si_height
    };
    base.si_extra_rows = base.si_extra_rows + add.si_extra_rows;

    base.gh_height = if add.gh_height > 0 && (base.gh_height == 0 || add.gh_height < base.gh_height) {
        add.gh_height
    } else {
        base.gh_height
    };
    base.gh_extra_rows = base.gh_extra_rows + add.gh_extra_rows;
    base.gh_every_clear = base.gh_every_clear || add.gh_every_clear;
    base
}

pub fn get_passive_effects(run_data: @RunData) -> PassiveEffect {
    let mut result: PassiveEffect = Default::default();
    let mut slot: u8 = 0;
    loop {
        if slot >= 3 {
            break;
        }

        let skill_id = run_data.get_slot_skill(slot);
        if skill_id >= 5 && skill_id <= 12 {
            let level = run_data.get_slot_level(slot);
            let branch = run_data.get_slot_branch(slot);
            let effect = passive_effect_for_skill(skill_id, level, branch);
            result = merge_passive_effects(result, effect);
        }

        slot += 1;
    };
    result
}
