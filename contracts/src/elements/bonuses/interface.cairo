use zkube::types::bonus::Bonus;

#[derive(Drop, Copy)]
trait BonusTrait {
    fn apply_bonus(bitmap: felt252, bonus: Bonus, row_index: u8, index: u8) -> felt252;
}
