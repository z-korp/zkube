// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::{IWorldDispatcher, Resource, WorldStorage};

// External imports

use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports

use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::store::{Store, StoreTrait};

#[dojo::interface]
trait IPlay<TContractState> {
    fn create(
        ref self: ContractState, mode: Mode, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn surrender(ref self: ContractState);
    fn move(ref self: ContractState, row_index: u8, start_index: u8, final_index: u8,);
    fn apply_bonus(ref self: ContractState, bonus: Bonus, row_index: u8, line_index: u8);
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
    use zkube::components::playable::PlayableComponent;
    use zkube::systems::chest::{IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::zkorp::{IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::tournament::{ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait};

    // Local imports

    use super::{
        IPlay, Proof, Bonus, Mode, Settings, SettingsTrait, Store, StoreTrait, Resource,
        WorldStorage
    };

    // Components

    component!(path: HostableComponent, storage: hostable, event: HostableEvent);
    impl HostableInternalImpl = HostableComponent::InternalImpl<ContractState>;
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        hostable: HostableComponent::Storage,
        #[substorage(v0)]
        playable: PlayableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        HostableEvent: HostableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref self: ContractState) {}

    // Implementations

    #[abi(embed_v0)]
    impl PlayImpl of IPlay<ContractState> {
        fn create(
            ref self: ContractState, mode: Mode, proof: Proof, seed: felt252, beta: felt252,
        ) -> u32 {
            let mut world = world_default();
            let store = StoreTrait::new(world);

            let mut was_free = false;

            // [Interaction] Pay entry price
            // [Check] Player exists
            let caller = get_caller_address();

            // [Effect] Create a game
            let (
                game_id,
                tournament_id,
                tournament_amount,
                chest_amount,
                referrer_amount,
                zkorp_amount
            ) =
                self
                .hostable
                ._create(world, proof, seed, beta, mode, was_free);

            let caller_felt: felt252 = caller.into();
            // [Setup] Settings
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-tournament")) {
                let tournament_system_dispatcher = ITournamentSystemDispatcher { contract_address };
                tournament_system_dispatcher
                    .sponsor(tournament_id, mode, tournament_amount, caller);
            }
            // Chest pool
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-chest")) {
                let chest_system_dispatcher = IChestDispatcher { contract_address };
                chest_system_dispatcher.sponsor_from(chest_amount, caller);
            }

            // zKorp
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-zkorp")) {
                let zkorp_system_dispatcher = IZKorpDispatcher { contract_address };
                zkorp_system_dispatcher.sponsor(zkorp_amount + referrer_amount, caller);
            }

            // [Return] Game ID
            game_id
        }

        fn surrender(ref self: ContractState) {
            let mut world = world_default();
            self.playable._surrender(world);
        }

        fn move(ref self: ContractState, row_index: u8, start_index: u8, final_index: u8,) {
            let mut world = world_default();
            self.playable._move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(ref self: ContractState, bonus: Bonus, row_index: u8, line_index: u8) {
            let mut world = world_default();
            self.playable._apply_bonus(world, bonus, row_index, line_index);
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
