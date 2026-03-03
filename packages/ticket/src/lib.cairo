// SPDX-License-Identifier: MIT
// zTicket — ERC1155 entry ticket for zKube daily challenges
//
// Token ID 1 = zTicket (fungible within ERC1155)
//
// Purchase: 100 LORDS or 1000 CUBEs per ticket
// Entry: daily_challenge_system burns 1 ticket per attempt
// Transferable: yes (standard ERC1155 transfers)

use starknet::ContractAddress;

#[starknet::interface]
pub trait IZTicket<T> {
    /// Purchase tickets with LORDS tokens
    /// Transfers (amount * lords_price) LORDS from caller to treasury, mints tickets
    fn purchase_with_lords(ref self: T, amount: u256);

    /// Purchase tickets with CUBEs
    /// Burns (amount * cube_price) CUBEs from caller, mints tickets
    fn purchase_with_cubes(ref self: T, amount: u256);

    // === Admin ===

    /// Set the LORDS price per ticket (in LORDS wei, e.g. 100 * 10^18)
    fn set_lords_price(ref self: T, price: u256);

    /// Set the CUBE price per ticket (whole cubes, e.g. 1000)
    fn set_cube_price(ref self: T, price: u256);

    /// Set the treasury address (receives LORDS from ticket sales)
    fn set_treasury(ref self: T, treasury: ContractAddress);

    /// Set the authorized burner (daily_challenge_system contract)
    fn set_authorized_burner(ref self: T, burner: ContractAddress);

    /// Burn tickets from a player (only callable by authorized burner)
    fn burn_from(ref self: T, account: ContractAddress, amount: u256);

    // === Views ===

    fn lords_price(self: @T) -> u256;
    fn cube_price(self: @T) -> u256;
    fn treasury(self: @T) -> ContractAddress;
}

/// Standard ERC20 interface for transfer_from and burn calls
#[starknet::interface]
trait IERC20<T> {
    fn transfer_from(ref self: T, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn burn(ref self: T, account: ContractAddress, amount: u256);
}

#[starknet::contract]
pub mod z_ticket {
    use openzeppelin_access::ownable::OwnableComponent;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::{ERC1155Component, ERC1155HooksEmptyImpl};
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::num::traits::Zero;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    // Ownable: owner management
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // ERC1155: full standard (balance_of, safe_transfer_from, etc.)
    #[abi(embed_v0)]
    impl ERC1155MixinImpl = ERC1155Component::ERC1155MixinImpl<ContractState>;
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;

    /// The single token ID for zTickets
    const TICKET_TOKEN_ID: u256 = 1;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        /// LORDS ERC20 contract address
        lords_token: ContractAddress,
        /// CubeToken (ERC20) contract address
        cube_token: ContractAddress,
        /// Protocol treasury (receives LORDS from ticket sales)
        treasury_address: ContractAddress,
        /// Price per ticket in LORDS (with decimals, e.g. 100 * 10^18)
        lords_price_per_ticket: u256,
        /// Price per ticket in CUBEs (whole cubes, 0 decimals, e.g. 1000)
        cube_price_per_ticket: u256,
        /// Authorized burner (daily_challenge_system)
        authorized_burner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        lords_token: ContractAddress,
        cube_token: ContractAddress,
        treasury: ContractAddress,
        lords_price: u256,
        cube_price: u256,
    ) {
        self.ownable.initializer(owner);
        self.erc1155.initializer("https://zkube.xyz/api/ticket/{id}.json");

        self.lords_token.write(lords_token);
        self.cube_token.write(cube_token);
        self.treasury_address.write(treasury);
        self.lords_price_per_ticket.write(lords_price);
        self.cube_price_per_ticket.write(cube_price);
    }

    #[abi(embed_v0)]
    impl ZTicketImpl of super::IZTicket<ContractState> {
        fn purchase_with_lords(ref self: ContractState, amount: u256) {
            assert!(amount > 0, "Amount must be > 0");

            let caller = get_caller_address();
            let price = self.lords_price_per_ticket.read();
            let total_cost = amount * price;
            let treasury = self.treasury_address.read();

            // Transfer LORDS from caller to treasury
            let lords = IERC20Dispatcher { contract_address: self.lords_token.read() };
            let success = lords.transfer_from(caller, treasury, total_cost);
            assert!(success, "LORDS transfer failed");

            // Mint zTickets to caller
            self
                .erc1155
                .mint_with_acceptance_check(
                    caller, TICKET_TOKEN_ID, amount, array![].span(),
                );
        }

        fn purchase_with_cubes(ref self: ContractState, amount: u256) {
            assert!(amount > 0, "Amount must be > 0");

            let caller = get_caller_address();
            let price = self.cube_price_per_ticket.read();
            let total_cost = amount * price;

            // Burn CUBEs from caller (CubeToken allows owner to burn their own)
            let cubes = IERC20Dispatcher { contract_address: self.cube_token.read() };
            cubes.burn(caller, total_cost);

            // Mint zTickets to caller
            self
                .erc1155
                .mint_with_acceptance_check(
                    caller, TICKET_TOKEN_ID, amount, array![].span(),
                );
        }

        // === Admin ===

        fn set_lords_price(ref self: ContractState, price: u256) {
            self.ownable.assert_only_owner();
            assert!(price > 0, "Price must be > 0");
            self.lords_price_per_ticket.write(price);
        }

        fn set_cube_price(ref self: ContractState, price: u256) {
            self.ownable.assert_only_owner();
            assert!(price > 0, "Price must be > 0");
            self.cube_price_per_ticket.write(price);
        }

        fn set_treasury(ref self: ContractState, treasury: ContractAddress) {
            self.ownable.assert_only_owner();
            assert!(!treasury.is_zero(), "Treasury cannot be zero address");
            self.treasury_address.write(treasury);
        }

        fn set_authorized_burner(ref self: ContractState, burner: ContractAddress) {
            self.ownable.assert_only_owner();
            self.authorized_burner.write(burner);
        }

        fn burn_from(ref self: ContractState, account: ContractAddress, amount: u256) {
            let caller = get_caller_address();
            let authorized = self.authorized_burner.read();
            assert!(!authorized.is_zero(), "No authorized burner set");
            assert!(caller == authorized, "Caller is not authorized burner");
            self.erc1155.burn(account, TICKET_TOKEN_ID, amount);
        }

        // === Views ===

        fn lords_price(self: @ContractState) -> u256 {
            self.lords_price_per_ticket.read()
        }

        fn cube_price(self: @ContractState) -> u256 {
            self.cube_price_per_ticket.read()
        }

        fn treasury(self: @ContractState) -> ContractAddress {
            self.treasury_address.read()
        }
    }
}
