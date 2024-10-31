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

#[starknet::interface]
trait IERC721<TState> {
    fn owner_of(self: @TState, token_id: u256) -> ContractAddress;
}

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
    use zkube::systems::chest::{IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::zkorp::{IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::tournament::{ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait};

    // Local imports

    use super::{
        IPlay, Proof, Bonus, Mode, Settings, SettingsTrait, Store, StoreTrait, Resource,
        IERC721Dispatcher, IERC721DispatcherTrait
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
        #[flat]
        CreditableEvent: CreditableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref world: IWorldDispatcher) {}

    // Implementations

    #[abi(embed_v0)]
    impl PlayImpl of IPlay<ContractState> {
        fn create(
            ref world: IWorldDispatcher,
            token_id: u256,
            mode: Mode,
            proof: Proof,
            seed: felt252,
            beta: felt252,
        ) -> u32 {
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Interaction] Pay entry price
            // [Check] Player exists
            let caller = get_caller_address();

            let erc721 = IERC721Dispatcher { contract_address: store.settings().erc721_address, };

            // [Check] Player owns the token
            assert_eq!(erc721.owner_of(token_id), caller);

            // [Get] Entry price
            let price = erc721.get_purchase_price(token_id, caller);

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
                ._create(world, proof, seed, beta, mode, price);

            // Tournament
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-tournament")) {
                let tournament_system_dispatcher = ITournamentSystemDispatcher { contract_address };
                tournament_system_dispatcher
                    .sponsor_from(tournament_id, mode, tournament_amount, settings.erc721_address);
            }
            // Chest pool
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-chest")) {
                let chest_system_dispatcher = IChestDispatcher { contract_address };
                chest_system_dispatcher.sponsor_from(chest_amount, settings.erc721_address);
            }

            // zKorp
            if let Resource::Contract((class_hash, contract_address)) = world
                .resource(selector_from_tag!("zkube-zkorp")) {
                let zkorp_system_dispatcher = IZKorpDispatcher { contract_address };
                zkorp_system_dispatcher
                    .sponsor_from(zkorp_amount + referrer_amount, settings.erc721_address);
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
