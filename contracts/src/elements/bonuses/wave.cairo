use alexandria_math::fast_power::fast_power;

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;

pub impl BonusImpl of BonusTrait {
    #[inline(always)]
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252 {
        // [Compute] Mask of the row
        let base_mask = constants::ROW_SIZE - 1;
        let exp = row_index * constants::ROW_BIT_COUNT;
        let shift: u256 = fast_power(2, exp.into());
        let mask: u256 = base_mask.into() * shift.into();
        // [Compute] Apply negative mask on bitmap to remove the row
        let mut bitmap: u256 = blocks.into();
        bitmap = bitmap & ~mask;

        bitmap.try_into().unwrap()
    }

    #[inline(always)]
    fn get_count(score: u16, combo_count: u16, max_combo: u8) -> u8 {
        if combo_count >= 64 {
            return 3;
        }
        if combo_count >= 32 {
            return 2;
        }
        if combo_count >= 16 {
            return 1;
        }
        return 0;
    }
}
