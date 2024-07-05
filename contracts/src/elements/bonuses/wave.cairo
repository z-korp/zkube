// External imports

use alexandria_math::fast_power::fast_power;

// Internal imports

use zkube::constants;
use zkube::elements::bonuses::interface::BonusTrait;
use zkube::models::game::Game;
use zkube::types::bonus::Bonus;

impl BonusImpl of BonusTrait {
    #[inline(always)]
    fn apply(blocks: felt252, colors: felt252, row_index: u8, index: u8) -> (felt252, felt252) {
        // [Compute] Mask of the row
        let base_mask = constants::ROW_SIZE - 1;
        let exp = row_index * constants::ROW_BIT_COUNT;
        let shift: u256 = fast_power(2, exp.into());
        let mask: u256 = base_mask.into() * shift.into();
        // [Compute] Apply negative mask on bitmap to remove the row
        let mut bitmap: u256 = blocks.into();
        bitmap = bitmap & ~mask;
        (bitmap.try_into().unwrap(), colors)
    }

    #[inline(always)]
    fn get_count(self: Bonus, game: Game) -> u8 {
        game.wave_bonus
    }
}
