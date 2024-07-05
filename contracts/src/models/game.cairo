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
use zkube::helpers::packer::Packer;
use zkube::helpers::controller::Controller;
use zkube::types::bonus::{Bonus, BonusTrait};

// Constants

const DIFFICULTY: Difficulty = Difficulty::Easy;

// Errors

mod errors {
    const GAME_NOT_EXISTS: felt252 = 'Game: does not exist';
    const GAME_IS_OVER: felt252 = 'Game: is over';
    const GAME_NOT_OVER: felt252 = 'Game: not over';
}

#[generate_trait]
impl GameImpl of GameTrait {
    #[inline(always)]
    fn new(id: u32, player_id: felt252, seed: felt252) -> Game {
        let (row, color) = Controller::create_line(seed, DIFFICULTY);
        Game {
            id,
            over: false,
            next_row: row,
            next_color: color,
            score: 0,
            bonuses: 0,
            blocks: 0,
            colors: 0,
            player_id,
            seed,
        }
    }

    #[inline(always)]
    fn reseed(ref self: Game) {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(self.seed);
        self.seed = state.finalize();
    }

    fn start(ref self: Game) {
        // [Effect] Add lines until we have 5 remaining
        let mut counter = 1;
        let div: u256 = fast_power(2_u256, 4 * constants::ROW_BIT_COUNT.into()) - 1;
        loop {
            if self.blocks.into() / div > 0 {
                break;
            };
            // [Effect] Add line
            self.setup_next();
            // [Effect] Assess game
            self.assess_game(ref counter);
        };
    }

    #[inline(always)]
    fn setup_next(ref self: Game) {
        self.reseed();
        let (row, color) = Controller::create_line(self.seed, DIFFICULTY);
        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.colors = Controller::add_line(self.colors, self.next_color);
        self.next_row = row;
        self.next_color = color;
    }

    #[inline(always)]
    fn assess_over(ref self: Game) {
        let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
            * constants::ROW_BIT_COUNT.into();
        let div: u256 = fast_power(2, exp) - 1;
        self.over = self.blocks.into() / div > 0;
    }

    fn move(ref self: Game, row_index: u8, start_index: u8, final_index: u8) {
        // [Compute] Move direction and step counts
        let direction = final_index > start_index;
        let count = match direction {
            true => final_index - start_index,
            false => start_index - final_index,
        };

        // [Effect] Swipe block
        let (new_blocks, new_colors) = Controller::swipe(
            self.blocks, self.colors, row_index, start_index, direction, count
        );
        self.blocks = new_blocks;
        self.colors = new_colors;

        // [Effect] Assess game
        let mut counter = 1;
        self.score += self.assess_game(ref counter);

        // [Effect] Assess game over
        self.assess_over();
        if self.over {
            return;
        };

        // [Effect] Add a new line
        self.setup_next();

        // [Effect] Assess game
        self.score += self.assess_game(ref counter);
    }

    fn assess_game(ref self: Game, ref counter: u32) -> u32 {
        let mut points = 0;
        let mut upper_blocks = 0;
        loop {
            let mut inner_blocks = 0;
            loop {
                if inner_blocks == self.blocks {
                    break;
                };
                inner_blocks = self.blocks;
                let (new_blocks, new_colors) = Controller::apply_gravity(self.blocks, self.colors);
                self.blocks = new_blocks;
                self.colors = new_colors;
            };
            self.blocks = Controller::assess_lines(self.blocks, ref counter, ref points, true);
            self.colors = Controller::assess_lines(self.colors, ref counter, ref points, false);
            if upper_blocks == self.blocks {
                break points;
            };
            upper_blocks = self.blocks;
        }
    }

    #[inline(always)]
    fn apply_bonus(ref self: Game, bonus: Bonus, row_index: u8, index: u8) {
        let (blocks, colors) = bonus.apply(self.blocks, self.colors, row_index, index);
        self.blocks = blocks;
        self.colors = colors;

        // [Effect] Assess game
        let mut counter = 1;
        self.score += self.assess_game(ref counter);
    }
}

impl ZeroableGame of core::Zeroable<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game {
            id: 0,
            over: false,
            score: 0,
            next_row: 0,
            next_color: 0,
            bonuses: 0,
            blocks: 0,
            colors: 0,
            player_id: 0,
            seed: 0,
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
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{Game, GameTrait, AssertTrait};

    // Constants

    const GAME_ID: u32 = 1;
    const PLAYER_ID: felt252 = 'PLAYER';
    const SEED: felt252 = 'SEED';

    #[test]
    fn test_game_new() {
        // [Effect] Create game
        let game = GameTrait::new(GAME_ID, PLAYER_ID, SEED);
        game.assert_exists();
        game.assert_not_over();
        // [Assert] Game seed
        assert_eq!(game.seed, SEED);
    }
}
