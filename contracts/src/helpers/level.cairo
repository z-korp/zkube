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

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use zkube::types::difficulty::Difficulty;
use zkube::types::level::LevelConfig;
use zkube::types::constraint::{LevelConstraint, LevelConstraintTrait, ConstraintType};
use zkube::models::config::{GameSettings, GameSettingsTrait};
use zkube::helpers::boss;

/// Constants for level generation
mod LevelConstants {
    // Moves scaling (linear 20 → 60)
    pub const BASE_MOVES: u16 = 20;
    pub const MAX_MOVES: u16 = 60;

    // Ratio scaling ×100 for integer math (0.80 → 1.80)
    pub const BASE_RATIO_X100: u16 = 80;   // 0.80 points per move at level 1
    pub const MAX_RATIO_X100: u16 = 180;   // 1.80 points per move at level 50

    // Correlated variance (consistent ±5% across all levels)
    pub const EARLY_VARIANCE_PERCENT: u16 = 5;   // ±5% for levels 1-5
    pub const MID_VARIANCE_PERCENT: u16 = 5;     // ±5% for levels 6-25
    pub const LATE_VARIANCE_PERCENT: u16 = 5;    // ±5% for levels 26-50

    // Cube thresholds (percentage of max_moves)
    pub const CUBE_3_PERCENT: u16 = 40; // 3 cubes if moves <= 40% of max
    pub const CUBE_2_PERCENT: u16 = 70; // 2 cubes if moves <= 70% of max

    // Level cap for scaling (survival mode after this)
    pub const LEVEL_CAP: u8 = 50;

    // Constraint none threshold (constraints start from level 5)
    pub const CONSTRAINT_NONE_THRESHOLD: u8 = 4;
}

/// Boss level constants and helpers
/// Boss levels occur at 10, 20, 30, 40, 50 with seeded dual constraints at max budget
pub mod BossLevel {
    /// Check if a level is a boss level
    pub fn is_boss_level(level: u8) -> bool {
        level == 10 || level == 20 || level == 30 || level == 40 || level == 50
    }
    
    /// Get boss tier (1-5) for a boss level
    /// Returns 0 if not a boss level
    pub fn get_boss_tier(level: u8) -> u8 {
        match level {
            10 => 1,
            20 => 2,
            30 => 3,
            40 => 4,
            50 => 5,
            _ => 0,
        }
    }
    
    /// Get boss cube bonus for completing a boss level
    /// Boss I (L10) = +10, Boss II (L20) = +20, etc.
    pub fn get_boss_cube_bonus(level: u8) -> u16 {
        match level {
            10 => 10,
            20 => 20,
            30 => 30,
            40 => 40,
            50 => 50,
            _ => 0,
        }
    }
}

#[generate_trait]
pub impl LevelGenerator of LevelGeneratorTrait {
    /// Generate a complete level configuration from seed, level number, and GameSettings
    /// Uses configurable game balance parameters from settings
    fn generate(seed: felt252, level: u8, settings: GameSettings) -> LevelConfig {
        // Derive a level-specific seed for deterministic variance
        let level_seed = Self::derive_level_seed(seed, level);

        // Get level cap from settings (or use default if 0)
        let level_cap = settings.get_level_cap();
        
        // Cap level for calculations (survival mode after cap)
        let calc_level = if level > level_cap {
            level_cap
        } else {
            level
        };

        // 1. Calculate base moves using settings
        let base_moves = Self::calculate_base_moves_with_settings(
            calc_level, settings.base_moves, settings.max_moves
        );

        // 2. Calculate ratio for this level using settings
        let ratio_x100 = Self::calculate_ratio_with_settings(
            calc_level, settings.base_ratio_x100, settings.max_ratio_x100
        );

        // 3. Calculate base points from moves × ratio
        let base_points: u16 = ((base_moves.into() * ratio_x100.into()) / 100_u32)
            .try_into()
            .unwrap();

        // 4. Get variance percent based on level tier (using settings)
        let variance_percent = settings.get_variance_percent(calc_level);

        // 5. Apply CORRELATED variance (same factor for both)
        let variance_factor = Self::calculate_variance_factor(level_seed, variance_percent.into());
        let points_required = Self::apply_factor(base_points, variance_factor);
        let max_moves = Self::apply_factor(base_moves, variance_factor);

        // Calculate cube thresholds using settings
        let cube_3_threshold = max_moves * settings.cube_3_percent.into() / 100;
        let cube_2_threshold = max_moves * settings.cube_2_percent.into() / 100;

        // Get difficulty from settings
        let difficulty = settings.get_difficulty_for_level(calc_level);
        
        // Generate constraints: use boss identity system for boss levels, otherwise normal generation
        // Respect constraints_enabled setting for both boss and regular levels
        let (constraint, constraint_2, constraint_3) = if !settings.are_constraints_enabled() {
            (LevelConstraintTrait::none(), LevelConstraintTrait::none(), LevelConstraintTrait::none())
        } else if BossLevel::is_boss_level(level) {
            // Boss levels use the boss identity system with budget_max
            let boss_id = boss::derive_boss_id(level_seed);
            let (_min_lines, _max_lines, _budget_min, budget_max, _min_times, _dual_chance, _secondary_no_bonus_chance) = 
                settings.get_constraint_params_for_difficulty(difficulty);
            let (c1, c2, c3) = boss::generate_boss_constraints(boss_id, difficulty, level_seed, budget_max);
            
            // Level 10/20/30: dual constraints (c3 = None)
            // Level 40/50: triple constraints (all three active)
            if level >= 40 {
                (c1, c2, c3)
            } else {
                (c1, c2, LevelConstraintTrait::none())
            }
        } else {
            // Regular levels: use existing constraint generation + new types
            let (c1, c2) = Self::generate_constraints_with_settings(level_seed, level, difficulty, settings);
            (c1, c2, LevelConstraintTrait::none())
        };

        LevelConfig {
            level,
            points_required,
            max_moves,
            difficulty,
            constraint,
            constraint_2,
            constraint_3,
            cube_3_threshold,
            cube_2_threshold,
        }
    }
    
    // NOTE: generate_boss_constraints_seeded, generate_clear_lines_constraint_max_budget,
    // and generate_boss_secondary_constraint were removed in the constraint V2 redesign.
    // Boss constraint generation now uses the boss module (helpers/boss.cairo).

    /// Generate constraints based on seed, level, difficulty, and settings.
    /// Uses unified budget system with weighted type selection.
    /// 
    /// Regular levels (3+) can generate any of 4 constraint types:
    /// ClearLines, BreakBlocks, AchieveCombo, Fill — weighted by difficulty tier.
    /// 
    /// Returns (primary_constraint, secondary_constraint)
    fn generate_constraints_with_settings(
        level_seed: felt252, level: u8, difficulty: Difficulty, settings: GameSettings
    ) -> (LevelConstraint, LevelConstraint) {
        // Check if constraints are enabled
        if !settings.are_constraints_enabled() {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        // No constraint before the start level (levels 1-2 have no constraints)
        if level < settings.constraint_start_level {
            return (LevelConstraintTrait::none(), LevelConstraintTrait::none());
        }
        
        let seed_u256: u256 = level_seed.into();
        
        // Get interpolated constraint parameters for this difficulty
        let (_min_lines, _max_lines, budget_min, budget_max, _min_times, dual_chance, secondary_no_bonus_chance) = 
            settings.get_constraint_params_for_difficulty(difficulty);
        
        // Get difficulty tier for type selection weights
        let tier = boss::difficulty_to_tier(difficulty);
        
        // Roll budget within [budget_min, budget_max]
        let budget_range: u8 = if budget_max > budget_min { budget_max - budget_min + 1 } else { 1 };
        let budget: u8 = budget_min + ((seed_u256 % budget_range.into()).try_into().unwrap());
        
        // Roll constraint type using weighted selection
        let primary_type = Self::select_constraint_type(level_seed, tier);
        
        // Generate primary constraint from budget
        let primary = Self::generate_constraint_from_budget(level_seed, budget, primary_type, tier);
        
        // Secondary constraint
        let secondary = Self::maybe_generate_secondary(
            level_seed, budget_min, budget_max, tier, dual_chance, secondary_no_bonus_chance, primary_type
        );
        
        (primary, secondary)
    }
    
    /// Select a constraint type using difficulty-weighted probabilities.
    /// Weights per tier (ClearLines / BreakBlocks / Fill / AchieveCombo, sum=100):
    /// tier 0: [80, 15,  5,  0]
    /// tier 1: [65, 20, 10,  5]
    /// tier 2: [55, 22, 13, 10]
    /// tier 3: [45, 24, 16, 15]
    /// tier 4: [38, 25, 17, 20]
    /// tier 5: [32, 25, 18, 25]
    /// tier 6: [28, 25, 20, 27]
    /// tier 7: [25, 25, 22, 28]
    fn select_constraint_type(seed: felt252, tier: u8) -> ConstraintType {
        let seed_u256: u256 = seed.into();
        let roll: u8 = ((seed_u256 / 10000) % 100).try_into().unwrap();
        
        // Get cumulative thresholds for this tier
        let (clear_lines_w, break_blocks_w, fill_w) = Self::get_type_weights(tier);
        // AchieveCombo = remainder (100 - clear - break - fill)
        
        if roll < clear_lines_w {
            ConstraintType::ClearLines
        } else if roll < clear_lines_w + break_blocks_w {
            ConstraintType::BreakBlocks
        } else if roll < clear_lines_w + break_blocks_w + fill_w {
            ConstraintType::FillAndClear
        } else {
            ConstraintType::AchieveCombo
        }
    }
    
    /// Get type selection weights for a difficulty tier.
    /// Returns (clear_lines, break_blocks, fill). AchieveCombo = 100 - sum.
    fn get_type_weights(tier: u8) -> (u8, u8, u8) {
        match tier {
            0 => (80, 15, 5),   // VeryEasy: ClearLines dominant, no AchieveCombo
            1 => (65, 20, 10),  // Easy
            2 => (55, 22, 13),  // Medium
            3 => (45, 24, 16),  // MediumHard
            4 => (38, 25, 17),  // Hard
            5 => (32, 25, 18),  // VeryHard
            6 => (28, 25, 20),  // Expert
            _ => (25, 25, 22),  // Master: most balanced
        }
    }
    
    /// Generate a constraint of the given type using the budget system.
    /// Budget determines the difficulty/scale of the constraint values.
    fn generate_constraint_from_budget(
        seed: felt252,
        budget: u8,
        constraint_type: ConstraintType,
        tier: u8,
    ) -> LevelConstraint {
        match constraint_type {
            ConstraintType::ClearLines => Self::generate_clear_lines_from_budget(seed, budget),
            ConstraintType::BreakBlocks => Self::generate_break_blocks_from_budget(seed, budget, tier),
            ConstraintType::FillAndClear => Self::generate_fill_from_budget(seed, budget),
            ConstraintType::AchieveCombo => Self::generate_achieve_combo_from_budget(seed, budget),
            ConstraintType::NoBonusUsed => LevelConstraintTrait::no_bonus(),
            ConstraintType::ClearGrid => LevelConstraintTrait::clear_grid(),
            ConstraintType::None => LevelConstraintTrait::none(),
        }
    }
    
    /// Returns the weighted difficulty cost for clearing N lines at once.
    /// Higher line counts are exponentially harder to achieve in practice.
    /// Line costs: 2->2, 3->4, 4->6, 5->10, 6->15, 7+->20
    /// 
    /// Used by constraint generation to determine how many "times" a constraint requires.
    /// Formula: times = budget / line_cost(lines)
    fn line_cost(lines: u8) -> u8 {
        match lines {
            0 | 1 => 1,
            2 => 2,
            3 => 4,
            4 => 6,
            5 => 10,
            6 => 15,
            _ => 20,  // 7+ (exceptional)
        }
    }
    
    /// Cost for breaking blocks of a given size.
    /// Smaller blocks are easier to find, so cheaper.
    /// size 1->3, 2->4, 3->5, 4->6
    fn break_cost(size: u8) -> u8 {
        match size {
            1 => 3,
            2 => 4,
            3 => 5,
            _ => 6,  // size 4+
        }
    }
    
    /// Cost for Fill constraints by target row.
    /// Higher rows are exponentially harder to maintain.
    /// row 5->2, 6->5, 7->10, 8->17, 9->26
    fn fill_row_cost(row: u8) -> u8 {
        match row {
            0 | 1 | 2 | 3 | 4 | 5 => 2,
            6 => 5,
            7 => 10,
            8 => 17,
            _ => 26,  // row 9+
        }
    }
    
    /// Max times for a Fill constraint by row (cap to keep it reasonable).
    /// row 5->4, 6->3, 7->2, 8->2, 9->1
    fn fill_times_cap(row: u8) -> u8 {
        match row {
            0 | 1 | 2 | 3 | 4 | 5 => 4,
            6 => 3,
            7 => 2,
            8 => 2,
            _ => 1,  // row 9
        }
    }
    
    /// Triangular number: n*(n-1)/2 — cost function for AchieveCombo.
    /// combo 3->3, 4->6, 5->10, 6->15, 7->21, 8->28, 9->36
    fn combo_cost(combo: u8) -> u8 {
        if combo <= 2 {
            1
        } else {
            let c: u16 = combo.into();
            let cost: u16 = c * (c - 1) / 2;
            if cost > 255 {
                255
            } else {
                cost.try_into().unwrap()
            }
        }
    }
    
    /// Generate a ClearLines constraint from budget.
    /// Algorithm:
    /// 1. Determine line range from budget (min 2, max capped by what budget supports)
    /// 2. Roll lines with skew-high
    /// 3. Compute times = budget / line_cost(lines), skew-high roll
    fn generate_clear_lines_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Determine max feasible lines (find highest line count where line_cost <= budget)
        let mut max_lines: u8 = 2;
        if budget >= Self::line_cost(3) { max_lines = 3; }
        if budget >= Self::line_cost(4) { max_lines = 4; }
        if budget >= Self::line_cost(5) { max_lines = 5; }
        if budget >= Self::line_cost(6) { max_lines = 6; }
        if budget >= Self::line_cost(7) { max_lines = 7; }
        
        // Roll lines [2, max_lines] with skew-high (max of two rolls)
        let lines_range: u8 = max_lines - 2 + 1;
        let l1: u8 = 2 + ((seed_u256 % lines_range.into()).try_into().unwrap());
        let l2: u8 = 2 + (((seed_u256 / 100) % lines_range.into()).try_into().unwrap());
        let lines: u8 = if l1 > l2 { l1 } else { l2 };
        
        // Compute times_cap = budget / line_cost(lines), min 1
        let cost = Self::line_cost(lines);
        let times_cap: u8 = if cost > 0 { budget / cost } else { 1 };
        let times_cap = if times_cap < 1 { 1 } else { times_cap };
        
        // Roll times [1, times_cap] with skew-high
        let times: u8 = if times_cap <= 1 {
            1
        } else {
            let t1: u8 = 1 + (((seed_u256 / 1000) % times_cap.into()).try_into().unwrap());
            let t2: u8 = 1 + (((seed_u256 / 10000) % times_cap.into()).try_into().unwrap());
            if t1 > t2 { t1 } else { t2 }
        };
        
        LevelConstraintTrait::clear_lines(lines, times)
    }
    
    /// Generate a BreakBlocks constraint from budget.
    /// - Block size varies by difficulty tier: tier 0-1 max=2, tier 2-3 max=3, tier 4+ max=4
    /// - BREAK_SCALE = 8: blocks_max = (budget * 8) / break_cost(size), clamped [4, 120]
    /// - Skew-high roll for block count
    fn generate_break_blocks_from_budget(seed: felt252, budget: u8, tier: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Max block size by tier
        let max_size: u8 = if tier <= 1 { 2 } else if tier <= 3 { 3 } else { 4 };
        
        // Roll size [1, max_size]
        let size_range: u8 = max_size;
        let size: u8 = 1 + ((seed_u256 % size_range.into()).try_into().unwrap());
        
        // Compute blocks_max = (budget * BREAK_SCALE) / break_cost(size)
        let break_scale: u16 = 8;
        let raw: u16 = (budget.into() * break_scale) / Self::break_cost(size).into();
        
        // Clamp [4, 120]
        let blocks_max: u8 = if raw < 4 { 4 }
            else if raw > 120 { 120 }
            else { raw.try_into().unwrap() };
        
        // Roll count [4, blocks_max] with skew-high
        let count: u8 = if blocks_max <= 4 {
            4
        } else {
            let count_range: u8 = blocks_max - 4 + 1;
            let c1: u8 = 4 + (((seed_u256 / 100) % count_range.into()).try_into().unwrap());
            let c2: u8 = 4 + (((seed_u256 / 1000) % count_range.into()).try_into().unwrap());
            if c1 > c2 { c1 } else { c2 }
        };
        
        LevelConstraintTrait::break_blocks(size, count)
    }
    
    /// Generate an AchieveCombo constraint from budget.
    /// Uses triangular cost: combo_cost(c) = c*(c-1)/2
    /// Find max feasible combo where cost <= budget, cap at 9.
    /// Skew-high roll within [3, max_combo].
    fn generate_achieve_combo_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Find max feasible combo (min 3, max 9)
        let mut max_combo: u8 = 3;
        let mut c: u8 = 4;
        while c <= 9 {
            if Self::combo_cost(c) <= budget {
                max_combo = c;
            }
            c += 1;
        };
        
        // Roll combo [3, max_combo] with skew-high
        let combo_range: u8 = max_combo - 3 + 1;
        let co1: u8 = 3 + ((seed_u256 % combo_range.into()).try_into().unwrap());
        let co2: u8 = 3 + (((seed_u256 / 100) % combo_range.into()).try_into().unwrap());
        let combo: u8 = if co1 > co2 { co1 } else { co2 };
        
        LevelConstraintTrait::achieve_combo(combo)
    }
    
    /// Generate a Fill constraint from budget.
    /// Find max feasible row where fill_row_cost(row) <= budget.
    /// Skew-high roll for row, then compute times from budget/row_cost clamped by fill_times_cap.
    fn generate_fill_from_budget(seed: felt252, budget: u8) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Find max feasible row (min 5, max 9)
        let mut max_row: u8 = 5;
        if budget >= Self::fill_row_cost(6) { max_row = 6; }
        if budget >= Self::fill_row_cost(7) { max_row = 7; }
        if budget >= Self::fill_row_cost(8) { max_row = 8; }
        if budget >= Self::fill_row_cost(9) { max_row = 9; }
        
        // Roll row [5, max_row] with skew-high
        let row_range: u8 = max_row - 5 + 1;
        let r1: u8 = 5 + ((seed_u256 % row_range.into()).try_into().unwrap());
        let r2: u8 = 5 + (((seed_u256 / 100) % row_range.into()).try_into().unwrap());
        let row: u8 = if r1 > r2 { r1 } else { r2 };
        
        // Compute times from budget, capped by fill_times_cap
        let row_cost = Self::fill_row_cost(row);
        let raw_times: u8 = if row_cost > 0 { budget / row_cost } else { 1 };
        let max_times = Self::fill_times_cap(row);
        let times_cap: u8 = if raw_times > max_times { max_times }
            else if raw_times < 1 { 1 }
            else { raw_times };
        
        // Roll times [1, times_cap]
        let times: u8 = if times_cap <= 1 {
            1
        } else {
            let t1: u8 = 1 + (((seed_u256 / 1000) % times_cap.into()).try_into().unwrap());
            let t2: u8 = 1 + (((seed_u256 / 10000) % times_cap.into()).try_into().unwrap());
            if t1 > t2 { t1 } else { t2 }
        };
        
        LevelConstraintTrait::fill_and_clear(row, times)
    }
    
    /// Maybe generate a secondary constraint.
    /// Rolls dual_chance to decide if secondary exists.
    /// If yes, rolls type (different from primary) or NoBonusUsed.
    fn maybe_generate_secondary(
        seed: felt252,
        budget_min: u8,
        budget_max: u8,
        tier: u8,
        dual_chance: u8,
        secondary_no_bonus_chance: u8,
        primary_type: ConstraintType,
    ) -> LevelConstraint {
        let seed_u256: u256 = seed.into();
        
        // Roll to see if we get a secondary constraint at all
        let dual_roll: u8 = ((seed_u256 / 100000) % 100).try_into().unwrap();
        if dual_roll >= dual_chance {
            return LevelConstraintTrait::none();
        }
        
        // Roll to see if secondary is NoBonusUsed
        let no_bonus_roll: u8 = ((seed_u256 / 1000000) % 100).try_into().unwrap();
        if no_bonus_roll < secondary_no_bonus_chance {
            return LevelConstraintTrait::no_bonus();
        }
        
        // Roll a different type than primary
        let secondary_seed: felt252 = (seed_u256 / 10000000).try_into().unwrap();
        let mut secondary_type = Self::select_constraint_type(secondary_seed, tier);
        
        // If same type as primary, shift to next type
        if secondary_type == primary_type {
            secondary_type = Self::next_regular_type(secondary_type);
        }
        
        // Roll a new budget for the secondary
        let budget_range: u8 = if budget_max > budget_min { budget_max - budget_min + 1 } else { 1 };
        let sec_seed_u256: u256 = secondary_seed.into();
        let budget: u8 = budget_min + ((sec_seed_u256 % budget_range.into()).try_into().unwrap());
        
        Self::generate_constraint_from_budget(secondary_seed, budget, secondary_type, tier)
    }
    
    /// Cycle to next regular constraint type (ClearLines -> BreakBlocks -> Fill -> AchieveCombo -> ClearLines)
    fn next_regular_type(t: ConstraintType) -> ConstraintType {
        match t {
            ConstraintType::ClearLines => ConstraintType::BreakBlocks,
            ConstraintType::BreakBlocks => ConstraintType::FillAndClear,
            ConstraintType::FillAndClear => ConstraintType::AchieveCombo,
            ConstraintType::AchieveCombo => ConstraintType::ClearLines,
            _ => ConstraintType::ClearLines,  // Fallback for boss-only types
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
            level, LevelConstants::BASE_MOVES, LevelConstants::MAX_MOVES
        )
    }
    
    /// Calculate base moves with custom settings
    /// Linear scaling from base_moves at level 1 to max_moves at level 50
    #[inline(always)]
    fn calculate_base_moves_with_settings(level: u8, base_moves: u16, max_moves: u16) -> u16 {
        if level <= 1 {
            return base_moves;
        }

        let range = max_moves - base_moves;
        let progress: u32 = (level.into() - 1) * range.into() / 49;
        base_moves + progress.try_into().unwrap()
    }

    /// Calculate ratio for this level (scaled by 100)
    /// Linear scaling: 80 (0.80) at level 1, 180 (1.80) at level 50 (using defaults)
    #[inline(always)]
    fn calculate_ratio(level: u8) -> u16 {
        Self::calculate_ratio_with_settings(
            level, LevelConstants::BASE_RATIO_X100, LevelConstants::MAX_RATIO_X100
        )
    }
    
    /// Calculate ratio with custom settings
    /// Linear scaling from base_ratio at level 1 to max_ratio at level 50
    #[inline(always)]
    fn calculate_ratio_with_settings(level: u8, base_ratio_x100: u16, max_ratio_x100: u16) -> u16 {
        if level <= 1 {
            return base_ratio_x100;
        }

        let range = max_ratio_x100 - base_ratio_x100;
        let progress: u32 = (level.into() - 1) * range.into() / 49;
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

    /// Generate random bonus type based on seed (DEPRECATED - no longer used in V3.0)
    /// Returns: 0 = Combo, 1 = Score, 2 = Harvest
    fn get_random_bonus_type(seed: felt252, index: u8) -> u8 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(seed);
        let state = state.update(index.into());
        let state = state.update('BONUS');
        let hash = state.finalize();

        let hash_u256: u256 = hash.into();
        (hash_u256 % 3).try_into().unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::{LevelGenerator, LevelGeneratorTrait, LevelConstants};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::constraint::ConstraintType;
    use zkube::models::config::{GameSettings, GameSettingsTrait};

    const TEST_SEED: felt252 = 'TEST_SEED_12345';
    const DIFFERENT_SEED: felt252 = 'DIFFERENT_SEED';

    #[test]
    fn test_base_moves_scaling() {
        assert!(LevelGeneratorTrait::calculate_base_moves(1) == 20, "Level 1 should have 20 moves");
        assert!(
            LevelGeneratorTrait::calculate_base_moves(50) == 60,
            "Level 50 should have 60 moves",
        );

        let mid = LevelGeneratorTrait::calculate_base_moves(25);
        assert!(mid >= 39 && mid <= 41, "Level 25 should be around 40 moves");
    }

    #[test]
    fn test_ratio_scaling() {
        assert!(LevelGeneratorTrait::calculate_ratio(1) == 80, "Level 1 should have ratio 80");
        assert!(
            LevelGeneratorTrait::calculate_ratio(50) == 180, "Level 50 should have ratio 180",
        );

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
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);

        assert!(config1.points_required == config2.points_required, "Points should match");
        assert!(config1.max_moves == config2.max_moves, "Moves should match");
        assert!(config1.difficulty == config2.difficulty, "Difficulty should match");
    }

    #[test]
    fn test_correlated_variance() {
        // Test that variance is correlated (ratio stays approximately constant)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Base at level 50: moves = 60, ratio_x100 = 180, points = 60 × 1.80 = 108
        // With variance (±5%), both should scale together maintaining the ratio
        // Ratio should be approximately: points_required * 100 / max_moves
        let actual_ratio = config.points_required.into() * 100_u32 / config.max_moves.into();
        
        // The ratio should be close to the base ratio for level 50 (~180)
        // Allow for rounding errors
        assert!(actual_ratio >= 165 && actual_ratio <= 195, "Ratio should be approximately 180");
    }

    #[test]
    fn test_different_seeds_different_configs() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25, settings);

        // At least one of points or moves should differ (very high probability)
        let points_differ = config1.points_required != config2.points_required;
        let moves_differ = config1.max_moves != config2.max_moves;

        assert!(points_differ || moves_differ, "Different seeds should produce different configs");
    }

    #[test]
    fn test_level_50_cap() {
        // Level 50 and 100 should have same base difficulty (Master)
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        let config100 = LevelGeneratorTrait::generate(TEST_SEED, 100, settings);

        assert!(config50.difficulty == Difficulty::Master, "Level 50 should be Master");
        assert!(config100.difficulty == Difficulty::Master, "Level 100 should be Master (capped)");
    }

    #[test]
    fn test_no_constraint_early_levels() {
        // Default constraint_start_level is 3, so levels 1-2 have no constraints
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        let config2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings);

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
    fn test_cube_thresholds() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Cube thresholds should be percentages of max_moves
        let expected_3_cube = config.max_moves * 40 / 100;
        let expected_2_cube = config.max_moves * 70 / 100;

        assert!(
            config.cube_3_threshold == expected_3_cube, "3-cube threshold should be 40% of max",
        );
        assert!(
            config.cube_2_threshold == expected_2_cube, "2-cube threshold should be 70% of max",
        );
    }

    #[test]
    fn test_generate_level_1() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);

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
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);

        // Level 25: base_moves~40, ratio~1.30, base_points~52
        // With ±5% variance: moves ~38-42, points ~49-55
        // With non-linear progression: Level 25 is VeryHard (tier 5, starts at level 25)
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required >= 47 && config.points_required <= 57, "Points in range");
        assert!(config.max_moves >= 36 && config.max_moves <= 44, "Moves in range");
        assert!(config.difficulty == Difficulty::VeryHard, "Level 25 should be VeryHard");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds ordered");
        assert!(config.cube_2_threshold < config.max_moves, "2-cube threshold < max");
    }

    #[test]
    fn test_generate_level_50() {
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);

        // Level 50 (max): base_moves=60, ratio=1.80, base_points=108
        // With ±5% variance: moves ~57-63, points ~103-113
        assert!(config.level == 50, "Level should be 50");
        assert!(
            config.points_required >= 100 && config.points_required <= 116, "Points in range",
        );
        assert!(config.max_moves >= 55 && config.max_moves <= 65, "Moves in range");
        assert!(config.difficulty == Difficulty::Master, "Level 50 should be Master");
    }

    #[test]
    fn test_random_bonus_distribution() {
        // Test that we get different bonus types
        let bonus1 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 0);
        let bonus2 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 1);
        let bonus3 = LevelGeneratorTrait::get_random_bonus_type(TEST_SEED, 2);

        // All should be valid bonus types (0, 1, or 2)
        assert!(bonus1 <= 2, "Bonus type should be 0-2");
        assert!(bonus2 <= 2, "Bonus type should be 0-2");
        assert!(bonus3 <= 2, "Bonus type should be 0-2");
    }
    
    #[test]
    fn test_generate_default_settings() {
        // Test generate with default settings
        let settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        
        // Verify it produces reasonable values
        assert!(config.level == 25, "Level should be 25");
        assert!(config.points_required > 0, "Points should be positive");
        assert!(config.max_moves > 0, "Moves should be positive");
        assert!(config.cube_3_threshold < config.cube_2_threshold, "Cube thresholds should be ordered");
    }
    
    #[test]
    fn test_generate_custom_moves() {
        // Create custom settings with different parameters
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.base_moves = 30;  // Higher than default 20
        settings.max_moves = 80;   // Higher than default 60
        settings.cube_3_percent = 30;  // Stricter than default 40
        settings.cube_2_percent = 60;  // Stricter than default 70
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        
        // At level 1, should use base_moves (with variance)
        // With ±5% variance: 30 -> 28-32
        assert!(config.max_moves >= 27 && config.max_moves <= 33, "Custom moves should be around 30");
        
        // Cube thresholds should use custom percentages
        let expected_3_cube = config.max_moves * 30 / 100;
        let expected_2_cube = config.max_moves * 60 / 100;
        assert!(config.cube_3_threshold == expected_3_cube, "Custom 3-cube threshold");
        assert!(config.cube_2_threshold == expected_2_cube, "Custom 2-cube threshold");
    }
    
    #[test]
    fn test_generate_tournament_mode() {
        // Tournament mode: harder thresholds, same base moves
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.cube_3_percent = 25;  // Much stricter
        settings.cube_2_percent = 50;  // Much stricter
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        
        // Cube thresholds should be much stricter
        let expected_3_cube = config.max_moves * 25 / 100;
        let expected_2_cube = config.max_moves * 50 / 100;
        assert!(config.cube_3_threshold == expected_3_cube, "Tournament 3-cube threshold");
        assert!(config.cube_2_threshold == expected_2_cube, "Tournament 2-cube threshold");
    }
    
    #[test]
    fn test_generate_constraints_disabled() {
        // Disable constraints entirely
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraints_enabled = 0;
        
        // Even at high levels, should have no constraint
        let config = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        assert!(
            config.constraint.constraint_type == ConstraintType::None,
            "Should have no constraint when disabled"
        );
        
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        assert!(
            config_50.constraint.constraint_type == ConstraintType::None,
            "Level 50 should have no constraint when disabled"
        );
    }
    
    #[test]
    fn test_generate_custom_constraint_start() {
        // Start constraints at level 20 instead of 5
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.constraint_start_level = 20;
        
        // Level 15 should have no constraint
        let config_15 = LevelGeneratorTrait::generate(TEST_SEED, 15, settings);
        assert!(
            config_15.constraint.constraint_type == ConstraintType::None,
            "Level 15 should have no constraint"
        );
        
        // Level 20 might have a constraint (depending on RNG)
        let _config_20 = LevelGeneratorTrait::generate(TEST_SEED, 20, settings);
        // We can't assert the specific type since it's random, but it should use generate_constraint
    }
    
    #[test]
    fn test_generate_custom_difficulty_progression() {
        // Custom tier thresholds for faster early progression
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.tier_1_threshold = 2;   // Easy starts at level 2
        settings.tier_2_threshold = 5;   // Medium starts at level 5
        settings.tier_3_threshold = 10;  // MediumHard starts at level 10
        settings.tier_4_threshold = 15;  // Hard starts at level 15
        settings.tier_5_threshold = 25;  // VeryHard starts at level 25
        settings.tier_6_threshold = 40;  // Expert starts at level 40
        settings.tier_7_threshold = 60;  // Master starts at level 60
        
        let config_1 = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        assert!(config_1.difficulty == Difficulty::VeryEasy, "Level 1 should be VeryEasy");
        
        let config_2 = LevelGeneratorTrait::generate(TEST_SEED, 2, settings);
        assert!(config_2.difficulty == Difficulty::Easy, "Level 2 should be Easy");
        
        let config_5 = LevelGeneratorTrait::generate(TEST_SEED, 5, settings);
        assert!(config_5.difficulty == Difficulty::Medium, "Level 5 should be Medium");
        
        let config_10 = LevelGeneratorTrait::generate(TEST_SEED, 10, settings);
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
        let config1 = LevelGeneratorTrait::generate(TEST_SEED, 25, settings);
        let config2 = LevelGeneratorTrait::generate(DIFFERENT_SEED, 25, settings);
        
        // Points should be exactly base calculation (no variance)
        // Level 25: base_moves ~28.5, ratio ~125, points ~35
        // Without variance, both seeds should give same result
        assert!(config1.points_required == config2.points_required, "Zero variance should give same points");
        assert!(config1.max_moves == config2.max_moves, "Zero variance should give same moves");
    }
    
    #[test]
    fn test_generate_custom_level_cap() {
        // Lower level cap to 30 (below default of 50)
        let mut settings = GameSettingsTrait::new_with_defaults(0, Difficulty::Increasing);
        settings.level_cap = 30;
        
        // Level 30 and 50 should have same scaling (both at cap)
        let config_30 = LevelGeneratorTrait::generate(TEST_SEED, 30, settings);
        let config_50 = LevelGeneratorTrait::generate(TEST_SEED, 50, settings);
        
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
        settings.base_moves = 30;       // More moves at start
        settings.max_moves = 100;       // Way more moves at high levels
        settings.base_ratio_x100 = 50;  // Lower points/move ratio (easier)
        settings.max_ratio_x100 = 150;  // Still easier at high levels
        settings.cube_3_percent = 50;   // More generous 3-cube threshold
        settings.cube_2_percent = 80;   // More generous 2-cube threshold
        settings.constraints_enabled = 0; // No constraints
        // Slow difficulty progression - stay VeryEasy longer
        settings.tier_1_threshold = 20;  // Easy starts at level 20
        settings.tier_2_threshold = 40;  // Medium starts at level 40
        settings.tier_3_threshold = 60;  // MediumHard starts at level 60
        settings.tier_4_threshold = 75;  // Hard starts at level 75
        settings.tier_5_threshold = 85;  // VeryHard starts at level 85
        settings.tier_6_threshold = 95;  // Expert starts at level 95
        settings.tier_7_threshold = 100; // Master starts at level 100
        
        let config = LevelGeneratorTrait::generate(TEST_SEED, 1, settings);
        
        // Should have easier parameters
        assert!(config.max_moves >= 27, "Should have more moves"); // ~30 with variance
        assert!(config.difficulty == Difficulty::VeryEasy, "Should be VeryEasy difficulty");
        assert!(config.constraint.constraint_type == ConstraintType::None, "Should have no constraint");
    }
}
