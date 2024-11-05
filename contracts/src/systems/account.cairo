// Dojo imports

use dojo::world::WorldStorage;

#[starknet::interface]
trait IAccount<T> {
    fn create(ref self: T, name: felt252);
    fn rename(ref self: T, name: felt252);
}

#[dojo::contract]
mod account {
    // Component imports

    use zkube::components::manageable::ManageableComponent;

    // Local imports

    use super::{IAccount, WorldStorage};

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

    fn dojo_init(ref self: ContractState) {}

    // Implementations

    #[abi(embed_v0)]
    impl AccountImpl of IAccount<ContractState> {
        fn create(ref self: ContractState, name: felt252) {
            let mut world = self.world_default();
            self.manageable._create(world, name);
        }

        fn rename(ref self: ContractState, name: felt252) {
            let mut world = self.world_default();
            self.manageable._rename(world, name);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"zkube")
        }
    }
}
