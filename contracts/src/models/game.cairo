use core::traits::Into;
use core::num::traits::zero::Zero;
use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use alexandria_math::fast_power::fast_power;

use zkube::constants;
use zkube::types::difficulty::Difficulty;
use zkube::helpers::math::Math;
use zkube::helpers::packer::Packer;
use zkube::helpers::controller::Controller;
use zkube::helpers::packing::{RunData, RunDataPackingTrait};
use zkube::types::bonus::{Bonus, BonusTrait};
use zkube::types::level::LevelConfigTrait;
use zkube::types::constraint::LevelConstraintTrait;
use zkube::helpers::level::{LevelGenerator, LevelGeneratorTrait};

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
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    /// Create a new game with level system
    fn new(game_id: u64, seed: felt252, started_at: u64) -> Game {
        // Get level 1 config
        let level_config = LevelGeneratorTrait::generate(seed, 1);

        // Generate level-specific seed so each level has a different starting grid
        let level_seed = Self::generate_level_seed(seed, 1);

        // Create initial row
        let row = Controller::create_line(level_seed, level_config.difficulty);

        // Initialize run_data with level 1
        let run_data = RunDataPackingTrait::new();

        let mut game = Game {
            game_id,
            blocks: 0,
            next_row: row,
            combo_counter: 0,
            max_combo: 0,
            run_data: run_data.pack(),
            started_at,
            over: false,
        };

        // Fill initial grid
        game.start(level_config.difficulty, level_seed);
        game
    }

    /// Initialize the grid with starting blocks
    fn start(ref self: Game, difficulty: Difficulty, base_seed: felt252) {
        let mut counter = 0;
        let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
        loop {
            if self.blocks.into() / div > 0 {
                break;
            };
            self.insert_new_line(difficulty, base_seed);
            self.assess_game(ref counter);
        };
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

    /// Get total stars
    #[inline(always)]
    fn get_total_stars(self: Game) -> u16 {
        self.get_run_data().total_stars
    }

    /// Get hammer count from inventory
    #[inline(always)]
    fn get_hammer_count(self: Game) -> u8 {
        self.get_run_data().hammer_count
    }

    /// Get wave count from inventory
    #[inline(always)]
    fn get_wave_count(self: Game) -> u8 {
        self.get_run_data().wave_count
    }

    /// Get totem count from inventory
    #[inline(always)]
    fn get_totem_count(self: Game) -> u8 {
        self.get_run_data().totem_count
    }

    /// Check if bonus was used this level (for NoBonusUsed constraint)
    #[inline(always)]
    fn is_bonus_used_this_level(self: Game) -> bool {
        self.get_run_data().bonus_used_this_level
    }

    /// Get constraint progress
    #[inline(always)]
    fn get_constraint_progress(self: Game) -> u8 {
        self.get_run_data().constraint_progress
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

    /// Insert a new line at the bottom
    #[inline(always)]
    fn insert_new_line(ref self: Game, difficulty: Difficulty, seed: felt252) -> felt252 {
        let new_seed = self.generate_seed_from_base(seed);
        let row = Controller::create_line(new_seed, difficulty);
        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.next_row = row;
        new_seed
    }

    /// Generate a deterministic seed from base seed and current state
    #[inline(always)]
    fn generate_seed_from_base(self: Game, base_seed: felt252) -> felt252 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(base_seed);
        let state = state.update(self.blocks.into());
        state.finalize()
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

    /// Make a move - returns lines cleared
    fn make_move(
        ref self: Game, seed: felt252, row_index: u8, start_index: u8, final_index: u8,
    ) -> u8 {
        // Get current level config
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);

        // Perform the swipe
        let direction = final_index > start_index;
        let count = if direction {
            final_index - start_index
        } else {
            start_index - final_index
        };
        self.blocks = Controller::swipe(self.blocks, row_index, start_index, direction, count);

        // Assess and score
        let mut lines_cleared: u8 = 0;
        let points = self.assess_game(ref lines_cleared);

        // Update level score (cap at 255 for u8)
        let new_score = run_data.level_score.into() + points;
        run_data.level_score = if new_score > 255 {
            255
        } else {
            new_score.try_into().unwrap()
        };

        // Accumulate total score (cap at 65535 for u16)
        let new_total = run_data.total_score.into() + points;
        run_data.total_score = if new_total > 65535 {
            65535
        } else {
            new_total.try_into().unwrap()
        };

        // Check grid full
        self.assess_over();
        if self.over {
            self.set_run_data(run_data);
            return 0;
        }

        // Insert new line
        self.insert_new_line(level_config.difficulty, seed);

        // Assess again after new line
        let mut more_lines: u8 = 0;
        let more_points = self.assess_game(ref more_lines);
        lines_cleared += more_lines;

        let new_score = run_data.level_score.into() + more_points;
        run_data.level_score = if new_score > 255 {
            255
        } else {
            new_score.try_into().unwrap()
        };

        // Accumulate total score
        let new_total = run_data.total_score.into() + more_points;
        run_data.total_score = if new_total > 65535 {
            65535
        } else {
            new_total.try_into().unwrap()
        };

        // Update combos based on TOTAL lines cleared in this move
        if lines_cleared > 1 {
            self.combo_counter += lines_cleared;
            self.max_combo = Math::max(self.max_combo, lines_cleared);

            // Track max combo for run
            if lines_cleared > run_data.max_combo_run {
                run_data.max_combo_run = lines_cleared;
            }
        }

        // Update constraint progress with TOTAL lines cleared in this move
        // (not separately for initial and cascade clears)
        run_data.constraint_progress = level_config
            .constraint
            .update_progress(run_data.constraint_progress, lines_cleared);

        // Increment level moves
        run_data.level_moves += 1;

        // If grid is empty, add a new line
        if self.blocks == 0 {
            self.insert_new_line(level_config.difficulty, seed);
        }

        self.set_run_data(run_data);
        lines_cleared
    }

    /// Apply a bonus
    fn apply_bonus(ref self: Game, seed: felt252, bonus: Bonus, row_index: u8, index: u8) {
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);

        // Check bonus availability
        let available = match bonus {
            Bonus::Hammer => run_data.hammer_count > 0,
            Bonus::Wave => run_data.wave_count > 0,
            Bonus::Totem => run_data.totem_count > 0,
            Bonus::None => false,
        };
        assert!(available, "Bonus not available");

        // Apply the bonus
        self.blocks = bonus.apply(self.blocks, row_index, index);

        // Decrement bonus count
        match bonus {
            Bonus::Hammer => run_data.hammer_count -= 1,
            Bonus::Wave => run_data.wave_count -= 1,
            Bonus::Totem => run_data.totem_count -= 1,
            Bonus::None => {},
        }

        // Mark bonus used for constraint tracking
        run_data.bonus_used_this_level = true;

        // Assess game
        let mut lines_cleared: u8 = 0;
        let points = self.assess_game(ref lines_cleared);

        let new_score = run_data.level_score.into() + points;
        run_data.level_score = if new_score > 255 {
            255
        } else {
            new_score.try_into().unwrap()
        };

        // Accumulate total score
        let new_total = run_data.total_score.into() + points;
        run_data.total_score = if new_total > 65535 {
            65535
        } else {
            new_total.try_into().unwrap()
        };

        if lines_cleared > 1 {
            self.combo_counter += lines_cleared;
            self.max_combo = Math::max(self.max_combo, lines_cleared);
            if lines_cleared > run_data.max_combo_run {
                run_data.max_combo_run = lines_cleared;
            }
        }

        // Update constraint progress
        run_data.constraint_progress = level_config
            .constraint
            .update_progress(run_data.constraint_progress, lines_cleared);

        // If grid is empty, add a new line
        if self.blocks == 0 {
            self.insert_new_line(level_config.difficulty, seed);
        }

        self.set_run_data(run_data);
    }

    /// Check if current level is complete
    fn is_level_complete(self: Game, seed: felt252) -> bool {
        let run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);

        level_config
            .is_complete(
                run_data.level_score.into(),
                run_data.constraint_progress,
                run_data.bonus_used_this_level,
            )
    }

    /// Check if current level failed (move limit exceeded without completing)
    fn is_level_failed(self: Game, seed: felt252) -> bool {
        let run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);

        level_config
            .is_failed(
                run_data.level_score.into(),
                run_data.level_moves.into(),
                run_data.constraint_progress,
                run_data.bonus_used_this_level,
            )
    }

    /// Complete the current level and advance to next
    /// Returns (stars_earned, bonuses_to_award)
    fn complete_level(ref self: Game, seed: felt252) -> (u8, u8) {
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);

        // Calculate stars
        let stars = level_config.calculate_stars(run_data.level_moves.into());
        let bonuses = LevelConfigTrait::get_bonus_reward(stars);

        // Add stars to total
        run_data.total_stars += stars.into();

        // Advance to next level
        run_data.current_level += 1;

        // Reset per-level state
        run_data.level_score = 0;
        run_data.level_moves = 0;
        run_data.constraint_progress = 0;
        run_data.bonus_used_this_level = false;

        // Reset per-level combos
        self.combo_counter = 0;
        self.max_combo = 0;

        self.set_run_data(run_data);

        // Reset grid with new level's difficulty
        // Use level-specific seed so each level has a different starting grid
        let new_level_config = LevelGeneratorTrait::generate(seed, run_data.current_level);
        let level_seed = Self::generate_level_seed(seed, run_data.current_level);
        self.blocks = 0;
        self.next_row = Controller::create_line(level_seed, new_level_config.difficulty);
        self.start(new_level_config.difficulty, level_seed);

        (stars, bonuses)
    }

    /// Award random bonuses after level completion
    fn award_bonuses(ref self: Game, seed: felt252, count: u8) {
        let mut run_data = self.get_run_data();
        let current_level = run_data.current_level;

        let mut i: u8 = 0;
        loop {
            if i >= count {
                break;
            }

            // Get random bonus type (0=Hammer, 1=Wave, 2=Totem)
            let bonus_type = LevelGeneratorTrait::get_random_bonus_type(seed, current_level + i);

            match bonus_type {
                0 => {
                    if run_data.hammer_count < 15 {
                        run_data.hammer_count += 1;
                    }
                },
                1 => {
                    if run_data.wave_count < 15 {
                        run_data.wave_count += 1;
                    }
                },
                _ => {
                    if run_data.totem_count < 15 {
                        run_data.totem_count += 1;
                    }
                },
            }

            i += 1;
        };

        self.set_run_data(run_data);
    }

    /// Assess the game state (gravity, line clearing)
    fn assess_game(ref self: Game, ref counter: u8) -> u16 {
        let mut points = 0;
        let mut upper_blocks = 0;
        loop {
            let mut inner_blocks = 0;
            loop {
                if inner_blocks == self.blocks {
                    break;
                };
                inner_blocks = self.blocks;
                self.blocks = Controller::apply_gravity(self.blocks);
            };
            self.blocks = Controller::assess_lines(self.blocks, ref counter, ref points, true);
            if upper_blocks == self.blocks {
                break points;
            };
            upper_blocks = self.blocks;
        }
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
        let count = match bonus {
            Bonus::Hammer => run_data.hammer_count,
            Bonus::Wave => run_data.wave_count,
            Bonus::Totem => run_data.totem_count,
            _ => 0,
        };
        assert!(count > 0, "Game {} bonus is not available", self.game_id);
    }
}
