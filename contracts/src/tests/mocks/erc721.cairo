// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^0.18.0
use starknet::ContractAddress;

// External imports

use openzeppelin::token::erc721::interface::{IERC721Dispatcher, IERC721DispatcherTrait};

const PAUSER_ROLE: felt252 = selector!("PAUSER_ROLE");
const MINTER_ROLE: felt252 = selector!("MINTER_ROLE");
const PRICE_SETTER_ROLE: felt252 =
    selector!("PRICE_SETTER_ROLE"); // to be sure only the minter_system can set the price
// not even an admin can set the price

#[starknet::interface]
pub trait IERC721Mintable<TContractState> {
    fn minter_mint(ref self: TContractState, recipient: ContractAddress);
    fn public_mint(ref self: TContractState, recipient: ContractAddress);
    fn get_mint_price(ref self: TContractState) -> u256;
    fn get_is_paused(ref self: TContractState) -> bool;
    fn get_purchase_price(ref self: TContractState, token_id: u256) -> u256;
}

#[starknet::interface]
pub trait IERC721Pausable<TContractState> {
    fn pause(ref self: TContractState);
    fn unpause(ref self: TContractState);
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
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use super::{ContractAddress};
    use starknet::{get_caller_address, get_contract_address};
    use super::{PAUSER_ROLE, MINTER_ROLE, PRICE_SETTER_ROLE};
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

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
        current_minter: ContractAddress,
        current_tournament: ContractAddress,
        current_chest: ContractAddress,
        current_zkorp: ContractAddress,
        current_play: ContractAddress
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
        // Custom events related to systems and roles
        SystemAddressUpdated: SystemAddressUpdated,
        ERC20ApprovalRevoked: ERC20ApprovalRevoked,
        RoleUpdated: RoleUpdated
    }

    #[derive(Drop, starknet::Event)]
    struct SystemAddressUpdated {
        old_address: ContractAddress,
        new_address: ContractAddress,
        system_type: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct ERC20ApprovalRevoked {
        system: ContractAddress,
        previous_allowance: u256
    }

    #[derive(Drop, starknet::Event)]
    struct RoleUpdated {
        role: felt252,
        account: ContractAddress,
        granted: bool // true for granted, false for revoked
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        default_admin: ContractAddress,
        pauser: ContractAddress,
        erc20_token: ContractAddress,
        tournament_system: ContractAddress,
        chest_system: ContractAddress,
        zkorp_system: ContractAddress,
        play_system: ContractAddress,
        minter_system: ContractAddress,
    ) {
        self.erc721.initializer("zKube-Credits", "ZKBC", "");
        self.accesscontrol.initializer();
        self.erc721_enumerable.initializer();
        self.erc20_token.write(erc20_token);

        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, default_admin);
        self.accesscontrol._grant_role(MINTER_ROLE, default_admin);
        self.accesscontrol._grant_role(PAUSER_ROLE, default_admin);
        self.accesscontrol._grant_role(PAUSER_ROLE, pauser);
        self.accesscontrol._grant_role(MINTER_ROLE, minter_system);
        self.accesscontrol._grant_role(PRICE_SETTER_ROLE, minter_system);

        // Approve play system to spend unlimited ERC20 tokens
        let erc20 = IERC20Dispatcher { contract_address: erc20_token };
        let max_u128 = 0xffffffffffffffffffffffffffffffff_u128;
        let max_u256: u256 = u256 { low: max_u128, high: max_u128 };

        // Approve all systems to spend ERC20 tokens
        erc20.approve(tournament_system, max_u256);
        erc20.approve(chest_system, max_u256);
        erc20.approve(zkorp_system, max_u256);

        // Store the current system addresses for revoking approvals
        self.current_tournament.write(tournament_system);
        self.current_chest.write(chest_system);
        self.current_zkorp.write(zkorp_system);
        self.current_play.write(play_system);
        self.current_minter.write(minter_system);

        // By default the contract is paused, until we set the price and unpause it
        self.pausable.pause();
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

            self.accesscontrol.assert_only_role(MINTER_ROLE);
            // should be safe_mint but for test purposes we use mint
            self.erc721.mint(recipient, token_id);

            self.purchase_prices.write(token_id, 0_u256);
            self.token_id.write(token_id);
        }

        #[external(v0)]
        fn public_mint(ref self: ContractState, recipient: ContractAddress) {
            let caller = get_caller_address();
            let mint_price = self.mint_price.read();

            // Verify that this contract has enough allowance to mint
            let erc20 = IERC20Dispatcher { contract_address: self.erc20_token.read() };
            let allowance = erc20.allowance(caller, get_contract_address());
            assert(allowance >= mint_price, 'Insufficient allowance');

            // Transfer ERC20 tokens for mint price
            erc20.transfer_from(caller, get_contract_address(), mint_price);

            // Mint the NFT
            let token_id = self.token_id.read() + 1;
            // should be safe_mint but for test purposes we use mint
            self.erc721.mint(recipient, token_id);

            // Store the purchase price
            self.purchase_prices.write(token_id, mint_price);

            // Update token_id
            self.token_id.write(token_id);
        }


        #[external(v0)]
        fn update_mint_price(ref self: ContractState, new_price: u256) {
            // Only the minter_system can set the price
            // So only an admin of dojo world can set the price through the minter_system
            self.accesscontrol.assert_only_role(PRICE_SETTER_ROLE);
            self.mint_price.write(new_price);
        }

        #[external(v0)]
        fn get_purchase_price(self: @ContractState, token_id: u256) -> u256 {
            // Retrieve the purchase price for a given token_id
            // This is used by the play system to determine the entry fee
            // and split the prize pool accordingly
            // The purchase price is set to 0 for tokens minted by the minter_system
            // (airdroped tokens)
            self.purchase_prices.read(token_id)
        }

        #[external(v0)]
        fn get_mint_price(self: @ContractState) -> u256 {
            self.mint_price.read()
        }

        #[external(v0)]
        fn get_is_paused(self: @ContractState) -> bool {
            self.pausable.is_paused()
        }

        #[external(v0)]
        fn update_system_addresses(
            ref self: ContractState,
            tournament_system: ContractAddress,
            chest_system: ContractAddress,
            zkorp_system: ContractAddress,
            play_system: ContractAddress,
            minter_system: ContractAddress,
        ) {
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);

            let erc20 = IERC20Dispatcher { contract_address: self.erc20_token.read() };

            // Get the old system addresses for revoking approvals
            let old_tournament = self.current_tournament.read();
            let old_chest = self.current_chest.read();
            let old_zkorp = self.current_zkorp.read();
            let old_play = self.current_play.read();
            let old_minter = self.current_minter.read();

            // Revoke old approvals
            //if !old_tournament.is_zero() {
            let previous_allowance = erc20.allowance(get_contract_address(), old_tournament);
            erc20.approve(old_tournament, 0);
            self.emit(ERC20ApprovalRevoked { system: old_tournament, previous_allowance });
            //}

            //if !old_chest.is_zero() {
            let previous_allowance = erc20.allowance(get_contract_address(), old_chest);
            erc20.approve(old_chest, 0);
            self.emit(ERC20ApprovalRevoked { system: old_chest, previous_allowance });
            //}

            //if !old_zkorp.is_zero() {
            let previous_allowance = erc20.allowance(get_contract_address(), old_zkorp);
            erc20.approve(old_zkorp, 0);
            self.emit(ERC20ApprovalRevoked { system: old_zkorp, previous_allowance });
            //}

            // New approvals
            let max_u128 = 0xffffffffffffffffffffffffffffffff_u128;
            let max_u256: u256 = u256 { low: max_u128, high: max_u128 };

            erc20.approve(tournament_system, max_u256);
            erc20.approve(chest_system, max_u256);
            erc20.approve(zkorp_system, max_u256);

            self
                .emit(
                    SystemAddressUpdated {
                        old_address: old_tournament,
                        new_address: tournament_system,
                        system_type: 'TOURNAMENT'
                    }
                );
            self
                .emit(
                    SystemAddressUpdated {
                        old_address: old_chest, new_address: chest_system, system_type: 'CHEST'
                    }
                );
            self
                .emit(
                    SystemAddressUpdated {
                        old_address: old_zkorp, new_address: zkorp_system, system_type: 'ZKORP'
                    }
                );
            self
                .emit(
                    SystemAddressUpdated {
                        old_address: old_play, new_address: play_system, system_type: 'PLAY'
                    }
                );
            self
                .emit(
                    SystemAddressUpdated {
                        old_address: old_minter, new_address: minter_system, system_type: 'MINTER'
                    }
                );

            // Update roles
            //if !old_minter.is_zero() {
            self.accesscontrol.revoke_role(MINTER_ROLE, old_minter);
            self.accesscontrol.revoke_role(PRICE_SETTER_ROLE, old_minter);
            self.emit(RoleUpdated { role: MINTER_ROLE, account: old_minter, granted: false });
            self.emit(RoleUpdated { role: PRICE_SETTER_ROLE, account: old_minter, granted: false });
            //}

            self.accesscontrol.grant_role(MINTER_ROLE, minter_system);
            self.accesscontrol.grant_role(PRICE_SETTER_ROLE, minter_system);
            self.emit(RoleUpdated { role: MINTER_ROLE, account: minter_system, granted: true });
            self
                .emit(
                    RoleUpdated { role: PRICE_SETTER_ROLE, account: minter_system, granted: true }
                );

            // Update current system addresses
            self.current_tournament.write(tournament_system);
            self.current_chest.write(chest_system);
            self.current_zkorp.write(zkorp_system);
            self.current_play.write(play_system);
            self.current_minter.write(minter_system);
        }

        #[external(v0)]
        fn update_role(
            ref self: ContractState, role: felt252, account: ContractAddress, grant: bool
        ) {
            // Vérification admin
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);

            if grant {
                self.accesscontrol._grant_role(role, account);
            } else {
                self.accesscontrol._revoke_role(role, account);
            }

            self.emit(RoleUpdated { role, account, granted: grant });
        }
    }
}
