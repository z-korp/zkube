// World

fn TOKEN_ADDRESS() -> starknet::ContractAddress {
    starknet::contract_address_const::<
        0x7BAE177CD2B998927B7637F0BA047609CD9A81A7D4AEA8F6DD216BA39FAFE9D
    >()
}

// Game

const DEFAULT_GRID_WIDTH: u8 = 8;
const DEFAULT_GRID_HEIGHT: u8 = 10;

// Packing

const COLOR_SIZE: u8 = 8;
const BLOCK_SIZE: u8 = 8;
const BLOCK_BIT_COUNT: u8 = 3;
const ROW_SIZE: u32 = 16777216;
const ROW_BIT_COUNT: u8 = 24;
const CARDS_IN_DECK: u32 = 14;
const TWO_POW_1: u128 = 0x2;
const MASK_1: u128 = 0x1;
const MASK_7: u32 = 0x7;

// Modes

const DAILY_MODE_PRICE: felt252 = 1_000_000_000_000_000_000_000;
const DAILY_MODE_DURATION: u64 = 86400; // = 1 day = 24x60x60
const DAILY_MODE_DAILY_CREDITS: u16 = 3;
const NORMAL_MODE_PRICE: felt252 = 1_000_000_000_000_000_000_000;
const NORMAL_MODE_DURATION: u64 = 60480000; // 100 weeks
const NORMAL_MODE_DAILY_CREDITS: u16 = 1;
