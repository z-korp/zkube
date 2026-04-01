use core::hash::HashStateTrait;
/// Level generation helpers
/// Generates deterministic level configurations based on seed and GameSettings
///
/// Key properties:
/// - Same seed + same level = same config
/// - Different seed = different config sequence
/// - Level 50+ caps at max difficulty (survival mode)
/// - Points derived from moves × ratio (0.8 → 1.8), base moves 20→60
/// - Correlated variance keeps difficulty ratio constant
/// - All generation uses GameSettings for configurable game balance

use core::poseidon::{HashState, PoseidonTrait};
use zkube::helpers::boss;
use zkube::helpers::mutator::MutatorEffectsTrait;
use zkube::models::config::{GameSettings, GameSettingsTrait};
use zkube::models::mutator::MutatorDef;
use zkube::types::constraint::{ConstraintType, LevelConstraint, LevelConstraintTrait};
use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;

/// Constants for level generation
mod LevelConstants {
    // Moves scaling (linear 20 → 60)
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;

    // Ratio scaling ×100 for integer math (0.80 → 1.80)
    pub const BASE_RATIO_X100: u16 = 80; // 0.80 points per move at level 1
    pub const MAX_RATIO_X100: u16 = 180; // 1.80 points per move at level 50

    // Correlated variance (consistent ±5% across all levels)
    pub const EARLY_VARIANCE_PERCENT: u16 = 5; // ±5% for levels 1-5
    pub const MID_VARIANCE_PERCENT: u16 = 5; // ±5% for levels 6-25
    pub const LATE_VARIANCE_PERCENT: u16 = 5; // ±5% for levels 26-50

    // Level cap for scaling (survival mode after this)
    pub const LEVEL_CAP: u8 = 50;

    // Constraint none threshold (constraints start from level 5)
    pub const CONSTRAINT_NONE_THRESHOLD: u8 = 4;
}

/// Boss level constants and helpers
/// Zone mode has a single boss at level 10.
pub mod BossLevel {
    /// Check if a level is a boss level
    pub fn is_boss_level(level: u8) -> bool {
        level == 10
    }

    /// Get boss tier (1) for a boss level
    /// Returns 0 if not a boss level
    pub fn get_boss_tier(level: u8) -> u8 {
        match level {
            10 => 1,
            _ => 0,
        }
    }

}

#[generate_trait]
pub impl LevelGenerator of LevelGeneratorTrait {
    /// Generate a complete level configuration from seed, level number, and GameSettings
    /// Uses configurable game balance parameters from settings
    fn generate(
        seed: felt252, level: u8, settings: GameSettings, mutator_def: @MutatorDef,
    ) -> LevelConfig {
        // Derive a level-specific seed for deterministic variance
        let level_seed = Self::derive_level_seed(seed, level);

        let zone_level_cap: u8 = 10;
        let is_endless = level > zone_level_cap;

        let (points_required, max_moves, difficulty) = if !is_endless {
            // Zone progression (1-10): same generation model, but 10-level cap.
            let calc_level = if level > zone_level_cap {
                zone_level_cap
            } else {
                level
            };

            let base_moves = Self::calculate_base_moves_with_cap(
                calc_level, settings.base_moves, settings.max_moves, zone_level_cap,
            );
            let ratio_x100 = Self::calculate_ratio_with_cap(
                calc_level, settings.base_ratio_x100, settings.max_ratio_x100, zone_level_cap,
            );
            let base_points: u16 = ((base_moves.into() * ratio_x100.into()) / 100_u32)
                .try_into()
                .unwrap();

            let variance_percent = settings.get_variance_percent(calc_level);
            let variance_factor = Self::calculate_variance_factor(level_seed, variance_percent.into());

            (
                Self::apply_factor(base_points, variance_factor),
                Self::apply_factor(base_moves, variance_factor),
                settings.get_difficulty_for_level(calc_level),
            )
        } else {
            // Endless (11+): fixed moves at max_moves, ratio escalates by +10 per depth.
            let endless_depth: u16 = (level - zone_level_cap).into();
            let endless_ratio_x100: u16 = settings.max_ratio_x100 + (endless_depth * 10);
            let endless_points: u16 = ((settings.max_moves.into() * endless_ratio_x100.into())
                / 100_u32)
                .try_into()
                .unwrap();

            (endless_points, settings.max_moves, Difficulty::Master)
        };

        // Generate constraints: use boss identity system for boss levels, otherwise normal
        // generation Respect constraints_enabled setting for both boss and regular levels
        let (constraint, constraint_2, constraint_3) = if !settings.are_constraints_enabled() {
            (
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
            )
        } else if BossLevel::is_boss_level(level) {
            // Boss level uses the boss identity system with budget_max
            let boss_id = boss::derive_boss_id(level_seed);
            let (_min_lines, _max_lines, _budget_min, budget_max, _min_times) = settings
                .get_constraint_params_for_difficulty(difficulty);
            let (c1, c2, c3) = boss::generate_boss_constraints(
                boss_id, level, level_seed, budget_max,
            );

            // Zone boss is always dual at level 10.
            let _ = c3;
            (c1, c2, LevelConstraintTrait::none())
        } else {
            // Regular levels: deterministic count-based constraint generation
            Self::generate_constraints_with_settings(
                level_seed, level, difficulty, settings, points_required,
            )
        };

        let mut config = LevelConfig {
            level,
            points_required,
            max_moves,
            difficulty,
            constraint,
            constraint_2,
            constraint_3,
        };

        MutatorEffectsTrait::apply_mutator_to_level(mutator_def, ref config);
        config
    }

    /// Generate the fixed level configuration used by dedicated Endless mode.
    /// Endless mode never completes a level and plays until game-over.
    fn generate_endless_level(seed: felt252, settings: GameSettings) -> LevelConfig {
        let _ = seed;
        let _ = settings;

        LevelConfig {
            level: 1,
            points_required: 0,
            max_moves: 65535,
            difficulty: Difficulty::VeryEasy,
            constraint: LevelConstraintTrait::none(),
            constraint_2: LevelConstraintTrait::none(),
            constraint_3: LevelConstraintTrait::none(),
        }
    }

    /// Returns the difficulty tier for the provided endless total score.
    ///
    /// Reads packed thresholds from `settings.endless_difficulty_thresholds` when configured.
    /// Fallback thresholds: [0, 15, 40, 80, 150, 280, 500, 900].
    fn get_endless_difficulty_for_score(total_score: u32, settings: @GameSettings) -> Difficulty {
        // Packed 8 × u16 thresholds (tier0..tier7). 0 means "use defaults".
        if *settings.endless_difficulty_thresholds != 0 {
            let packed: u256 = (*settings.endless_difficulty_thresholds).into();
            let tier_0: u16 = (packed & 0xFFFF).try_into().unwrap();
            let tier_1: u16 = ((packed / 0x10000) & 0xFFFF).try_into().unwrap();
            let tier_2: u16 = ((packed / 0x100000000) & 0xFFFF).try_into().unwrap();
            let tier_3: u16 = ((packed / 0x1000000000000) & 0xFFFF).try_into().unwrap();
            let tier_4: u16 = ((packed / 0x10000000000000000) & 0xFFFF).try_into().unwrap();
            let tier_5: u16 = ((packed / 0x100000000000000000000) & 0xFFFF).try_into().unwrap();
            let tier_6: u16 = ((packed / 0x1000000000000000000000000) & 0xFFFF).try_into().unwrap();
            let tier_7: u16 = ((packed / 0x10000000000000000000000000000) & 0xFFFF)
                .try_into()
                .unwrap();

            let _ = tier_0;
            if total_score >= tier_7.into() {
                return Difficulty::Master;
            }
            if total_score >= tier_6.into() {
                return Difficulty::Expert;
            }
            if total_score >= tier_5.into() {
                return Difficulty::VeryHard;
            }
            if total_score >= tier_4.into() {
                return Difficulty::Hard;
            }
            if total_score >= tier_3.into() {
                return Difficulty::MediumHard;
            }
            if total_score >= tier_2.into() {
                return Difficulty::Medium;
            }
            if total_score >= tier_1.into() {
                return Difficulty::Easy;
            }

            return Difficulty::VeryEasy;
        }

        if total_score >= 900 {
            return Difficulty::Master;
        }
        if total_score >= 500 {
            return Difficulty::Expert;
        }
        if total_score >= 280 {
            return Difficulty::VeryHard;
        }
        if total_score >= 150 {
            return Difficulty::Hard;
        }
        if total_score >= 80 {
            return Difficulty::MediumHard;
        }
        if total_score >= 40 {
            return Difficulty::Medium;
        }
        if total_score >= 15 {
            return Difficulty::Easy;
        }

        Difficulty::VeryEasy
    }

    /// Returns endless score multiplier in x10 fixed-point.
    ///
    /// Reads packed multipliers from `settings.endless_score_multipliers` when configured.
    /// Fallback sequence by tier: [10, 12, 14, 17, 20, 25, 33, 40].
    fn get_endless_score_multiplier(difficulty: Difficulty, settings: @GameSettings) -> u16 {
        // Packed 8 × u8 multipliers (tier0..tier7). 0 means "use defaults".
        if *settings.endless_score_multipliers != 0 {
            let packed: u64 = *settings.endless_score_multipliers;
            let tier_0: u16 = (packed & 0xFF).try_into().unwrap();
            let tier_1: u16 = ((packed / 0x100) & 0xFF).try_into().unwrap();
            let tier_2: u16 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
            let tier_3: u16 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
            let tier_4: u16 = ((packed / 0x100000000) & 0xFF).try_into().unwrap();
            let tier_5: u16 = ((packed / 0x10000000000) & 0xFF).try_into().unwrap();
            let tier_6: u16 = ((packed / 0x1000000000000) & 0xFF).try_into().unwrap();
            let tier_7: u16 = ((packed / 0x100000000000000) & 0xFF).try_into().unwrap();

            return match difficulty {
                Difficulty::VeryEasy => tier_0,
                Difficulty::Easy => tier_1,
                Difficulty::Medium => tier_2,
                Difficulty::MediumHard => tier_3,
                Difficulty::Hard => tier_4,
                Difficulty::VeryHard => tier_5,
                Difficulty::Expert => tier_6,
                Difficulty::Master => tier_7,
                _ => tier_0,
            };
        }

        match difficulty {
            Difficulty::VeryEasy => 10,
            Difficulty::Easy => 12,
            Difficulty::Medium => 14,
            Difficulty::MediumHard => 17,
            Difficulty::Hard => 20,
            Difficulty::VeryHard => 25,
            Difficulty::Expert => 33,
            Difficulty::Master => 40,
            _ => 10,
        }
    }

    // NOTE: generate_boss_constraints_seeded, generate_clear_lines_constraint_max_budget,
    // and generate_boss_secondary_constraint were removed in the constraint V2 redesign.
    // Boss constraint generation now uses the boss module (helpers/boss.cairo).

    /// Generate constraints based on seed, level, difficulty, and settings.
    /// Uses unified budget system with weighted type selection.
    ///
    /// Deterministic count-based system: each difficulty tier has a hardcoded
    /// constraint_min/constraint_max. Roll count in [min, max], generate that many.
    /// Regular levels generate ComboLines, BreakBlocks, ComboStreak only.
    ///
    /// Returns (constraint_1, constraint_2, constraint_3)
    fn generate_constraints_with_settings(
        level_seed: felt252,
        level: u8,
        difficulty: Difficulty,
        settings: GameSettings,
        points_required: u16,
    ) -> (LevelConstraint, LevelConstraint, LevelConstraint) {
        // Check if constraints are enabled
        if !settings.are_constraints_enabled() {
            return (
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
            );
        }

        // No constraint before the start level (levels 1-2 have no constraints)
        if level < settings.constraint_start_level {
            return (
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
            );
        }

        let seed_u256: u256 = level_seed.into();

        // Get interpolated constraint parameters for this difficulty
        let (_min_lines, _max_lines, budget_min, budget_max, _min_times) = settings
            .get_constraint_params_for_difficulty(difficulty);

        // Determine how many constraints this level has from budget range.
        let (count_min, count_max) = Self::get_constraint_count_range_from_budget(
            budget_min, budget_max,
        );

        // If tier has 0 constraints, return none
        if count_max == 0 {
            return (
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
                LevelConstraintTrait::none(),
            );
        }

        // Roll constraint count in [count_min, count_max]
        let count: u8 = if count_min == count_max {
            count_min
        } else {
            let count_range: u8 = count_max - count_min + 1;
            count_min + ((seed_u256 % count_range.into()).try_into().unwrap())
        };

        // Generate each constraint with independent budget rolls and type selection
        // Use different seed derivations for each constraint to ensure independence
        let mut constraints: Array<LevelConstraint> = array![];
        let mut used_types: Array<ConstraintType> = array![];
        let mut i: u8 = 0;
        while i < count {
            // Derive a unique seed for this constraint index
            let constraint_seed: felt252 = {
                let state: HashState = PoseidonTrait::new();
                let state = state.update(level_seed);
                let state = state.update(i.into());
                let state = state.update('CONSTRAINT');
                state.finalize()
            };
            let constraint_seed_u256: u256 = constraint_seed.into();

            // Roll budget within [budget_min, budget_max]
            let budget_range: u8 = if budget_max > budget_min {
                budget_max - budget_min + 1
            } else {
                1
            };
            let budget: u8 = budget_min
                + ((constraint_seed_u256 % budget_range.into()).try_into().unwrap());

            // Roll constraint type, avoiding duplicates
            let mut constraint_type = Self::select_constraint_type(constraint_seed, budget);

            // If this type was already used, cycle to next unused type
            let mut attempts: u8 = 0;
            while attempts < 4 {
                if !Self::type_in_array(@used_types, constraint_type) {
                    break;
                }
                constraint_type = Self::next_regular_type(constraint_type);
                attempts += 1;
            }

            // Generate constraint from budget
            let constraint = Self::generate_constraint_from_budget(
                constraint_seed, budget, constraint_type,
            );
            constraints.append(constraint);
            used_types.append(constraint_type);

            i += 1;
        }

        // Pad to 3 constraints (fill with None)
        let c1 = if constraints.len() > 0 {
            *constraints.at(0)
        } else {
            LevelConstraintTrait::none()
        };
        let c2 = if constraints.len() > 1 {
            *constraints.at(1)
        } else {
            LevelConstraintTrait::none()
        };
        let c3 = if constraints.len() > 2 {
            *constraints.at(2)
        } else {
            LevelConstraintTrait::none()
        };

        (c1, c2, c3)
    }

    /// Check if a constraint type is already in the used types array
    fn type_in_array(arr: @Array<ConstraintType>, t: ConstraintType) -> bool {
        let mut i: u32 = 0;
        let len = arr.len();
        while i < len {
            if *arr.at(i) == t {
                return true;
            }
            i += 1;
        }
        false
    }

    /// Select a constraint type using budget-weighted probabilities.
    /// Returns one of ComboLines / BreakBlocks / ComboStreak.
    fn select_constraint_type(seed: felt252, budget: u8) -> ConstraintType {
        let seed_u256: u256 = seed.into();
        let roll: u8 = ((seed_u256 / 10000) % 100).try_into().unwrap();

        // Get cumulative thresholds for this budget.
        let (clear_lines_w, break_blocks_w) = Self::get_type_weights_from_budget(budget);
        // ComboStreak = remainder (100 - combo_lines - break)

        if roll < clear_lines_w {
            ConstraintType::ComboLines
        } else if roll < clear_lines_w + break_blocks_w {
            ConstraintType::BreakBlocks
        } else {
            ConstraintType::ComboStreak
        }
    }

    /// Get type selection weights from budget.
    /// Returns (combo_lines, break_blocks). ComboStreak = 100 - sum.
    fn get_type_weights_from_budget(budget: u8) -> (u8, u8) {
        if budget <= 5 {
            (38, 38)
        } else if budget <= 9 {
            (34, 34)
        } else if budget <= 14 {
            (31, 31)
        } else if budget <= 20 {
            (29, 29)
        } else if budget <= 26 {
            (28, 28)
        } else if budget <= 32 {
            (27, 27)
        } else if budget <= 38 {
            (26, 26)
        } else {
            (25, 25)
        }
    }

    /// Get deterministic constraint count range from budget range.
    /// Returns (constraint_min, constraint_max).
    /// Roll a random count in [min, max] to determine how many constraints a level has.
    /// KeepGridBelow is boss-only — never generated on regular levels.
    fn get_constraint_count_range_from_budget(budget_min: u8, budget_max: u8) -> (u8, u8) {
        let avg_budget: u8 = (((budget_min.into() + budget_max.into()) / 2_u16))
            .try_into()
            .unwrap();
        if avg_budget <= 3 {
            (0, 0)
        } else if avg_budget <= 8 {
            (1, 1)
        } else if avg_budget <= 16 {
            (1, 2)
        } else if avg_budget <= 24 {
            (2, 2)
        } else if avg_budget <= 32 {
            (2, 3)
        } else {
            (3, 3)
        }
    }

    /// Get maximum allowed ComboLines repetitions.
    /// Keeps line-vs-times tradeoffs across tiers, while capping outliers.
    fn get_max_combo_lines_times() -> u8 {
        5
    }

    /// Minimum budget utilization floor (x100).
    /// Generated constraint cost must be within [ceil(budget * floor), budget].
    fn budget_utilization_floor_x100() -> u16 {
        70
    }

    /// ceil(numerator / denominator) for positive integers.
    fn ceil_div_u16_by_u8(numerator: u16, denominator: u8) -> u8 {
        if denominator == 0 {
            return 0;
        }
        let den_u16: u16 = denominator.into();
        let q: u16 = (numerator + den_u16 - 1_u16) / den_u16;
        q.try_into().unwrap()
    }

    /// Compute minimum spend for a sampled budget using utilization floor.
    fn min_budget_spend(budget: u8) -> u8 {
        let floor_x100 = Self::budget_utilization_floor_x100();
        let raw: u16 = budget.into() * floor_x100;
        let min_spend: u16 = (raw + 99_u16) / 100_u16;
        if min_spend < 1 {
            1
        } else if min_spend > budget.into() {
            budget
        } else {
            min_spend.try_into().unwrap()
        }
    }

    /// Generate a constraint of the given type using the budget system.
    /// Budget determines the difficulty/scale of the constraint values.
    fn generate_constraint_from_budget(
        seed: felt252, budget: u8, constraint_type: ConstraintType,
    ) -> LevelConstraint {
        match constraint_type {
            ConstraintType::ComboLines => Self::generate_combo_lines_from_budget(seed, budget),
            ConstraintType::BreakBlocks => Self::generate_break_blocks_from_budget(seed, budget),
            ConstraintType::ComboStreak => Self::generate_combo_streak_from_budget(seed, budget),
            ConstraintType::KeepGridBelow => LevelConstraintTrait::keep_grid_below(),
            ConstraintType::None => LevelConstraintTrait::none(),
        }
    }

    /// Returns the weighted difficulty cost for clearing N lines at once.
    /// Higher line counts are exponentially harder to achieve in practice.
    /// Line costs: 2->3, 3->10, 4->20, 5->30, 6->40, 7->60, 8->80
    ///
    /// Used by constraint generation to determine how many "times" a constraint requires.
    /// Formula: times = budget / line_cost(lines)
    fn line_cost(lines: u8) -> u8 {
        match lines {
            0 | 1 => 1,
            2 => 3,
            3 => 10,
            4 => 20,
            5 => 30,
            6 => 40,
            7 => 60,
            _ => 80 // 8+
        }
    }

    /// Cost for breaking blocks of a given size.
    /// Smaller blocks are easier to find, so cheaper.
    /// size 1->4, 2->5, 3->6, 4->7
    fn break_cost(size: u8) -> u8 {
        match size {
            1 => 4,
            2 => 5,
            3 => 6,
            _ => 7 // size 4+
        }
    }

    /// Generate a ComboLines constraint from budget.
    /// Candidate pairs (lines, times) must satisfy:
    /// line_cost(lines) * times in [min_budget_spend(budget), budget]
    fn generate_combo_lines_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        let min_spend = Self::min_budget_spend(budget);
        let max_times_cap = Self::get_max_combo_lines_times();

        let mut candidates_count: u16 = 0;
        let mut lines_scan: u8 = 2;
        while lines_scan <= 8 {
            let cost = Self::line_cost(lines_scan);
            if cost <= budget {
                let times_cap_raw: u8 = budget / cost;
                let times_cap: u8 = if times_cap_raw > max_times_cap {
                    max_times_cap
                } else if times_cap_raw < 1 {
                    1
                } else {
                    times_cap_raw
                };

                let times_min = Self::ceil_div_u16_by_u8(min_spend.into(), cost);
                if times_min <= times_cap {
                    candidates_count += (times_cap - times_min + 1).into();
                }
            }
            lines_scan += 1;
        }

        if candidates_count == 0 {
            return LevelConstraintTrait::combo_lines(2, 1);
        }

        let pick: u16 = (seed_u256 % candidates_count.into()).try_into().unwrap();
        let mut idx: u16 = 0;
        let mut chosen_lines: u8 = 2;
        let mut chosen_times: u8 = 1;

        let mut lines_scan2: u8 = 2;
        while lines_scan2 <= 8 {
            let cost = Self::line_cost(lines_scan2);
            if cost <= budget {
                let times_cap_raw: u8 = budget / cost;
                let times_cap: u8 = if times_cap_raw > max_times_cap {
                    max_times_cap
                } else if times_cap_raw < 1 {
                    1
                } else {
                    times_cap_raw
                };

                let times_min = Self::ceil_div_u16_by_u8(min_spend.into(), cost);
                if times_min <= times_cap {
                    let mut t: u8 = times_min;
                    while t <= times_cap {
                        if idx == pick {
                            chosen_lines = lines_scan2;
                            chosen_times = t;
                            break;
                        }
                        idx += 1;
                        t += 1;
                    }
                    if idx > pick {
                        break;
                    }
                }
            }
            lines_scan2 += 1;
        }

        LevelConstraintTrait::combo_lines(chosen_lines, chosen_times)
    }

    /// Generate a BreakBlocks constraint from budget.
    /// Candidate pairs (size, count) must satisfy utilization band:
    /// count * break_cost(size) <= budget * break_scale(size)
    /// count * break_cost(size) >= min_budget_spend(budget) * break_scale(size)
    fn generate_break_blocks_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        let min_spend = Self::min_budget_spend(budget);

        // Max block size by budget
        let max_size: u8 = if budget < 10 {
            2
        } else if budget < 20 {
            3
        } else {
            4
        };

        let mut candidates_count: u16 = 0;
        let mut size_scan: u8 = 1;
        while size_scan <= max_size {
            let scale: u16 = Self::break_scale(size_scan);
            let cost: u16 = Self::break_cost(size_scan).into();
            let max_units: u16 = budget.into() * scale;
            let min_units: u16 = min_spend.into() * scale;

            let count_min_budget: u8 = Self::ceil_div_u16_by_u8(
                min_units, cost.try_into().unwrap(),
            );
            let count_max_budget: u8 = (max_units / cost).try_into().unwrap();

            let count_min: u8 = if count_min_budget < 1 {
                1
            } else {
                count_min_budget
            };
            let count_max: u8 = if count_max_budget > 120 {
                120
            } else {
                count_max_budget
            };

            if count_min <= count_max {
                candidates_count += (count_max - count_min + 1).into();
            }
            size_scan += 1;
        }

        if candidates_count == 0 {
            return LevelConstraintTrait::break_blocks(1, 1);
        }

        let pick: u16 = (seed_u256 % candidates_count.into()).try_into().unwrap();
        let mut idx: u16 = 0;
        let mut chosen_size: u8 = 1;
        let mut chosen_count: u8 = 1;

        let mut size_scan2: u8 = 1;
        while size_scan2 <= max_size {
            let scale: u16 = Self::break_scale(size_scan2);
            let cost: u16 = Self::break_cost(size_scan2).into();
            let max_units: u16 = budget.into() * scale;
            let min_units: u16 = min_spend.into() * scale;

            let count_min_budget: u8 = Self::ceil_div_u16_by_u8(
                min_units, cost.try_into().unwrap(),
            );
            let count_max_budget: u8 = (max_units / cost).try_into().unwrap();

            let count_min: u8 = if count_min_budget < 1 {
                1
            } else {
                count_min_budget
            };
            let count_max: u8 = if count_max_budget > 120 {
                120
            } else {
                count_max_budget
            };

            if count_min <= count_max {
                let mut c = count_min;
                while c <= count_max {
                    if idx == pick {
                        chosen_size = size_scan2;
                        chosen_count = c;
                        break;
                    }
                    idx += 1;
                    c += 1;
                }
                if idx > pick {
                    break;
                }
            }
            size_scan2 += 1;
        }

        LevelConstraintTrait::break_blocks(chosen_size, chosen_count)
    }

    /// Generate a ComboStreak constraint from budget.
    /// Target is half of rolled budget (floor division).
    fn generate_combo_streak_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let _ = seed;
        let target: u8 = budget / 2;
        LevelConstraintTrait::combo_streak(target)
    }

    /// Scale factor for BreakBlocks target counts by size.
    fn break_scale(size: u8) -> u16 {
        match size {
            1 => 3,
            2 => 3,
            3 => 2,
            _ => 2,
        }
    }

    /// Cycle to next regular constraint type (ComboLines -> BreakBlocks -> ComboStreak ->
    /// ComboLines)
    fn next_regular_type(t: ConstraintType) -> ConstraintType {
        match t {
            ConstraintType::ComboLines => ConstraintType::BreakBlocks,
            ConstraintType::BreakBlocks => ConstraintType::ComboStreak,
            ConstraintType::ComboStreak => ConstraintType::ComboLines,
            _ => ConstraintType::ComboLines // Fallback for boss-only types
        }
    }

    /// Derive a deterministic seed for a specific level
    fn derive_level_seed(seed: felt252, level: u8) -> felt252 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(seed);
        let state = state.update(level.into());
        let state = state.update('LEVEL_CONFIG');
        state.finalize()
    }

    /// Calculate base moves for a level (before variance)
    /// Linear scaling: 20 at level 1, 60 at level 50 (using defaults)
    #[inline(always)]
    fn calculate_base_moves(level: u8) -> u16 {
        Self::calculate_base_moves_with_settings(
            level, LevelConstants::BASE_MOVES, LevelConstants::MAX_MOVES,
        )
    }

    /// Calculate base moves with custom settings
    /// Linear scaling from base_moves at level 1 to max_moves at level 50
    #[inline(always)]
    fn calculate_base_moves_with_settings(level: u8, base_moves: u16, max_moves: u16) -> u16 {
        Self::calculate_base_moves_with_cap(level, base_moves, max_moves, LevelConstants::LEVEL_CAP)
    }

    /// Calculate base moves with a custom level cap.
    #[inline(always)]
    fn calculate_base_moves_with_cap(
        level: u8, base_moves: u16, max_moves: u16, level_cap: u8,
    ) -> u16 {
        if level <= 1 {
            return base_moves;
        }

        if level_cap <= 1 {
            return max_moves;
        }

        let clamped_level = if level > level_cap {
            level_cap
        } else {
            level
        };
        let range = max_moves - base_moves;
        let denominator: u32 = (level_cap - 1).into();
        let progress: u32 = (clamped_level.into() - 1) * range.into() / denominator;
        base_moves + progress.try_into().unwrap()
    }

    /// Calculate ratio for this level (scaled by 100)
    /// Linear scaling: 80 (0.80) at level 1, 180 (1.80) at level 50 (using defaults)
    #[inline(always)]
    fn calculate_ratio(level: u8) -> u16 {
        Self::calculate_ratio_with_settings(
            level, LevelConstants::BASE_RATIO_X100, LevelConstants::MAX_RATIO_X100,
        )
    }

    /// Calculate ratio with custom settings
    /// Linear scaling from base_ratio at level 1 to max_ratio at level 50
    #[inline(always)]
    fn calculate_ratio_with_settings(level: u8, base_ratio_x100: u16, max_ratio_x100: u16) -> u16 {
        Self::calculate_ratio_with_cap(
            level, base_ratio_x100, max_ratio_x100, LevelConstants::LEVEL_CAP,
        )
    }

    /// Calculate ratio with custom settings and a custom level cap.
    #[inline(always)]
    fn calculate_ratio_with_cap(
        level: u8, base_ratio_x100: u16, max_ratio_x100: u16, level_cap: u8,
    ) -> u16 {
        if level <= 1 {
            return base_ratio_x100;
        }

        if level_cap <= 1 {
            return max_ratio_x100;
        }

        let clamped_level = if level > level_cap {
            level_cap
        } else {
            level
        };
        let range = max_ratio_x100 - base_ratio_x100;
        let denominator: u32 = (level_cap - 1).into();
        let progress: u32 = (clamped_level.into() - 1) * range.into() / denominator;
        base_ratio_x100 + progress.try_into().unwrap()
    }

    /// Get variance percentage based on level tier
    #[inline(always)]
    fn get_variance_percent(level: u8) -> u16 {
        if level <= 5 {
            LevelConstants::EARLY_VARIANCE_PERCENT
        } else if level <= 25 {
            LevelConstants::MID_VARIANCE_PERCENT
        } else {
            LevelConstants::LATE_VARIANCE_PERCENT
        }
    }

    /// Calculate correlated variance factor
    /// Returns a value like 95-105 for ±5%, or 85-115 for ±15%
    fn calculate_variance_factor(seed: felt252, variance_percent: u16) -> u16 {
        let seed_u256: u256 = seed.into();
        let variance_range = variance_percent * 2 + 1; // e.g., 11 for ±5% (95-105)
        let roll: u16 = (seed_u256 % variance_range.into()).try_into().unwrap();
        // Center around 100: (100 - variance) + roll
        100 - variance_percent + roll
    }

    /// Apply factor to base value
    #[inline(always)]
    fn apply_factor(base: u16, factor: u16) -> u16 {
        let result: u32 = base.into() * factor.into() / 100;
        result.try_into().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use zkube::helpers::mutator::MutatorEffectsTrait;
    use zkube::models::config::GameSettingsTrait;
    use zkube::models::mutator::MutatorDef;
    use zkube::types::constraint::ConstraintType;
    use zkube::types::difficulty::Difficulty;
    use super::{LevelGenerator, LevelGeneratorTrait};

    const TEST_SEED: felt252 = 'TEST_SEED_12345';
    const DIFFERENT_SEED: felt252 = 'DIFFERENT_SEED';

    fn default_mutator() -> MutatorDef {
        MutatorEffectsTrait::neutral(0)
    }

    #[test]
    fn test_base_moves_scaling() {
        assert!(LevelGeneratorTrait::calculate_base_moves(1) == 20, "Level 1 should have 20 moves");
        assert!(
            LevelGeneratorTrait::calculate_base_moves(50) == 60, "Level 50 should have 60 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(25);
        assert!(mid >= 39 && mid <= 41, "Level 25 should be around 40 moves");
    }

    #[test]
    fn test_ratio_scaling() {
        assert!(LevelGeneratorTrait::calculate_ratio(1) == 80, "Level 1 should have ratio 80");
        assert!(LevelGeneratorTrait::calculate_ratio(50) == 180, "Level 50 should have ratio 180");

        let mid = LevelGeneratorTrait::calculate_ratio(25);
        assert!(mid >= 125 && mid <= 135, "Level 25 should have ratio around 130");
    }

    #[test]
    fn test_variance_percent_tiers() {
        // All levels now use consistent ±5% variance
        assert!(LevelGeneratorTrait::get_variance_percent(1) == 5, "Level 1 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(5) == 5, "Level 5 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(6) == 5, "Level 6 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(25) == 5, "Level 25 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(26) == 5, "Level 26 should be 5%");
        assert!(LevelGeneratorTrait::get_variance_percent(50) == 5, "Level 50 should be 5%");
    }

    #[test]
    fn test_seed_determinism() {
        // Same seed + same level should produce same config
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());

        assert!(config1.points_required == config2.points_required, "Points should match");
        assert!(config1.max_moves == config2.max_moves, "Moves should match");
        assert!(config1.difficulty == config2.difficulty, "Difficulty should match");
    }

    #[test]
    fn test_correlated_variance() {
        // Test that zone-mode variance is correlated (ratio stays approximately constant).
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 10, settings, @default_mutator());

        // Base at level 10 (zone cap): moves = 60, ratio_x100 = 180, points = 60 × 1.80 = 108
        // With variance (±5%), both should scale together maintaining the ratio
        // Ratio should be approximately: points_required * 100 / max_moves
        let actual_ratio = config.points_required.into() * 100_u32 / config.max_moves.into();

        // The ratio should be close to the base zone-cap ratio (~180)
        // Allow for rounding errors
        assert!(actual_ratio >= 165 && actual_ratio <= 195, "Ratio should be approximately 180");
    }

    #[test]
    fn test_different_seeds_different_configs() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        // Endless levels are seed-independent by design; use a zone level where variance/constraints
        // are seeded.
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 9, settings, @default_mutator());
        let config2 = LevelGeneratorTrait::generate(
            DIFFERENT_SEED, 9, settings, @default_mutator(),
        );

        // At least one of points or moves should differ (very high probability)
        let points_differ = config1.points_required != config2.points_required;
        let moves_differ = config1.max_moves != config2.max_moves;

        assert!(points_differ || moves_differ, "Different seeds should produce different configs");
    }

    #[test]
    fn test_level_50_cap() {
        // Level 50 and 100 should have same base difficulty (Master)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings, @default_mutator());
        let config100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings, @default_mutator());

        assert!(config50.difficulty == Difficulty::Master, "Level 50 should be Master");
        assert!(config100.difficulty == Difficulty::Master, "Level 100 should be Master (capped)");
    }

    #[test]
    fn test_no_constraint_early_levels() {
        // Default constraint_start_level is 3, so levels 1-2 have no constraints
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings, @default_mutator());
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings, @default_mutator());

        assert!(
            config1.constraint.constraint_type == ConstraintType::None,
            "Level 1 should have no constraint",
        );
        assert!(
            config2.constraint.constraint_type == ConstraintType::None,
            "Level 2 should have no constraint",
        );
    }

    #[test]
    fn test_generate_level_1() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings, @default_mutator());

        // Level 1: base_moves=20, ratio=0.80, base_points=16
        // With ±5% variance: moves 19-21, points 15-17
        // With non-linear progression: Level 1 is VeryEasy (tier 0)
        assert!(config.level == 1, "Level should be 1");
        assert!(config.points_required >= 14 && config.points_required <= 18, "Points in range");
        assert!(config.max_moves >= 18 && config.max_moves <= 22, "Moves in range");
        assert!(config.difficulty == Difficulty::VeryEasy, "Level 1 should be VeryEasy");
    }

    #[test]
    fn test_generate_level_25() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());

        // Endless mode (11+): fixed moves=max_moves, Master difficulty,
        // ratio increases by +10 per level depth over level 10.
        // Level 25 => depth 15 => ratio_x100=330 => points=60*3.30=198.
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required == 198, "Endless level 25 points should be deterministic");
        assert!(config.max_moves == 60, "Endless levels should use max_moves");
        assert!(config.difficulty == Difficulty::Master, "Endless levels should be Master");
    }

    #[test]
    fn test_generate_level_50() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings, @default_mutator());

        // Endless level 50 => depth 40 => ratio_x100=580 => points=60*5.80=348.
        assert!(config.level == 50, "Level should be 50");
        assert!(config.points_required == 348, "Endless level 50 points should be deterministic");
        assert!(config.max_moves == 60, "Endless levels should use max_moves");
        assert!(config.difficulty == Difficulty::Master, "Endless levels should be Master");
    }

    #[test]
    fn test_generate_default_settings() {
        // Test generate with default settings
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);

        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());

        // Verify it produces reasonable values
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required > 0, "Points should be positive");
        assert!(config.max_moves > 0, "Moves should be positive");
    }

    #[test]
    fn test_combo_lines_budget_scales_times() {
        // With enough budget, 4-line targets can require repeats naturally from budget.
        let c = LevelGeneratorTrait::generate_constraint_from_budget(
            1, 16, ConstraintType::ComboLines,
        );

        assert!(c.constraint_type == ConstraintType::ComboLines, "Should generate ComboLines");
        assert!(c.value >= 2 && c.value <= 8, "Lines target must stay in valid range");
        assert!(c.required_count >= 1, "Times must be at least 1");
    }


    #[test]
    fn test_generate_constraints_disabled() {
        // Disable constraints entirely
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraints_enabled = 0;

        // Even at high levels, should have no constraint
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());
        assert!(
            config.constraint.constraint_type == ConstraintType::None,
            "Should have no constraint when disabled",
        );

        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings, @default_mutator());
        assert!(
            config_50.constraint.constraint_type == ConstraintType::None,
            "Level 50 should have no constraint when disabled",
        );
    }

    #[test]
    fn test_generate_custom_constraint_start() {
        // Start constraints at level 20 instead of 5
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraint_start_level = 20;

        // Level 15 should have no constraint
        let config_15 = LevelGeneratorTrait::generate(TEST_SEED, 15, settings, @default_mutator());
        assert!(
            config_15.constraint.constraint_type == ConstraintType::None,
            "Level 15 should have no constraint",
        );

        // Level 20 might have a constraint (depending on RNG)
        let _config_20 = LevelGeneratorTrait::generate(TEST_SEED, 20, settings, @default_mutator());
        // We can't assert the specific type since it's random, but it should use
    // generate_constraint
    }

    #[test]
    fn test_generate_custom_difficulty_progression() {
        // Custom tier thresholds for faster early progression
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.tier_1_threshold = 2; // Easy starts at level 2
        settings.tier_2_threshold = 5; // Medium starts at level 5
        settings.tier_3_threshold = 10; // MediumHard starts at level 10
        settings.tier_4_threshold = 15; // Hard starts at level 15
        settings.tier_5_threshold = 25; // VeryHard starts at level 25
        settings.tier_6_threshold = 40; // Expert starts at level 40
        settings.tier_7_threshold = 60; // Master starts at level 60

        let config_1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings, @default_mutator());
        assert!(config_1.difficulty == Difficulty::VeryEasy, "Level 1 should be VeryEasy");

        let config_2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings, @default_mutator());
        assert!(config_2.difficulty == Difficulty::Easy, "Level 2 should be Easy");

        let config_5 = LevelGeneratorTrait::generate(TEST_SEED, 5, settings, @default_mutator());
        assert!(config_5.difficulty == Difficulty::Medium, "Level 5 should be Medium");

        let config_10 = LevelGeneratorTrait::generate(TEST_SEED, 10, settings, @default_mutator());
        assert!(config_10.difficulty == Difficulty::MediumHard, "Level 10 should be MediumHard");
    }

    #[test]
    fn test_generate_custom_variance() {
        // Use zero variance for completely deterministic levels
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.early_variance_percent = 0;
        settings.mid_variance_percent = 0;
        settings.late_variance_percent = 0;

        // With zero variance, multiple generations with same seed should be identical
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings, @default_mutator());
        let config2 = LevelGeneratorTrait::generate(
            DIFFERENT_SEED, 25, settings, @default_mutator(),
        );

        // Points should be exactly base calculation (no variance)
        // Level 25: base_moves ~28.5, ratio ~125, points ~35
        // Without variance, both seeds should give same result
        assert!(
            config1.points_required == config2.points_required,
            "Zero variance should give same points",
        );
        assert!(config1.max_moves == config2.max_moves, "Zero variance should give same moves");
    }

    #[test]
    fn test_generate_custom_level_cap() {
        // Lower level cap to 30 (below default of 50)
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.level_cap = 30;

        // Level 30 and 50 should have same scaling (both at cap)
        let config_30 = LevelGeneratorTrait::generate(TEST_SEED, 30, settings, @default_mutator());
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings, @default_mutator());

        // Both should use level 30 for calculations
        // Note: We can't directly compare due to different level seeds, but we can verify
        // the level field is different while the base calculation is capped
        assert!(config_30.level == 30, "Level should be 30");
        assert!(config_50.level == 50, "Level should be 50");
    }

    #[test]
    fn test_generate_easy_mode() {
        // "Easy mode": more moves, lower ratios, generous thresholds
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.base_moves = 30; // More moves at start
        settings.max_moves = 100; // Way more moves at high levels
        settings.base_ratio_x100 = 50; // Lower points/move ratio (easier)
        settings.max_ratio_x100 = 150; // Still easier at high levels
        settings.constraints_enabled = 0; // No constraints
        // Slow difficulty progression - stay VeryEasy longer
        settings.tier_1_threshold = 20; // Easy starts at level 20
        settings.tier_2_threshold = 40; // Medium starts at level 40
        settings.tier_3_threshold = 60; // MediumHard starts at level 60
        settings.tier_4_threshold = 75; // Hard starts at level 75
        settings.tier_5_threshold = 85; // VeryHard starts at level 85
        settings.tier_6_threshold = 95; // Expert starts at level 95
        settings.tier_7_threshold = 100; // Master starts at level 100

        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings, @default_mutator());

        // Should have easier parameters
        assert!(config.max_moves >= 27, "Should have more moves"); // ~30 with variance
        assert!(config.difficulty == Difficulty::VeryEasy, "Should be VeryEasy difficulty");
        assert!(
            config.constraint.constraint_type == ConstraintType::None, "Should have no constraint",
        );
    }
}
