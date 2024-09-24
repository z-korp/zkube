use starknet::ContractAddress;
use core::Zeroable;

#[starknet::interface]
trait IERC20<TState> {
    fn total_supply(ref self: TState) -> u256;
    fn balance_of(self: @TState, account: ContractAddress) -> u256;
    fn allowance(self: @TState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TState, spender: ContractAddress, amount: u256) -> bool;
}

#[inline(always)]
fn ierc20(contract_address: ContractAddress) -> IERC20Dispatcher {
    assert(contract_address != core::Zeroable::zero(), 'ierc20(): null address');
    (IERC20Dispatcher { contract_address })
}
