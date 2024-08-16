#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Player {
    #[key]
    id: felt252,
    game_id: u32,
    hammer_bonus: u8,
    wave_bonus: u8,
    totem_bonus: u8,
    name: felt252,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Game {
    #[key]
    id: u32,
    difficulty: u8,
    over: bool,
    score: u32,
    moves: u32,
    next_row: u32,
    next_color: u32,
    hammer_bonus: u8,
    wave_bonus: u8,
    totem_bonus: u8,
    combo_counter: u8,
    blocks: felt252,
    colors: felt252,
    player_id: felt252,
    seed: felt252,
}
