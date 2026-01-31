use core::traits::Into;

use zkube::elements::bonuses::hammer;
use zkube::elements::bonuses::totem;
use zkube::elements::bonuses::wave;
use zkube::elements::bonuses::shrink;
use zkube::elements::bonuses::shuffle;

/// Bonus types available in the game
/// Players select 3 of 5 at game start (Shrink and Shuffle require unlock)
#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum Bonus {
    None,
    Hammer,   // Clear target block (L2: +1 combo, L3: +2 combo)
    Totem,    // Clear same-size blocks (L2: +cubes, L3: clear grid)
    Wave,     // Clear row (L2: +1 free move, L3: +2 free moves)
    Shrink,   // Shrink block size (L2: same-size, L3: shrink by 2)
    Shuffle,  // Randomize positions (L2: next line, L3: entire grid)
}

#[generate_trait]
pub impl BonusImpl of BonusTrait {
    /// Apply bonus effect at level 1 (basic effect)
    /// For level-scaled effects, use apply_with_level
    #[inline(always)]
    fn apply(self: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
        match self {
            Bonus::None => blocks,
            Bonus::Hammer => hammer::BonusImpl::apply(blocks, row_index, index),
            Bonus::Totem => totem::BonusImpl::apply(blocks, row_index, index),
            Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
            Bonus::Shrink => shrink::BonusImpl::apply(blocks, row_index, index),
            Bonus::Shuffle => shuffle::BonusImpl::apply(blocks, row_index, index),
        }
    }

    /// Check if this bonus type requires unlocking in the permanent shop
    fn requires_unlock(self: Bonus) -> bool {
        match self {
            Bonus::Shrink | Bonus::Shuffle => true,
            _ => false,
        }
    }

    /// Check if this is a valid selectable bonus (not None)
    fn is_selectable(self: Bonus) -> bool {
        match self {
            Bonus::None => false,
            _ => true,
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
            Bonus::Shrink => 'SHRINK',
            Bonus::Shuffle => 'SHUFFLE',
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
            Bonus::Shrink => 4,
            Bonus::Shuffle => 5,
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
            4 => Bonus::Shrink,
            5 => Bonus::Shuffle,
            _ => Bonus::None,
        }
    }
}

#[cfg(test)]
mod tests {
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
