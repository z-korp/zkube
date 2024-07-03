#[derive(Copy, Drop, Serde)]
enum Card {
    None,
    Zero,
    One,
    Two,
    Three,
    Four
}


#[generate_trait]
impl CardImpl of CardTrait {
    fn get_bits(card: Card) -> u32 {
        return 0;
    }
}
