// Starknet imports
use starknet::ContractAddress;

// Dojo imports
use dojo::world::WorldStorage;

// External imports
use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::store::{Store, StoreTrait};

#[starknet::interface]
trait ITournamentSystem<T> {
    fn claim(ref self: T, mode: Mode, tournament_id: u32, rank: u8);
    fn sponsor_from(
        ref self: T, tournament_id: u32, mode: Mode, amount: u128, caller: ContractAddress
    );
    fn sponsor(ref self: T, tournament_id: u32, mode: Mode, amount: u128);
}

#[dojo::contract]
mod tournament {
    // Starknet imports
    use starknet::{ContractAddress, ClassHash};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports
    use zkube::components::payable::PayableComponent;

    // Local imports
    use super::{
        ITournamentSystem, Proof, Bonus, Mode, Settings, SettingsTrait, Store, StoreTrait,
        WorldStorage
    };
    use zkube::models::tournament::{TournamentTrait, TournamentAssert, TournamentImpl};
    use zkube::models::tournament_prize::{TournamentPrizeTrait, TournamentPrizeAssert};
    use zkube::models::player_info::{PlayerInfoTrait, PlayerInfoAssert};
    use zkube::models::participation::{ParticipationTrait, ParticipationAssert};
    use zkube::types::mode::ModeTrait;

    // Components
    component!(path: PayableComponent, storage: payable, event: PayableEvent);
    impl PayableInternalImpl = PayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        payable: PayableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        PayableEvent: PayableComponent::Event,
    }

    // Constructor
    fn dojo_init(ref self: ContractState, token_address: ContractAddress,) {
        // [Effect] Initialize components
        self.payable._initialize(token_address);
    }

    // Implementations
    #[abi(embed_v0)]
    impl TournamentSystemImpl of ITournamentSystem<ContractState> {
        fn claim(ref self: ContractState, mode: Mode, tournament_id: u32, rank: u8) {
            // [Setup] Datastore
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let player_info = store.player_info(caller.into());
            player_info.assert_exists();

            // [Check] Tournament exists
            let mut tournament = store.tournament(tournament_id);
            tournament.assert_exists();

            // [Effect] Update claim
            let time: u32 = get_block_timestamp().try_into().unwrap();
            // Get the game_id of the player at the rank
            let game_id = tournament.game_at_rank(rank);
            // From the game_id, get the game to retrieve the player_id
            let game = store.game(game_id);

            // [Check] Caller is the owner of the game
            assert(player_info.player_id == game.player_id, 'Player does not own the game');
            let tournament_prize = store.tournament_prize(tournament_id);
            let reward = tournament.claim(rank, time, mode.duration(), tournament_prize.prize);
            store.set_tournament(tournament);

            // [Effect] Pay reward
            self.payable._refund(caller, reward.into());
        }

        fn sponsor_from(
            ref self: ContractState,
            tournament_id: u32,
            mode: Mode,
            amount: u128,
            caller: ContractAddress
        ) {
            // [Setup] Datastore
            let mut world = self.world_default();
            let store: Store = StoreTrait::new(world);

            // [Check] Tournament exists
            let time = get_block_timestamp().try_into().unwrap();
            let tournament_id = TournamentImpl::compute_id(time, mode.duration());

            let mut tournament_prize = store.tournament_prize(tournament_id);
            //let tournament = store.tournament(tournament_id);
            tournament_prize.assert_exists(); // TBD remove?

            // [Effect] Add amount to the current tournament prize pool
            tournament_prize.pay_entry_fee(amount);
            store.set_tournament_prize(tournament_prize);

            // [Return] Amount to pay
            self.payable._pay(caller, amount.into());
        }

        fn sponsor(ref self: ContractState, tournament_id: u32, mode: Mode, amount: u128) {
            self.sponsor_from(tournament_id, mode, amount, get_caller_address());
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(crate::default_namespace())
        }
    }
}
