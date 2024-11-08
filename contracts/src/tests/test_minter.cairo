use zkube::models::game::AssertTrait;
// Core imports

use core::debug::PrintTrait;

// Starknet imports

use starknet::testing::{set_contract_address, set_block_timestamp};
use starknet::get_block_timestamp;

// Dojo imports

use dojo::world::{IWorldDispatcher, IWorldDispatcherTrait};

// Internal imports

use zkube::constants;
use zkube::store::{Store, StoreTrait};
use zkube::models::mint::{Mint, MintTrait, MintAssert};
use zkube::systems::minter::IMinterDispatcherTrait;
use zkube::tests::mocks::erc721::{IERC721Dispatcher, IERC721DispatcherTrait};

use zkube::tests::setup::{
    setup, setup::{Systems, ADMIN, PLAYER1, IERC20DispatcherTrait, impersonate}
};

#[test]
fn test_minter() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    impersonate(ADMIN());
    let game_id = systems.minter.add_free_mint(PLAYER1(), 10, 2000);

    // [Assert] Initial state
    let mint = store.mint(PLAYER1().into());
    mint.assert_has_mint_not_expired(get_block_timestamp());
    assert_eq!(mint.number, 10);

    // Mint
    impersonate(PLAYER1());
    systems.minter.claim_free_mint();
    let mint = store.mint(PLAYER1().into());
    assert(!mint.has_mint_not_expired(get_block_timestamp()), 'Mint should be 0');
}

#[test]
fn test_minter_mint() {
    // [Setup]
    let (mut world, systems, context) = setup::create_accounts();
    let store = StoreTrait::new(world);

    set_block_timestamp(1000);

    // Mint
    impersonate(PLAYER1());
    systems.minter.mint();

    let erc721 = IERC721Dispatcher { contract_address: context.erc721.contract_address };
    let final_nft_balance = erc721.balance_of(PLAYER1().into());
    assert_eq!(final_nft_balance, 1, "Minting failed");
}
