use core::traits::Into;
use zkube::elements::bonuses::{hammer, totem, wave};

#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum Bonus {
    None,
    Hammer, // Destroy single block at target position
    Totem, // Destroy all blocks of same size across grid
    Wave // Destroy entire target row
}

#[generate_trait]
pub impl BonusImpl of BonusTrait {
    fn apply(self: Bonus, blocks: felt252, row_index: u8, index: u8) -> felt252 {
        match self {
            Bonus::None => blocks,
            Bonus::Hammer => hammer::BonusImpl::apply(blocks, row_index, index),
            Bonus::Totem => totem::BonusImpl::apply(blocks, row_index, index),
            Bonus::Wave => wave::BonusImpl::apply(blocks, row_index, index),
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
