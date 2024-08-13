// World

fn WORLD() -> starknet::ContractAddress {
    starknet::contract_address_const::<
        0x1e3b79a25df98dd5032e519c0637d0136f2e69f2cb1906d22dc336420a3ca16
    >()
}

fn TOKEN_ADDRESS() -> starknet::ContractAddress {
    starknet::contract_address_const::<
        0x21d38979aa1388702436102d42e0db359d32760ee2d939bf96b3941fc606153
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

const DAILY_MODE_PRICE: felt252 = 0;
const DAILY_MODE_DURATION: u64 = 86400; // = 1 day = 24x60x60
const DAILY_MODE_DAILY_CREDITS: u16 = 3;
const NORMAL_MODE_PRICE: felt252 = 0;
const NORMAL_MODE_DURATION: u64 = 60480000; // 100 weeks
const NORMAL_MODE_DAILY_CREDITS: u16 = 1;
