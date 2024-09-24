// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::{IWorldDispatcher, Resource};

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
        ref world: IWorldDispatcher, mode: Mode, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
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
    use zkube::components::playable::PlayableComponent;
    use zkube::components::creditable::CreditableComponent;
    use zkube::systems::chest::{IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::zkorp::{IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::tournament::{ITournamentDispatcher, ITournamentDispatcherTrait};

    // Local imports

    use super::{IPlay, Proof, Bonus, Mode, Settings, SettingsTrait, Store, StoreTrait, Resource};

    // Components

    component!(path: HostableComponent, storage: hostable, event: HostableEvent);
    impl HostableInternalImpl = HostableComponent::InternalImpl<ContractState>;
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
        PlayableEvent: PlayableComponent::Event,
        #[flat]
        CreditableEvent: CreditableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher) {}

    // Implementations

    #[abi(embed_v0)]
    impl PlayImpl of IPlay<ContractState> {
        fn create(
            ref world: IWorldDispatcher, mode: Mode, proof: Proof, seed: felt252, beta: felt252,
        ) -> u32 {
            let store = StoreTrait::new(world);

            let mut was_free = false;

            // [Interaction] Pay entry price
            // [Check] Player exists
            let caller = get_caller_address();
            if (self.creditable._has_credits(world, caller)) {
                was_free = true;
            }

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

            println!("tournament_amount: {}", tournament_amount);
            println!("chest_amount: {}", chest_amount);
            println!("referrer_amount: {}", referrer_amount);
            println!("zkorp_amount: {}", zkorp_amount);

            // Get the settings
            if (was_free) {
                self.creditable._use_credit(world, caller);
            } else {
                // [Setup] Settings
                if let Resource::Contract((class_hash, contract_address)) = world
                    .resource(selector_from_tag!("zkube-tournament")) {
                    let tournament_system_dispatcher = ITournamentDispatcher { contract_address };
                    tournament_system_dispatcher.sponsor(tournament_id, mode, tournament_amount);
                }

                // Chest pool
                if let Resource::Contract((class_hash, contract_address)) = world
                    .resource(selector_from_tag!("zkube-chest")) {
                    let chest_system_dispatcher = IChestDispatcher { contract_address };
                    chest_system_dispatcher.sponsor_unknown(chest_amount);
                }

                // zKorp
                if let Resource::Contract((class_hash, contract_address)) = world
                    .resource(selector_from_tag!("zkube-zkorp")) {
                    let zkorp_system_dispatcher = IZKorpDispatcher { contract_address };
                    zkorp_system_dispatcher.sponsor(chest_amount);
                }
            }

            // [Return] Game ID
            game_id
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
