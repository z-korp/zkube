// External imports

use origami::random::deck::Deck;

// Internal imports

use zkube::elements::decks::interface::{DeckTrait};
use zkube::types::cards::Card;

impl DeckDataImpl of DeckTrait {
    #[inline(always)]
    fn count() -> u32 {
        14
    }

    #[inline(always)]
    fn draw(id: u8) -> Card {
        match id {
            0 => Card::None,
            1 => Card::Zero,
            2 => Card::Zero,
            3 => Card::One,
            4 => Card::One,
            5 => Card::One,
            6 => Card::One,
            7 => Card::Two,
            8 => Card::Two,
            9 => Card::Two,
            10 => Card::Two,
            11 => Card::Three,
            12 => Card::Three,
            13 => Card::Four,
            _ => Card::Zero,
        }
    }
}
