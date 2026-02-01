use zkube::types::block::Block;

pub trait DifficultyTrait {
    fn count() -> u32;
    fn reveal(id: u8) -> Block;
}
