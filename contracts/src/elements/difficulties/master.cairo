use zkube::elements::difficulties::interface::DifficultyTrait;
use zkube::types::block::Block;

pub impl DifficultyImpl of DifficultyTrait {
    #[inline(always)]
    fn count() -> u32 {
        15
    }

    #[inline(always)]
    fn reveal(id: u8) -> Block {
        match id {
            0 => Block::None,
            1 => Block::Zero,
            2 => Block::One,
            3 => Block::One,
            4 => Block::Two,
            5 => Block::Two,
            6 => Block::Two,
            7 => Block::Three,
            8 => Block::Three,
            9 => Block::Three,
            10 => Block::Three,
            11 => Block::Four,
            12 => Block::Four,
            13 => Block::Four,
            14 => Block::Four,
            15 => Block::Four,
            _ => Block::Zero,
        }
    }
}
