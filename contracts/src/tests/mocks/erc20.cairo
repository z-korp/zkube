// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts for Cairo v0.9.0 (presets/erc20.cairo)

/// # ERC20 Preset
///
/// The ERC20 contract offers basic functionality and provides a
/// fixed-supply mechanism for token distribution. The fixed supply is
/// set in the constructor.

mod interface;
mod erc20;

use interface::{IERC20Dispatcher, IERC20DispatcherTrait};

#[starknet::interface]
trait IERC20Faucet<TState> {
    fn mint(ref self: TState);
}

#[starknet::contract]
mod ERC20 {
    use zkube::tests::mocks::erc20::erc20::ERC20Component;
    use starknet::{ContractAddress, get_caller_address};
    const FAUCET_AMOUNT: u256 = 1_000_000_000_000_000_000_000_000; // 1E6 * 1E18

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    #[abi(embed_v0)]
    impl ERC20Impl = ERC20Component::ERC20Impl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20MetadataImpl = ERC20Component::ERC20MetadataImpl<ContractState>;
    #[abi(embed_v0)]
    impl ERC20CamelOnlyImpl = ERC20Component::ERC20CamelOnlyImpl<ContractState>;
    impl InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event
    }

    /// Sets the token `name` and `symbol`.
    /// Mints `fixed_supply` tokens to `recipient`.
    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[external(v0)]
    fn mint(ref self: ContractState) {
        self.erc20._mint(get_caller_address(), FAUCET_AMOUNT);
    }
}
