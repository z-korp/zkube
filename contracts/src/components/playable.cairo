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

    use dojo::world::WorldStorage;

    // External imports

    use arcade_trophy::store::{Store as BushidoStore, StoreTrait as BushidoStoreTrait};
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
    use zkube::types::task::{Task, TaskTrait};
    use zkube::types::trophy::{Trophy, TrophyTrait};
    use zkube::types::level::LevelTrait;


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
        fn _surrender(self: @ComponentState<TContractState>, mut world: WorldStorage) {
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
            mut world: WorldStorage,
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
            let line_count = game.move(row_index, start_index, final_index);

            println!("game 1: {} {}", game.combo_counter, game.combo_counter_2);

            // [Effect] Update tournament points
            if (game.score > previous_score) {
                self._handle_score_for_tournament(world, store, player, ref game);
            }

            // [Effect] Update game
            store.set_game(game);
            println!("game 2: {} {}", game.combo_counter, game.combo_counter_2);

            // [Effect] Update player if game is over
            if game.over {
                self._handle_game_over(world, store, game, player);
            }

            // [Trophy] Update Breaking task progression
            let value = line_count.into();
            if Trophy::BreakIn.assess(value) {
                let level = Trophy::LineDestroyer.level();
                let task_id = Task::Breaking.identifier(level);
                let time = get_block_timestamp();
                let store = BushidoStoreTrait::new(world);
                store.progress(player.id, task_id, value, time);
            }
        }

        fn _apply_bonus(
            self: @ComponentState<TContractState>,
            mut world: WorldStorage,
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
            mut world: WorldStorage,
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

                // Put this for patching the u8 combo_counter_in_tournament to u16
                // this is the case where the game has been started before the patch
                // the game_counter_2 (u16 is up to date because _handle_score_for_tournament
                // is called after move or apply_bonus)
                game.combo_counter_in_tournament_2 = game.combo_counter_2;
                game.max_combo_in_tournament = game.max_combo;
            }
        }

        fn _handle_game_over(
            self: @ComponentState<TContractState>,
            mut world: WorldStorage,
            store: Store,
            game: Game,
            mut player: Player,
        ) {
            let base_points = game.score;

            // [Effect] Update player
            let current_timestamp = get_block_timestamp();
            player.update_daily_streak(current_timestamp);

            let mode: Mode = game.mode.into();
            let mode_multiplier = mode.get_multiplier();

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

            // [Trophy] Update Mastering tasks progression
            let value = game.combo_counter_2.into();
            let time = get_block_timestamp();
            let store = BushidoStoreTrait::new(world);
            if Trophy::ComboInitiator.assess(value) {
                let level = Trophy::ComboInitiator.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::ComboExpert.assess(value) {
                let level = Trophy::ComboExpert.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::ComboMaster.assess(value) {
                let level = Trophy::ComboMaster.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }

            // [Trophy] Update Chaining tasks progression
            let value = game.max_combo.into();
            if Trophy::TripleThreat.assess(value) {
                let level = Trophy::TripleThreat.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::SixShooter.assess(value) {
                let level = Trophy::SixShooter.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::NineLives.assess(value) {
                let level = Trophy::NineLives.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }

            // [Trophy] Update Streaking tasks progression
            let value = player.daily_streak.into();
            if Trophy::StreakStarter.assess(value) {
                let level = Trophy::StreakStarter.level();
                let task_id = Task::Streaking.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::StreakAchiever.assess(value) {
                let level = Trophy::StreakAchiever.level();
                let task_id = Task::Streaking.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::StreakChampion.assess(value) {
                let level = Trophy::StreakChampion.level();
                let task_id = Task::Streaking.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }

            // [Trophy] Update Leveling tasks progression
            let player_level: u8 = LevelTrait::from_points(player.points).into();
            let value = player_level.into();
            if Trophy::BeginnersLuck.assess(value) {
                let level = Trophy::BeginnersLuck.level();
                let task_id = Task::Leveling.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::ClimbingHigh.assess(value) {
                let level = Trophy::ClimbingHigh.level();
                let task_id = Task::Leveling.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
            if Trophy::SkyIsTheLimit.assess(value) {
                let level = Trophy::SkyIsTheLimit.level();
                let task_id = Task::Leveling.identifier(level);
                store.progress(player.id, task_id, 1, time);
            }
        }
    }
}
