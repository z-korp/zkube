// Starknet imports
use starknet::ContractAddress;

// Dojo imports
use dojo::world::IWorldDispatcher;

// External imports
use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::store::{Store, StoreTrait};

#[dojo::interface]
trait IZKorp<TContractState> {
    fn claim(ref world: IWorldDispatcher);
    fn sponsor(ref world: IWorldDispatcher, amount: u128, caller: ContractAddress);
}

#[dojo::contract]
mod zkorp {
    // Starknet imports
    use starknet::{ContractAddress, ClassHash};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports
    use zkube::components::payable::PayableComponent;

    // Local imports
    use super::{IZKorp, Settings, SettingsTrait, Store, StoreTrait};
    use zkube::constants::ZKORP_ADDRESS;
    use zkube::interfaces::ierc20::{ierc20, IERC20Dispatcher, IERC20DispatcherTrait};

    // Components
    component!(path: PayableComponent, storage: payable, event: PayableEvent);
    impl PayableInternalImpl = PayableComponent::InternalImpl<ContractState>;

    // Storage
    #[storage]
    struct Storage {
        #[substorage(v0)]
        payable: PayableComponent::Storage,
    }

    // Events
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        PayableEvent: PayableComponent::Event,
    }

    // Constructor
    fn dojo_init(ref world: IWorldDispatcher, token_address: ContractAddress,) {
        // [Setup] Datastore
        let store = StoreTrait::new(world);

        // [Effect] Initialize components
        self.payable._initialize(token_address);
    }

    // Implementations
    #[abi(embed_v0)]
    impl ZKorpImpl of IZKorp<ContractState> {
        fn claim(ref world: IWorldDispatcher) {
            // [Check] Player exists
            let caller = get_caller_address();
            assert!(caller.into() == ZKORP_ADDRESS, "Caller is not ZKorp");

            let token_address = self.payable.token_address.read();
            let token_dispatcher = ierc20(token_address);
            let claimable = token_dispatcher.balance_of(caller);

            // [Effect] Pay reward
            self.payable._refund(caller, claimable.into());
        }

        fn sponsor(ref world: IWorldDispatcher, amount: u128, caller: ContractAddress) {
            // [Effect] Pay reward
            self.payable._pay(caller, amount.into());
        }
    }
}