
// no longer needed
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub id: felt252,
    pub game_id: u32,
    pub name: felt252,
    pub points: u32,
    // Multipliers
    // Daily streak
    pub daily_streak: u8,
    pub last_active_day: u32, // Number of days since epoch
    // Account age
    pub account_creation_day: u32,
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    pub over: bool,
    pub score: u32,
    pub moves: u32,
    pub next_row: u32,
    // ------------------------
    // Bonuses
    // Bonuses usable during the game (start (0, 0, 0) and will evolve)
    pub hammer_bonus: u8,
    pub wave_bonus: u8,
    pub totem_bonus: u8,
    // Bonuses used during the game
    pub hammer_used: u8,
    pub wave_used: u8,
    pub totem_used: u8,
    // ------------------------
    pub combo_counter: u8,
    pub max_combo: u8,
    pub blocks: felt252,
    pub player_id: felt252,
    pub seed: felt252,
    pub mode: u8, // move to settings?
    pub start_time: u64, // no longer needed
    pub tournament_id: u64, // no longer needed
    // ------------------------
    pub score_in_tournament: u32, // no longer needed
    pub combo_counter_in_tournament: u8, // no longer needed
    pub max_combo_in_tournament: u8, // no longer needed
    // ------------------------
    pub pending_chest_prize: u128, // no longer needed
    // prize to be added to the right chest
    // the right chest is the one that is not complete and has the highest point_target
    // only known after the game is over

    // ------------------------
    // added to patch the max combo u8 limit
    pub combo_counter_2: u16,
    pub combo_counter_in_tournament_2: u16, // no longer needed
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Settings {
    #[key]
    pub id: u8,
    pub is_set: bool,
    pub game_price: u256,
    pub zkorp_address: felt252,
    pub erc721_address: felt252, // no longer needed (same as contract address)
    // In case we need to pause the game
    pub are_games_paused: bool, // no longer needed
    pub are_chests_unlock: bool, // no longer needed
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct GameSettings {
    #[key]
    pub id: u8,
    pub mode: u8,
    pub time: u64,
    pub difficulty: u8,
}

// no longer needed
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Participation {
    #[key]
    pub chest_id: u32,
    #[key]
    pub player_id: felt252,
    pub is_set: bool,
    pub points: u32,
    pub claimed: bool,
}