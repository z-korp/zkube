use zkube::types::block::Block;

#[derive(Drop, Copy)]
pub trait DifficultyTrait {
    fn count() -> u32;
    fn reveal(id: u8) -> Block;
}
