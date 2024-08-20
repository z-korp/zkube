// Dojo imports

use dojo::world::IWorldDispatcher;

#[dojo::interface]
trait IAccount<TContractState> {
    fn create(ref world: IWorldDispatcher, name: felt252);
    fn rename(ref world: IWorldDispatcher, name: felt252);
}

#[dojo::contract]
mod account {
    // Component imports

    use zkube::components::manageable::ManageableComponent;
    use zkube::components::manageable::ManageableComponent::InternalTrait;

    // Local imports

    use super::{IAccount};

    // Components
    component!(path: ManageableComponent, storage: manageable, event: ManageableEvent);
    impl ManageableInternalImpl = ManageableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        manageable: ManageableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ManageableEvent: ManageableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher) {}

    // Implementations

    #[abi(embed_v0)]
    impl AccountImpl of IAccount<ContractState> {
        fn create(ref world: IWorldDispatcher, name: felt252) {
            self.manageable._create(world, name);
        }

        fn rename(ref world: IWorldDispatcher, name: felt252) {
            self.manageable._rename(world, name);
        }
    }
}
