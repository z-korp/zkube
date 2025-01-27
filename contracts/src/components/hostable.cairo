// Starknet imports

use starknet::ContractAddress;

// Component

#[starknet::component]
mod HostableComponent {
    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};
    use starknet::storage::{Map};

    // Dojo imports

    use dojo::world::{WorldStorage, IWorldDispatcherTrait};

    // External imports

    use arcade_trophy::store::{Store as BushidoStore, StoreTrait as BushidoStoreTrait};

    // Internal imports

    use zkube::constants::{
        REFERRER_PERCENTAGE, CHEST_PERCENTAGE, TOURNAMENT_PERCENTAGE, PRECISION_FACTOR
    };
    use zkube::store::{Store, StoreTrait};
    use zkube::models::game::{Game, GameImpl, GameAssert};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};
    use zkube::models::player_info::{PlayerInfo, PlayerInfoTrait, PlayerInfoAssert};
    use zkube::types::mode::{Mode, ModeTrait};
    use zkube::types::task::{Task, TaskTrait};
    use zkube::models::game::GameTrait;
    use zkube::models::tournament::{TournamentImpl, TournamentAssert};

    // External imports

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Errors

    mod errors {
        const PLAYABLE_INVALID_PROOF: felt252 = 'Playable:: invalid proof';
        const PLAYABLE_INVALID_BETA: felt252 = 'Playable:: invalid beta';
        const PLAYABLE_INVALID_SEED: felt252 = 'Playable:: invalid seed';
    }

    // Storage

    #[storage]
    struct Storage {
        seeds: Map::<felt252, bool>,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn _create(
            self: @ComponentState<TContractState>,
            mut world: WorldStorage,
            proof: Proof,
            seed: felt252,
            beta: felt252,
            mode: Mode,
            price: u256,
        ) -> (u32, u64, u128, u128, u128, u128) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Verify new seed
            assert(!self.seeds.read(beta), errors::PLAYABLE_INVALID_SEED);

            // [Check] Verify seed
            let public_key = Point {
                x: 1173415989117130929327570255074235160147948257071299476886506896372006087277,
                y: 2678963217040729019448869120760864799670267652070964164868211652985974476023,
            };
            let ecvrf = ECVRFTrait::new(public_key);
            let computed = ecvrf
                .verify(proof, array![seed].span())
                .expect(errors::PLAYABLE_INVALID_PROOF);
            assert(computed == beta, errors::PLAYABLE_INVALID_BETA);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player_info = store.player_info(caller.into());

            player_info.assert_exists();

            let player_id = player_info.player_id;
            let mut player = store.player(player_id);

            // [Check] Game is over
            let game = store.game(player.game_id);
            game.assert_is_over();

            // [Effect] Create game
            let game_id: u32 = world.dispatcher.uuid() + 1;
            let time = get_block_timestamp();
            let mut game = GameTrait::new(game_id, player_id, beta, mode: mode.into(), time: time,);

            // [Effect] Create tournament if not existing
            let tournament_id = TournamentImpl::compute_id(time, mode.duration());
            let mut tournament = store.tournament(tournament_id);
            tournament.is_set = true;
            tournament.score(player_id, game_id, 0); // by default add score = 0, otherwise 
            // could have tournament without winners
            store.set_tournament(tournament);

            let mut tournament_prize = store.tournament_prize(tournament_id);
            tournament_prize.is_set = true;
            store.set_tournament_prize(tournament_prize);

            // [Effect] Add tournament id to game
            game.tournament_id = tournament_id;

            // [Effect] Start game
            game.start();
            store.set_game(game);

            // [Effect] Update player
            player.game_id = game_id;
            store.set_player(player);

            // [Effect] Compute prices

            // Apply PRECISION_FACTOR to price at the beginning
            let precise_price: u256 = price * PRECISION_FACTOR.into();

            // Tournament
            let tournament_amount: u256 = (precise_price * TOURNAMENT_PERCENTAGE.into()) / 100;

            // Chest
            let chest_amount: u256 = (precise_price * CHEST_PERCENTAGE.into()) / 100;

            let mut game_prize = store.game_prize(game_id);
            game_prize
                .pending_chest_prize = (chest_amount / PRECISION_FACTOR.into())
                .try_into()
                .unwrap();
            store.set_game_prize(game_prize);

            // Referrer
            let referrer_amount: u256 = (precise_price * REFERRER_PERCENTAGE.into()) / 100;

            // zKorp
            let zkorp_amount: u256 = precise_price
                - tournament_amount
                - chest_amount
                - referrer_amount;

            // [Trophy] Update progression, can manage the mode here to target specific game modes
            if mode != Mode::None {
                let task_id = Task::Playing.identifier(0);
                let count = 1;
                let store = BushidoStoreTrait::new(world);
                store.progress(caller.into(), task_id, count, get_block_timestamp());
            }

            // [Return] Game ID and amounts to pay
            (
                game_id,
                tournament_id,
                (tournament_amount / PRECISION_FACTOR.into()).try_into().unwrap(),
                (chest_amount / PRECISION_FACTOR.into()).try_into().unwrap(),
                (referrer_amount / PRECISION_FACTOR.into()).try_into().unwrap(),
                (zkorp_amount / PRECISION_FACTOR.into()).try_into().unwrap(),
            )
        }
    }
}
