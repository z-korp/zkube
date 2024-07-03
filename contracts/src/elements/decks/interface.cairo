// Internal imports

use zkube::types::cards::Card;

#[derive(Drop, Copy)]
trait DeckTrait {
    fn count() -> u32;
    fn reveal(id: u8) -> Card;
}
