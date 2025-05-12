use core::traits::Into;

use zkube::elements::bonuses::hammer;
use zkube::elements::bonuses::totem;
use zkube::elements::bonuses::wave;

#[derive(Drop, Copy, Serde)]
pub enum Bonus {
    None,
    Hammer,
    Totem,
    Wave,
}

#[generate_trait]
pub impl BonusImpl of BonusTrait {
    #[inline(always)]
    fn apply(self: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
        match self {
            Bonus::None => blocks,
            Bonus::Hammer => hammer::BonusImpl::apply(blocks, row_index, index),
            Bonus::Totem => totem::BonusImpl::apply(blocks, row_index, index),
            Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
        }
    }

    #[inline(always)]
    fn get_count(self: Bonus, score: u16, combo_count: u16, max_combo: u8) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::Hammer => hammer::BonusImpl::get_count(score, combo_count, max_combo),
            Bonus::Totem => totem::BonusImpl::get_count(score, combo_count, max_combo),
            Bonus::Wave => wave::BonusImpl::get_count(score, combo_count, max_combo),
        }
    }
}

impl IntoBonusFelt252 of Into<Bonus, felt252> {
    #[inline(always)]
    fn into(self: Bonus) -> felt252 {
        match self {
            Bonus::None => 'NONE',
            Bonus::Hammer => 'HAMMER',
            Bonus::Totem => 'TOTEM',
            Bonus::Wave => 'WAVE',
        }
    }
}

impl IntoBonusU8 of Into<Bonus, u8> {
    #[inline(always)]
    fn into(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::Hammer => 1,
            Bonus::Totem => 2,
            Bonus::Wave => 3,
        }
    }
}

impl IntoU8Bonus of Into<u8, Bonus> {
    #[inline(always)]
    fn into(self: u8) -> Bonus {
        let action: felt252 = self.into();
        match action {
            0 => Bonus::None,
            1 => Bonus::Hammer,
            2 => Bonus::Totem,
            3 => Bonus::Wave,
            _ => Bonus::None,
        }
    }
}

#[cfg(test)]
mod tests {
    // Core imports

    use core::debug::PrintTrait;

    // Local imports

    use super::{Bonus, BonusTrait};

    #[test]
    fn test_bonus_hammer() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 001_010_010_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let bonus: Bonus = Bonus::Hammer;
        let blocks = bonus.apply(bitmap, 0, 1);
        assert_eq!(
            blocks,
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_000_000_000_000
        );
    }

    #[test]
    fn test_bonus_wave() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 000_000_000_001_000_000_000_001
        // 010_010_010_010_100_100_100_100
        // 000_000_000_000_000_000_000_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let bonus: Bonus = Bonus::Wave;
        let blocks = bonus.apply(bitmap, 0, 1);
        assert_eq!(
            blocks,
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_000_000_000_000_000_000_000_000
        );
    }

    #[test]
    fn test_bonus_totem() {
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // Final grid = 0
        // 000_000_000_001_000_000_000_001
        // 000_000_000_000_100_100_100_100
        // 001_000_000_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let bonus: Bonus = Bonus::Totem;
        let blocks = bonus.apply(bitmap, 2, 4);
        assert_eq!(
            blocks,
            0b000_000_000_001_000_000_000_001_000_000_000_000_000_000_000_000_000_000_000_000_100_100_100_100_001_000_000_000_011_011_011_000
        );
    }
}
