// Internal imports

use zkube::elements::decks::interface::DeckTrait;
use zkube::types::cards::Card;

impl DeckDataImpl of DeckTrait {
    #[inline(always)]
    fn count() -> u32 {
        15
    }

    #[inline(always)]
    fn reveal(id: u8) -> Card {
        match id {
            0 => Card::None,
            1 => Card::Zero,
            2 => Card::Zero,
            3 => Card::Zero,
            4 => Card::One,
            5 => Card::One,
            6 => Card::One,
            7 => Card::One,
            8 => Card::One,
            9 => Card::Two,
            10 => Card::Two,
            11 => Card::Two,
            12 => Card::Two,
            13 => Card::Three,
            14 => Card::Three,
            15 => Card::Four,
            _ => Card::Zero,
        }
    }
}
