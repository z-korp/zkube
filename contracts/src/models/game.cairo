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
use zkube::elements::bonuses::shrink::{apply_shrink_same_size, apply_shrink_all};
use zkube::elements::bonuses::shuffle::{shuffle_next_line, shuffle_entire_grid};
use zkube::helpers::level::{LevelGenerator, LevelGeneratorTrait, BossLevel};
use zkube::models::config::GameSettings;

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
    pub difficulty: u8,           // Difficulty enum as u8
    // Primary constraint
    pub constraint_type: u8,      // ConstraintType enum as u8 (0=None, 1=ClearLines, 2=NoBonusUsed)
    pub constraint_value: u8,     // For ClearLines: minimum lines to clear
    pub constraint_count: u8,     // For ClearLines: number of times required
    // Secondary constraint (for boss levels)
    pub constraint2_type: u8,
    pub constraint2_value: u8,
    pub constraint2_count: u8,
    // Cube thresholds
    pub cube_3_threshold: u16,    // Moves threshold for 3 cubes
    pub cube_2_threshold: u16,    // Moves threshold for 2 cubes
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
            cube_3_threshold: config.cube_3_threshold,
            cube_2_threshold: config.cube_2_threshold,
        }
    }
}

#[inline(always)]
fn saturating_add_u16(lhs: u16, rhs: u16) -> u16 {
    let sum: u32 = lhs.into() + rhs.into();
    if sum > 65535 {
        65535_u16
    } else {
        sum.try_into().unwrap()
    }
}

#[inline(always)]
fn saturating_add_u8(lhs: u8, rhs: u8) -> u8 {
    let sum: u16 = lhs.into() + rhs.into();
    if sum > 255 {
        255_u8
    } else {
        sum.try_into().unwrap()
    }
}

/// Add with a maximum cap (for fields with limited bit space like free_moves)
#[inline(always)]
fn saturating_add_u8_capped(lhs: u8, rhs: u8, max: u8) -> u8 {
    let sum: u16 = lhs.into() + rhs.into();
    if sum > max.into() {
        max
    } else {
        sum.try_into().unwrap()
    }
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    /// Create a new game with level system using GameSettings
    fn new(game_id: u64, seed: felt252, started_at: u64, settings: GameSettings) -> Game {
        // Get level 1 config using settings
        let level_config = LevelGeneratorTrait::generate(seed, 1, settings);

        // Generate level-specific seed so each level has a different starting grid
        let level_seed = Self::generate_level_seed(seed, 1);

        // Create initial row using settings-based block weights
        let row = Controller::create_line(level_seed, level_config.difficulty, settings);

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

        // Fill initial grid using settings-aware line generation
        game.start(level_config.difficulty, level_seed, settings);
        game
    }

    /// Initialize the grid with starting blocks using configurable block weights
    fn start(ref self: Game, difficulty: Difficulty, base_seed: felt252, settings: GameSettings) {
        let mut counter = 0;
        let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
        loop {
            if self.blocks.into() / div > 0 {
                break;
            };
            self.insert_new_line(difficulty, base_seed, settings);
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

    /// Get total cubes
    #[inline(always)]
    fn get_total_cubes(self: Game) -> u16 {
        self.get_run_data().total_cubes
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

    /// Get the level (0-2) for a given bonus type based on selected bonuses
    /// @param bonus_type: 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
    /// Returns 0 (L1), 1 (L2), or 2 (L3)
    fn get_bonus_level(self: Game, bonus_type: u8) -> u8 {
        let run_data = self.get_run_data();
        
        // Find which slot this bonus is in
        if run_data.selected_bonus_1 == bonus_type {
            run_data.bonus_1_level
        } else if run_data.selected_bonus_2 == bonus_type {
            run_data.bonus_2_level
        } else if run_data.selected_bonus_3 == bonus_type {
            run_data.bonus_3_level
        } else {
            0 // Default to L1 if not found (shouldn't happen)
        }
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

    /// Insert a new line at the bottom using configurable block weights
    #[inline(always)]
    fn insert_new_line(ref self: Game, difficulty: Difficulty, seed: felt252, settings: GameSettings) -> felt252 {
        let new_seed = self.generate_seed_from_base(seed);
        let row = Controller::create_line(new_seed, difficulty, settings);
        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.next_row = row;
        new_seed
    }

    /// Generate a deterministic seed from base seed and current state
    /// Includes level number for more diversity across levels
    #[inline(always)]
    fn generate_seed_from_base(self: Game, base_seed: felt252) -> felt252 {
        let run_data = self.get_run_data();
        let state: HashState = PoseidonTrait::new();
        let state = state.update(base_seed);
        let state = state.update(self.blocks.into());
        let state = state.update(run_data.current_level.into());
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

    /// Make a move with configurable settings - returns lines cleared
    fn make_move(
        ref self: Game, seed: felt252, row_index: u8, start_index: u8, final_index: u8, settings: GameSettings,
    ) -> u8 {
        // Get current level config using settings
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);

        // Prevent overflowing the move counter; failing happens when moves reach max.
        let effective_max_moves: u16 = level_config.max_moves + run_data.extra_moves.into();
        assert!(run_data.level_moves.into() < effective_max_moves, "Move limit exceeded");

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

        // Insert new line with configurable block weights
        self.insert_new_line(level_config.difficulty, seed, settings);

        // Assess again after new line
        let more_points = self.assess_game(ref lines_cleared);

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
            self.combo_counter = saturating_add_u8(self.combo_counter, lines_cleared);
            self.max_combo = Math::max(self.max_combo, lines_cleared);

            // Track max combo for run
            if lines_cleared > run_data.max_combo_run {
                run_data.max_combo_run = lines_cleared;
            }
        }

        // Combo line bonus cubes (scaled for high combos):
        // 4 lines = +1, 5 lines = +3, 6 lines = +5, 7 lines = +10, 8 lines = +25, 9+ lines = +50
        if lines_cleared >= 4 {
            let combo_cubes: u16 = if lines_cleared >= 9 {
                50
            } else if lines_cleared >= 8 {
                25
            } else if lines_cleared >= 7 {
                10
            } else if lines_cleared >= 6 {
                5
            } else if lines_cleared >= 5 {
                3
            } else {
                1
            };
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, combo_cubes);
        }

        // Combo achievement bonuses (one-time per run)
        if run_data.max_combo_run >= 5 && !run_data.combo_5_achieved {
            run_data.combo_5_achieved = true;
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
        }
        if run_data.max_combo_run >= 10 && !run_data.combo_10_achieved {
            run_data.combo_10_achieved = true;
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 5_u16);
        }

        // Update constraint progress with TOTAL lines cleared in this move
        run_data.constraint_progress = level_config
            .constraint
            .update_progress(run_data.constraint_progress, lines_cleared);
        
        // Update secondary constraint progress
        run_data.constraint_2_progress = level_config
            .constraint_2
            .update_progress(run_data.constraint_2_progress, lines_cleared);

        // Increment level moves (or consume free move from Wave L2/L3)
        if run_data.free_moves > 0 {
            run_data.free_moves -= 1;
        } else {
            run_data.level_moves += 1;
        }

        // If grid is empty, add a new line with settings
        if self.blocks == 0 {
            self.insert_new_line(level_config.difficulty, seed, settings);
        }

        self.set_run_data(run_data);
        lines_cleared
    }

    /// Apply a bonus with configurable settings and level-scaled effects
    fn apply_bonus(
        ref self: Game,
        seed: felt252,
        bonus: Bonus,
        row_index: u8,
        index: u8,
        settings: GameSettings,
    ) {
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);

        // Check bonus availability
        let available = match bonus {
            Bonus::Hammer => run_data.hammer_count > 0,
            Bonus::Wave => run_data.wave_count > 0,
            Bonus::Totem => run_data.totem_count > 0,
            Bonus::Shrink => run_data.shrink_count > 0,
            Bonus::Shuffle => run_data.shuffle_count > 0,
            Bonus::None => false,
        };
        assert!(available, "Bonus not available");

        // Get bonus type as u8 for level lookup: 1=Hammer, 2=Totem, 3=Wave, 4=Shrink, 5=Shuffle
        let bonus_type_u8: u8 = match bonus {
            Bonus::Hammer => 1,
            Bonus::Totem => 2,
            Bonus::Wave => 3,
            Bonus::Shrink => 4,
            Bonus::Shuffle => 5,
            Bonus::None => 0,
        };
        let bonus_level = self.get_bonus_level(bonus_type_u8);

        // Apply bonus effect based on type and level
        match bonus {
            Bonus::Totem => {
                if bonus_level == 2 {
                    // L3 Totem: nuclear option - clear entire grid, no cube bonus
                    self.blocks = 0;
                } else {
                    // L1/L2 Totem: clear all blocks of same size
                    self.blocks = bonus.apply(self.blocks, row_index, index);
                }
            },
            Bonus::Shrink => {
                if bonus_level == 2 {
                    // L3 Shrink: shrink ALL blocks on grid (except size 1)
                    self.blocks = apply_shrink_all(self.blocks);
                } else if bonus_level == 1 {
                    // L2 Shrink: shrink all blocks of the same size
                    self.blocks = apply_shrink_same_size(self.blocks, row_index, index);
                } else {
                    // L1 Shrink: shrink single target block
                    self.blocks = bonus.apply(self.blocks, row_index, index);
                }
            },
            Bonus::Shuffle => {
                if bonus_level == 2 {
                    // L3 Shuffle: shuffle the entire grid
                    self.blocks = shuffle_entire_grid(self.blocks, seed);
                } else if bonus_level == 1 {
                    // L2 Shuffle: shuffle the upcoming next_row
                    self.next_row = shuffle_next_line(self.next_row, seed);
                } else {
                    // L1 Shuffle: shuffle a single row
                    self.blocks = bonus.apply(self.blocks, row_index, index);
                }
            },
            _ => {
                // Hammer, Wave, None: apply normal effect
                self.blocks = bonus.apply(self.blocks, row_index, index);
            },
        }

        // Apply additional level-scaled effects (bonuses beyond the primary effect)
        match bonus {
            Bonus::Hammer => {
                // L2: +1 combo, L3: +2 combo
                if bonus_level >= 1 {
                    self.combo_counter = saturating_add_u8(self.combo_counter, 1);
                }
                if bonus_level >= 2 {
                    self.combo_counter = saturating_add_u8(self.combo_counter, 1);
                }
            },
            Bonus::Wave => {
                // L2: +1 free move, L3: +2 free moves
                if bonus_level >= 1 {
                    run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
                }
                if bonus_level >= 2 {
                    run_data.free_moves = saturating_add_u8_capped(run_data.free_moves, 1, 7);
                }
            },
            Bonus::Totem => {
                // L2: +3 bonus cubes (simplified flat award)
                if bonus_level == 1 {
                    run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
                }
                // L3 handled above (clear grid, no additional bonus)
            },
            _ => {
                // Shrink, Shuffle, None: no additional level bonuses
            },
        }

        // Decrement bonus count
        match bonus {
            Bonus::Hammer => run_data.hammer_count -= 1,
            Bonus::Wave => run_data.wave_count -= 1,
            Bonus::Totem => run_data.totem_count -= 1,
            Bonus::Shrink => run_data.shrink_count -= 1,
            Bonus::Shuffle => run_data.shuffle_count -= 1,
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
            self.combo_counter = saturating_add_u8(self.combo_counter, lines_cleared);
            self.max_combo = Math::max(self.max_combo, lines_cleared);
            if lines_cleared > run_data.max_combo_run {
                run_data.max_combo_run = lines_cleared;
            }
        }

        // Combo line bonus cubes (scaled for high combos):
        // 4 lines = +1, 5 lines = +3, 6 lines = +5, 7 lines = +10, 8 lines = +25, 9+ lines = +50
        if lines_cleared >= 4 {
            let combo_cubes: u16 = if lines_cleared >= 9 {
                50
            } else if lines_cleared >= 8 {
                25
            } else if lines_cleared >= 7 {
                10
            } else if lines_cleared >= 6 {
                5
            } else if lines_cleared >= 5 {
                3
            } else {
                1
            };
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, combo_cubes);
        }

        // Combo achievement bonuses (one-time per run)
        if run_data.max_combo_run >= 5 && !run_data.combo_5_achieved {
            run_data.combo_5_achieved = true;
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 3_u16);
        }
        if run_data.max_combo_run >= 10 && !run_data.combo_10_achieved {
            run_data.combo_10_achieved = true;
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, 5_u16);
        }

        // Update constraint progress
        run_data.constraint_progress = level_config
            .constraint
            .update_progress(run_data.constraint_progress, lines_cleared);

        // Update secondary constraint progress
        run_data.constraint_2_progress = level_config
            .constraint_2
            .update_progress(run_data.constraint_2_progress, lines_cleared);

        // If grid is empty, add a new line using settings
        if self.blocks == 0 {
            self.insert_new_line(level_config.difficulty, seed, settings);
        }

        self.set_run_data(run_data);
    }

    /// Check if current level is complete
    fn is_level_complete(self: Game, seed: felt252, settings: GameSettings) -> bool {
        let run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);

        level_config
            .is_complete(
                run_data.level_score.into(),
                run_data.constraint_progress,
                run_data.constraint_2_progress,
                run_data.bonus_used_this_level,
            )
    }

    /// Check if current level failed (move limit exceeded without completing)
    fn is_level_failed(self: Game, seed: felt252, settings: GameSettings) -> bool {
        let run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);

        let completed = level_config.is_complete(
            run_data.level_score.into(),
            run_data.constraint_progress,
            run_data.constraint_2_progress,
            run_data.bonus_used_this_level,
        );

        let effective_max_moves: u16 = level_config.max_moves + run_data.extra_moves.into();
        run_data.level_moves.into() >= effective_max_moves && !completed
    }

    /// Complete the current level and advance to next
    /// Returns (cubes_earned, bonuses_to_award, is_victory)
    /// is_victory is true if level 50 was completed (run is complete)
    fn complete_level(ref self: Game, seed: felt252, settings: GameSettings) -> (u8, u8, bool) {
        let mut run_data = self.get_run_data();
        let level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);
        let completed_level = run_data.current_level;

        // Calculate cubes from level performance (1-3 cubes based on moves used)
        let cubes = level_config.calculate_cubes(run_data.level_moves.into());
        let bonuses = LevelConfigTrait::get_bonus_reward(cubes);

        // Add cubes to total
        run_data.total_cubes = saturating_add_u16(run_data.total_cubes, cubes.into());

        // Boss cube bonus: boss levels (10, 20, 30, 40, 50) give flat bonus cubes
        // Replaces old milestone bonus (level/2 every 10 levels)
        let boss_bonus = BossLevel::get_boss_cube_bonus(completed_level);
        if boss_bonus > 0 {
            run_data.total_cubes = saturating_add_u16(run_data.total_cubes, boss_bonus);
        }

        // Check for victory: completing level 50 ends the run
        let is_victory = completed_level >= 50;
        if is_victory {
            // Mark run as completed (victory!)
            run_data.run_completed = true;
            self.set_run_data(run_data);
            // Don't advance to next level or reset grid - game will end
            return (cubes, bonuses, true);
        }

        // Advance to next level
        run_data.current_level += 1;

        // Reset per-level state
        run_data.level_score = 0;
        run_data.level_moves = 0;
        run_data.constraint_progress = 0;
        run_data.constraint_2_progress = 0;
        run_data.extra_moves = 0;
        run_data.bonus_used_this_level = false;

        // Reset per-level combos
        self.combo_counter = 0;
        self.max_combo = 0;

        self.set_run_data(run_data);

        // Reset grid with new level's difficulty (use settings for block weights)
        // Use level-specific seed so each level has a different starting grid
        let new_level_config = LevelGeneratorTrait::generate(seed, run_data.current_level, settings);
        let level_seed = Self::generate_level_seed(seed, run_data.current_level);
        self.blocks = 0;
        self.next_row = Controller::create_line(level_seed, new_level_config.difficulty, settings);
        self.start(new_level_config.difficulty, level_seed, settings);

        (cubes, bonuses, false)
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
            Bonus::Shrink => run_data.shrink_count,
            Bonus::Shuffle => run_data.shuffle_count,
            Bonus::None => 0,
        };
        assert!(count > 0, "Game {} bonus is not available", self.game_id);
    }
}
