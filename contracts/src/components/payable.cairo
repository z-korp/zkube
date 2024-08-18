// Starknet imports

use starknet::ContractAddress;

// Interfaces

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transferFrom(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
}

// Component

#[starknet::component]
mod PayableComponent {
    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::get_contract_address;

    // Internal imports

    use zkube::constants;

    // Local imports

    use super::{IERC20Dispatcher, IERC20DispatcherTrait};

    // Errors

    mod errors {
        const ERC20_REWARD_FAILED: felt252 = 'ERC20: reward failed';
        const ERC20_PAY_FAILED: felt252 = 'ERC20: pay failed';
        const ERC20_REFUND_FAILED: felt252 = 'ERC20: refund failed';
    }

    // Storage

    #[storage]
    struct Storage {
        token_address: ContractAddress,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn _initialize(ref self: ComponentState<TContractState>, token_address: ContractAddress) {
            // [Storage] Set token address
            self.token_address.write(token_address);
        }

        fn _pay(self: @ComponentState<TContractState>, caller: ContractAddress, amount: u256) {
            // [Check] Amount is not null, otherwise return
            if amount == 0 {
                return;
            }

            // [Interaction] Transfer
            let contract = get_contract_address();
            let erc20 = IERC20Dispatcher { contract_address: self.token_address.read() };
            let status = erc20.transferFrom(caller, contract, amount);

            // [Check] Status
            assert(status, errors::ERC20_PAY_FAILED);
        }

        fn _refund(
            self: @ComponentState<TContractState>, recipient: ContractAddress, amount: u256
        ) {
            // [Check] Amount is not null, otherwise return
            if amount == 0 {
                return;
            }

            // [Interaction] Transfer
            let erc20 = IERC20Dispatcher { contract_address: self.token_address.read() };
            let status = erc20.transfer(recipient, amount);

            // [Check] Status
            assert(status, errors::ERC20_REFUND_FAILED);
        }
    }
}
