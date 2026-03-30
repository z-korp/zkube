pub trait BonusTrait {
    fn apply(blocks: felt252, row_index: u8, index: u8) -> felt252;
}
