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

    fn size(self: Block) -> u8 {
        match self {
            Block::None => 0,
            Block::Zero => 1,
            Block::One => 1,
            Block::Two => 2,
            Block::Three => 3,
            Block::Four => 4,
        }
    }
}
