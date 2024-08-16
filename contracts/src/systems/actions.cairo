// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::IWorldDispatcher;

// External imports

use stark_vrf::ecvrf::Proof;

// Interla imports

use zkube::types::bonus::Bonus;

// Interfaces

#[dojo::interface]
trait IActions<TContractState> {
    fn create(ref world: IWorldDispatcher, name: felt252);
    fn rename(ref world: IWorldDispatcher, name: felt252);
    fn start(
        ref world: IWorldDispatcher, difficulty: u8, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn surrender(ref world: IWorldDispatcher);
    fn move(ref world: IWorldDispatcher, row_index: u8, start_index: u8, final_index: u8,);
    fn apply_bonus(ref world: IWorldDispatcher, bonus: Bonus, row_index: u8, line_index: u8);
}

// Contracts

#[dojo::contract]
mod actions {
    // Component imports

    use zkube::components::manageable::ManageableComponent;
    use zkube::components::manageable::ManageableComponent::InternalTrait;
    use zkube::components::playable::PlayableComponent;
    use zkube::types::bonus::Bonus;

    // Local imports

    use super::{IActions, Proof};

    // Components

    component!(path: ManageableComponent, storage: manageable, event: ManageableEvent);
    impl ManageableInternalImpl = ManageableComponent::InternalImpl<ContractState>;
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
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
        ManageableEvent: ManageableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher) {}

    // Implementations

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {
        fn create(ref world: IWorldDispatcher, name: felt252) {
            self.manageable.create(world, name);
        }

        fn rename(ref world: IWorldDispatcher, name: felt252) {
            self.manageable.rename(world, name);
        }

        fn start(
            ref world: IWorldDispatcher, difficulty: u8, proof: Proof, seed: felt252, beta: felt252
        ) -> u32 {
            self.playable.start(world, difficulty.into(), proof, seed, beta)
        }

        fn surrender(ref world: IWorldDispatcher) {
            self.playable.surrender(world);
        }

        fn move(ref world: IWorldDispatcher, row_index: u8, start_index: u8, final_index: u8,) {
            self.playable.move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(ref world: IWorldDispatcher, bonus: Bonus, row_index: u8, line_index: u8) {
            self.playable.apply_bonus(world, bonus, row_index, line_index);
        }
    }
}
