// Core imports

use core::poseidon::{PoseidonTrait, HashState};
use core::hash::HashStateTrait;
use core::debug::PrintTrait;

// External imports

use origami::random::deck::{Deck as OrigamiDeck, DeckTrait as OrigamiDeckTrait};
use alexandria_math::bitmap::Bitmap;

// Internal imports

use zkube::constants;
use zkube::types::difficulty::Difficulty;

// Constants

const NONE: felt252 = 0;
const NORMAL: felt252 = 'NORMAL';
const DAILY: felt252 = 'DAILY';

#[derive(Copy, Drop, Serde, PartialEq)]
enum Mode {
    None,
    Normal,
    Daily,
}

#[generate_trait]
impl ModeImpl of ModeTrait {
    #[inline(always)]
    fn price(self: Mode) -> felt252 {
        match self {
            Mode::Normal => constants::NORMAL_MODE_PRICE,
            Mode::Daily => constants::DAILY_MODE_PRICE,
            _ => 0,
        }
    }

    fn daily_credits(self: Mode) -> u16 {
        match self {
            Mode::Normal => constants::NORMAL_MODE_DAILY_CREDITS,
            Mode::Daily => constants::DAILY_MODE_DAILY_CREDITS,
            _ => 0,
        }
    }

    fn difficulty(self: Mode) -> Difficulty {
        match self {
            Mode::Normal => Difficulty::None, // meaning increasing difficulty
            Mode::Daily => Difficulty::VeryHard,
            _ => Difficulty::None,
        }
    }

    #[inline(always)]
    fn duration(self: Mode) -> u64 {
        match self {
            Mode::Normal => constants::DAILY_MODE_DURATION,
            Mode::Daily => constants::NORMAL_MODE_DURATION,
            _ => 0,
        }
    }

    #[inline(always)]
    fn seed(self: Mode, time: u64, game_id: u32, salt: felt252) -> felt252 {
        match self {
            Mode::Normal => {
                let state: HashState = PoseidonTrait::new();
                let state = state.update(salt);
                let state = state.update(game_id.into());
                let state = state.update(time.into());
                state.finalize()
            },
            Mode::Daily => {
                let id: u64 = time / self.duration(); // number of days since epoch
                let state: HashState = PoseidonTrait::new();
                let state = state.update(id.into());
                state.finalize()
            },
            _ => 0,
        }
    }
}

impl IntoModeFelt252 of core::Into<Mode, felt252> {
    #[inline(always)]
    fn into(self: Mode) -> felt252 {
        match self {
            Mode::Normal => NORMAL,
            Mode::Daily => DAILY,
            _ => NONE,
        }
    }
}

impl IntoModeU8 of core::Into<Mode, u8> {
    #[inline(always)]
    fn into(self: Mode) -> u8 {
        match self {
            Mode::Normal => 1,
            Mode::Daily => 2,
            _ => 0,
        }
    }
}

impl IntoU8Mode of core::Into<u8, Mode> {
    #[inline(always)]
    fn into(self: u8) -> Mode {
        match self {
            0 => Mode::None,
            1 => Mode::Normal,
            2 => Mode::Daily,
            _ => Mode::None,
        }
    }
}

impl ModePrint of PrintTrait<Mode> {
    #[inline(always)]
    fn print(self: Mode) {
        let felt: felt252 = self.into();
        felt.print();
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{Mode, NONE, DAILY, NORMAL,};

    // Constants

    const UNKNOWN_FELT: felt252 = 'UNKNOWN';
    const UNKNOWN_U8: u8 = 42;

    #[test]
    fn test_mode_into_felt() {
        assert(NONE == Mode::None.into(), 'Mode: wrong None');
        assert(NORMAL == Mode::Normal.into(), 'Mode: wrong Normal');
        assert(DAILY == Mode::Daily.into(), 'Mode: wrong Daily');
    }

    #[test]
    fn test_felt_into_mode() {
        assert(NONE == Mode::None.into(), 'Mode: wrong None');
        assert(NORMAL == Mode::Normal.into(), 'Mode: wrong Normal');
        assert(DAILY == Mode::Daily.into(), 'Mode: wrong Daily');
    }

    #[test]
    fn test_mode_into_u8() {
        assert(0_u8 == Mode::None.into(), 'Mode: wrong None');
        assert(1_u8 == Mode::Normal.into(), 'Mode: wrong Normal');
        assert(2_u8 == Mode::Daily.into(), 'Mode: wrong Daily');
    }

    #[test]
    fn test_u8_into_mode() {
        assert(Mode::None == 0_u8.into(), 'Mode: wrong None');
        assert(Mode::Normal == 1_u8.into(), 'Mode: wrong Normal');
        assert(Mode::Daily == 2_u8.into(), 'Mode: wrong Daily');
    }

    #[test]
    fn test_unknown_u8_into_mode() {
        assert(Mode::None == UNKNOWN_U8.into(), 'Mode: wrong Unknown');
    }
}
