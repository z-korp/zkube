use core::traits::Into;

/// Active skill types (vNext)
/// 4 active skills that consume charges when used:
///
/// 1. ComboSurge  - Combo depth boost (Tempo archetype)
/// 2. Momentum    - Score burst scaling with zone (Scaling archetype)
/// 3. Harvest     - Random block destruction for cubes (Risk archetype)
/// 4. Tsunami     - Targeted block/row destruction (Control archetype)
#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum Bonus {
    None,
    ComboSurge, // +combo depth to next cascade
    Momentum, // Score burst (scales with zones cleared)
    Harvest, // Destroy random blocks, earn cubes per block size
    Tsunami, // Targeted block or row destruction
}

#[generate_trait]
pub impl BonusImpl of BonusTrait {
    /// Check if this is a valid selectable active skill (not None)
    fn is_selectable(self: Bonus) -> bool {
        match self {
            Bonus::None => false,
            _ => true,
        }
    }

    /// Get the type code / skill_id for this active skill.
    /// Matches the skill IDs used in RunData slots.
    #[inline(always)]
    fn to_type_code(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::ComboSurge => 1,
            Bonus::Momentum => 2,
            Bonus::Harvest => 3,
            Bonus::Tsunami => 4,
        }
    }

    /// Create a Bonus from a type code / skill_id.
    #[inline(always)]
    fn from_type_code(code: u8) -> Bonus {
        match code {
            1 => Bonus::ComboSurge,
            2 => Bonus::Momentum,
            3 => Bonus::Harvest,
            4 => Bonus::Tsunami,
            _ => Bonus::None,
        }
    }
}

impl IntoBonusFelt252 of Into<Bonus, felt252> {
    #[inline(always)]
    fn into(self: Bonus) -> felt252 {
        match self {
            Bonus::None => 'NONE',
            Bonus::ComboSurge => 'COMBO_SURGE',
            Bonus::Momentum => 'MOMENTUM',
            Bonus::Harvest => 'HARVEST',
            Bonus::Tsunami => 'TSUNAMI',
        }
    }
}

impl IntoBonusU8 of Into<Bonus, u8> {
    #[inline(always)]
    fn into(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::ComboSurge => 1,
            Bonus::Momentum => 2,
            Bonus::Harvest => 3,
            Bonus::Tsunami => 4,
        }
    }
}

impl IntoU8Bonus of Into<u8, Bonus> {
    #[inline(always)]
    fn into(self: u8) -> Bonus {
        let action: felt252 = self.into();
        match action {
            0 => Bonus::None,
            1 => Bonus::ComboSurge,
            2 => Bonus::Momentum,
            3 => Bonus::Harvest,
            4 => Bonus::Tsunami,
            _ => Bonus::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Bonus, BonusTrait};

    #[test]
    fn test_bonus_type_codes() {
        assert!(Bonus::ComboSurge.to_type_code() == 1, "ComboSurge should be 1");
        assert!(Bonus::Momentum.to_type_code() == 2, "Momentum should be 2");
        assert!(Bonus::Harvest.to_type_code() == 3, "Harvest should be 3");
        assert!(Bonus::Tsunami.to_type_code() == 4, "Tsunami should be 4");
    }

    #[test]
    fn test_bonus_from_type_code_roundtrip() {
        let codes: Array<u8> = array![0, 1, 2, 3, 4];
        let mut i: u32 = 0;
        loop {
            if i >= codes.len() {
                break;
            }
            let code = *codes.at(i);
            let bonus = BonusTrait::from_type_code(code);
            assert!(bonus.to_type_code() == code, "Roundtrip failed");
            i += 1;
        };
    }

    #[test]
    fn test_bonus_is_selectable() {
        assert!(!Bonus::None.is_selectable(), "None should not be selectable");
        assert!(Bonus::ComboSurge.is_selectable(), "ComboSurge should be selectable");
        assert!(Bonus::Momentum.is_selectable(), "Momentum should be selectable");
        assert!(Bonus::Harvest.is_selectable(), "Harvest should be selectable");
        assert!(Bonus::Tsunami.is_selectable(), "Tsunami should be selectable");
    }
}
