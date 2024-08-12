// Internal imports
use zkube::elements::difficulties::interface::{DifficultyTrait, Block};

impl DifficultyImpl of DifficultyTrait {
    #[inline(always)]
    fn count() -> u32 {
        15
    }

    #[inline(always)]
    fn reveal(id: u8) -> Block {
        match id {
            0 => Block::None,
            1 => Block::Zero,
            2 => Block::Zero,
            3 => Block::Zero,
            4 => Block::Zero,
            5 => Block::Zero,
            6 => Block::One,
            7 => Block::One,
            8 => Block::One,
            9 => Block::One,
            10 => Block::One,
            11 => Block::Two,
            12 => Block::Two,
            13 => Block::Two,
            14 => Block::Three,
            15 => Block::Four,
            _ => Block::Zero,
        }
    }
}
