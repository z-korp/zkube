/// In-game shop consumable types
/// These can be purchased during a run using cubes from brought + earned
/// They provide immediate benefits but don't persist beyond the run
///
/// V2.0 Shop System:
/// - Bonus1/2/3: Buy one of your selected bonuses (5 CUBE each)
///   Each can only be bought once per shop visit, then requires a Refill
/// - Refill: Allows buying another bonus of any type (cost = 2 * (n+1) where n = refills bought)
/// - LevelUp: Level up one of your bonuses (50 CUBE, only at shop levels)

#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum ConsumableType {
    Bonus1,         // Add 1 of selected_bonus_1 to inventory (5 CUBE)
    Bonus2,         // Add 1 of selected_bonus_2 to inventory (5 CUBE)
    Bonus3,         // Add 1 of selected_bonus_3 to inventory (5 CUBE)
    Refill,         // Allow buying another bonus (2 * (n+1) CUBE)
    LevelUp,        // Level up a bonus (50 CUBE) - requires bonus_slot param
}

/// Base cost for bonus consumables
pub const BONUS_COST: u16 = 5;

/// Cost for level up
pub const LEVEL_UP_COST: u16 = 50;

#[generate_trait]
pub impl ConsumableImpl of ConsumableTrait {
    /// Get the base cost of a consumable (fixed costs)
    /// Note: Refill cost depends on how many refills already bought - use get_refill_cost
    #[inline(always)]
    fn get_cost(self: ConsumableType) -> u16 {
        match self {
            ConsumableType::Bonus1 => BONUS_COST,
            ConsumableType::Bonus2 => BONUS_COST,
            ConsumableType::Bonus3 => BONUS_COST,
            ConsumableType::Refill => 2, // Base cost, actual is 2 * (n+1)
            ConsumableType::LevelUp => LEVEL_UP_COST,
        }
    }
    
    /// Get refill cost based on number of refills already bought
    /// Cost formula: 2 * (refills_bought + 1)
    #[inline(always)]
    fn get_refill_cost(refills_bought: u8) -> u16 {
        let multiplier: u16 = (refills_bought + 1).into();
        2_u16 * multiplier
    }
}

impl IntoConsumableU8 of Into<ConsumableType, u8> {
    #[inline(always)]
    fn into(self: ConsumableType) -> u8 {
        match self {
            ConsumableType::Bonus1 => 0,
            ConsumableType::Bonus2 => 1,
            ConsumableType::Bonus3 => 2,
            ConsumableType::Refill => 3,
            ConsumableType::LevelUp => 4,
        }
    }
}

impl IntoU8Consumable of Into<u8, ConsumableType> {
    #[inline(always)]
    fn into(self: u8) -> ConsumableType {
        match self {
            0 => ConsumableType::Bonus1,
            1 => ConsumableType::Bonus2,
            2 => ConsumableType::Bonus3,
            3 => ConsumableType::Refill,
            4 => ConsumableType::LevelUp,
            _ => ConsumableType::Bonus1, // Default fallback
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ConsumableType, ConsumableTrait, BONUS_COST, LEVEL_UP_COST};

    #[test]
    fn test_consumable_costs() {
        assert!(ConsumableType::Bonus1.get_cost() == BONUS_COST, "Bonus1 should cost 5");
        assert!(ConsumableType::Bonus2.get_cost() == BONUS_COST, "Bonus2 should cost 5");
        assert!(ConsumableType::Bonus3.get_cost() == BONUS_COST, "Bonus3 should cost 5");
        assert!(ConsumableType::Refill.get_cost() == 2, "Refill base should be 2");
        assert!(ConsumableType::LevelUp.get_cost() == LEVEL_UP_COST, "LevelUp should cost 50");
    }
    
    #[test]
    fn test_refill_cost_formula() {
        // Cost = 2 * (n + 1) where n = refills already bought
        assert!(ConsumableTrait::get_refill_cost(0) == 2, "First refill costs 2");
        assert!(ConsumableTrait::get_refill_cost(1) == 4, "Second refill costs 4");
        assert!(ConsumableTrait::get_refill_cost(2) == 6, "Third refill costs 6");
        assert!(ConsumableTrait::get_refill_cost(4) == 10, "Fifth refill costs 10");
    }

    #[test]
    fn test_consumable_to_u8() {
        let bonus1: u8 = ConsumableType::Bonus1.into();
        let bonus2: u8 = ConsumableType::Bonus2.into();
        let bonus3: u8 = ConsumableType::Bonus3.into();
        let refill: u8 = ConsumableType::Refill.into();
        let level_up: u8 = ConsumableType::LevelUp.into();
        
        assert!(bonus1 == 0, "Bonus1 should be 0");
        assert!(bonus2 == 1, "Bonus2 should be 1");
        assert!(bonus3 == 2, "Bonus3 should be 2");
        assert!(refill == 3, "Refill should be 3");
        assert!(level_up == 4, "LevelUp should be 4");
    }

    #[test]
    fn test_u8_to_consumable() {
        let bonus1: ConsumableType = 0_u8.into();
        let bonus2: ConsumableType = 1_u8.into();
        let bonus3: ConsumableType = 2_u8.into();
        let refill: ConsumableType = 3_u8.into();
        let level_up: ConsumableType = 4_u8.into();
        
        assert!(bonus1 == ConsumableType::Bonus1, "0 should be Bonus1");
        assert!(bonus2 == ConsumableType::Bonus2, "1 should be Bonus2");
        assert!(bonus3 == ConsumableType::Bonus3, "2 should be Bonus3");
        assert!(refill == ConsumableType::Refill, "3 should be Refill");
        assert!(level_up == ConsumableType::LevelUp, "4 should be LevelUp");
    }
}
