use zkube::helpers::packing::{RunData, RunDataHelpersTrait, SkillTreeDataPackingTrait};

mod SkillIds {
    pub const COMBO: u8 = 1;
    pub const SCORE: u8 = 2;
    pub const HARVEST: u8 = 3;
    pub const WAVE: u8 = 4;
    pub const SUPPLY: u8 = 5;
    pub const TEMPO: u8 = 6;
    pub const FORTUNE: u8 = 7;
    pub const SURGE: u8 = 8;
    pub const CATALYST: u8 = 9;
    pub const RESILIENCE: u8 = 10;
    pub const FOCUS: u8 = 11;
    pub const EXPANSION: u8 = 12;
    pub const MOMENTUM: u8 = 13;
    pub const ADRENALINE: u8 = 14;
    pub const LEGACY: u8 = 15;
}

mod BranchIds {
    pub const NONE: u8 = 0;
    pub const A: u8 = 1;
    pub const B: u8 = 2;
}

const SLOT_NOT_FOUND: u8 = 255;
const MAX_ACTIVE_SLOTS: u8 = 5;
const MAX_SKILL_ID: u8 = 15;

#[derive(Copy, Drop, Debug, Serde)]
pub struct BonusEffect {
    pub combo_add: u8,
    pub score_add: u16,
    pub cube_reward_per_block: u8,
    pub rows_to_clear: u8,
    pub lines_to_add: u8,
    pub bonus_score_per_line: u8,
    pub chance_no_consume_num: u8,
    pub chance_no_consume_den: u8,
    pub free_move_on_proc: u8,
    pub score_doubles_under_moves: u8,
    pub score_triples: bool,
    pub harvest_adjacent: u8,
    pub harvest_size_range: u8,
    pub harvest_only_small: bool,
    pub harvest_score_per_block: u8,
    pub harvest_triggers_gravity: bool,
    pub harvest_free_moves: u8,
    pub wave_score_per_block: u8,
    pub wave_free_moves: u8,
    pub wave_combo_add: u8,
    pub wave_chance_no_consume: bool,
    pub wave_cube_per_row: u8,
    pub wave_auto_add_line: bool,
    pub supply_difficulty_reduction: u8,
    pub supply_very_easy: bool,
    pub supply_score_per_line: u8,
    pub supply_cube_reward: u8,
    pub supply_free_moves: u8,
    pub combo_add_from_score: u8,
    pub cube_per_use: u8,
    pub score_div10_as_cubes: bool,
    pub charge_all_bonus: bool,
}

#[derive(Copy, Drop, Debug, Default, Serde)]
pub struct WorldEffects {
    pub extra_max_moves: u16,
    pub tempo_refund_every_n_clears: u8,
    pub tempo_refund_score: u8,
    pub fortune_flat_cubes: u8,
    pub fortune_cubes_per_n_lines: u8,
    pub fortune_lines_divisor: u8,
    pub fortune_star_multiplier_3: u8,
    pub fortune_star_multiplier_2: u8,
    pub surge_score_percent: u16,
    pub surge_per_level_percent: u8,
    pub catalyst_threshold_reduction: u8,
    pub catalyst_bonus_cubes: u8,
    pub catalyst_bonus_score: u8,
    pub catalyst_free_moves_on_combo: u8,
    pub catalyst_double_cubes_above: u8,
    pub catalyst_triple_cubes_above: u8,
    pub resilience_free_moves: u8,
    pub resilience_regen_on_clear: u8,
    pub resilience_regen_amount: u8,
    pub resilience_score_per_free: u8,
    pub focus_bonus_progress: u8,
    pub focus_score_on_progress: u8,
    pub focus_prefill_percent: u8,
    pub focus_cube_per_constraint: u8,
    pub expansion_difficulty_reduction: u8,
    pub expansion_score_per_line: u8,
    pub expansion_guaranteed_gaps: u8,
    pub expansion_cube_per_level: u8,
    pub expansion_cube_per_10_lines: u8,
    pub momentum_score_per_consec: u8,
    pub momentum_streak_cube_threshold: u8,
    pub momentum_streak_cubes: u8,
    pub momentum_move_refund: u8,
    pub momentum_combo_on_streak: u8,
    pub momentum_streak_clear_rows: u8,
    pub adrenaline_row_threshold: u8,
    pub adrenaline_score_per_clear: u8,
    pub adrenaline_cubes_per_clear: u8,
    pub adrenaline_combo_multiplier: u8,
    pub adrenaline_free_moves: u8,
    pub adrenaline_free_moves_threshold: u8,
    pub legacy_score_per_n_levels: u8,
    pub legacy_level_divisor: u8,
    pub legacy_cube_per_n_levels: u8,
    pub legacy_cube_level_divisor: u8,
    pub legacy_score_per_unique_skill: u8,
    pub legacy_free_moves_per_10: u8,
}

fn empty_bonus_effect() -> BonusEffect {
    BonusEffect {
        combo_add: 0,
        score_add: 0,
        cube_reward_per_block: 0,
        rows_to_clear: 0,
        lines_to_add: 0,
        bonus_score_per_line: 0,
        chance_no_consume_num: 0,
        chance_no_consume_den: 0,
        free_move_on_proc: 0,
        score_doubles_under_moves: 0,
        score_triples: false,
        harvest_adjacent: 0,
        harvest_size_range: 0,
        harvest_only_small: false,
        harvest_score_per_block: 0,
        harvest_triggers_gravity: false,
        harvest_free_moves: 0,
        wave_score_per_block: 0,
        wave_free_moves: 0,
        wave_combo_add: 0,
        wave_chance_no_consume: false,
        wave_cube_per_row: 0,
        wave_auto_add_line: false,
        supply_difficulty_reduction: 0,
        supply_very_easy: false,
        supply_score_per_line: 0,
        supply_cube_reward: 0,
        supply_free_moves: 0,
        combo_add_from_score: 0,
        cube_per_use: 0,
        score_div10_as_cubes: false,
        charge_all_bonus: false,
    }
}

fn empty_world_effects() -> WorldEffects {
    WorldEffects {
        extra_max_moves: 0,
        tempo_refund_every_n_clears: 0,
        tempo_refund_score: 0,
        fortune_flat_cubes: 0,
        fortune_cubes_per_n_lines: 0,
        fortune_lines_divisor: 0,
        fortune_star_multiplier_3: 0,
        fortune_star_multiplier_2: 0,
        surge_score_percent: 0,
        surge_per_level_percent: 0,
        catalyst_threshold_reduction: 0,
        catalyst_bonus_cubes: 0,
        catalyst_bonus_score: 0,
        catalyst_free_moves_on_combo: 0,
        catalyst_double_cubes_above: 0,
        catalyst_triple_cubes_above: 0,
        resilience_free_moves: 0,
        resilience_regen_on_clear: 0,
        resilience_regen_amount: 0,
        resilience_score_per_free: 0,
        focus_bonus_progress: 0,
        focus_score_on_progress: 0,
        focus_prefill_percent: 0,
        focus_cube_per_constraint: 0,
        expansion_difficulty_reduction: 0,
        expansion_score_per_line: 0,
        expansion_guaranteed_gaps: 0,
        expansion_cube_per_level: 0,
        expansion_cube_per_10_lines: 0,
        momentum_score_per_consec: 0,
        momentum_streak_cube_threshold: 0,
        momentum_streak_cubes: 0,
        momentum_move_refund: 0,
        momentum_combo_on_streak: 0,
        momentum_streak_clear_rows: 0,
        adrenaline_row_threshold: 0,
        adrenaline_score_per_clear: 0,
        adrenaline_cubes_per_clear: 0,
        adrenaline_combo_multiplier: 0,
        adrenaline_free_moves: 0,
        adrenaline_free_moves_threshold: 0,
        legacy_score_per_n_levels: 0,
        legacy_level_divisor: 0,
        legacy_cube_per_n_levels: 0,
        legacy_cube_level_divisor: 0,
        legacy_score_per_unique_skill: 0,
        legacy_free_moves_per_10: 0,
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

fn merge_world_effects(mut base: WorldEffects, add: WorldEffects) -> WorldEffects {
    base.extra_max_moves += add.extra_max_moves;
    base.tempo_refund_every_n_clears += add.tempo_refund_every_n_clears;
    base.tempo_refund_score += add.tempo_refund_score;
    base.fortune_flat_cubes += add.fortune_flat_cubes;
    base.fortune_cubes_per_n_lines += add.fortune_cubes_per_n_lines;
    base.fortune_lines_divisor += add.fortune_lines_divisor;
    base.fortune_star_multiplier_3 += add.fortune_star_multiplier_3;
    base.fortune_star_multiplier_2 += add.fortune_star_multiplier_2;
    base.surge_score_percent += add.surge_score_percent;
    base.surge_per_level_percent += add.surge_per_level_percent;
    base.catalyst_threshold_reduction += add.catalyst_threshold_reduction;
    base.catalyst_bonus_cubes += add.catalyst_bonus_cubes;
    base.catalyst_bonus_score += add.catalyst_bonus_score;
    base.catalyst_free_moves_on_combo += add.catalyst_free_moves_on_combo;
    base.catalyst_double_cubes_above += add.catalyst_double_cubes_above;
    base.catalyst_triple_cubes_above += add.catalyst_triple_cubes_above;
    base.resilience_free_moves += add.resilience_free_moves;
    base.resilience_regen_on_clear += add.resilience_regen_on_clear;
    base.resilience_regen_amount += add.resilience_regen_amount;
    base.resilience_score_per_free += add.resilience_score_per_free;
    base.focus_bonus_progress += add.focus_bonus_progress;
    base.focus_score_on_progress += add.focus_score_on_progress;
    base.focus_prefill_percent += add.focus_prefill_percent;
    base.focus_cube_per_constraint += add.focus_cube_per_constraint;
    base.expansion_difficulty_reduction += add.expansion_difficulty_reduction;
    base.expansion_score_per_line += add.expansion_score_per_line;
    base.expansion_guaranteed_gaps += add.expansion_guaranteed_gaps;
    base.expansion_cube_per_level += add.expansion_cube_per_level;
    base.expansion_cube_per_10_lines += add.expansion_cube_per_10_lines;
    base.momentum_score_per_consec += add.momentum_score_per_consec;
    base.momentum_streak_cube_threshold += add.momentum_streak_cube_threshold;
    base.momentum_streak_cubes += add.momentum_streak_cubes;
    base.momentum_move_refund += add.momentum_move_refund;
    base.momentum_combo_on_streak += add.momentum_combo_on_streak;
    base.momentum_streak_clear_rows += add.momentum_streak_clear_rows;
    base.adrenaline_row_threshold += add.adrenaline_row_threshold;
    base.adrenaline_score_per_clear += add.adrenaline_score_per_clear;
    base.adrenaline_cubes_per_clear += add.adrenaline_cubes_per_clear;
    base.adrenaline_combo_multiplier += add.adrenaline_combo_multiplier;
    base.adrenaline_free_moves += add.adrenaline_free_moves;
    base.adrenaline_free_moves_threshold += add.adrenaline_free_moves_threshold;
    base.legacy_score_per_n_levels += add.legacy_score_per_n_levels;
    base.legacy_level_divisor += add.legacy_level_divisor;
    base.legacy_cube_per_n_levels += add.legacy_cube_per_n_levels;
    base.legacy_cube_level_divisor += add.legacy_cube_level_divisor;
    base.legacy_score_per_unique_skill += add.legacy_score_per_unique_skill;
    base.legacy_free_moves_per_10 += add.legacy_free_moves_per_10;
    base
}

pub fn bonus_effect_for_skill(skill_id: u8, level: u8, branch_id: u8) -> BonusEffect {
    match skill_id {
        1 => combo_effect(level, branch_id),
        2 => score_effect(level, branch_id),
        3 => harvest_effect(level, branch_id),
        4 => wave_effect(level, branch_id),
        5 => supply_effect(level, branch_id),
        _ => empty_bonus_effect(),
    }
}

pub fn combo_effect(level: u8, branch_id: u8) -> BonusEffect {
    let mut effect = empty_bonus_effect();

    match level {
        0 => effect.combo_add = 1,
        1 => effect.combo_add = 2,
        2 => effect.combo_add = 3,
        3 => effect.combo_add = 4,
        4 => effect.combo_add = 5,
        5 => {
            match branch_id {
                1 => {
                    effect.combo_add = 6;
                    effect.bonus_score_per_line = 1;
                },
                2 => {
                    effect.combo_add = 5;
                    effect.chance_no_consume_num = 1;
                    effect.chance_no_consume_den = 3;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.combo_add = 7;
                    effect.bonus_score_per_line = 2;
                },
                2 => {
                    effect.combo_add = 6;
                    effect.chance_no_consume_num = 1;
                    effect.chance_no_consume_den = 3;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.combo_add = 8;
                    effect.bonus_score_per_line = 3;
                },
                2 => {
                    effect.combo_add = 7;
                    effect.chance_no_consume_num = 1;
                    effect.chance_no_consume_den = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.combo_add = 9;
                    effect.bonus_score_per_line = 4;
                },
                2 => {
                    effect.combo_add = 8;
                    effect.chance_no_consume_num = 1;
                    effect.chance_no_consume_den = 2;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.combo_add = 10;
                    effect.bonus_score_per_line = 5;
                    effect.cube_per_use = 1;
                },
                2 => {
                    effect.combo_add = 9;
                    effect.chance_no_consume_num = 2;
                    effect.chance_no_consume_den = 3;
                    effect.free_move_on_proc = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.combo_add = 12;
                    effect.bonus_score_per_line = 6;
                    effect.charge_all_bonus = true;
                },
                2 => {
                    effect.combo_add = 10;
                    effect.chance_no_consume_num = 1;
                    effect.chance_no_consume_den = 1;
                    effect.free_move_on_proc = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn score_effect(level: u8, branch_id: u8) -> BonusEffect {
    let mut effect = empty_bonus_effect();

    match level {
        0 => effect.score_add = 5,
        1 => effect.score_add = 8,
        2 => effect.score_add = 12,
        3 => effect.score_add = 18,
        4 => effect.score_add = 25,
        5 => {
            match branch_id {
                1 => {
                    effect.score_add = 30;
                    effect.combo_add_from_score = 1;
                },
                2 => {
                    effect.score_add = 30;
                    effect.score_doubles_under_moves = 5;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.score_add = 35;
                    effect.combo_add_from_score = 1;
                },
                2 => {
                    effect.score_add = 35;
                    effect.score_doubles_under_moves = 5;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.score_add = 40;
                    effect.combo_add_from_score = 2;
                },
                2 => {
                    effect.score_add = 42;
                    effect.score_doubles_under_moves = 7;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.score_add = 50;
                    effect.combo_add_from_score = 2;
                },
                2 => {
                    effect.score_add = 50;
                    effect.score_doubles_under_moves = 7;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.score_add = 60;
                    effect.combo_add_from_score = 3;
                    effect.cube_per_use = 1;
                },
                2 => {
                    effect.score_add = 60;
                    effect.score_doubles_under_moves = 10;
                    effect.cube_per_use = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.score_add = 80;
                    effect.combo_add_from_score = 4;
                    effect.score_div10_as_cubes = true;
                },
                2 => {
                    effect.score_add = 80;
                    effect.score_doubles_under_moves = 10;
                    effect.score_triples = true;
                    effect.cube_per_use = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn harvest_effect(level: u8, branch_id: u8) -> BonusEffect {
    let mut effect = empty_bonus_effect();

    match level {
        0 => effect.cube_reward_per_block = 1,
        1 => {
            effect.cube_reward_per_block = 1;
            effect.harvest_adjacent = 2;
        },
        2 => effect.cube_reward_per_block = 2,
        3 => {
            effect.cube_reward_per_block = 2;
            effect.harvest_adjacent = 3;
        },
        4 => effect.cube_reward_per_block = 3,
        5 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 3;
                    effect.harvest_size_range = 1;
                },
                2 => {
                    effect.cube_reward_per_block = 4;
                    effect.harvest_only_small = true;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 4;
                    effect.harvest_size_range = 1;
                },
                2 => {
                    effect.cube_reward_per_block = 5;
                    effect.harvest_only_small = true;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 5;
                    effect.harvest_size_range = 1;
                },
                2 => {
                    effect.cube_reward_per_block = 6;
                    effect.harvest_only_small = true;
                    effect.harvest_score_per_block = 1;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 6;
                    effect.harvest_size_range = 1;
                    effect.harvest_score_per_block = 1;
                },
                2 => {
                    effect.cube_reward_per_block = 8;
                    effect.harvest_only_small = true;
                    effect.harvest_score_per_block = 2;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 8;
                    effect.harvest_size_range = 1;
                    effect.harvest_score_per_block = 2;
                    effect.harvest_triggers_gravity = true;
                },
                2 => {
                    effect.cube_reward_per_block = 10;
                    effect.harvest_only_small = true;
                    effect.harvest_score_per_block = 3;
                    effect.harvest_free_moves = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.cube_reward_per_block = 10;
                    effect.harvest_size_range = 2;
                    effect.harvest_score_per_block = 3;
                    effect.harvest_triggers_gravity = true;
                },
                2 => {
                    effect.cube_reward_per_block = 15;
                    effect.harvest_only_small = true;
                    effect.harvest_score_per_block = 5;
                    effect.harvest_free_moves = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn wave_effect(level: u8, branch_id: u8) -> BonusEffect {
    let mut effect = empty_bonus_effect();

    match level {
        0 => effect.rows_to_clear = 1,
        1 => {
            effect.rows_to_clear = 1;
            effect.wave_score_per_block = 1;
        },
        2 => effect.rows_to_clear = 2,
        3 => {
            effect.rows_to_clear = 2;
            effect.wave_score_per_block = 2;
        },
        4 => effect.rows_to_clear = 3,
        5 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 3;
                    effect.wave_score_per_block = 3;
                },
                2 => {
                    effect.rows_to_clear = 2;
                    effect.wave_free_moves = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 4;
                    effect.wave_score_per_block = 3;
                },
                2 => {
                    effect.rows_to_clear = 2;
                    effect.wave_free_moves = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 4;
                    effect.wave_score_per_block = 4;
                },
                2 => {
                    effect.rows_to_clear = 3;
                    effect.wave_free_moves = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 5;
                    effect.wave_score_per_block = 5;
                },
                2 => {
                    effect.rows_to_clear = 3;
                    effect.wave_free_moves = 3;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 5;
                    effect.wave_score_per_block = 6;
                    effect.wave_cube_per_row = 1;
                },
                2 => {
                    effect.rows_to_clear = 4;
                    effect.wave_free_moves = 3;
                    effect.wave_combo_add = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.rows_to_clear = 6;
                    effect.wave_score_per_block = 8;
                    effect.wave_cube_per_row = 2;
                    effect.wave_auto_add_line = true;
                },
                2 => {
                    effect.rows_to_clear = 5;
                    effect.wave_free_moves = 4;
                    effect.wave_combo_add = 2;
                    effect.wave_chance_no_consume = true;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn supply_effect(level: u8, branch_id: u8) -> BonusEffect {
    let mut effect = empty_bonus_effect();

    match level {
        0 => effect.lines_to_add = 1,
        1 => {
            effect.lines_to_add = 1;
            effect.supply_difficulty_reduction = 1;
        },
        2 => effect.lines_to_add = 2,
        3 => {
            effect.lines_to_add = 2;
            effect.supply_difficulty_reduction = 1;
        },
        4 => effect.lines_to_add = 3,
        5 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 3;
                    effect.supply_difficulty_reduction = 2;
                },
                2 => {
                    effect.lines_to_add = 3;
                    effect.supply_score_per_line = 2;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 4;
                    effect.supply_difficulty_reduction = 2;
                },
                2 => {
                    effect.lines_to_add = 3;
                    effect.supply_score_per_line = 3;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 4;
                    effect.supply_difficulty_reduction = 3;
                },
                2 => {
                    effect.lines_to_add = 4;
                    effect.supply_score_per_line = 4;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 5;
                    effect.supply_difficulty_reduction = 3;
                },
                2 => {
                    effect.lines_to_add = 4;
                    effect.supply_score_per_line = 5;
                    effect.supply_cube_reward = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 5;
                    effect.supply_very_easy = true;
                    effect.supply_free_moves = 1;
                },
                2 => {
                    effect.lines_to_add = 5;
                    effect.supply_score_per_line = 6;
                    effect.supply_cube_reward = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.lines_to_add = 6;
                    effect.supply_very_easy = true;
                    effect.supply_free_moves = 2;
                },
                2 => {
                    effect.lines_to_add = 6;
                    effect.supply_score_per_line = 8;
                    effect.supply_cube_reward = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn world_effect_for_skill(skill_id: u8, level: u8, branch_id: u8) -> WorldEffects {
    match skill_id {
        6 => tempo_effect(level, branch_id),
        7 => fortune_effect(level, branch_id),
        8 => surge_effect(level, branch_id),
        9 => catalyst_effect(level, branch_id),
        10 => resilience_effect(level, branch_id),
        11 => focus_effect(level, branch_id),
        12 => expansion_effect(level, branch_id),
        13 => momentum_effect(level, branch_id),
        14 => adrenaline_effect(level, branch_id),
        15 => legacy_effect(level, branch_id),
        _ => empty_world_effects(),
    }
}

pub fn tempo_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.extra_max_moves = 1,
        1 => effect.extra_max_moves = 2,
        2 => effect.extra_max_moves = 3,
        3 => effect.extra_max_moves = 4,
        4 => effect.extra_max_moves = 5,
        5 => {
            match branch_id {
                1 => effect.extra_max_moves = 7,
                2 => {
                    effect.extra_max_moves = 5;
                    effect.tempo_refund_every_n_clears = 3;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => effect.extra_max_moves = 9,
                2 => {
                    effect.extra_max_moves = 5;
                    effect.tempo_refund_every_n_clears = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => effect.extra_max_moves = 11,
                2 => {
                    effect.extra_max_moves = 6;
                    effect.tempo_refund_every_n_clears = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => effect.extra_max_moves = 14,
                2 => {
                    effect.extra_max_moves = 7;
                    effect.tempo_refund_every_n_clears = 2;
                    effect.tempo_refund_score = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => effect.extra_max_moves = 18,
                2 => {
                    effect.extra_max_moves = 8;
                    effect.tempo_refund_every_n_clears = 2;
                    effect.tempo_refund_score = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => effect.extra_max_moves = 25,
                2 => {
                    effect.extra_max_moves = 10;
                    effect.tempo_refund_every_n_clears = 1;
                    effect.tempo_refund_score = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn fortune_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    if level <= 10 {
        effect.fortune_star_multiplier_3 = 1;
        effect.fortune_star_multiplier_2 = 1;
    }

    match level {
        0 => effect.fortune_flat_cubes = 1,
        1 => effect.fortune_flat_cubes = 1,
        2 => effect.fortune_flat_cubes = 2,
        3 => effect.fortune_flat_cubes = 2,
        4 => effect.fortune_flat_cubes = 3,
        5 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 4;
                    effect.fortune_cubes_per_n_lines = 1;
                    effect.fortune_lines_divisor = 5;
                },
                2 => {
                    effect.fortune_flat_cubes = 3;
                    effect.fortune_star_multiplier_3 = 2;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 5;
                    effect.fortune_cubes_per_n_lines = 1;
                    effect.fortune_lines_divisor = 4;
                },
                2 => {
                    effect.fortune_flat_cubes = 4;
                    effect.fortune_star_multiplier_3 = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 6;
                    effect.fortune_cubes_per_n_lines = 1;
                    effect.fortune_lines_divisor = 3;
                },
                2 => {
                    effect.fortune_flat_cubes = 5;
                    effect.fortune_star_multiplier_3 = 2;
                    effect.fortune_star_multiplier_2 = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 8;
                    effect.fortune_cubes_per_n_lines = 1;
                    effect.fortune_lines_divisor = 3;
                },
                2 => {
                    effect.fortune_flat_cubes = 6;
                    effect.fortune_star_multiplier_3 = 2;
                    effect.fortune_star_multiplier_2 = 2;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 10;
                    effect.fortune_cubes_per_n_lines = 2;
                    effect.fortune_lines_divisor = 3;
                },
                2 => {
                    effect.fortune_flat_cubes = 8;
                    effect.fortune_star_multiplier_3 = 3;
                    effect.fortune_star_multiplier_2 = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.fortune_flat_cubes = 15;
                    effect.fortune_cubes_per_n_lines = 3;
                    effect.fortune_lines_divisor = 2;
                },
                2 => {
                    effect.fortune_flat_cubes = 12;
                    effect.fortune_star_multiplier_3 = 4;
                    effect.fortune_star_multiplier_2 = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn surge_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.surge_score_percent = 5,
        1 => effect.surge_score_percent = 8,
        2 => effect.surge_score_percent = 12,
        3 => effect.surge_score_percent = 16,
        4 => effect.surge_score_percent = 20,
        5 => {
            match branch_id {
                1 => effect.surge_score_percent = 25,
                2 => {
                    effect.surge_score_percent = 20;
                    effect.surge_per_level_percent = 2;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => effect.surge_score_percent = 30,
                2 => {
                    effect.surge_score_percent = 20;
                    effect.surge_per_level_percent = 3;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => effect.surge_score_percent = 35,
                2 => {
                    effect.surge_score_percent = 20;
                    effect.surge_per_level_percent = 4;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => effect.surge_score_percent = 40,
                2 => {
                    effect.surge_score_percent = 22;
                    effect.surge_per_level_percent = 5;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => effect.surge_score_percent = 50,
                2 => {
                    effect.surge_score_percent = 25;
                    effect.surge_per_level_percent = 6;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => effect.surge_score_percent = 75,
                2 => {
                    effect.surge_score_percent = 30;
                    effect.surge_per_level_percent = 8;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn catalyst_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.catalyst_threshold_reduction = 1,
        1 => effect.catalyst_threshold_reduction = 1,
        2 => {
            effect.catalyst_threshold_reduction = 1;
            effect.catalyst_bonus_cubes = 1;
        },
        3 => {
            effect.catalyst_threshold_reduction = 1;
            effect.catalyst_bonus_cubes = 1;
        },
        4 => effect.catalyst_threshold_reduction = 2,
        5 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 2;
                    effect.catalyst_bonus_cubes = 2;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 2;
                    effect.catalyst_bonus_score = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 2;
                    effect.catalyst_bonus_cubes = 3;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 2;
                    effect.catalyst_bonus_score = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 3;
                    effect.catalyst_bonus_cubes = 3;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 2;
                    effect.catalyst_bonus_score = 3;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 3;
                    effect.catalyst_bonus_cubes = 4;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 3;
                    effect.catalyst_bonus_score = 4;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 3;
                    effect.catalyst_bonus_cubes = 5;
                    effect.catalyst_double_cubes_above = 6;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 3;
                    effect.catalyst_bonus_score = 5;
                    effect.catalyst_free_moves_on_combo = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.catalyst_threshold_reduction = 4;
                    effect.catalyst_bonus_cubes = 7;
                    effect.catalyst_triple_cubes_above = 5;
                },
                2 => {
                    effect.catalyst_threshold_reduction = 4;
                    effect.catalyst_bonus_score = 7;
                    effect.catalyst_free_moves_on_combo = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn resilience_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.resilience_free_moves = 1,
        1 => effect.resilience_free_moves = 1,
        2 => effect.resilience_free_moves = 2,
        3 => effect.resilience_free_moves = 2,
        4 => effect.resilience_free_moves = 3,
        5 => {
            match branch_id {
                1 => effect.resilience_free_moves = 4,
                2 => {
                    effect.resilience_free_moves = 3;
                    effect.resilience_regen_on_clear = 3;
                    effect.resilience_regen_amount = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => effect.resilience_free_moves = 5,
                2 => {
                    effect.resilience_free_moves = 3;
                    effect.resilience_regen_on_clear = 2;
                    effect.resilience_regen_amount = 1;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => effect.resilience_free_moves = 6,
                2 => {
                    effect.resilience_free_moves = 4;
                    effect.resilience_regen_on_clear = 2;
                    effect.resilience_regen_amount = 1;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => effect.resilience_free_moves = 7,
                2 => {
                    effect.resilience_free_moves = 4;
                    effect.resilience_regen_on_clear = 1;
                    effect.resilience_regen_amount = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => effect.resilience_free_moves = 9,
                2 => {
                    effect.resilience_free_moves = 5;
                    effect.resilience_regen_on_clear = 1;
                    effect.resilience_regen_amount = 1;
                    effect.resilience_score_per_free = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => effect.resilience_free_moves = 12,
                2 => {
                    effect.resilience_free_moves = 6;
                    effect.resilience_regen_on_clear = 1;
                    effect.resilience_regen_amount = 2;
                    effect.resilience_score_per_free = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn focus_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.focus_bonus_progress = 1,
        1 => effect.focus_bonus_progress = 1,
        2 => {
            effect.focus_bonus_progress = 1;
            effect.focus_score_on_progress = 1;
        },
        3 => effect.focus_bonus_progress = 2,
        4 => {
            effect.focus_bonus_progress = 2;
            effect.focus_score_on_progress = 2;
        },
        5 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 3;
                    effect.focus_score_on_progress = 3;
                },
                2 => {
                    effect.focus_bonus_progress = 2;
                    effect.focus_prefill_percent = 25;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 3;
                    effect.focus_score_on_progress = 4;
                },
                2 => {
                    effect.focus_bonus_progress = 2;
                    effect.focus_prefill_percent = 30;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 4;
                    effect.focus_score_on_progress = 5;
                },
                2 => {
                    effect.focus_bonus_progress = 3;
                    effect.focus_prefill_percent = 35;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 4;
                    effect.focus_score_on_progress = 6;
                },
                2 => {
                    effect.focus_bonus_progress = 3;
                    effect.focus_prefill_percent = 40;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 5;
                    effect.focus_score_on_progress = 8;
                    effect.focus_cube_per_constraint = 1;
                },
                2 => {
                    effect.focus_bonus_progress = 4;
                    effect.focus_prefill_percent = 50;
                    effect.focus_cube_per_constraint = 1;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.focus_bonus_progress = 6;
                    effect.focus_score_on_progress = 10;
                    effect.focus_cube_per_constraint = 2;
                },
                2 => {
                    effect.focus_bonus_progress = 5;
                    effect.focus_prefill_percent = 60;
                    effect.focus_cube_per_constraint = 2;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn expansion_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.expansion_difficulty_reduction = 1,
        1 => effect.expansion_difficulty_reduction = 1,
        2 => {
            effect.expansion_difficulty_reduction = 1;
            effect.expansion_score_per_line = 1;
        },
        3 => effect.expansion_difficulty_reduction = 2,
        4 => {
            effect.expansion_difficulty_reduction = 2;
            effect.expansion_score_per_line = 1;
        },
        5 => {
            match branch_id {
                1 => effect.expansion_difficulty_reduction = 3,
                2 => {
                    effect.expansion_difficulty_reduction = 2;
                    effect.expansion_guaranteed_gaps = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.expansion_difficulty_reduction = 3;
                    effect.expansion_score_per_line = 2;
                },
                2 => {
                    effect.expansion_difficulty_reduction = 2;
                    effect.expansion_guaranteed_gaps = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => effect.expansion_difficulty_reduction = 4,
                2 => {
                    effect.expansion_difficulty_reduction = 3;
                    effect.expansion_guaranteed_gaps = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.expansion_difficulty_reduction = 4;
                    effect.expansion_score_per_line = 3;
                },
                2 => {
                    effect.expansion_difficulty_reduction = 3;
                    effect.expansion_guaranteed_gaps = 2;
                    effect.expansion_cube_per_10_lines = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.expansion_difficulty_reduction = 5;
                    effect.expansion_score_per_line = 4;
                    effect.expansion_cube_per_level = 1;
                },
                2 => {
                    effect.expansion_difficulty_reduction = 3;
                    effect.expansion_guaranteed_gaps = 3;
                    effect.expansion_cube_per_10_lines = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.expansion_difficulty_reduction = 6;
                    effect.expansion_score_per_line = 5;
                    effect.expansion_cube_per_level = 2;
                },
                2 => {
                    effect.expansion_difficulty_reduction = 4;
                    effect.expansion_guaranteed_gaps = 4;
                    effect.expansion_cube_per_10_lines = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn momentum_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => effect.momentum_score_per_consec = 1,
        1 => effect.momentum_score_per_consec = 1,
        2 => effect.momentum_score_per_consec = 2,
        3 => effect.momentum_score_per_consec = 2,
        4 => effect.momentum_score_per_consec = 3,
        5 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 4;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 1;
                },
                2 => {
                    effect.momentum_score_per_consec = 3;
                    effect.momentum_move_refund = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 5;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 1;
                },
                2 => {
                    effect.momentum_score_per_consec = 4;
                    effect.momentum_move_refund = 1;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 6;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 2;
                },
                2 => {
                    effect.momentum_score_per_consec = 5;
                    effect.momentum_move_refund = 1;
                    effect.momentum_combo_on_streak = 1;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 8;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 2;
                },
                2 => {
                    effect.momentum_score_per_consec = 6;
                    effect.momentum_move_refund = 2;
                    effect.momentum_combo_on_streak = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 10;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 3;
                    effect.momentum_streak_clear_rows = 1;
                },
                2 => {
                    effect.momentum_score_per_consec = 8;
                    effect.momentum_move_refund = 2;
                    effect.momentum_combo_on_streak = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.momentum_score_per_consec = 12;
                    effect.momentum_streak_cube_threshold = 3;
                    effect.momentum_streak_cubes = 4;
                    effect.momentum_streak_clear_rows = 2;
                },
                2 => {
                    effect.momentum_score_per_consec = 10;
                    effect.momentum_move_refund = 3;
                    effect.momentum_combo_on_streak = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn adrenaline_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => {
            effect.adrenaline_row_threshold = 7;
            effect.adrenaline_score_per_clear = 2;
        },
        1 => {
            effect.adrenaline_row_threshold = 7;
            effect.adrenaline_score_per_clear = 3;
        },
        2 => {
            effect.adrenaline_row_threshold = 7;
            effect.adrenaline_score_per_clear = 4;
        },
        3 => {
            effect.adrenaline_row_threshold = 7;
            effect.adrenaline_score_per_clear = 5;
        },
        4 => {
            effect.adrenaline_row_threshold = 7;
            effect.adrenaline_score_per_clear = 6;
            effect.adrenaline_cubes_per_clear = 1;
        },
        5 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 8;
                    effect.adrenaline_cubes_per_clear = 2;
                },
                2 => {
                    effect.adrenaline_row_threshold = 8;
                    effect.adrenaline_score_per_clear = 6;
                    effect.adrenaline_combo_multiplier = 2;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 10;
                    effect.adrenaline_cubes_per_clear = 2;
                },
                2 => {
                    effect.adrenaline_row_threshold = 8;
                    effect.adrenaline_score_per_clear = 7;
                    effect.adrenaline_combo_multiplier = 2;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 12;
                    effect.adrenaline_cubes_per_clear = 3;
                },
                2 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 8;
                    effect.adrenaline_combo_multiplier = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 15;
                    effect.adrenaline_cubes_per_clear = 3;
                },
                2 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 10;
                    effect.adrenaline_combo_multiplier = 2;
                    effect.adrenaline_free_moves = 1;
                    effect.adrenaline_free_moves_threshold = 7;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 20;
                    effect.adrenaline_cubes_per_clear = 4;
                    effect.adrenaline_free_moves = 1;
                    effect.adrenaline_free_moves_threshold = 8;
                },
                2 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 12;
                    effect.adrenaline_combo_multiplier = 3;
                    effect.adrenaline_free_moves = 2;
                    effect.adrenaline_free_moves_threshold = 7;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 25;
                    effect.adrenaline_cubes_per_clear = 6;
                    effect.adrenaline_free_moves = 2;
                    effect.adrenaline_free_moves_threshold = 8;
                },
                2 => {
                    effect.adrenaline_row_threshold = 7;
                    effect.adrenaline_score_per_clear = 15;
                    effect.adrenaline_combo_multiplier = 4;
                    effect.adrenaline_free_moves = 3;
                    effect.adrenaline_free_moves_threshold = 7;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn legacy_effect(level: u8, branch_id: u8) -> WorldEffects {
    let mut effect = empty_world_effects();

    match level {
        0 => {
            effect.legacy_score_per_n_levels = 1;
            effect.legacy_level_divisor = 5;
        },
        1 => {
            effect.legacy_score_per_n_levels = 1;
            effect.legacy_level_divisor = 4;
        },
        2 => {
            effect.legacy_score_per_n_levels = 1;
            effect.legacy_level_divisor = 3;
        },
        3 => {
            effect.legacy_score_per_n_levels = 2;
            effect.legacy_level_divisor = 3;
        },
        4 => {
            effect.legacy_score_per_n_levels = 2;
            effect.legacy_level_divisor = 3;
            effect.legacy_cube_per_n_levels = 1;
            effect.legacy_cube_level_divisor = 10;
        },
        5 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 3;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_cube_per_n_levels = 1;
                    effect.legacy_cube_level_divisor = 5;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 2;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 1;
                },
                _ => {},
            };
        },
        6 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 3;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_cube_per_n_levels = 2;
                    effect.legacy_cube_level_divisor = 5;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 2;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 1;
                },
                _ => {},
            };
        },
        7 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 4;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_cube_per_n_levels = 2;
                    effect.legacy_cube_level_divisor = 5;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 3;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 2;
                },
                _ => {},
            };
        },
        8 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 5;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_cube_per_n_levels = 3;
                    effect.legacy_cube_level_divisor = 5;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 3;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 2;
                    effect.legacy_free_moves_per_10 = 1;
                },
                _ => {},
            };
        },
        9 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 6;
                    effect.legacy_level_divisor = 2;
                    effect.legacy_cube_per_n_levels = 4;
                    effect.legacy_cube_level_divisor = 5;
                    effect.legacy_free_moves_per_10 = 1;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 4;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 3;
                    effect.legacy_free_moves_per_10 = 2;
                },
                _ => {},
            };
        },
        10 => {
            match branch_id {
                1 => {
                    effect.legacy_score_per_n_levels = 8;
                    effect.legacy_level_divisor = 2;
                    effect.legacy_cube_per_n_levels = 6;
                    effect.legacy_cube_level_divisor = 5;
                    effect.legacy_free_moves_per_10 = 2;
                },
                2 => {
                    effect.legacy_score_per_n_levels = 5;
                    effect.legacy_level_divisor = 3;
                    effect.legacy_score_per_unique_skill = 4;
                    effect.legacy_free_moves_per_10 = 3;
                },
                _ => {},
            };
        },
        _ => {},
    };

    effect
}

pub fn extract_world_skill_effect(run_data: @RunData, skill_id: u8, branch_id: u8) -> WorldEffects {
    if skill_id < 6 || skill_id > 15 {
        return empty_world_effects();
    }

    let slot = run_data.find_skill_slot(skill_id);
    if slot == SLOT_NOT_FOUND {
        return empty_world_effects();
    }

    let level = run_data.get_slot_level(slot);
    world_effect_for_skill(skill_id, level, branch_id)
}

pub fn get_tempo_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 6, branch_id)
}

pub fn get_fortune_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 7, branch_id)
}

pub fn get_surge_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 8, branch_id)
}

pub fn get_catalyst_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 9, branch_id)
}

pub fn get_resilience_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 10, branch_id)
}

pub fn get_focus_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 11, branch_id)
}

pub fn get_expansion_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 12, branch_id)
}

pub fn get_momentum_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 13, branch_id)
}

pub fn get_adrenaline_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 14, branch_id)
}

pub fn get_legacy_effect(run_data: @RunData, branch_id: u8) -> WorldEffects {
    extract_world_skill_effect(run_data, 15, branch_id)
}

pub fn get_world_effects(run_data: @RunData, branch_ids: Span<u8>) -> WorldEffects {
    aggregate_world_effects(run_data, branch_ids)
}

pub fn aggregate_world_effects(run_data: @RunData, branch_ids: Span<u8>) -> WorldEffects {
    let mut combined = empty_world_effects();

    let mut slot_count = *run_data.active_slot_count;
    if slot_count > MAX_ACTIVE_SLOTS {
        slot_count = MAX_ACTIVE_SLOTS;
    }

    let mut slot: u8 = 0;
    loop {
        if slot >= slot_count {
            break;
        }

        let skill_id = run_data.get_slot_skill(slot);
        if skill_id >= 6 && skill_id <= 15 {
            let level = run_data.get_slot_level(slot);
            let branch_id = branch_for_skill(branch_ids, skill_id);
            let skill_effect = world_effect_for_skill(skill_id, level, branch_id);
            combined = merge_world_effects(combined, skill_effect);
        }

        slot += 1;
    };

    combined
}


/// Get the skill_effects branch_id (0=none, 1=A, 2=B) for a run_data skill_id (1-15).
/// Converts from SkillTreeData (0-indexed, branch_id 0=A/1=B) to skill_effects convention.
pub fn get_branch_id_for_skill(skill_data: felt252, run_data_skill_id: u8) -> u8 {
    if run_data_skill_id == 0 || run_data_skill_id > MAX_SKILL_ID {
        return 0;
    }
    let tree_data = SkillTreeDataPackingTrait::unpack(skill_data);
    let tree_skill_id = run_data_skill_id - 1; // Convert to 0-indexed
    let info = tree_data.get_skill(tree_skill_id);
    if info.branch_chosen {
        info.branch_id + 1 // SkillTreeData: 0=A,1=B -> skill_effects: 1=A,2=B
    } else {
        0
    }
}

/// Build an Array<u8> of branch_ids (0=none, 1=A, 2=B) for all 15 skills from skill_data.
/// Index i corresponds to skill_id i+1 (0-indexed array for 1-indexed skill IDs).
pub fn build_branch_ids(skill_data: felt252) -> Array<u8> {
    let tree_data = SkillTreeDataPackingTrait::unpack(skill_data);
    let mut ids = ArrayTrait::new();
    let mut i: u8 = 0;
    loop {
        if i >= 15 {
            break;
        }
        let info = tree_data.get_skill(i);
        if info.branch_chosen {
            ids.append(info.branch_id + 1);
        } else {
            ids.append(0);
        }
        i += 1;
    };
    ids
}
