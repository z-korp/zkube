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
    points: u32,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Game {
    #[key]
    id: u32,
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
    mode: u8,
    start_time: u64,
    tournament_id: u64,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Tournament {
    #[key]
    id: u64,
    prize: felt252,
    top1_player_id: felt252,
    top2_player_id: felt252,
    top3_player_id: felt252,
    top1_score: u32,
    top2_score: u32,
    top3_score: u32,
    top1_claimed: bool,
    top2_claimed: bool,
    top3_claimed: bool,
}
