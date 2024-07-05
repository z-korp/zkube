#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Player {
    #[key]
    id: felt252,
    game_id: u32,
    name: felt252,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Game {
    #[key]
    id: u32,
    over: bool,
    score: u32,
    next_row: u32,
    next_color: u32,
    bonuses: u16,
    blocks: felt252,
    colors: felt252,
    player_id: felt252,
    seed: felt252,
}
