// Internal imports

use zkube::elements::bonuses::hammer;

#[derive(Drop, Copy, Serde)]
enum Bonus {
    None,
    Hammer,
    Totem,
    Wave,
}

#[generate_trait]
impl BonusImpl of BonusTrait {
    fn apply_bonus(self: Bonus, bitmap: felt252, row_index: u8, index: u8) -> felt252 {
        match self {
            Bonus::Hammer => hammer::BonusImpl::apply_bonus(bitmap, self, row_index, index),
            _ => bitmap,
        }
    }
}


impl IntoBonusFelt252 of core::Into<Bonus, felt252> {
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

impl IntoBonusU8 of core::Into<Bonus, u8> {
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

impl IntoU8Bonus of core::Into<u8, Bonus> {
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

impl BonusPrint of core::debug::PrintTrait<Bonus> {
    #[inline(always)]
    fn print(self: Bonus) {
        let felt: felt252 = self.into();
        felt.print();
    }
}

