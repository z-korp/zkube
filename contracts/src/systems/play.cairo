// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::{WorldStorage, WorldStorageTrait};

// External imports

use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports

use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait, SettingsAssert};
use zkube::store::{Store, StoreTrait};

#[starknet::interface]
trait IPlay<T> {
    fn create(
        ref self: T, token_id: u256, mode: Mode, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn surrender(ref self: T);
    fn move(ref self: T, row_index: u8, start_index: u8, final_index: u8,);
    fn apply_bonus(ref self: T, bonus: Bonus, row_index: u8, line_index: u8);
}

#[dojo::contract]
mod play {
    // Starknet imports

    use starknet::{ContractAddress, ClassHash, Felt252TryIntoContractAddress};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports

    use zkube::components::hostable::HostableComponent;
    use zkube::components::playable::PlayableComponent;
    use zkube::systems::chest::{IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::zkorp::{IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::tournament::{ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait};
    use zkube::interfaces::ierc721_game_credits::{
        ierc721_game_credits, IERC721GameCreditsDispatcherTrait
    };

    // Local imports

    use super::{
        IPlay, Proof, Bonus, Mode, Settings, SettingsTrait, SettingsAssert, Store, StoreTrait,
        WorldStorage, WorldStorageTrait,
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
            ref self: ContractState,
            token_id: u256,
            mode: Mode,
            proof: Proof,
            seed: felt252,
            beta: felt252,
        ) -> u32 {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);

            let settings = store.settings();
            // [Check] Games are not paused
            settings.assert_are_games_unpaused();

            let erc721_address: ContractAddress = settings.erc721_address.try_into().unwrap();
            let erc721 = ierc721_game_credits(erc721_address);

            // [Interaction] Pay entry price
            // [Check] Player exists
            let caller = get_caller_address();

            let price = if mode != Mode::Free {
                // [Check] Player owns the token
                let owner = erc721.owner_of(token_id);
                assert(caller == owner, 'Not nft owner');

                // [Get] Entry price
                erc721.get_purchase_price(token_id)
            } else {
                0
            };

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

            if price != 0 {
                // [Effect] Sponsor the tournament from the erc721 contract funds
                let (contract_address, _) = world.dns(@"tournament").unwrap();
                let tournament_system_dispatcher = ITournamentSystemDispatcher { contract_address };
                tournament_system_dispatcher
                    .sponsor_from(tournament_id, mode, tournament_amount, erc721_address);

                // Chest pool
                let (contract_address, _) = world.dns(@"chest").unwrap();
                let chest_system_dispatcher = IChestDispatcher { contract_address };
                chest_system_dispatcher.sponsor_from(chest_amount, erc721_address);

                // zKorp
                let (contract_address, _) = world.dns(@"zkorp").unwrap();
                let zkorp_system_dispatcher = IZKorpDispatcher { contract_address };
                zkorp_system_dispatcher
                    .sponsor_from(zkorp_amount + referrer_amount, erc721_address);
            }

            if (mode != Mode::Free) {
                // [Effect] Burn the nft
                erc721.burn(token_id);
            }

            // [Return] Game ID
            game_id
        }

        fn surrender(ref self: ContractState) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to surrender otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

            self.playable._surrender(world);
        }

        fn move(ref self: ContractState, row_index: u8, start_index: u8, final_index: u8,) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to move otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

            self.playable._move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(ref self: ContractState, bonus: Bonus, row_index: u8, line_index: u8) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to apply_bonus otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

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
