/// In-game shop consumable types
/// These can be purchased during a run using cubes_brought
/// They provide immediate benefits but don't persist beyond the run

#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum ConsumableType {
    Hammer,         // Add 1 Hammer bonus to inventory
    Wave,           // Add 1 Wave bonus to inventory
    Totem,          // Add 1 Totem bonus to inventory
    ExtraMoves,     // Add extra moves to current level
}

/// Costs for consumables in the in-game shop
mod ConsumableCosts {
    pub const HAMMER_COST: u16 = 5;
    pub const WAVE_COST: u16 = 5;
    pub const TOTEM_COST: u16 = 5;
    pub const EXTRA_MOVES_COST: u16 = 10; // Adds 5 extra moves
}

/// Extra moves granted when purchasing ExtraMoves consumable
pub const EXTRA_MOVES_AMOUNT: u8 = 5;

#[generate_trait]
pub impl ConsumableImpl of ConsumableTrait {
    /// Get the cost of a consumable in cubes
    fn get_cost(self: ConsumableType) -> u16 {
        match self {
            ConsumableType::Hammer => ConsumableCosts::HAMMER_COST,
            ConsumableType::Wave => ConsumableCosts::WAVE_COST,
            ConsumableType::Totem => ConsumableCosts::TOTEM_COST,
            ConsumableType::ExtraMoves => ConsumableCosts::EXTRA_MOVES_COST,
        }
    }
}

impl IntoConsumableU8 of Into<ConsumableType, u8> {
    #[inline(always)]
    fn into(self: ConsumableType) -> u8 {
        match self {
            ConsumableType::Hammer => 0,
            ConsumableType::Wave => 1,
            ConsumableType::Totem => 2,
            ConsumableType::ExtraMoves => 3,
        }
    }
}

impl IntoU8Consumable of Into<u8, ConsumableType> {
    #[inline(always)]
    fn into(self: u8) -> ConsumableType {
        match self {
            0 => ConsumableType::Hammer,
            1 => ConsumableType::Wave,
            2 => ConsumableType::Totem,
            3 => ConsumableType::ExtraMoves,
            _ => ConsumableType::Hammer, // Default fallback
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ConsumableType, ConsumableTrait, ConsumableCosts};

    #[test]
    fn test_consumable_costs() {
        assert!(ConsumableType::Hammer.get_cost() == 5, "Hammer should cost 5");
        assert!(ConsumableType::Wave.get_cost() == 5, "Wave should cost 5");
        assert!(ConsumableType::Totem.get_cost() == 5, "Totem should cost 5");
        assert!(ConsumableType::ExtraMoves.get_cost() == 10, "ExtraMoves should cost 10");
    }

    #[test]
    fn test_consumable_to_u8() {
        let hammer: u8 = ConsumableType::Hammer.into();
        let wave: u8 = ConsumableType::Wave.into();
        let totem: u8 = ConsumableType::Totem.into();
        let extra_moves: u8 = ConsumableType::ExtraMoves.into();
        
        assert!(hammer == 0, "Hammer should be 0");
        assert!(wave == 1, "Wave should be 1");
        assert!(totem == 2, "Totem should be 2");
        assert!(extra_moves == 3, "ExtraMoves should be 3");
    }

    #[test]
    fn test_u8_to_consumable() {
        let hammer: ConsumableType = 0_u8.into();
        let wave: ConsumableType = 1_u8.into();
        let totem: ConsumableType = 2_u8.into();
        let extra_moves: ConsumableType = 3_u8.into();
        
        assert!(hammer == ConsumableType::Hammer, "0 should be Hammer");
        assert!(wave == ConsumableType::Wave, "1 should be Wave");
        assert!(totem == ConsumableType::Totem, "2 should be Totem");
        assert!(extra_moves == ConsumableType::ExtraMoves, "3 should be ExtraMoves");
    }
}
