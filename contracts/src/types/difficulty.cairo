// Internal imports

use zkube::elements::difficulties::easy;
use zkube::types::block::Block;

#[derive(Copy, Drop, Serde)]
enum Difficulty {
    None,
    Easy,
}

#[generate_trait]
impl DifficultyImpl of DifficultyTrait {
    fn count(self: Difficulty) -> u32 {
        match self {
            Difficulty::None => 0,
            Difficulty::Easy => easy::DifficultyImpl::count(),
        }
    }

    fn reveal(self: Difficulty, id: u8) -> Block {
        match self {
            Difficulty::None => Block::None,
            Difficulty::Easy => easy::DifficultyImpl::reveal(id),
        }
    }
}
