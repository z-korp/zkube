// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::IWorldDispatcher;

// External imports

use stark_vrf::ecvrf::Proof;

// Interla imports

use zkube::types::bonus::Bonus;

// Interfaces

#[starknet::interface]
trait IActions<TContractState> {
    fn create(self: @TContractState, world: IWorldDispatcher, name: felt252);
    fn rename(self: @TContractState, world: IWorldDispatcher, name: felt252);
    fn start(
        self: @TContractState,
        world: IWorldDispatcher,
        difficulty: u8,
        proof: Proof,
        seed: felt252,
        beta: felt252
    ) -> u32;
    fn surrender(self: @TContractState, world: IWorldDispatcher);
    fn move(
        self: @TContractState,
        world: IWorldDispatcher,
        row_index: u8,
        start_index: u8,
        final_index: u8,
    );
    fn apply_bonus(
        self: @TContractState, world: IWorldDispatcher, bonus: Bonus, row_index: u8, line_index: u8
    );
}

// Contracts

#[starknet::contract]
mod actions {
    // Dojo imports

    use core::traits::Into;
    use dojo::world;
    use dojo::world::IWorldDispatcher;
    use dojo::world::IWorldDispatcherTrait;
    use dojo::world::IDojoResourceProvider;

    // Component imports

    use zkube::components::initializable::InitializableComponent;
    use zkube::components::manageable::ManageableComponent;
    use zkube::components::manageable::ManageableComponent::InternalTrait;
    use zkube::components::playable::PlayableComponent;
    use zkube::types::bonus::Bonus;

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
            difficulty: u8,
            proof: Proof,
            seed: felt252,
            beta: felt252
        ) -> u32 {
            self.playable.start(world, difficulty.into(), proof, seed, beta)
        }

        fn surrender(self: @ContractState, world: IWorldDispatcher) {
            self.playable.surrender(world);
        }

        fn move(
            self: @ContractState,
            world: IWorldDispatcher,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) {
            self.playable.move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(
            self: @ContractState,
            world: IWorldDispatcher,
            bonus: Bonus,
            row_index: u8,
            line_index: u8
        ) {
            self.playable.apply_bonus(world, bonus, row_index, line_index);
        }
    }
}
