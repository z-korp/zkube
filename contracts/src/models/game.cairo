use zkube::types::mode::ModeTrait;
use core::traits::Into;
// Core imports

use core::debug::PrintTrait;
use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

// External imports

use alexandria_math::fast_power::fast_power;

// Inernal imports

use zkube::models::index::Game;
use zkube::constants;
use zkube::types::difficulty::Difficulty;
use zkube::helpers::math::Math;
use zkube::helpers::packer::Packer;
use zkube::helpers::controller::Controller;
use zkube::types::bonus::{Bonus, BonusTrait};
use zkube::types::mode::Mode;

// Errors

mod errors {
    const GAME_NOT_EXISTS: felt252 = 'Game: does not exist';
    const GAME_IS_OVER: felt252 = 'Game: is over';
    const GAME_NOT_OVER: felt252 = 'Game: not over';
    const GAME_BONUS_NOT_AVAILABLE: felt252 = 'Game: bonus not available';
}

#[generate_trait]
impl GameImpl of GameTrait {
    #[inline(always)]
    fn new(id: u32, player_id: felt252, seed: felt252, mode: Mode, time: u64,) -> Game {
        let difficulty = mode.difficulty();
        let game_seed = mode.seed(time, id, seed);
        let row = Controller::create_line(game_seed, difficulty);
        Game {
            id,
            over: false,
            next_row: row,
            score: 0,
            moves: 0,
            hammer_bonus: 0,
            wave_bonus: 0,
            totem_bonus: 0,
            hammer_used: 0,
            wave_used: 0,
            totem_used: 0,
            combo_counter: 0,
            max_combo: 0,
            blocks: 0,
            player_id,
            seed: game_seed,
            mode: mode.into(),
            start_time: time,
            tournament_id: 0,
            score_in_tournament: 0,
            combo_counter_in_tournament: 0,
            max_combo_in_tournament: 0,
            pending_chest_prize: 0,
        }
    }

    #[inline(always)]
    fn duration(self: Game) -> u64 {
        let mode: Mode = self.mode.into();
        mode.duration()
    }

    #[inline(always)]
    fn difficulty(self: Game) -> Difficulty {
        let mode: Mode = self.mode.into();
        mode.difficulty()
    }

    #[inline(always)]
    fn reseed(ref self: Game) {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(self.seed);
        self.seed = state.finalize();
    }

    fn start(ref self: Game) {
        // [Effect] Add lines until we have 5 remaining
        let mut counter = 0;
        let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
        loop {
            if self.blocks.into() / div > 0 {
                break;
            };
            // [Effect] Add line
            self.insert_new_line();
            // [Effect] Assess game
            self.assess_game(ref counter);
        };
    }

    #[inline(always)]
    fn setup_next(ref self: Game) {
        self.reseed();

        let row = Controller::create_line(self.seed, self.get_difficulty());

        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.next_row = row;
    }

    #[inline(always)]
    fn assess_over(ref self: Game) {
        let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
            * constants::ROW_BIT_COUNT.into();
        let div: u256 = fast_power(2, exp) - 1;
        self.over = self.blocks.into() / div > 0;
    }

    #[inline(always)]
    fn assess_bonuses(self: Game) -> (u8, u8, u8) {
        let hammer = Bonus::Hammer.get_count(self.score, self.combo_counter, self.max_combo);
        let totem = Bonus::Totem.get_count(self.score, self.combo_counter, self.max_combo);
        let wave = Bonus::Wave.get_count(self.score, self.combo_counter, self.max_combo);
        (hammer, totem, wave)
    }

    #[inline(always)]
    fn get_difficulty(ref self: Game) -> Difficulty {
        let mut difficulty = self.difficulty();
        if (difficulty == Difficulty::None) { // Difficulty::None meaning increasing difficulty
            difficulty = Difficulty::Master;
            if (self.moves < 20) {
                difficulty = Difficulty::Easy;
            } else if (self.moves < 40) {
                difficulty = Difficulty::Medium;
            } else if (self.moves < 80) {
                difficulty = Difficulty::MediumHard;
            } else if (self.moves < 120) {
                difficulty = Difficulty::Hard;
            } else if (self.moves < 160) {
                difficulty = Difficulty::VeryHard;
            } else if (self.moves < 200) {
                difficulty = Difficulty::Expert;
            }
        }
        difficulty
    }

    fn insert_new_line(ref self: Game) {
        self.setup_next();
    }

    fn move(ref self: Game, row_index: u8, start_index: u8, final_index: u8) {
        // [Compute] Move direction and step counts
        let direction = final_index > start_index;
        let count = match direction {
            true => final_index - start_index,
            false => start_index - final_index,
        };

        // [Effect] Swipe block
        let new_blocks = Controller::swipe(self.blocks, row_index, start_index, direction, count);
        self.blocks = new_blocks;

        // [Effect] Assess game
        let mut counter: u8 = 0;
        self.score += self.assess_game(ref counter);

        // [Effect] Assess bonuses
        let (hammer, totem, wave) = self.assess_bonuses();
        self.hammer_bonus = hammer;
        self.totem_bonus = totem;
        self.wave_bonus = wave;

        // [Effect] Assess game over
        self.assess_over();
        if self.over {
            return;
        };

        // [Effect] Add a new line
        self.insert_new_line();

        // [Effect] Assess game
        self.score += self.assess_game(ref counter);
        if (counter > 1) {
            self.combo_counter += counter;
            self.max_combo = Math::max(self.max_combo, counter);
        }
        self.moves += 1;

        let (hammer, totem, wave) = self.assess_bonuses();
        self.hammer_bonus = hammer;
        self.totem_bonus = totem;
        self.wave_bonus = wave;

        // [Effect] Grid empty add a new line
        if self.is_empty_grid() {
            self.insert_new_line()
        }
    }

    fn is_empty_grid(ref self: Game) -> bool {
        self.blocks == 0
    }

    fn assess_game(ref self: Game, ref counter: u8) -> u32 {
        let mut points = 0;
        let mut upper_blocks = 0;
        loop {
            let mut inner_blocks = 0;
            loop {
                if inner_blocks == self.blocks {
                    break;
                };
                inner_blocks = self.blocks;
                let new_blocks = Controller::apply_gravity(self.blocks);
                self.blocks = new_blocks;
            };
            self.blocks = Controller::assess_lines(self.blocks, ref counter, ref points, true);
            if upper_blocks == self.blocks {
                break points;
            };
            upper_blocks = self.blocks;
        }
    }

    #[inline(always)]
    fn apply_bonus(ref self: Game, bonus: Bonus, row_index: u8, index: u8) {
        let blocks = bonus.apply(self.blocks, row_index, index);
        self.blocks = blocks;

        // [Effect] Assess game
        let mut counter = 0;
        self.score += self.assess_game(ref counter);
        if (counter > 1) {
            self.combo_counter += counter;
            self.max_combo = Math::max(self.max_combo, counter);
        }

        match bonus {
            Bonus::None => {},
            Bonus::Hammer => self.hammer_used += 1,
            Bonus::Totem => self.totem_used += 1,
            Bonus::Wave => self.wave_used += 1,
        }

        // [Effect] Grid empty add a new line
        if self.is_empty_grid() {
            self.insert_new_line()
        }
    }
}

impl ZeroableGame of core::Zeroable<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game {
            id: 0,
            over: false,
            score: 0,
            moves: 0,
            next_row: 0,
            hammer_bonus: 0,
            wave_bonus: 0,
            totem_bonus: 0,
            hammer_used: 0,
            wave_used: 0,
            totem_used: 0,
            combo_counter: 0,
            max_combo: 0,
            blocks: 0,
            player_id: 0,
            seed: 0,
            mode: 0,
            start_time: 0,
            tournament_id: 0,
            score_in_tournament: 0,
            combo_counter_in_tournament: 0,
            max_combo_in_tournament: 0,
            pending_chest_prize: 0,
        }
    }

    #[inline(always)]
    fn is_zero(self: Game) -> bool {
        0 == self.seed
    }

    #[inline(always)]
    fn is_non_zero(self: Game) -> bool {
        !self.is_zero()
    }
}

#[generate_trait]
impl GameAssert of AssertTrait {
    #[inline(always)]
    fn assert_exists(self: Game) {
        assert(self.is_non_zero(), errors::GAME_NOT_EXISTS);
    }

    #[inline(always)]
    fn assert_not_over(self: Game) {
        assert(!self.over, errors::GAME_IS_OVER);
    }

    #[inline(always)]
    fn assert_is_over(self: Game) {
        assert(self.over || self.is_zero(), errors::GAME_NOT_OVER);
    }

    #[inline(always)]
    fn assert_is_available(self: Game, bonus: Bonus) {
        let count = match bonus {
            Bonus::Hammer => self.hammer_bonus - self.hammer_used,
            Bonus::Totem => self.totem_bonus - self.totem_used,
            Bonus::Wave => self.wave_bonus - self.wave_used,
            _ => 0,
        };
        assert(count > 0, errors::GAME_BONUS_NOT_AVAILABLE);
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;
    use core::poseidon::{PoseidonTrait, HashState};
    use core::hash::HashStateTrait;

    // Local imports

    use super::{Game, GameTrait, AssertTrait};
    use zkube::types::difficulty::Difficulty;
    use zkube::types::mode::Mode;

    // Constants

    const GAME_ID: u32 = 1;
    const PLAYER_ID: felt252 = 'PLAYER';
    const SEED: felt252 = 'SEED';

    #[test]
    fn test_game_new() {
        // [Effect] Create game
        let game = GameTrait::new(GAME_ID, PLAYER_ID, SEED, Mode::Normal, 0);
        game.assert_exists();
        game.assert_not_over();
        // [Assert] Game seed has changed

        let state: HashState = PoseidonTrait::new();
        let state = state.update(SEED);
        let state = state.update(GAME_ID.into());
        let state = state.update(0);

        assert_eq!(game.seed, state.finalize());
    }
}
