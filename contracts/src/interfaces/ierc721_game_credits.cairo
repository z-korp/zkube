use starknet::ContractAddress;
use core::Zeroable;

#[starknet::interface]
trait IERC721GameCredits<TState> {
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
    fn burn(self: @TState, token_id: u256);
    fn minter_mint(self: @TState, recipient: ContractAddress);
    fn public_mint_from(self: @TState, recipient: ContractAddress, caller: ContractAddress);
    fn public_mint(self: @TState, recipient: ContractAddress);
    fn get_purchase_price(self: @TState, token_id: u256) -> u256;
    fn update_mint_price(self: @TState, new_price: u256);
}

#[inline(always)]
fn ierc721_game_credits(contract_address: ContractAddress) -> IERC721GameCreditsDispatcher {
    assert(contract_address != core::Zeroable::zero(), 'ierc20(): null address');
    (IERC721GameCreditsDispatcher { contract_address })
}
