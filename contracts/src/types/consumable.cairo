/// In-game shop consumable types
/// These can be purchased during a run using cubes from brought + earned
///
/// V3.0 Shop System:
/// - BonusCharge: Buy a charge that goes to unallocated pool (player allocates later)
///   Cost scales: ceil(5 * 1.5^n) where n = shop_purchases this shop visit
///   Sequence: 5, 8, 12, 18, 27, 41, ...
/// - LevelUp: Upgrade one selected bonus (L1→L2→L3), 50 CUBE, limit 1 per shop
/// - SwapBonus: Replace one selected bonus with an unselected one, 50 CUBE, limit 1 per shop
///   NOTE: SwapBonus uses a standalone swap_bonus() entrypoint, not purchase_consumable

#[derive(Drop, Copy, Serde, Introspect, PartialEq)]
pub enum ConsumableType {
    BonusCharge,    // Buy a bonus charge to unallocated pool (scaling cost)
    LevelUp,        // Level up a bonus (50 CUBE, 1 per shop)
    SwapBonus,      // Swap a bonus for a different one (50 CUBE, 1 per shop)
}

/// Base cost for bonus charge (first purchase)
pub const BONUS_CHARGE_BASE_COST: u16 = 5;

/// Cost for level up
pub const LEVEL_UP_COST: u16 = 50;

/// Cost for swap bonus
pub const SWAP_BONUS_COST: u16 = 50;

#[generate_trait]
pub impl ConsumableImpl of ConsumableTrait {
    /// Get the cost of a BonusCharge based on how many have been purchased this shop visit.
    /// Cost formula: ceil(5 * 1.5^n) where n = shop_purchases
    /// Sequence: 5, 8, 12, 18, 27, 41, 62, 93, ...
    /// Price scaling resets per shop visit.
    #[inline(always)]
    fn get_bonus_charge_cost(shop_purchases: u8) -> u16 {
        // Use integer math: multiply by 3/2 each step, rounding up
        let mut cost: u32 = BONUS_CHARGE_BASE_COST.into();
        let mut i: u8 = 0;
        loop {
            if i >= shop_purchases {
                break;
            }
            // cost = ceil(cost * 3 / 2) = (cost * 3 + 1) / 2
            cost = (cost * 3 + 1) / 2;
            i += 1;
        };
        if cost > 65535 { 65535_u16 } else { cost.try_into().unwrap() }
    }

    /// Get the fixed cost of a consumable (for LevelUp and SwapBonus)
    #[inline(always)]
    fn get_cost(self: ConsumableType) -> u16 {
        match self {
            ConsumableType::BonusCharge => BONUS_CHARGE_BASE_COST, // Base; actual depends on shop_purchases
            ConsumableType::LevelUp => LEVEL_UP_COST,
            ConsumableType::SwapBonus => SWAP_BONUS_COST,
        }
    }
}

impl IntoConsumableU8 of Into<ConsumableType, u8> {
    #[inline(always)]
    fn into(self: ConsumableType) -> u8 {
        match self {
            ConsumableType::BonusCharge => 0,
            ConsumableType::LevelUp => 1,
            ConsumableType::SwapBonus => 2,
        }
    }
}

impl IntoU8Consumable of Into<u8, ConsumableType> {
    #[inline(always)]
    fn into(self: u8) -> ConsumableType {
        match self {
            0 => ConsumableType::BonusCharge,
            1 => ConsumableType::LevelUp,
            2 => ConsumableType::SwapBonus,
            _ => ConsumableType::BonusCharge, // Default fallback
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ConsumableType, ConsumableTrait, BONUS_CHARGE_BASE_COST, LEVEL_UP_COST, SWAP_BONUS_COST};

    #[test]
    fn test_consumable_costs() {
        assert!(ConsumableType::BonusCharge.get_cost() == BONUS_CHARGE_BASE_COST, "BonusCharge base should be 5");
        assert!(ConsumableType::LevelUp.get_cost() == LEVEL_UP_COST, "LevelUp should cost 50");
        assert!(ConsumableType::SwapBonus.get_cost() == SWAP_BONUS_COST, "SwapBonus should cost 50");
    }

    #[test]
    fn test_bonus_charge_cost_scaling() {
        // Cost = ceil(5 * 1.5^n)
        // n=0: 5, n=1: 8, n=2: 12, n=3: 18, n=4: 27, n=5: 41
        assert!(ConsumableTrait::get_bonus_charge_cost(0) == 5, "First charge costs 5");
        assert!(ConsumableTrait::get_bonus_charge_cost(1) == 8, "Second charge costs 8");
        assert!(ConsumableTrait::get_bonus_charge_cost(2) == 12, "Third charge costs 12");
        assert!(ConsumableTrait::get_bonus_charge_cost(3) == 18, "Fourth charge costs 18");
        assert!(ConsumableTrait::get_bonus_charge_cost(4) == 27, "Fifth charge costs 27");
        assert!(ConsumableTrait::get_bonus_charge_cost(5) == 41, "Sixth charge costs 41");
    }

    #[test]
    fn test_consumable_to_u8() {
        let bonus_charge: u8 = ConsumableType::BonusCharge.into();
        let level_up: u8 = ConsumableType::LevelUp.into();
        let swap_bonus: u8 = ConsumableType::SwapBonus.into();

        assert!(bonus_charge == 0, "BonusCharge should be 0");
        assert!(level_up == 1, "LevelUp should be 1");
        assert!(swap_bonus == 2, "SwapBonus should be 2");
    }

    #[test]
    fn test_u8_to_consumable() {
        let bonus_charge: ConsumableType = 0_u8.into();
        let level_up: ConsumableType = 1_u8.into();
        let swap_bonus: ConsumableType = 2_u8.into();

        assert!(bonus_charge == ConsumableType::BonusCharge, "0 should be BonusCharge");
        assert!(level_up == ConsumableType::LevelUp, "1 should be LevelUp");
        assert!(swap_bonus == ConsumableType::SwapBonus, "2 should be SwapBonus");
    }
}
