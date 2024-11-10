// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts for Cairo ^0.17.0

#[starknet::contract]
mod token {
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::token::erc20::ERC20Component;
    use openzeppelin::token::erc20::ERC20HooksEmptyImpl;
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        last_faucet_claim: Map::<ContractAddress, u64>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.erc20.initializer("Fake Lord", "FLORD");
        self.ownable.initializer(owner);
    }

    const FAUCET_AMOUNT: u256 = 1000 * 1_000_000_000_000_000_000; // 1000 LORD tokens
    const FAUCET_COOLDOWN: u64 = 86400; // 24 hours in seconds

    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn burn(ref self: ContractState, value: u256) {
            self.erc20.burn(get_caller_address(), value);
        }

        #[external(v0)]
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.ownable.assert_only_owner();
            self.erc20.mint(recipient, amount);
        }

        #[external(v0)]
        fn faucet(ref self: ContractState) {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            let last_claim = self.last_faucet_claim.read(caller);

            assert(current_time >= last_claim + FAUCET_COOLDOWN, 'Faucet cooldown not passed');

            self.last_faucet_claim.write(caller, current_time);
            self.erc20.mint(caller, FAUCET_AMOUNT);
        }
    }
}
