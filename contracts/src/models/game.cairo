use alexandria_math::BitShift;
use core::hash::HashStateTrait;
use core::num::traits::zero::Zero;
use core::poseidon::{HashState, PoseidonTrait};
use core::traits::Into;
use zkube::constants;
use zkube::helpers::packing::{RunData, RunDataPackingTrait};

/// Game model for the level-based system
/// All run progress is packed into run_data for efficient storage
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: felt252,
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
    pub run_data: felt252, // Bit-packed: level/score/moves + zone/endless state
    pub level_stars: u32, // 2 bits per level × 10 levels = 20 bits used
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
    pub game_id: felt252,
    pub seed: felt252, // Original VRF seed — set once at game creation, NEVER changes
    pub level_seed: felt252, // Per-level seed — updated on each level advance
    pub vrf_enabled: bool,
}

/// Current level configuration - synced to client via Torii
/// This is the single source of truth for level config, eliminating
/// the need for client-side level generation (which can't work with VRF)
#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct GameLevel {
    #[key]
    pub game_id: felt252,
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
    // Mutator
    pub mutator_id: u8 // Active mutator for this level (0=none)
}
use zkube::types::level::LevelConfig;

#[generate_trait]
pub impl GameLevelImpl of GameLevelTrait {
    /// Create a GameLevel model from a LevelConfig and game_id
    fn from_level_config(game_id: felt252, config: LevelConfig) -> GameLevel {
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
            mutator_id: 0,
        }
    }
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    /// Create an empty game shell (no grid initialization)
    /// Grid should be initialized separately via grid_system.initialize_grid()
    fn new_empty(
        game_id: felt252, started_at: u64, zone_id: u8, active_mutator_id: u8, run_type: u8,
    ) -> Game {
        let run_data = RunDataPackingTrait::new(zone_id, active_mutator_id, run_type);

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

    /// Get total score (cumulative across all levels)
    #[inline(always)]
    fn get_total_score(self: Game) -> u32 {
        self.get_run_data().total_score
    }

    /// Check if grid is full (game over condition)
    #[inline(always)]
    fn assess_over(ref self: Game) {
        let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
            * constants::ROW_BIT_COUNT.into();
        let div: u256 = BitShift::shl(1_u256, exp) - 1;
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

    /// Get stars earned for a specific level (1-indexed, returns 0-3)
    /// Each level uses 2 bits: level 1 at bits 0-1, level 2 at bits 2-3, etc.
    fn get_level_stars(self: Game, level: u8) -> u8 {
        assert!(level >= 1 && level <= 10, "Level must be 1-10");
        let shift: u32 = ((level - 1) * 2).into();
        ((BitShift::shr(self.level_stars, shift) & 0x3_u32)).try_into().unwrap()
    }

    /// Set stars earned for a specific level (1-indexed, value 0-3)
    fn set_level_stars(ref self: Game, level: u8, stars: u8) {
        assert!(level >= 1 && level <= 10, "Level must be 1-10");
        assert!(stars <= 3, "Stars must be 0-3");
        let shift: u32 = ((level - 1) * 2).into();
        let mask: u32 = BitShift::shl(0x3_u32, shift);
        let star_val: u32 = (stars & 0x3).into();
        self.level_stars = (self.level_stars & ~mask) | BitShift::shl(star_val, shift);
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
}
