// Internal imports

use zkube::models::game::Game;
use zkube::types::bonus::Bonus;

#[derive(Drop, Copy)]
trait BonusTrait {
    fn apply(blocks: felt252, colors: felt252, row_index: u8, index: u8) -> (felt252, felt252);

    fn get_count(self: Bonus, game: Game) -> u8;
}
