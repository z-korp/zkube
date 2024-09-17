// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::IWorldDispatcher;

// External imports

use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports

use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;

#[dojo::interface]
trait IPlay<TContractState> {
    fn create(
        ref world: IWorldDispatcher, mode: Mode, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn claim(ref world: IWorldDispatcher, mode: Mode, tournament_id: u64, rank: u8,);
    fn sponsor(ref world: IWorldDispatcher, mode: Mode, amount: felt252);
    fn surrender(ref world: IWorldDispatcher);
    fn move(ref world: IWorldDispatcher, row_index: u8, start_index: u8, final_index: u8,);
    fn apply_bonus(ref world: IWorldDispatcher, bonus: Bonus, row_index: u8, line_index: u8);
}

#[dojo::contract]
mod play {
    // Starknet imports

    use starknet::{ContractAddress, ClassHash};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports

    use zkube::components::hostable::HostableComponent;
    use zkube::components::payable::PayableComponent;
    use zkube::components::playable::PlayableComponent;
    use zkube::components::creditable::CreditableComponent;

    // Local imports

    use super::{IPlay, Proof, Bonus, Mode};

    // Components

    component!(path: HostableComponent, storage: hostable, event: HostableEvent);
    impl HostableInternalImpl = HostableComponent::InternalImpl<ContractState>;
    component!(path: PayableComponent, storage: payable, event: PayableEvent);
    impl PayableInternalImpl = PayableComponent::InternalImpl<ContractState>;
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;
    component!(path: CreditableComponent, storage: creditable, event: CreditableEvent);
    impl CreditableInternalImpl = CreditableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        hostable: HostableComponent::Storage,
        #[substorage(v0)]
        payable: PayableComponent::Storage,
        #[substorage(v0)]
        playable: PlayableComponent::Storage,
        #[substorage(v0)]
        creditable: CreditableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        HostableEvent: HostableComponent::Event,
        #[flat]
        PayableEvent: PayableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
        #[flat]
        CreditableEvent: CreditableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher, token_address: ContractAddress,) {
        // [Effect] Initialize components
        self.payable._initialize(token_address);
    }

    // Implementations

    #[abi(embed_v0)]
    impl PlayImpl of IPlay<ContractState> {
        fn create(
            ref world: IWorldDispatcher, mode: Mode, proof: Proof, seed: felt252, beta: felt252,
        ) -> u32 {
            let mut was_free = false;
            // [Interaction] Pay entry price
            // [Check] Player exists
            let caller = get_caller_address();
            if (self.creditable._has_credits(world, caller)) {
                was_free = true;
            }

            // [Effect] Create a game
            let (game_id, amount) = self.hostable._create(world, proof, seed, beta, mode, was_free);

            if (was_free) {
                self.creditable._use_credit(world, caller);
            } else {
                self.payable._pay(caller, amount);
            }

            // [Return] Game ID
            game_id
        }

        fn claim(ref world: IWorldDispatcher, mode: Mode, tournament_id: u64, rank: u8) {
            let reward = self.hostable._claim(world, tournament_id, rank, mode);
            let caller = get_caller_address();
            self.payable._refund(caller, reward);
        }

        fn sponsor(ref world: IWorldDispatcher, mode: Mode, amount: felt252) {
            let amount = self.hostable._sponsor(world, amount, mode);
            let caller = get_caller_address();
            self.payable._pay(caller, amount);
        }

        fn surrender(ref world: IWorldDispatcher) {
            self.playable._surrender(world);
        }

        fn move(ref world: IWorldDispatcher, row_index: u8, start_index: u8, final_index: u8,) {
            self.playable._move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(ref world: IWorldDispatcher, bonus: Bonus, row_index: u8, line_index: u8) {
            self.playable._apply_bonus(world, bonus, row_index, line_index);
        }
    }
}
