// Internal imports

use zkube::types::cards::Card;

#[derive(Drop, Copy)]
trait DeckTrait {
    fn count() -> u32;
    fn draw(id: u8) -> Card;
}
