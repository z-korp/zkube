// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::IWorldDispatcher;

// External imports

use stark_vrf::ecvrf::Proof;

// Interfaces

#[starknet::interface]
trait IActions<TContractState> {
    fn create(self: @TContractState, world: IWorldDispatcher, name: felt252);
    fn rename(self: @TContractState, world: IWorldDispatcher, name: felt252);
    fn start(
        self: @TContractState, world: IWorldDispatcher, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn surrender(self: @TContractState, world: IWorldDispatcher);
    fn move(
        self: @TContractState,
        world: IWorldDispatcher,
        row: u8,
        index: u8,
        direction: bool,
        count: u8
    );
}

// Contracts

#[starknet::contract]
mod actions {
    // Dojo imports

    use dojo::world;
    use dojo::world::IWorldDispatcher;
    use dojo::world::IWorldDispatcherTrait;
    use dojo::world::IDojoResourceProvider;

    // Component imports

    use zkube::components::initializable::InitializableComponent;
    use zkube::components::manageable::ManageableComponent;
    use zkube::components::manageable::ManageableComponent::InternalTrait;
    use zkube::components::playable::PlayableComponent;

    // Local imports

    use super::{IActions, Proof};

    // Components

    component!(path: InitializableComponent, storage: initializable, event: InitializableEvent);
    #[abi(embed_v0)]
    impl WorldProviderImpl =
        InitializableComponent::WorldProviderImpl<ContractState>;
    #[abi(embed_v0)]
    impl DojoInitImpl = InitializableComponent::DojoInitImpl<ContractState>;
    component!(path: ManageableComponent, storage: manageable, event: ManageableEvent);
    impl ManageableInternalImpl = ManageableComponent::InternalImpl<ContractState>;
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        initializable: InitializableComponent::Storage,
        #[substorage(v0)]
        manageable: ManageableComponent::Storage,
        #[substorage(v0)]
        playable: PlayableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        InitializableEvent: InitializableComponent::Event,
        #[flat]
        ManageableEvent: ManageableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
    }

    // Implementations

    #[abi(embed_v0)]
    impl DojoResourceProviderImpl of IDojoResourceProvider<ContractState> {
        fn dojo_resource(self: @ContractState) -> felt252 {
            'actions'
        }
    }

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn create(self: @ContractState, world: IWorldDispatcher, name: felt252) {
            self.manageable.create(world, name);
        }

        fn rename(self: @ContractState, world: IWorldDispatcher, name: felt252) {
            self.manageable.rename(world, name);
        }

        fn start(
            self: @ContractState,
            world: IWorldDispatcher,
            proof: Proof,
            seed: felt252,
            beta: felt252
        ) -> u32 {
            self.playable.start(world, proof, seed, beta)
        }

        fn surrender(self: @ContractState, world: IWorldDispatcher) {
            self.playable.surrender(world);
        }

        fn move(
            self: @ContractState,
            world: IWorldDispatcher,
            row: u8,
            index: u8,
            direction: bool,
            count: u8
        ) {
            self.playable.move(world, row, index, direction, count);
        }
    }
}
