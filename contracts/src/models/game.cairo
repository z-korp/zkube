use alexandria_math::BitShift;
use alexandria_math::fast_power::fast_power;
use core::hash::HashStateTrait;
use core::num::traits::zero::Zero;
use core::poseidon::{HashState, PoseidonTrait};
use core::traits::Into;
use zkube::constants;
use zkube::helpers::packing::{RunData, RunDataHelpersTrait, RunDataPackingTrait};
use zkube::helpers::scoring::saturating_add_u16;
use zkube::types::bonus::{Bonus, BonusTrait};

/// Game model for the level-based system
/// All run progress is packed into run_data for efficient storage
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    // ----------------------------------------
    // Grid state (changes every move)
    // ----------------------------------------
    pub blocks: felt252, // 10 lines of 3x8 bits = 240 bits
    pub next_row: u32, // 3x8 bits per row = 24 bits
    // ----------------------------------------
    // Per-level combo tracking (resets each level)
    // ----------------------------------------
    pub combo_counter: u8, // Current combo streak this level
    pub max_combo: u8, // Best combo this level
    // ----------------------------------------
    // Level system (bit-packed run progress)
    // ----------------------------------------
    pub run_data: felt252, // Bit-packed: level, score, moves, bonuses, stars, etc.
    pub level_stars: felt252, // 2 bits per level × 50 levels = 100 bits
    // ----------------------------------------
    // Timestamps
    // ----------------------------------------
    pub started_at: u64, // Run start timestamp
    // ----------------------------------------
    // Game state
    // ----------------------------------------
    pub over: bool,
}

/// Separate model for game seed (kept for VRF consistency)
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct GameSeed {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
    pub vrf_enabled: bool,
}

/// Current level configuration - synced to client via Torii
/// This is the single source of truth for level config, eliminating
/// the need for client-side level generation (which can't work with VRF)
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct GameLevel {
    #[key]
    pub game_id: u64,
    pub level: u8,
    pub points_required: u16,
    pub max_moves: u16,
    pub difficulty: u8, // Difficulty enum as u8
    // Primary constraint
    pub constraint_type: u8, // ConstraintType enum as u8 (0-6)
    pub constraint_value: u8, // Constraint parameter
    pub constraint_count: u8, // Required count
    // Secondary constraint
    pub constraint2_type: u8,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    // Tertiary constraint (boss levels 40/50)
    pub constraint3_type: u8,
    pub constraint3_value: u8,
    pub constraint3_count: u8,
    // Cube thresholds
    pub cube_3_threshold: u16, // Moves threshold for 3 cubes
    pub cube_2_threshold: u16 // Moves threshold for 2 cubes
}
use zkube::types::level::LevelConfig;

#[generate_trait]
pub impl GameLevelImpl of GameLevelTrait {
    /// Create a GameLevel model from a LevelConfig and game_id
    fn from_level_config(game_id: u64, config: LevelConfig) -> GameLevel {
        GameLevel {
            game_id,
            level: config.level,
            points_required: config.points_required,
            max_moves: config.max_moves,
            difficulty: config.difficulty.into(),
            constraint_type: config.constraint.constraint_type.into(),
            constraint_value: config.constraint.value,
            constraint_count: config.constraint.required_count,
            constraint2_type: config.constraint_2.constraint_type.into(),
            constraint2_value: config.constraint_2.value,
            constraint2_count: config.constraint_2.required_count,
            constraint3_type: config.constraint_3.constraint_type.into(),
            constraint3_value: config.constraint_3.value,
            constraint3_count: config.constraint_3.required_count,
            cube_3_threshold: config.cube_3_threshold,
            cube_2_threshold: config.cube_2_threshold,
        }
    }
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    /// Create an empty game shell (no grid initialization)
    /// Grid should be initialized separately via grid_system.initialize_grid()
    fn new_empty(game_id: u64, started_at: u64) -> Game {
        let run_data = RunDataPackingTrait::new();

        Game {
            game_id,
            blocks: 0,
            next_row: 0,
            combo_counter: 0,
            max_combo: 0,
            run_data: run_data.pack(),
            level_stars: 0,
            started_at,
            over: false,
        }
    }

    /// Get unpacked run data
    #[inline(always)]
    fn get_run_data(self: Game) -> RunData {
        RunDataPackingTrait::unpack(self.run_data)
    }

    /// Set run data (repack)
    #[inline(always)]
    fn set_run_data(ref self: Game, data: RunData) {
        self.run_data = data.pack();
    }

    /// Get current level
    #[inline(always)]
    fn get_level(self: Game) -> u8 {
        self.get_run_data().current_level
    }

    /// Get level score
    #[inline(always)]
    fn get_level_score(self: Game) -> u8 {
        self.get_run_data().level_score
    }

    /// Get level moves
    #[inline(always)]
    fn get_level_moves(self: Game) -> u8 {
        self.get_run_data().level_moves
    }

    /// Get total cubes
    #[inline(always)]
    fn get_total_cubes(self: Game) -> u16 {
        self.get_run_data().total_cubes
    }

    /// Get combo bonus count from inventory
    #[inline(always)]
    fn get_combo_count(self: Game) -> u8 {
        self.get_run_data().get_bonus_charges(1)
    }

    /// Get score bonus count from inventory
    #[inline(always)]
    fn get_score_count(self: Game) -> u8 {
        self.get_run_data().get_bonus_charges(2)
    }

    /// Get harvest bonus count from inventory
    #[inline(always)]
    fn get_harvest_count(self: Game) -> u8 {
        self.get_run_data().get_bonus_charges(3)
    }

    /// Get wave bonus count from inventory
    #[inline(always)]
    fn get_wave_count(self: Game) -> u8 {
        self.get_run_data().get_bonus_charges(4)
    }

    /// Get supply bonus count from inventory
    #[inline(always)]
    fn get_supply_count(self: Game) -> u8 {
        self.get_run_data().get_bonus_charges(5)
    }

    /// Check if bonus was used this level (for NoBonusUsed constraint)
    #[inline(always)]
    fn is_bonus_used_this_level(self: Game) -> bool {
        self.get_run_data().bonus_used_this_level
    }

    /// Get constraint progress (primary constraint)
    #[inline(always)]
    fn get_constraint_progress(self: Game) -> u8 {
        self.get_run_data().constraint_progress
    }

    /// Get constraint_2 progress (secondary constraint)
    #[inline(always)]
    fn get_constraint_2_progress(self: Game) -> u8 {
        self.get_run_data().constraint_2_progress
    }

    /// Get constraint_3 progress (tertiary constraint)
    #[inline(always)]
    fn get_constraint_3_progress(self: Game) -> u8 {
        self.get_run_data().constraint_3_progress
    }

    /// Get the level for a given bonus skill id
    /// @param bonus_type: 1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply
    fn get_bonus_level(self: Game, bonus_type: u8) -> u8 {
        let run_data = self.get_run_data();
        run_data.get_bonus_level(bonus_type)
    }

    /// Get total score (cumulative across all levels)
    #[inline(always)]
    fn get_total_score(self: Game) -> u16 {
        self.get_run_data().total_score
    }

    /// Check if grid is full (game over condition)
    #[inline(always)]
    fn assess_over(ref self: Game) {
        let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
            * constants::ROW_BIT_COUNT.into();
        let div: u256 = fast_power(2, exp) - 1;
        self.over = self.blocks.into() / div > 0;
    }

    /// Generate a level-specific seed (for starting new levels with different grids)
    #[inline(always)]
    fn generate_level_seed(base_seed: felt252, level: u8) -> felt252 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(base_seed);
        let state = state.update(level.into());
        let state = state.update('LEVEL_SEED'); // Domain separator
        state.finalize()
    }

    /// Complete the current level and advance to next (run_data only, no grid changes)
    /// Grid should be reset separately via grid_system.reset_grid_for_level()
    /// Returns (cubes_earned, bonuses_to_award, is_victory)
    fn complete_level_data(
        ref self: Game, cubes: u8, bonuses: u8, boss_bonus: u16, is_victory: bool,
    ) -> (u8, u8, bool) {
        let mut run_data = self.get_run_data();

        // Add cubes to total
        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cubes.into());

        // Boss cube bonus
        if boss_bonus > 0 {
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, boss_bonus);
        }

        if is_victory {
            // Mark run as completed (victory!)
            run_data.run_completed = true;
            self.set_run_data(run_data);
            return (cubes, bonuses, true);
        }

        // Advance to next level
        run_data.current_level += 1;

        // Reset per-level state
        run_data.level_score = 0;
        run_data.level_moves = 0;
        run_data.constraint_progress = 0;
        run_data.constraint_2_progress = 0;
        run_data.constraint_3_progress = 0;
        run_data.bonus_used_this_level = false;

        // Reset per-level combos
        self.combo_counter = 0;
        self.max_combo = 0;

        self.set_run_data(run_data);

        (cubes, bonuses, false)
    }

    /// Get stars earned for a specific level (1-indexed, returns 0-3)
    /// Each level uses 2 bits: level 1 at bits 0-1, level 2 at bits 2-3, etc.
    fn get_level_stars(self: Game, level: u8) -> u8 {
        assert!(level >= 1 && level <= 50, "Level must be 1-50");
        let shift: u32 = ((level - 1) * 2).into();
        let data: u256 = self.level_stars.into();
        (BitShift::shr(data, shift.into()) & 0x3_u256).try_into().unwrap()
    }

    /// Set stars earned for a specific level (1-indexed, value 0-3)
    fn set_level_stars(ref self: Game, level: u8, stars: u8) {
        assert!(level >= 1 && level <= 50, "Level must be 1-50");
        assert!(stars <= 3, "Stars must be 0-3");
        let shift: u32 = ((level - 1) * 2).into();
        let mut data: u256 = self.level_stars.into();
        let mask: u256 = BitShift::shl(0x3_u256, shift.into());
        data = (data & ~mask) | BitShift::shl(stars.into() & 0x3_u256, shift.into());
        self.level_stars = data.try_into().unwrap();
    }
}

pub impl ZeroableGame of Zero<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game {
            game_id: 0,
            blocks: 0,
            next_row: 0,
            combo_counter: 0,
            max_combo: 0,
            run_data: 0,
            level_stars: 0,
            started_at: 0,
            over: false,
        }
    }

    #[inline(always)]
    fn is_zero(self: @Game) -> bool {
        *(self.next_row) == 0
    }

    #[inline(always)]
    fn is_non_zero(self: @Game) -> bool {
        !self.is_zero()
    }
}

#[generate_trait]
pub impl GameAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Game) {
        assert!(self.is_non_zero(), "Game {} does not exist", self.game_id);
    }

    #[inline(always)]
    fn assert_not_over(self: Game) {
        assert!(!self.over, "Game {} is over", self.game_id);
    }

    #[inline(always)]
    fn assert_is_over(self: Game) {
        assert!(self.over || self.is_zero(), "Game {} is not over", self.game_id);
    }

    #[inline(always)]
    fn assert_bonus_available(self: Game, bonus: Bonus) {
        let run_data = self.get_run_data();
        let count = run_data.get_bonus_charges(bonus.to_type_code());
        assert!(count > 0, "Game {} bonus is not available", self.game_id);
    }
}
