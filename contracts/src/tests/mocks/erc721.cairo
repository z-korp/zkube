// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^0.18.0
use starknet::ContractAddress;

use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

const PAUSER_ROLE: felt252 = selector!("PAUSER_ROLE");
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");

#[starknet::interface]
pub trait IERC721Mintable<TContractState> {
    fn minter_mint(ref self: TContractState, recipient: ContractAddress);
    fn public_mint(ref self: TContractState, recipient: ContractAddress);
}

#[starknet::contract]
mod ERC721 {
    use core::num::traits::Zero;
    use openzeppelin::access::accesscontrol::AccessControlComponent;
    use openzeppelin::access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin::introspection::src5::SRC5Component;
    use openzeppelin::security::pausable::PausableComponent;
    use openzeppelin::token::erc721::ERC721Component;
    use openzeppelin::token::erc721::extensions::ERC721EnumerableComponent;
    use openzeppelin::token::erc20::interface::IERC20Dispatcher;
    use openzeppelin::token::erc20::interface::IERC20DispatcherTrait;
    use super::{ContractAddress};
    use starknet::{get_caller_address, get_contract_address};
    use super::{PAUSER_ROLE, MINTER_ROLE};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    use zkube::systems::tournament::{ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait};

    component!(path: ERC721Component, storage: erc721, event: ERC721Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);
    component!(
        path: ERC721EnumerableComponent, storage: erc721_enumerable, event: ERC721EnumerableEvent
    );

    #[abi(embed_v0)]
    impl ERC721MixinImpl = ERC721Component::ERC721MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC721EnumerableImpl =
        ERC721EnumerableComponent::ERC721EnumerableImpl<ContractState>;

    impl ERC721InternalImpl = ERC721Component::InternalImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;
    impl ERC721EnumerableInternalImpl = ERC721EnumerableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc721: ERC721Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
        #[substorage(v0)]
        erc721_enumerable: ERC721EnumerableComponent::Storage,
        erc20_token: ContractAddress,
        mint_price: u256,
        purchase_prices: Map<u256, u256>, // Mapping from token_id to purchase price
        token_id: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC721Event: ERC721Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
        #[flat]
        ERC721EnumerableEvent: ERC721EnumerableComponent::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        default_admin: ContractAddress,
        pauser: ContractAddress,
        minter: ContractAddress,
        erc20_token: ContractAddress,
        mint_price: u256,
        tournament_system: ContractAddress,
        chest_system: ContractAddress,
        zkorp_system: ContractAddress,
        play_system: ContractAddress,
    ) {
        self.erc721.initializer("zKube-Credits", "ZKBC", "");
        self.accesscontrol.initializer();
        self.erc721_enumerable.initializer();
        self.erc20_token.write(erc20_token);
        self.mint_price.write(mint_price);

        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, default_admin);
        self.accesscontrol._grant_role(PAUSER_ROLE, pauser);
        self.accesscontrol._grant_role(MINTER_ROLE, minter);

        // Approve play system to spend unlimited ERC20 tokens
        let erc20 = IERC20Dispatcher { contract_address: erc20_token };
        let max_u128 = 0xffffffffffffffffffffffffffffffff_u128;
        let max_u256: u256 = u256 { low: max_u128, high: max_u128 };
        erc20.approve(play_system, max_u256);
    }

    impl ERC721HooksImpl of ERC721Component::ERC721HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC721Component::ComponentState<ContractState>,
            to: ContractAddress,
            token_id: u256,
            auth: ContractAddress,
        ) {
            let mut contract_state = self.get_contract_mut();
            contract_state.pausable.assert_not_paused();
            contract_state.erc721_enumerable.before_update(to, token_id);
        }
    }

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn pause(ref self: ContractState) {
            self.accesscontrol.assert_only_role(PAUSER_ROLE);
            self.pausable.pause();
        }

        #[external(v0)]
        fn unpause(ref self: ContractState) {
            self.accesscontrol.assert_only_role(PAUSER_ROLE);
            self.pausable.unpause();
        }

        #[external(v0)]
        fn burn(ref self: ContractState, token_id: u256) {
            self.erc721.update(Zero::zero(), token_id, get_caller_address());
        }

        #[external(v0)]
        fn minter_mint(ref self: ContractState, recipient: ContractAddress) {
            let token_id = self.token_id.read() + 1;

            // Ensure caller has MINTER_ROLE
            self.accesscontrol.assert_only_role(MINTER_ROLE);

            // Mint the NFT without payment
            self.erc721.safe_mint(recipient, token_id, array![].span());

            // Store purchase price as zero for minter mints
            self.purchase_prices.write(token_id, 0_u256);

            // Increment the token_id
            self.token_id.write(token_id);
        }

        #[external(v0)]
        fn public_mint_from(
            ref self: ContractState, recipient: ContractAddress, caller: ContractAddress
        ) {
            let token_id = self.token_id.read() + 1;

            // Set up ERC20 dispatcher
            let mut erc20_dispatcher = IERC20Dispatcher {
                contract_address: self.erc20_token.read()
            };
            let erc20_token = self.erc20_token.read();
            let mint_price = self.mint_price.read();

            // Transfer ERC20 tokens for mint price
            erc20_dispatcher.transfer_from(caller, erc20_token, mint_price);

            // Mint the NFT
            self.erc721.safe_mint(recipient, token_id, array![].span());

            // Store the purchase price for the token
            self.purchase_prices.write(token_id, mint_price);

            // Increment the token_id
            self.token_id.write(token_id);
        }

        #[external(v0)]
        fn public_mint(ref self: ContractState, recipient: ContractAddress) {
            self.public_mint_from(recipient, get_caller_address());
        }

        #[external(v0)]
        fn update_mint_price(ref self: ContractState, new_price: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.mint_price.write(new_price);
        }

        fn get_purchase_price(self: @ContractState, token_id: u256) -> u256 {
            // Retrieve the purchase price for a given token_id
            self.purchase_prices.read(token_id)
        }
    }
}
