// Core imports

use core::debug::PrintTrait;
use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

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
    fn new(id: u32, seed: felt252) -> Game {
        let (row, color) = Controller::create_line(seed, DIFFICULTY);
        Game {
            id,
            over: false,
            next_row: row,
            next_color: color,
            bonuses: 0,
            blocks: 0,
            colors: 0,
            seed,
            points: 0
        }
    }

    #[inline(always)]
    fn start(ref self: Game) {
        self.setup_next();
    }

    #[inline(always)]
    fn setup_next(ref self: Game) {
        let (row, color) = Controller::create_line(self.seed, DIFFICULTY);
        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.next_row = row;
        self.next_color = color;
    }

    #[inline(always)]
    fn assess_over(ref self: Game) {
        let bitmap: u256 = self.blocks.into();
        let rows: Array<u32> = Packer::unpack(bitmap, constants::BLOCK_SIZE);
        self.over = rows.len() == constants::DEFAULT_GRID_HEIGHT.into();
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
        let mut points = 0;
        self.assess_game(ref counter, ref points);

        // [Effect] Assess game over
        self.assess_over();
        if self.over {
            return;
        };

        // [Effect] Add a new line
        self.setup_next();

        // [Effect] Assess game
        let mut points = 0;
        self.assess_game(ref counter, ref points);
    }

    fn assess_game(ref self: Game, ref counter: u32, ref points: u32) {
        let mut blocks = 0;
        loop {
            if blocks == self.blocks {
                self.points += points;
                break;
            };
            blocks = self.blocks;
            let (new_blocks, new_colors) = Controller::apply_gravity(self.blocks, self.colors);
            self.blocks = Controller::assess_lines(new_blocks, ref counter, ref points, true);
            self.colors = Controller::assess_lines(new_colors, ref counter, ref points, false);
        };
        self.points += points;
    }

    #[inline(always)]
    fn apply_bonus(ref self: Game, bonus: Bonus, row_index: u8, index: u8) {
        self.blocks = bonus.apply_bonus(self.blocks, row_index, index)
    }
}


impl ZeroableGame of core::Zeroable<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game {
            id: 0,
            over: false,
            next_row: 0,
            next_color: 0,
            bonuses: 0,
            blocks: 0,
            colors: 0,
            seed: 0,
            points: 0
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
    const SEED: felt252 = 'SEED';

    #[test]
    fn test_game_new() {
        // [Effect] Create game
        let game = GameTrait::new(GAME_ID, SEED);
        game.assert_exists();
        game.assert_not_over();
        // [Assert] Game seed
        assert_eq!(game.seed, SEED);
    }
}
