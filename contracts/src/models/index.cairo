#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct Player {
    #[key]
    id: felt252,
    game_id: u32,
    name: felt252,
    points: u32,
    // Multipliers
    // Daily streak
    daily_streak: u8,
    last_active_day: u32, // Number of days since epoch
    // Account age
    account_creation_day: u32,
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
    // ------------------------
    // Bonuses
    // Bonuses usable during the game (start (0, 0, 0) and will evolve)
    hammer_bonus: u8,
    wave_bonus: u8,
    totem_bonus: u8,
    // Bonuses used during the game
    hammer_used: u8,
    wave_used: u8,
    totem_used: u8,
    // ------------------------
    combo_counter: u8,
    max_combo: u8,
    blocks: felt252,
    player_id: felt252,
    seed: felt252,
    mode: u8,
    start_time: u64,
    tournament_id: u64,
    // ------------------------
    score_in_tournament: u32,
    combo_counter_in_tournament: u8,
    max_combo_in_tournament: u8,
    // ------------------------
    pending_chest_prize: u128, // prize to be added to the right chest
// the right chest is the one that is not complete and has the highest point_target
// only known after the game is over
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Tournament {
    #[key]
    id: u64,
    is_set: bool,
    prize: u128,
    top1_player_id: felt252,
    top2_player_id: felt252,
    top3_player_id: felt252,
    top1_score: u32,
    top2_score: u32,
    top3_score: u32,
    top1_claimed: bool,
    top2_claimed: bool,
    top3_claimed: bool,
    top1_game_id: u32,
    top2_game_id: u32,
    top3_game_id: u32,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Credits {
    #[key]
    id: felt252, // player_id (address)
    day_id: u64,
    remaining: u8,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Settings {
    #[key]
    id: u8,
    is_set: bool,
    zkorp_address: felt252,
    free_daily_credits: u8,
    daily_mode_price: u128,
    normal_mode_price: u128,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Chest {
    #[key]
    id: u32,
    point_target: u32,
    points: u32,
    prize: u128,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Participation {
    #[key]
    chest_id: u32,
    #[key]
    player_id: felt252,
    is_set: bool,
    points: u32,
    claimed: bool,
}

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
struct Admin {
    #[key]
    id: felt252,
    is_set: bool,
}
