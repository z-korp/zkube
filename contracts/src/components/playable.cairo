// Component

#[starknet::component]
mod PlayableComponent {
    // Core imports

    use core::debug::PrintTrait;

    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::IWorldDispatcher;
    use dojo::world::IWorldDispatcherTrait;

    // External imports

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::constants;
    use zkube::store::{Store, StoreTrait};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};
    use zkube::models::game::AssertTrait;
    use zkube::types::bonus::Bonus;
    use zkube::types::difficulty::Difficulty;
    use zkube::types::mode::Mode;
    use zkube::models::tournament::TournamentImpl;


    // Storage

    #[storage]
    struct Storage {}

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {}

    #[generate_trait]
    impl InternalImpl<
        TContractState, +HasComponent<TContractState>
    > of InternalTrait<TContractState> {
        fn _surrender(self: @ComponentState<TContractState>, world: IWorldDispatcher) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

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

            // [Effect] Update player if game is over
            if game.over {
                player.update(game.score);
                store.set_player(player);
            }

            // [Effect] Update tournament on game over
            let time = get_block_timestamp();
            let tournament_id = TournamentImpl::compute_id(game.start_time, game.duration());
            let id_end = TournamentImpl::compute_id(time, game.duration());
            if tournament_id == id_end && game.over {
                // [Effect] Update tournament
                let mut tournament = store.tournament(tournament_id);
                tournament.score(player.id, game.score);
                store.set_tournament(tournament);

                // [Effect] Add tournament id to game
                game.tournament_id = tournament_id;
            }
        }

        fn _move(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            row_index: u8,
            start_index: u8,
            final_index: u8,
        ) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Check] Game exists and not over
            let mut game = store.game(player.game_id);
            game.assert_exists();
            game.assert_not_over();

            // [Effect] Perform move
            game.move(row_index, start_index, final_index);

            // [Effect] Update game
            store.set_game(game);

            // [Effect] Update player if game is over
            if game.over {
                player.update(game.score);
                store.set_player(player);
            }

            // [Effect] Update tournament on game over
            let time = get_block_timestamp();
            let tournament_id = TournamentImpl::compute_id(game.start_time, game.duration());
            let id_end = TournamentImpl::compute_id(time, game.duration());
            if tournament_id == id_end && game.over {
                // [Effect] Update tournament
                let mut tournament = store.tournament(tournament_id);
                tournament.score(player.id, game.score);
                store.set_tournament(tournament);

                // [Effect] Add tournament id to game
                game.tournament_id = tournament_id;
            }
        }

        fn _apply_bonus(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            bonus: Bonus,
            row_index: u8,
            index: u8,
        ) {
            // [Setup] Datastore
            let store: Store = StoreTrait::new(world);

            // [Check] Player exists
            let caller = get_caller_address();
            let mut player = store.player(caller.into());
            player.assert_exists();

            // [Check] Game exists and not over
            let mut game = store.game(player.game_id);
            game.assert_exists();
            game.assert_not_over();

            // [Check] Bonus is available
            game.assert_is_available(bonus);

            // [Effect] Apply bonus
            game.apply_bonus(bonus, row_index, index);

            // [Effect] Update game
            store.set_game(game);
        }
    }
}
