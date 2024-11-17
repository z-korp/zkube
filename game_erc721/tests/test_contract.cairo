use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};

use core::option::OptionTrait;
use core::traits::TryInto;
use starknet::ContractAddress;

// Importing the IERC721Dispatcher and IERC721MintingAndBurningDispatcher traits
use openzeppelin::token::erc721::interface::IERC721Dispatcher;
use openzeppelin::token::erc721::interface::IERC721DispatcherTrait;
use game_erc721::ZKubeCreditsMintableDispatcher;
use game_erc721::ZKubeCreditsMintableDispatcherTrait;

fn deploy_erc721(
    deployer: ContractAddress
) -> (ContractAddress, IERC721Dispatcher, ZKubeCreditsMintableDispatcher) {
    // Declaring the contract class
    let contract_class = declare("MyNFT").unwrap().contract_class();
    // Creating the data to send to the constructor, first specifying as a default value
    let mut data_to_constructor = Default::default();
    // Packing the data into the constructor
    Serde::serialize(@deployer, ref data_to_constructor);
    // Deploying the contract, and getting the address
    let (address, _) = contract_class.deploy(@data_to_constructor).unwrap();

    // Returning the address of the contract and the dispatchers
    return (
        address,
        IERC721Dispatcher { contract_address: address },
        ZKubeCreditsMintableDispatcher { contract_address: address }
    );
}

fn mint_nft(
    contract: ContractAddress,
    dispatcher: ZKubeCreditsMintableDispatcher,
    deployer: ContractAddress,
    user: ContractAddress,
    tokenId: u256
) {
    dispatcher.safe_mint(user, tokenId, array![].span());
}

#[test]
fn test_mint() {
    // Generating the deployer address
    let deployer: ContractAddress = 123.try_into().unwrap();

    // Deploying the contract
    let (erc721_address, erc721_general_dispatch, erc721_mint_dispatch) = deploy_erc721(deployer);

    // Creating the address of Alice
    let alice: ContractAddress = 1.try_into().unwrap();

    // TODO: Mint token id 1 to Alice
    mint_nft(erc721_address, erc721_mint_dispatch, deployer, alice, 1);

    // TODO: Check that Alice is the owner of token id 1
    assert(erc721_general_dispatch.owner_of(1) == alice, 'Alice is not the owner of 1');
}
