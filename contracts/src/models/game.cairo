// Core imports

use core::debug::PrintTrait;
use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

// External imports

use alexandria_math::bitmap::Bitmap;

// Inernal imports

use zkube::models::index::Game;
use zkube::helpers::controller::Controller;

mod errors {
    const GAME_NOT_EXISTS: felt252 = 'Game: does not exist';
    const GAME_IS_OVER: felt252 = 'Game: is over';
    const GAME_NOT_OVER: felt252 = 'Game: not over';
}

#[generate_trait]
impl GameImpl of GameTrait {
    #[inline(always)]
    fn new(id: u32, seed: felt252) -> Game {
        Game { id, over: false, bonuses: 0, blocks: 0, seed, }
    }

    #[inline(always)]
    fn start(ref self: Game) {}

    fn move(ref self: Game, row_index: u8, start_index: u8, final_index: u8,) {
        // [Compute] Move direction and step counts
        let direction = final_index > start_index;
        let count = match direction {
            true => final_index - start_index,
            false => start_index - final_index,
        };
        // [Effect] Swipe block
        self.blocks = Controller::swipe(self.blocks, row_index, start_index, direction, count);
        let mut blocks = 0;
        loop {
            if blocks == self.blocks {
                break;
            };
            blocks = self.blocks;
            self.blocks = Controller::apply_gravity(self.blocks);
            self.blocks = Controller::assess_lines(self.blocks);
        };
    // [Effect] Add a new line

    }
}

impl ZeroableGame of core::Zeroable<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game { id: 0, over: false, bonuses: 0, blocks: 0, seed: 0, }
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
