// Component

#[starknet::component]
mod PlayableComponent {
    // Core imports

    use core::debug::PrintTrait;

    // Starknet imports

    use zkube::models::game::AssertTrait;
    use zkube::store::StoreTrait;
    use starknet::ContractAddress;
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::IWorldDispatcher;
    use dojo::world::IWorldDispatcherTrait;

    // External imports

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::constants;
    use zkube::store::{Store, StoreImpl};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};

    // Errors

    mod errors {
        const PLAYABLE_INVALID_PROOF: felt252 = 'Playable:: invalid proof';
        const PLAYABLE_INVALID_BETA: felt252 = 'Playable:: invalid beta';
        const PLAYABLE_INVALID_SEED: felt252 = 'Playable:: invalid seed';
    }

    // Storage

    #[storage]
    struct Storage {
        seeds: LegacyMap::<felt252, bool>,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn start(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            proof: Proof,
            seed: felt252,
            beta: felt252
        ) -> u32 {
            // [Setup] Datastore
            let store: Store = StoreImpl::new(world);

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
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Check] Game is over
            let game = store.game(player.game_id);
            game.assert_is_over();

            // [Effect] Create game
            let game_id: u32 = world.uuid() + 1;
            let mut game = GameTrait::new(game_id, beta);
            game.start();
            store.set_game(game);

            // [Effect] Update player
            player.game_id = game_id;
            store.set_player(player);

            // [Return] Game id
            game_id
        }

        fn surrender(self: @ComponentState<TContractState>, world: IWorldDispatcher) {
            // [Setup] Datastore
            let store: Store = StoreImpl::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Check] Game exists and not over
            let mut game = store.game(player.game_id);
            game.assert_exists();
            game.assert_not_over();

            // [Effect] Assess achievements
            game.over = true;

            // [Effect] Update game
            store.set_game(game);
        }

        fn move(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) {
            // [Setup] Datastore
            let store: Store = StoreImpl::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Check] Game exists and not over
            let mut game = store.game(player.game_id);
            game.assert_exists();
            game.assert_not_over();

            // game.move(row, index, direction, count);

            // [Effect] Update game
            store.set_game(game);
        }
    }
}
