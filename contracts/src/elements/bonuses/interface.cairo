#[derive(Drop, Copy)]
pub trait BonusTrait {
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252;
    fn get_count(score: u16, combo_count: u16, max_combo: u8) -> u8;
}
