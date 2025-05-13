use core::traits::Into;
use core::num::traits::zero::Zero;
use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;

use alexandria_math::fast_power::fast_power;

use dojo::world::WorldStorage;
use dojo::world::WorldStorageTrait;

use starknet::{get_caller_address};

use zkube::constants;
use zkube::types::difficulty::Difficulty;
use zkube::helpers::math::Math;
use zkube::helpers::packer::Packer;
use zkube::helpers::controller::Controller;
use zkube::types::bonus::{Bonus, BonusTrait};

use openzeppelin_token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

use tournaments::components::interfaces::{IGameTokenDispatcher, IGameTokenDispatcherTrait};

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u64,
    // ----------------------------------------
    // Change every move
    // ----------------------------------------
    pub blocks: felt252, // 10 lines of 3x8 bits = 240 bits
    pub next_row: u32, // 3x8 bits per row = 24 bits
    pub score: u16,
    pub moves: u16,
    // Total = 1 felts + 32 + 16*2 = 1 felts + 64 bits

    // ----------------------------------------
    // Can change when a move breaks lines
    // ----------------------------------------
    // Counters
    pub combo_counter: u16,
    pub max_combo: u8,
    // Bonuses usable during the game (start (0, 0, 0) and will evolve)
    pub hammer_bonus: u8,
    pub wave_bonus: u8,
    pub totem_bonus: u8,
    // Bonuses used during the game
    pub hammer_used: u8,
    pub wave_used: u8,
    pub totem_used: u8,
    // Total = 16 + 8*7 = 80 bits
    // ------------------------

    // ----------------------------------------
    // Change once per game
    // ----------------------------------------
    pub over: bool,
} // 1 felt + 64 + 80 = 1 felt + 144 bits

#[derive(Copy, Drop, Serde, Introspect)]
#[dojo::model]
pub struct GameSeed {
    #[key]
    pub game_id: u64,
    pub seed: felt252,
}

#[generate_trait]
pub impl GameImpl of GameTrait {
    #[inline(always)]
    fn new(game_id: u64, seed: felt252, difficulty: Difficulty) -> Game {
        let row = Controller::create_line(seed, difficulty);
        let mut game = Game {
            game_id,
            blocks: 0,
            next_row: row,
            score: 0,
            moves: 0,
            combo_counter: 0,
            max_combo: 0,
            hammer_bonus: 0,
            wave_bonus: 0,
            totem_bonus: 0,
            hammer_used: 0,
            wave_used: 0,
            totem_used: 0,
            over: false,
        };
        game.start(difficulty, seed);
        game
    }

    fn start(ref self: Game, difficulty: Difficulty, base_seed: felt252) {
        // Add lines until we have 5 remaining
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

    #[inline(always)]
    fn assess_over(ref self: Game) {
        let exp: u256 = (constants::DEFAULT_GRID_HEIGHT.into() - 1)
            * constants::ROW_BIT_COUNT.into();
        let div: u256 = fast_power(2, exp) - 1;
        self.over = self.blocks.into() / div > 0;
    }

    #[inline(always)]
    fn assess_bonuses(self: Game) -> (u8, u8, u8) {
        let combo_counter: u16 = self.get_combo_counter();
        let hammer = Bonus::Hammer.get_count(self.score, combo_counter, self.max_combo);
        let totem = Bonus::Totem.get_count(self.score, combo_counter, self.max_combo);
        let wave = Bonus::Wave.get_count(self.score, combo_counter, self.max_combo);
        (hammer, totem, wave)
    }

    #[inline(always)]
    fn insert_new_line(ref self: Game, difficulty: Difficulty, seed: felt252) -> felt252 {
        // Generate a new seed for this operation
        let new_seed = self.generate_seed_from_base(seed);

        let row = Controller::create_line(new_seed, difficulty);

        self.blocks = Controller::add_line(self.blocks, self.next_row);
        self.next_row = row;

        new_seed
    }

    #[inline(always)]
    fn generate_seed_from_base(self: Game, base_seed: felt252) -> felt252 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(base_seed);
        let state = state.update(self.blocks.into());
        state.finalize()
    }

    fn move(
        ref self: Game,
        difficulty: Difficulty,
        base_seed: felt252,
        row_index: u8,
        start_index: u8,
        final_index: u8
    ) -> u8 {
        let direction = final_index > start_index;
        let count = match direction {
            true => final_index - start_index,
            false => start_index - final_index,
        };

        let new_blocks = Controller::swipe(self.blocks, row_index, start_index, direction, count);
        self.blocks = new_blocks;

        let mut counter: u8 = 0;
        self.score += self.assess_game(ref counter);

        let (hammer, totem, wave) = self.assess_bonuses();
        self.hammer_bonus = hammer;
        self.totem_bonus = totem;
        self.wave_bonus = wave;

        self.assess_over();
        if self.over {
            return 0;
        };

        self.insert_new_line(difficulty, base_seed);

        self.score += self.assess_game(ref counter);
        if (counter > 1) {
            self.update_combo_counter(counter);
            self.max_combo = Math::max(self.max_combo, counter);
        }
        self.moves += 1;

        let (hammer, totem, wave) = self.assess_bonuses();
        self.hammer_bonus = hammer;
        self.totem_bonus = totem;
        self.wave_bonus = wave;

        if self.is_empty_grid() {
            self.insert_new_line(difficulty, base_seed);
        }

        // Return break line count
        counter
    }

    #[inline(always)]
    fn is_empty_grid(ref self: Game) -> bool {
        self.blocks == 0
    }

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
    fn apply_bonus(
        ref self: Game,
        difficulty: Difficulty,
        base_seed: felt252,
        bonus: Bonus,
        row_index: u8,
        index: u8
    ) {
        let blocks = bonus.apply(self.blocks, row_index, index);
        self.blocks = blocks;

        // [Effect] Assess game
        let mut counter = 0;
        self.score += self.assess_game(ref counter);
        if (counter > 1) {
            self.update_combo_counter(counter);
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
            self.insert_new_line(difficulty, base_seed);
        }
    }

    // Put this for patching the u8 combo_counter to u16
    // this is the case where the game has been started before the patch
    // in this case we get the highest value from the u8 and u16
    // the u16 will be updated later (in move and apply_bonus)
    #[inline(always)]
    fn get_combo_counter(self: Game) -> u16 {
        self.combo_counter.into()
    }

    #[inline(always)]
    fn update_combo_counter(ref self: Game, counter: u8) {
        self.combo_counter += counter.into();
    }

    fn update_metadata(self: Game, world: WorldStorage) {
        let (contract_address, _) = world.dns(@"game_system").unwrap();
        let game_token_dispatcher = IGameTokenDispatcher { contract_address };
        game_token_dispatcher.emit_metadata_update(self.game_id.into());
    }
}

impl ZeroableGame of Zero<Game> {
    #[inline(always)]
    fn zero() -> Game {
        Game {
            game_id: 0,
            blocks: 0,
            next_row: 0,
            score: 0,
            moves: 0,
            combo_counter: 0,
            max_combo: 0,
            hammer_bonus: 0,
            wave_bonus: 0,
            totem_bonus: 0,
            hammer_used: 0,
            wave_used: 0,
            totem_used: 0,
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
    fn assert_is_available(self: Game, bonus: Bonus) {
        let count = match bonus {
            Bonus::Hammer => self.hammer_bonus - self.hammer_used,
            Bonus::Totem => self.totem_bonus - self.totem_used,
            Bonus::Wave => self.wave_bonus - self.wave_used,
            _ => 0,
        };
        assert!(count > 0, "Game {} bonus is not available", self.game_id);
    }

    fn assert_owner(self: Game, world: WorldStorage) {
        let (contract_address, _) = world.dns(@"game_system").unwrap();
        let game_token = IERC721Dispatcher { contract_address };
        assert(game_token.owner_of(self.game_id.into()) == get_caller_address(), 'Not Owner');
    }
}

#[cfg(test)]
mod tests {
    // Core imports
    use core::poseidon::{PoseidonTrait, HashState};
    use core::hash::HashStateTrait;

    // Local imports
    use super::{Game, GameTrait, AssertTrait};
    use zkube::types::difficulty::Difficulty;

    // Constants
    const GAME_ID: u32 = 101;
    const PLAYER_ID: u32 = 1;
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

    #[test]
    fn test_shuffle_line() {
        // [Effect] Create game
        let mut game = GameTrait::new(GAME_ID, PLAYER_ID, SEED, Mode::Normal, 0);
        // [Effect] Get new line
        game.setup_next();
    }
}
