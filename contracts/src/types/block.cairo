// Internal imports

use zkube::types::width::Width;

#[derive(Copy, Drop, Serde)]
enum Block {
    None,
    Zero,
    One,
    Two,
    Three,
    Four
}

#[generate_trait]
impl BlockImpl of BlockTrait {
    #[inline(always)]
    fn get_bits(self: Block) -> u32 {
        match self {
            Block::None => 0,
            Block::Zero => 0,
            Block::One => 0b001,
            Block::Two => 0b010010,
            Block::Three => 0b011011011,
            Block::Four => 0b100100100100,
        }
    }

    #[inline(always)]
    fn size(self: Block) -> Width {
        match self {
            Block::None => Width::None,
            Block::Zero => Width::One,
            Block::One => Width::One,
            Block::Two => Width::Two,
            Block::Three => Width::Three,
            Block::Four => Width::Four,
        }
    }
}
