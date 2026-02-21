use core::traits::Into;

/// Bonus types available in the game (V3.0)
/// Players select 3 of 5 at game start (Wave and Supply require unlock)
///
/// 1. Combo   - Adds combo to next move (+1/+2/+3 at L1/L2/L3)
/// 2. Score   - Adds direct score (+10/+20/+30 at L1/L2/L3)
/// 3. Harvest - Destroys all blocks of chosen size, earns CUBE per block (+1/+2/+3 at L1/L2/L3)
/// 4. Wave    - Clears horizontal lines (1/2/3 at L1/L2/L3) [locked, requires unlock]
/// 5. Supply  - Adds new lines at no move cost (1/2/3 at L1/L2/L3) [locked, requires unlock]
#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum Bonus {
    None,
    Combo, // +combo to next move (L1: +1, L2: +2, L3: +3)
    Score, // +direct score (L1: +10, L2: +20, L3: +30)
    Harvest, // Destroy blocks of chosen size, +CUBE/block (L1: +1, L2: +2, L3: +3)
    Wave, // Clear lines (L1: 1, L2: 2, L3: 3) [requires unlock]
    Supply // Add lines at no move cost (L1: 1, L2: 2, L3: 3) [requires unlock]
}

#[generate_trait]
pub impl BonusImpl of BonusTrait {
    /// Check if this bonus type requires unlocking in the permanent shop
    fn requires_unlock(self: Bonus) -> bool {
        match self {
            Bonus::Wave | Bonus::Supply => true,
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

    /// Get the type code for this bonus (1=Combo, 2=Score, 3=Harvest, 4=Wave, 5=Supply).
    /// This matches the encoding used in RunData.selected_bonus_*.
    #[inline(always)]
    fn to_type_code(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::Combo => 1,
            Bonus::Score => 2,
            Bonus::Harvest => 3,
            Bonus::Wave => 4,
            Bonus::Supply => 5,
        }
    }

    /// Create a Bonus from a type code.
    #[inline(always)]
    fn from_type_code(code: u8) -> Bonus {
        match code {
            1 => Bonus::Combo,
            2 => Bonus::Score,
            3 => Bonus::Harvest,
            4 => Bonus::Wave,
            5 => Bonus::Supply,
            _ => Bonus::None,
        }
    }

    /// Get the bag index for this bonus type.
    /// Bag indices: 0=Combo, 1=Score, 2=Harvest, 3=Wave, 4=Supply.
    /// This matches the order in MetaData.get_bag_size().
    #[inline(always)]
    fn bag_index(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::Combo => 0,
            Bonus::Score => 1,
            Bonus::Harvest => 2,
            Bonus::Wave => 3,
            Bonus::Supply => 4,
        }
    }
}

impl IntoBonusFelt252 of Into<Bonus, felt252> {
    #[inline(always)]
    fn into(self: Bonus) -> felt252 {
        match self {
            Bonus::None => 'NONE',
            Bonus::Combo => 'COMBO',
            Bonus::Score => 'SCORE',
            Bonus::Harvest => 'HARVEST',
            Bonus::Wave => 'WAVE',
            Bonus::Supply => 'SUPPLY',
        }
    }
}

impl IntoBonusU8 of Into<Bonus, u8> {
    #[inline(always)]
    fn into(self: Bonus) -> u8 {
        match self {
            Bonus::None => 0,
            Bonus::Combo => 1,
            Bonus::Score => 2,
            Bonus::Harvest => 3,
            Bonus::Wave => 4,
            Bonus::Supply => 5,
        }
    }
}

impl IntoU8Bonus of Into<u8, Bonus> {
    #[inline(always)]
    fn into(self: u8) -> Bonus {
        let action: felt252 = self.into();
        match action {
            0 => Bonus::None,
            1 => Bonus::Combo,
            2 => Bonus::Score,
            3 => Bonus::Harvest,
            4 => Bonus::Wave,
            5 => Bonus::Supply,
            _ => Bonus::None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{Bonus, BonusTrait};

    #[test]
    fn test_bonus_type_codes() {
        assert!(Bonus::Combo.to_type_code() == 1, "Combo should be 1");
        assert!(Bonus::Score.to_type_code() == 2, "Score should be 2");
        assert!(Bonus::Harvest.to_type_code() == 3, "Harvest should be 3");
        assert!(Bonus::Wave.to_type_code() == 4, "Wave should be 4");
        assert!(Bonus::Supply.to_type_code() == 5, "Supply should be 5");
    }

    #[test]
    fn test_bonus_from_type_code_roundtrip() {
        let codes: Array<u8> = array![0, 1, 2, 3, 4, 5];
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
    fn test_bonus_requires_unlock() {
        assert!(!Bonus::Combo.requires_unlock(), "Combo should not require unlock");
        assert!(!Bonus::Score.requires_unlock(), "Score should not require unlock");
        assert!(!Bonus::Harvest.requires_unlock(), "Harvest should not require unlock");
        assert!(Bonus::Wave.requires_unlock(), "Wave should require unlock");
        assert!(Bonus::Supply.requires_unlock(), "Supply should require unlock");
    }

    #[test]
    fn test_bonus_bag_index() {
        assert!(Bonus::Combo.bag_index() == 0, "Combo bag index should be 0");
        assert!(Bonus::Score.bag_index() == 1, "Score bag index should be 1");
        assert!(Bonus::Harvest.bag_index() == 2, "Harvest bag index should be 2");
        assert!(Bonus::Wave.bag_index() == 3, "Wave bag index should be 3");
        assert!(Bonus::Supply.bag_index() == 4, "Supply bag index should be 4");
    }
}

#[cfg(test)]
mod bonus_effect_tests {
    // Local imports
    use zkube::helpers::bonus_logic::apply_bonus_effect;
    use super::Bonus;

    #[test]
    fn test_bonus_harvest() {
        // Harvest clears all blocks of the same size as the target block.
        // Target: row 2, index 4 → block at position 4 in row 2 is size 2 (010).
        // All size-2 (010) blocks in the grid are cleared.
        // Initial grid
        // 000_000_000_001_000_000_000_001
        // 000_000_010_010_000_000_000_000
        // 010_010_000_000_100_100_100_100
        // 001_010_010_000_011_011_011_000
        // After Harvest on row_index=2, index=4 (targets size 010):
        // All 010 blocks are removed → only 001, 100, 011 blocks remain
        // 000_000_000_001_000_000_000_001
        // 000_000_000_000_000_000_000_000
        // 000_000_000_000_100_100_100_100
        // 001_000_000_000_011_011_011_000
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = apply_bonus_effect(Bonus::Harvest, bitmap, 2, 4);
        assert_eq!(
            blocks,
            0b000_000_000_001_000_000_000_001_000_000_000_000_000_000_000_000_000_000_000_000_100_100_100_100_001_000_000_000_011_011_011_000,
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
        let blocks = apply_bonus_effect(Bonus::Wave, bitmap, 0, 1);
        assert_eq!(
            blocks,
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_000_000_000_000_000_000_000_000,
        );
    }

    #[test]
    fn test_bonus_combo_noop() {
        // Combo is non-grid: applying it should return blocks unchanged.
        let bitmap: felt252 =
            0b000_000_000_001_000_000_000_001_000_000_010_010_000_000_000_000_010_010_000_000_100_100_100_100_001_010_010_000_011_011_011_000;
        let blocks = apply_bonus_effect(Bonus::Combo, bitmap, 0, 0);
        assert_eq!(blocks, bitmap);
    }
}
