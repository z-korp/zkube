// Internal imports

use zkube::types::difficulty::Difficulty;
use zkube::types::block::Block;

#[derive(Drop, Copy)]
trait DifficultyTrait {
    fn count() -> u32;
    fn reveal(id: u8) -> Block;
}
