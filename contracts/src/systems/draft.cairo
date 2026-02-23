#[starknet::interface]
pub trait IDraftSystem<T> {
    fn maybe_open_after_level(
        ref self: T, game_id: u64, completed_level: u8, player: starknet::ContractAddress,
    );
    fn reroll(ref self: T, game_id: u64, reroll_slot: u8);
    fn select(ref self: T, game_id: u64, selected_slot: u8);
}

#[dojo::contract]
mod draft_system {
    use core::hash::HashStateTrait;
    use core::poseidon::{HashState, PoseidonTrait};
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use game_components_minigame::libs::assert_token_ownership;
    use starknet::{ContractAddress, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{DraftOpened, DraftRerolled, DraftSelected};
    use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
    use zkube::helpers::packing::RunData;
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::token;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameSeed, GameTrait};

    const EVENT_TYPE_POST_LEVEL_1: u8 = 1;
    const EVENT_TYPE_POST_BOSS: u8 = 2;
    const EVENT_TYPE_ZONE_MICRO: u8 = 3;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl DraftSystemImpl of super::IDraftSystem<ContractState> {
        fn maybe_open_after_level(
            ref self: ContractState, game_id: u64, completed_level: u8, player: ContractAddress,
        ) {
            if completed_level >= 50 {
                return;
            }

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();

            // Guard: only open from real progression (level just completed -> now at next level).
            if run_data.current_level != completed_level + 1 {
                return;
            }

            let game_seed: GameSeed = world.read_model(game_id);
            let mut draft: DraftState = world.read_model(game_id);
            if draft.game_id != game_id {
                draft = DraftStateTrait::new(game_id, game_seed.seed);
            }

            let mut event_slot: u8 = 0;
            let mut event_type: u8 = 0;
            let mut zone: u8 = 1;

            if completed_level == 1 {
                event_slot = 0;
                event_type = EVENT_TYPE_POST_LEVEL_1;
                zone = 1;
            } else if completed_level < 50 && completed_level % 10 == 0 {
                zone = completed_level / 10;
                event_slot = 5 + zone;
                event_type = EVENT_TYPE_POST_BOSS;
            } else {
                zone = InternalImpl::zone_for_level(completed_level);
                let trigger = InternalImpl::zone_micro_trigger(draft.seed, zone);
                if completed_level != trigger {
                    return;
                }

                event_slot = zone;
                event_type = EVENT_TYPE_ZONE_MICRO;
            }

            if draft.active {
                return;
            }

            if draft.is_slot_completed(event_slot) {
                return;
            }

            let boss_clears: u8 = if event_type == EVENT_TYPE_POST_BOSS {
                completed_level / 10
            } else {
                (completed_level - 1) / 10
            };

            let choice_1 = InternalImpl::choose_bonus_option(
                game_seed.seed,
                event_slot,
                0,
                run_data.selected_bonus_1,
                run_data.selected_bonus_2,
                run_data.selected_bonus_3,
            );
            let choice_2 = InternalImpl::choose_upgrade_option(
                game_seed.seed, event_slot, 0, boss_clears,
            );
            let choice_3 = InternalImpl::choose_world_option(
                game_seed.seed, event_slot, 0, boss_clears,
            );

            draft.active = true;
            draft.event_slot = event_slot;
            draft.event_type = event_type;
            draft.trigger_level = completed_level;
            draft.zone = zone;
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;
            draft.reroll_1 = 0;
            draft.reroll_2 = 0;
            draft.reroll_3 = 0;
            draft.spent_cubes = 0;
            draft.selected_slot = 0;
            draft.selected_choice = 0;

            world.write_model(@draft);

            world
                .emit_event(
                    @DraftOpened {
                        game_id,
                        player,
                        event_slot,
                        event_type,
                        trigger_level: completed_level,
                        zone,
                        choice_1,
                        choice_2,
                        choice_3,
                    },
                );
        }

        fn reroll(ref self: ContractState, game_id: u64, reroll_slot: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let token_address = token::get_token_address(world);
            assert_token_ownership(token_address, game_id);

            let game: Game = world.read_model(game_id);
            let game_seed: GameSeed = world.read_model(game_id);
            let mut draft: DraftState = world.read_model(game_id);
            assert!(draft.game_id == game_id, "Draft state missing");
            assert!(draft.active, "No active draft");
            assert!(reroll_slot < 3, "Invalid reroll slot");

            let run_data = game.get_run_data();
            let boss_clears: u8 = if draft.event_type == EVENT_TYPE_POST_BOSS {
                draft.trigger_level / 10
            } else {
                (draft.trigger_level - 1) / 10
            };

            let reroll_count: u8 = if reroll_slot == 0 {
                draft.reroll_1
            } else if reroll_slot == 1 {
                draft.reroll_2
            } else {
                draft.reroll_3
            };

            let cost = InternalImpl::reroll_cost(reroll_count);
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(get_caller_address(), cost.into());

            let next_reroll = reroll_count + 1;
            let reroll_seed = RandomImpl::from_vrf_enabled(game_seed.vrf_enabled).seed;

            let new_choice = if reroll_slot == 0 {
                draft.reroll_1 = next_reroll;
                let c = InternalImpl::choose_bonus_option(
                    reroll_seed,
                    draft.event_slot,
                    next_reroll,
                    run_data.selected_bonus_1,
                    run_data.selected_bonus_2,
                    run_data.selected_bonus_3,
                );
                draft.choice_1 = c;
                c
            } else if reroll_slot == 1 {
                draft.reroll_2 = next_reroll;
                let c = InternalImpl::choose_upgrade_option(
                    reroll_seed, draft.event_slot, next_reroll, boss_clears,
                );
                draft.choice_2 = c;
                c
            } else {
                draft.reroll_3 = next_reroll;
                let c = InternalImpl::choose_world_option(
                    reroll_seed, draft.event_slot, next_reroll, boss_clears,
                );
                draft.choice_3 = c;
                c
            };

            let next_spent: u32 = draft.spent_cubes.into() + cost.into();
            assert!(next_spent <= 65535, "Draft spent overflow");
            draft.spent_cubes = next_spent.try_into().unwrap();
            world.write_model(@draft);

            world
                .emit_event(
                    @DraftRerolled {
                        game_id,
                        player: get_caller_address(),
                        event_slot: draft.event_slot,
                        reroll_slot,
                        reroll_cost: cost,
                        new_choice,
                    },
                );
        }

        fn select(ref self: ContractState, game_id: u64, selected_slot: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let token_address = token::get_token_address(world);
            assert_token_ownership(token_address, game_id);

            let mut draft: DraftState = world.read_model(game_id);
            assert!(draft.game_id == game_id, "Draft state missing");
            assert!(draft.active, "No active draft");
            assert!(selected_slot < 3, "Invalid selected slot");

            let selected_choice = if selected_slot == 0 {
                draft.choice_1
            } else if selected_slot == 1 {
                draft.choice_2
            } else {
                draft.choice_3
            };

            let mut game: Game = world.read_model(game_id);
            InternalImpl::apply_selected_choice(
                ref game, selected_slot, selected_choice, draft.event_slot,
            );
            world.write_model(@game);

            let event_slot = draft.event_slot;
            draft.mark_slot_completed(event_slot);
            draft.set_pick_for_slot(event_slot, selected_choice);
            draft.active = false;
            draft.selected_slot = selected_slot;
            draft.selected_choice = selected_choice;

            world.write_model(@draft);

            world
                .emit_event(
                    @DraftSelected {
                        game_id,
                        player: get_caller_address(),
                        event_slot,
                        selected_slot,
                        selected_choice,
                    },
                );
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn apply_selected_choice(
            ref game: Game, selected_slot: u8, selected_choice: u16, event_slot: u8,
        ) {
            let mut run_data = game.get_run_data();

            if selected_slot == 0 {
                Self::apply_bonus_choice(ref run_data, selected_choice, event_slot);
            } else if selected_slot == 1 {
                Self::apply_upgrade_choice(ref run_data, selected_choice, event_slot);
            } else {
                Self::apply_world_choice(ref run_data, selected_choice, event_slot);
            }

            game.set_run_data(run_data);
        }

        fn apply_bonus_choice(ref run_data: RunData, selected_choice: u16, event_slot: u8) {
            if selected_choice < 101 || selected_choice > 105 {
                return;
            }

            let bonus_type: u8 = (selected_choice - 100).try_into().unwrap();

            if run_data.selected_bonus_1 == 0 {
                run_data.selected_bonus_1 = bonus_type;
                run_data.bonus_1_level = 0;
                return;
            }
            if run_data.selected_bonus_2 == 0 {
                run_data.selected_bonus_2 = bonus_type;
                run_data.bonus_2_level = 0;
                return;
            }
            if run_data.selected_bonus_3 == 0 {
                run_data.selected_bonus_3 = bonus_type;
                run_data.bonus_3_level = 0;
                return;
            }

            let replace_slot = event_slot % 3;
            if replace_slot == 0 {
                Self::clear_bonus_inventory(ref run_data, run_data.selected_bonus_1);
                run_data.selected_bonus_1 = bonus_type;
                run_data.bonus_1_level = 0;
            } else if replace_slot == 1 {
                Self::clear_bonus_inventory(ref run_data, run_data.selected_bonus_2);
                run_data.selected_bonus_2 = bonus_type;
                run_data.bonus_2_level = 0;
            } else {
                Self::clear_bonus_inventory(ref run_data, run_data.selected_bonus_3);
                run_data.selected_bonus_3 = bonus_type;
                run_data.bonus_3_level = 0;
            }
        }

        fn apply_upgrade_choice(ref run_data: RunData, selected_choice: u16, event_slot: u8) {
            if selected_choice < 201 || selected_choice > 204 {
                return;
            }

            let tier: u8 = (selected_choice - 200).try_into().unwrap();
            let slot_a = event_slot % 3;
            let slot_b = (slot_a + 1) % 3;

            if tier == 1 {
                Self::level_up_slot(ref run_data, slot_a, 1);
            } else if tier == 2 {
                Self::level_up_slot(ref run_data, slot_a, 1);
                Self::level_up_slot(ref run_data, slot_b, 1);
            } else if tier == 3 {
                Self::level_up_slot(ref run_data, slot_a, 2);
            } else {
                Self::level_up_slot(ref run_data, slot_a, 2);
                Self::level_up_slot(ref run_data, slot_b, 1);
            }
        }

        fn apply_world_choice(ref run_data: RunData, selected_choice: u16, event_slot: u8) {
            if selected_choice < 301 || selected_choice > 307 {
                return;
            }

            let world_pick: u8 = (selected_choice - 300).try_into().unwrap();
            if world_pick == 1 {
                run_data.free_moves = Self::sat_add_u8(run_data.free_moves, 1, 7);
            } else if world_pick == 2 {
                run_data.total_cubes = Self::sat_add_u16(run_data.total_cubes, 5, 65535);
            } else if world_pick == 3 {
                run_data.free_moves = Self::sat_add_u8(run_data.free_moves, 2, 7);
            } else if world_pick == 4 {
                Self::level_up_slot(ref run_data, event_slot % 3, 1);
            } else if world_pick == 5 {
                run_data.combo_count = Self::sat_add_u8(run_data.combo_count, 1, 255);
            } else if world_pick == 6 {
                run_data.score_count = Self::sat_add_u8(run_data.score_count, 1, 255);
            } else {
                run_data.harvest_count = Self::sat_add_u8(run_data.harvest_count, 1, 255);
            }
        }

        fn clear_bonus_inventory(ref run_data: RunData, bonus_type: u8) {
            if bonus_type == 1 {
                run_data.combo_count = 0;
            } else if bonus_type == 2 {
                run_data.score_count = 0;
            } else if bonus_type == 3 {
                run_data.harvest_count = 0;
            } else if bonus_type == 4 {
                run_data.wave_count = 0;
            } else if bonus_type == 5 {
                run_data.supply_count = 0;
            }
        }

        fn level_up_slot(ref run_data: RunData, slot: u8, amount: u8) {
            if slot == 0 {
                run_data.bonus_1_level = Self::sat_add_u8(run_data.bonus_1_level, amount, 2);
            } else if slot == 1 {
                run_data.bonus_2_level = Self::sat_add_u8(run_data.bonus_2_level, amount, 2);
            } else {
                run_data.bonus_3_level = Self::sat_add_u8(run_data.bonus_3_level, amount, 2);
            }
        }

        fn sat_add_u8(value: u8, delta: u8, max: u8) -> u8 {
            let sum: u16 = value.into() + delta.into();
            if sum > max.into() {
                max
            } else {
                sum.try_into().unwrap()
            }
        }

        fn sat_add_u16(value: u16, delta: u16, max: u16) -> u16 {
            let sum: u32 = value.into() + delta.into();
            if sum > max.into() {
                max
            } else {
                sum.try_into().unwrap()
            }
        }

        fn zone_for_level(level: u8) -> u8 {
            ((level - 1) / 10) + 1
        }

        fn zone_micro_trigger(seed: felt252, zone: u8) -> u8 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_MICRO');
            let zone_felt: felt252 = zone.into();
            let state = state.update(zone_felt);
            let h = state.finalize();
            let h_u256: u256 = h.into();
            let offset_u256: u256 = h_u256 % 7_u256;
            let offset: u8 = offset_u256.try_into().unwrap();
            let start = (zone - 1) * 10 + 1;
            start + 1 + offset
        }

        fn choice_hash(seed: felt252, event_slot: u8, slot: u8, reroll_count: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_CHOICE');
            let event_slot_felt: felt252 = event_slot.into();
            let slot_felt: felt252 = slot.into();
            let reroll_count_felt: felt252 = reroll_count.into();
            let state = state.update(event_slot_felt);
            let state = state.update(slot_felt);
            let state = state.update(reroll_count_felt);
            state.finalize()
        }

        fn choose_bonus_option(
            seed: felt252,
            event_slot: u8,
            reroll_count: u8,
            selected_bonus_1: u8,
            selected_bonus_2: u8,
            selected_bonus_3: u8,
        ) -> u16 {
            let h = Self::choice_hash(seed, event_slot, 0, reroll_count);
            let h_u256: u256 = h.into();
            let start_u256: u256 = (h_u256 % 5_u256) + 1_u256;
            let mut candidate: u8 = start_u256.try_into().unwrap();
            let has_empty = selected_bonus_1 == 0 || selected_bonus_2 == 0 || selected_bonus_3 == 0;

            let mut i: u8 = 0;
            loop {
                if i >= 5 {
                    break;
                }

                if has_empty {
                    return (100_u16 + candidate.into());
                }

                if candidate != selected_bonus_1
                    && candidate != selected_bonus_2
                    && candidate != selected_bonus_3 {
                    return (100_u16 + candidate.into());
                }

                candidate = if candidate == 5 {
                    1
                } else {
                    candidate + 1
                };
                i += 1;
            }

            101
        }

        fn choose_upgrade_option(
            seed: felt252, event_slot: u8, reroll_count: u8, boss_clears: u8,
        ) -> u16 {
            let h = Self::choice_hash(seed, event_slot, 1, reroll_count);
            let h_u256: u256 = h.into();
            let start_u256: u256 = (h_u256 % 4_u256) + 1_u256;
            let mut candidate: u8 = start_u256.try_into().unwrap();

            let mut i: u8 = 0;
            loop {
                if i >= 4 {
                    break;
                }

                let allowed = if candidate == 1 {
                    true
                } else if candidate == 2 {
                    boss_clears >= 1
                } else if candidate == 3 {
                    boss_clears >= 2
                } else {
                    boss_clears >= 3
                };

                if allowed {
                    return (200_u16 + candidate.into());
                }

                candidate = if candidate == 4 {
                    1
                } else {
                    candidate + 1
                };
                i += 1;
            }

            201
        }

        fn choose_world_option(
            seed: felt252, event_slot: u8, reroll_count: u8, boss_clears: u8,
        ) -> u16 {
            let h = Self::choice_hash(seed, event_slot, 2, reroll_count);
            let h_u256: u256 = h.into();
            let start_u256: u256 = (h_u256 % 7_u256) + 1_u256;
            let mut candidate: u8 = start_u256.try_into().unwrap();

            let mut i: u8 = 0;
            loop {
                if i >= 7 {
                    break;
                }

                let allowed = if candidate <= 3 {
                    true
                } else if candidate == 4 {
                    boss_clears >= 1
                } else if candidate == 5 {
                    boss_clears >= 2
                } else if candidate == 6 {
                    boss_clears >= 3
                } else {
                    boss_clears >= 2
                };

                if allowed {
                    return (300_u16 + candidate.into());
                }

                candidate = if candidate == 7 {
                    1
                } else {
                    candidate + 1
                };
                i += 1;
            }

            301
        }

        fn reroll_cost(reroll_count: u8) -> u16 {
            let mut cost: u16 = 5;
            let mut i = 0;
            loop {
                if i >= reroll_count {
                    break;
                }
                cost = ((cost * 3) + 1) / 2;
                i += 1;
            }
            cost
        }
    }
}
