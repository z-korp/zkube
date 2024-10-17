// Component

#[starknet::component]
mod PlayableComponent {
    // Core imports

    use core::debug::PrintTrait;
    use core::Zeroable;

    // Starknet imports

    use starknet::ContractAddress;
    use starknet::info::{get_contract_address, get_caller_address, get_block_timestamp};

    // Dojo imports

    use dojo::world::IWorldDispatcher;
    use dojo::world::IWorldDispatcherTrait;

    // External imports

    use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

    // Internal imports

    use zkube::constants::PRECISION_FACTOR;
    use zkube::store::{Store, StoreTrait};
    use zkube::models::game::{Game, GameTrait, GameAssert};
    use zkube::models::player::{Player, PlayerTrait, PlayerAssert};
    use zkube::models::game::AssertTrait;
    use zkube::types::bonus::Bonus;
    use zkube::types::difficulty::Difficulty;
    use zkube::types::mode::Mode;
    use zkube::models::tournament::TournamentImpl;
    use zkube::models::chest::ChestTrait;
    use zkube::models::participation::{Participation, ParticipationTrait, ZeroableParticipation};
    use zkube::helpers::math::Math;
    use zkube::types::mode::ModeTrait;


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

            if game.over {
                self._handle_game_over(world, store, game, player);
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
            let previous_score = game.score;

            // [Effect] Perform move
            game.move(row_index, start_index, final_index);

            // [Effect] Update tournament points
            if (game.score > previous_score) {
                self._handle_score_for_tournament(world, store, player, ref game);
            }

            // [Effect] Update game
            store.set_game(game);

            // [Effect] Update player if game is over
            if game.over {
                self._handle_game_over(world, store, game, player);
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
            let previous_score = game.score;

            // [Check] Bonus is available
            game.assert_is_available(bonus);

            // [Effect] Apply bonus
            game.apply_bonus(bonus, row_index, index);

            // [Effect] Update tournament points
            if (game.score > previous_score) {
                self._handle_score_for_tournament(world, store, player, ref game);
            }

            // [Effect] Update game
            store.set_game(game);
        }

        fn _handle_score_for_tournament(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            store: Store,
            player: Player,
            ref game: Game,
        ) {
            // [Effect] Update tournament
            let time = get_block_timestamp();
            let tournament_id = TournamentImpl::compute_id(game.start_time, game.duration());
            let id_end = TournamentImpl::compute_id(time, game.duration());
            if tournament_id == id_end {
                let mut tournament = store.tournament(tournament_id);
                tournament.score(player.id, game.id, game.score);
                store.set_tournament(tournament);
                game.score_in_tournament = game.score;
                game.combo_counter_in_tournament = game.combo_counter;
                game.max_combo_in_tournament = game.max_combo;
            }
        }

        fn _handle_game_over(
            self: @ComponentState<TContractState>,
            world: IWorldDispatcher,
            store: Store,
            game: Game,
            mut player: Player,
        ) {
            let base_points = game.score;

            // [Effect] Update player
            let current_timestamp = get_block_timestamp();
            player.update_daily_streak(current_timestamp);

            let mode: Mode = game.mode.into();
            let settings = store.settings();
            let mode_multiplier = mode.get_multiplier(settings);

            let final_points = player
                .update_points(base_points, mode_multiplier, current_timestamp);
            store.set_player(player);

            // [Effect] Update Chest
            let mut remaining_points: u32 = final_points;
            let mut remaining_prize: u256 = game.pending_chest_prize.into()
                * PRECISION_FACTOR.into();
            let mut i = 0;
            loop {
                if i >= 11 || remaining_points == 0 {
                    break;
                }
                let mut chest = store.chest(i);
                // [Effect] Add points to first incomplete chest
                if (!chest.is_complete()) {
                    // [Effect] Add points to chest
                    let points_to_add: u32 = Math::min(remaining_points, chest.remaining_points());
                    chest.add_points(points_to_add);

                    // [Effect] Add prize proportionally to the points added
                    let prize_to_add: u256 = (remaining_prize * points_to_add.into())
                        / remaining_points.into();

                    chest.add_prize((prize_to_add / PRECISION_FACTOR.into()).try_into().unwrap());
                    store.set_chest(chest);

                    // [Effect] Add participation
                    let mut participation = store.participation(i, player.id);
                    if (participation.is_zero()) {
                        participation = ParticipationTrait::new(i, player.id);
                    }
                    participation.add_points(points_to_add);
                    store.set_participation(participation);

                    remaining_points = remaining_points - points_to_add;
                    remaining_prize = remaining_prize - prize_to_add;
                }
                i += 1;
            };
        }
    }
}
