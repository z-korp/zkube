use starknet::contract_address::ContractAddress;

// Gas fees optimisation
// u8: 2^8 - 1 = 255
// u16: 2^16 - 1 = 65,535
// u32: 2^32 - 1 = 4,294,967,295
// u64: 2^64 - 1 = 18,446,744,073,709,551,615

// bool are felt252 in cairo but u1 in introspectpacked

// Prize -> u128 because even with 18 decimals, 128 bits is enough
// u128: 2^128 - 1 = 340,282,366,920,938,463,463,374,607,431,768,211,455 ->
// 340,282,366,920,938,463,463 ETH u64: 2^64 - 1 = 18,446,744,073,709,551,615 -> 18 ETH

// Date are stored as u32 because it is enough to store the number of days since epoch (in seconds)
// the end date would be limited to January 19, 2038

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Player {
    #[key]
    pub id: u32,
    pub game_id: u32,
    pub points: u32,
    // Multipliers
    pub last_active_day: u64, // Number of days since epoch
    // Account age
    pub account_creation_day: u64,
    // Daily streak
    pub daily_streak: u16,
// Total bits = 32 + 32 + 32 + 16 + 32 + 32 = 176 bits
} // 1 felts

// Used to do the match between the player_id and the address
// in order to have a lighter Player model and avoid felt252 in other models such
// as Game or Tournament
#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct PlayerInfo {
    #[key]
    pub address: felt252,
    pub name: felt252,
    pub player_id: u32,
} // 2 felts (not written often)

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Tournament {
    #[key]
    pub id: u32,
    pub top1_score: u16,
    pub top2_score: u16,
    pub top3_score: u16,
    pub top1_player_id: u32,
    pub top2_player_id: u32,
    pub top3_player_id: u32,
    pub top1_game_id: u32,
    pub top2_game_id: u32,
    pub top3_game_id: u32,
    pub is_set: bool,
    pub top1_claimed: bool,
    pub top2_claimed: bool,
    pub top3_claimed: bool,
// Total = 16*3 + 32*6 + 4 = 208 bits
} // 1 felt

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct TournamentPrize {
    #[key]
    pub id: u32,
    pub prize: u128,
    pub is_set: bool,
} // 1 felt

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Mint {
    #[key]
    pub id: felt252, // player_id (address)
    pub number: u32,
    pub expiration_timestamp: u64,
} // 1 felt

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Settings {
    #[key]
    pub id: u8,
    pub zkorp_address: felt252,
    pub erc721_address: felt252,
    pub game_price: u128,
    pub is_set: bool,
    // In case we need to pause the game
    pub are_games_paused: bool,
    pub are_chests_unlock: bool,
} // 3 felts

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Chest {
    #[key]
    pub id: u32,
    pub prize: u128,
    pub point_target: u32,
    pub points: u32,
} // 2 felts

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Participation {
    #[key]
    pub chest_id: u32,
    #[key]
    pub player_id: u32,
    pub points: u32,
    pub is_set: bool,
    pub claimed: bool,
} // 1 felt

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
struct Admin {
    #[key]
    pub id: felt252,
    pub is_set: bool,
} // 1 felt


#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub id: u32,
    // ----------------------------------------
    // Change every move
    // ----------------------------------------
    pub seed: felt252,
    pub blocks: felt252, // 10 lines of 3x8 bits = 240 bits
    pub next_row: u32, // 3x8 bits per row = 24 bits
    pub score: u16,
    pub moves: u16,
    // Total = 2 felts + 32+16*2 = 2 felts + 64 bits

    // ----------------------------------------
    // Can change when a move breaks lines
    // ----------------------------------------
    // Counters
    pub combo_counter: u16,
    pub max_combo: u8,
    // Bonuses usable during the game (start (0, 0, 0) and will evolve)
    pub hammer_bonus: u8,
    pub wave_bonus: u8,
    pub totem_bonus: u8,
    // Bonuses used during the game
    pub hammer_used: u8,
    pub wave_used: u8,
    pub totem_used: u8,
    // Total = 8
    // ------------------------

    // ----------------------------------------
    // Change once per game
    // ----------------------------------------
    pub start_time: u64,
    pub tournament_id: u64,
    pub player_id: u32,
    pub mode: u8,
    pub over: bool,
} // 3 felts

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct GamePrize {
    #[key]
    pub game_id: u32,
    pub pending_chest_prize: u128, // prize to be added to the right chest
// the right chest is the one that is not complete and has the highest point_target
// only known after the game is over

// Total = 64 + 64 + 32 + 8 + 1 = 169 bits
// ------------------------
// Total = 169 + 128 = 297 bits
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct GameAfterTournament {
    #[key]
    pub id: u32,
    // ------------------------
    pub score_outside_tournament: u32,
    //pub combo_counter_outside_tournament: u16,
    pub max_combo_outside_tournament: u8,
// ------------------------
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct TestModel {
    #[key]
    pub id: u32,
    pub v_contract_address: ContractAddress,
    pub v_felt: felt252,
    pub v_u128: u128,
    pub v_u64: u64,
    pub v_u32: u32,
    pub v_u16: u16,
    pub v_u8: u8,
    pub v_bool: bool,
}
