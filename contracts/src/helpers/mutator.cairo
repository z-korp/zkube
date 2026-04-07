use zkube::models::mutator::MutatorDef;
use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;

mod MutatorDefaults {
    pub const BIAS_ZERO: u8 = 128;
    pub const MULTIPLIER_NEUTRAL_X100: u16 = 100;
}

#[generate_trait]
pub impl MutatorEffectsImpl of MutatorEffectsTrait {
    /// Neutral mutator values (used for mutator_id = 0 and missing records).
    fn neutral(mutator_id: u8) -> MutatorDef {
        MutatorDef {
            mutator_id,
            name: 0,
            zone_id: 0,
            moves_modifier: MutatorDefaults::BIAS_ZERO,
            ratio_modifier: MutatorDefaults::BIAS_ZERO,
            difficulty_offset: MutatorDefaults::BIAS_ZERO,
            combo_score_mult_x100: MutatorDefaults::MULTIPLIER_NEUTRAL_X100,
            star_threshold_modifier: MutatorDefaults::BIAS_ZERO,
            endless_ramp_mult_x100: MutatorDefaults::MULTIPLIER_NEUTRAL_X100,
            line_clear_bonus: 0,
            perfect_clear_bonus: 0,
            starting_rows: 0,
            bonus_1_type: 0,
            bonus_1_trigger_type: 0,
            bonus_1_trigger_threshold: 0,
            bonus_1_starting_charges: 0,
            bonus_2_type: 0,
            bonus_2_trigger_type: 0,
            bonus_2_trigger_threshold: 0,
            bonus_2_starting_charges: 0,
            bonus_3_type: 0,
            bonus_3_trigger_type: 0,
            bonus_3_trigger_threshold: 0,
            bonus_3_starting_charges: 0,
        }
    }

    /// Normalize a mutator record read from storage.
    ///
    /// Missing Dojo records read as zero-values. We treat zero-valued modifier fields
    /// as "unset" and map them to neutral defaults.
    fn normalize(mutator_id: u8, mut mutator_def: MutatorDef) -> MutatorDef {
        if mutator_id == 0 {
            return Self::neutral(0);
        }

        mutator_def.mutator_id = mutator_id;

        if mutator_def.moves_modifier == 0 {
            mutator_def.moves_modifier = MutatorDefaults::BIAS_ZERO;
        }
        if mutator_def.ratio_modifier == 0 {
            mutator_def.ratio_modifier = MutatorDefaults::BIAS_ZERO;
        }
        if mutator_def.difficulty_offset == 0 {
            mutator_def.difficulty_offset = MutatorDefaults::BIAS_ZERO;
        }
        if mutator_def.combo_score_mult_x100 == 0 {
            mutator_def.combo_score_mult_x100 = MutatorDefaults::MULTIPLIER_NEUTRAL_X100;
        }
        if mutator_def.star_threshold_modifier == 0 {
            mutator_def.star_threshold_modifier = MutatorDefaults::BIAS_ZERO;
        }
        if mutator_def.endless_ramp_mult_x100 == 0 {
            mutator_def.endless_ramp_mult_x100 = MutatorDefaults::MULTIPLIER_NEUTRAL_X100;
        }

        mutator_def
    }

    /// Apply mutator-driven level modifiers.
    fn apply_mutator_to_level(mutator_def: @MutatorDef, ref config: LevelConfig) {
        config
            .max_moves =
                apply_bias_offset_u16(config.max_moves, *mutator_def.moves_modifier, 1, 65535);
        config
            .points_required =
                apply_bias_percent_u16(
                    config.points_required, *mutator_def.ratio_modifier, 1, 65535,
                );
        config
            .difficulty =
                apply_difficulty_offset(config.difficulty, *mutator_def.difficulty_offset);
    }

    /// Apply mutator-driven score multiplier.
    fn apply_mutator_to_score(mutator_def: @MutatorDef, base_score: u16) -> u16 {
        let mut multiplier_x100 = *mutator_def.combo_score_mult_x100;
        if multiplier_x100 == 0 {
            multiplier_x100 = MutatorDefaults::MULTIPLIER_NEUTRAL_X100;
        }
        if multiplier_x100 == MutatorDefaults::MULTIPLIER_NEUTRAL_X100 {
            return base_score;
        }

        let adjusted: u32 = (base_score.into() * multiplier_x100.into()) / 100_u32;
        if adjusted > 65535 {
            65535
        } else {
            adjusted.try_into().unwrap()
        }
    }

    /// Apply mutator-driven endless ramp multiplier to score used in difficulty checks.
    fn apply_endless_ramp(mutator_def: @MutatorDef, total_score: u32) -> u32 {
        let mut ramp_x100 = *mutator_def.endless_ramp_mult_x100;
        if ramp_x100 == 0 {
            ramp_x100 = MutatorDefaults::MULTIPLIER_NEUTRAL_X100;
        }
        if ramp_x100 == MutatorDefaults::MULTIPLIER_NEUTRAL_X100 {
            return total_score;
        }

        let adjusted: u64 = (total_score.into() * ramp_x100.into()) / 100_u64;
        if adjusted > 0xFFFFFFFF {
            0xFFFFFFFF
        } else {
            adjusted.try_into().unwrap()
        }
    }

    /// Flat score bonus per cleared line.
    fn get_line_clear_bonus(mutator_def: @MutatorDef) -> u8 {
        *mutator_def.line_clear_bonus
    }

    /// Score bonus when grid is fully cleared.
    fn get_perfect_clear_bonus(mutator_def: @MutatorDef) -> u8 {
        *mutator_def.perfect_clear_bonus
    }

    /// Starting filled rows override. 0 keeps the default (4 rows).
    fn get_starting_rows(mutator_def: @MutatorDef) -> u8 {
        let rows = *mutator_def.starting_rows;
        if rows == 0 {
            4
        } else {
            rows
        }
    }
}

fn decode_bias(value: u8) -> (bool, u8) {
    if value >= MutatorDefaults::BIAS_ZERO {
        (true, value - MutatorDefaults::BIAS_ZERO)
    } else {
        (false, MutatorDefaults::BIAS_ZERO - value)
    }
}

fn apply_bias_offset_u16(value: u16, modifier: u8, min_value: u16, max_value: u16) -> u16 {
    let (is_positive, magnitude) = decode_bias(modifier);
    if magnitude == 0 {
        return value;
    }

    if is_positive {
        let added: u32 = value.into() + magnitude.into();
        if added > max_value.into() {
            max_value
        } else {
            let candidate: u16 = added.try_into().unwrap();
            if candidate < min_value {
                min_value
            } else {
                candidate
            }
        }
    } else {
        let magnitude_u16: u16 = magnitude.into();
        if value <= magnitude_u16 {
            min_value
        } else {
            let candidate = value - magnitude_u16;
            if candidate < min_value {
                min_value
            } else {
                candidate
            }
        }
    }
}

fn apply_bias_percent_u16(value: u16, modifier: u8, min_value: u16, max_value: u16) -> u16 {
    let (is_positive, magnitude) = decode_bias(modifier);
    if magnitude == 0 {
        return value;
    }

    let magnitude_u16: u16 = magnitude.into();
    let factor_x100: u16 = if is_positive {
        100 + magnitude_u16
    } else if magnitude_u16 >= 100 {
        1
    } else {
        100 - magnitude_u16
    };

    let adjusted: u32 = (value.into() * factor_x100.into()) / 100_u32;
    if adjusted < min_value.into() {
        min_value
    } else if adjusted > max_value.into() {
        max_value
    } else {
        adjusted.try_into().unwrap()
    }
}

fn difficulty_to_tier(difficulty: Difficulty) -> u8 {
    match difficulty {
        Difficulty::VeryEasy => 0,
        Difficulty::Easy => 1,
        Difficulty::Medium => 2,
        Difficulty::MediumHard => 3,
        Difficulty::Hard => 4,
        Difficulty::VeryHard => 5,
        Difficulty::Expert => 6,
        Difficulty::Master => 7,
        _ => 0,
    }
}

fn tier_to_difficulty(tier: u8) -> Difficulty {
    match tier {
        0 => Difficulty::VeryEasy,
        1 => Difficulty::Easy,
        2 => Difficulty::Medium,
        3 => Difficulty::MediumHard,
        4 => Difficulty::Hard,
        5 => Difficulty::VeryHard,
        6 => Difficulty::Expert,
        _ => Difficulty::Master,
    }
}

fn apply_difficulty_offset(base_difficulty: Difficulty, modifier: u8) -> Difficulty {
    let (is_positive, magnitude) = decode_bias(modifier);
    if magnitude == 0 {
        return base_difficulty;
    }

    let tier = difficulty_to_tier(base_difficulty);
    if is_positive {
        let advanced: u16 = tier.into() + magnitude.into();
        let next_tier: u8 = if advanced > 7 {
            7
        } else {
            advanced.try_into().unwrap()
        };
        tier_to_difficulty(next_tier)
    } else {
        if magnitude >= tier {
            tier_to_difficulty(0)
        } else {
            tier_to_difficulty(tier - magnitude)
        }
    }
}
