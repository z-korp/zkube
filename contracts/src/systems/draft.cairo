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
    use zkube::helpers::packing::{RunData, RunDataHelpersTrait, SkillTreeDataPackingTrait};
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::token;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameSeed, GameTrait};
    use zkube::models::skill_tree::{PlayerSkillTree, PlayerSkillTreeTrait};

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
                // Zone 1 entry draft: after completing level 1
                event_slot = 0; // (zone 1 - 1) * 2 = 0
                event_type = EVENT_TYPE_POST_LEVEL_1;
                zone = 1;
            } else if completed_level == 10
                || completed_level == 20
                || completed_level == 30
                || completed_level == 40
            {
                // Entry draft for zones 2-5: after clearing boss
                let next_zone: u8 = (completed_level / 10) + 1;
                zone = next_zone;
                event_slot = (next_zone - 1) * 2; // slots 2, 4, 6, 8
                event_type = EVENT_TYPE_POST_BOSS;
            } else {
                // Mid-zone (micro) draft: one per zone at a random level
                zone = InternalImpl::zone_for_level(completed_level);
                if zone > 5 {
                    return;
                }
                let trigger = InternalImpl::zone_micro_trigger(draft.seed, zone);
                if completed_level != trigger {
                    return;
                }

                event_slot = (zone - 1) * 2 + 1; // slots 1, 3, 5, 7, 9
                event_type = EVENT_TYPE_ZONE_MICRO;
            }

            if draft.active {
                return;
            }

            if draft.is_slot_completed(event_slot) {
                return;
            }

            let (choice_1, choice_2, choice_3) = InternalImpl::draw_three_skills(
                game_seed.seed, event_slot, 0, @run_data,
            );

            draft.active = true;
            draft.event_slot = event_slot;
            draft.event_type = event_type;
            draft.trigger_level = completed_level;
            draft.zone = zone;
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;
            draft.reroll_count = 0;
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
            let run_data = game.get_run_data();
            let game_seed: GameSeed = world.read_model(game_id);
            let mut draft: DraftState = world.read_model(game_id);
            assert!(draft.game_id == game_id, "Draft state missing");
            assert!(draft.active, "No active draft");
            assert!(reroll_slot < 3, "Invalid reroll slot");
            assert!(InternalImpl::pool_size(@run_data) >= 3, "Draft pool too small");

            let cost = InternalImpl::reroll_cost(draft.reroll_count);
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(get_caller_address(), cost.into());

            let next_reroll = draft.reroll_count + 1;
            // Salt = poseidon(game_id, reroll_slot, next_reroll) for unique VRF per reroll.
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), reroll_slot.into(), next_reroll.into()].span(),
            );
            let reroll_seed = RandomImpl::from_vrf_enabled(game_seed.vrf_enabled, vrf_salt).seed;

            let mut new_choice = InternalImpl::draw_card_from_pool(
                reroll_seed, draft.event_slot, reroll_slot, next_reroll, @run_data,
            );

            if reroll_slot == 0 {
                loop {
                    if new_choice != draft.choice_2 && new_choice != draft.choice_3 {
                        break;
                    }
                    new_choice = InternalImpl::next_skill_in_pool(new_choice, @run_data);
                };
                draft.choice_1 = new_choice;
            } else if reroll_slot == 1 {
                loop {
                    if new_choice != draft.choice_1 && new_choice != draft.choice_3 {
                        break;
                    }
                    new_choice = InternalImpl::next_skill_in_pool(new_choice, @run_data);
                };
                draft.choice_2 = new_choice;
            } else {
                loop {
                    if new_choice != draft.choice_1 && new_choice != draft.choice_2 {
                        break;
                    }
                    new_choice = InternalImpl::next_skill_in_pool(new_choice, @run_data);
                };
                draft.choice_3 = new_choice;
            }

            draft.reroll_count = next_reroll;
            draft.spent_cubes = InternalImpl::sat_add_u16(draft.spent_cubes, cost, 65535);
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

            let player = get_caller_address();
            let mut draft: DraftState = world.read_model(game_id);
            assert!(draft.game_id == game_id, "Draft state missing");
            assert!(draft.active, "No active draft");
            assert!(selected_slot < 3, "Invalid selected slot");

            let selected_choice: u8 = if selected_slot == 0 {
                draft.choice_1
            } else if selected_slot == 1 {
                draft.choice_2
            } else {
                draft.choice_3
            };
            assert!(selected_choice >= 1 && selected_choice <= 15, "Invalid selected choice");

            let mut skill_tree: PlayerSkillTree = world.read_model(player);
            if !skill_tree.exists() {
                skill_tree = PlayerSkillTreeTrait::new(player);
            }
            let skill_data = skill_tree.get_skill_tree_data();
            let tree_skill_id: u8 = selected_choice - 1;
            let tree_skill = skill_data.get_skill(tree_skill_id);

            let mut game: Game = world.read_model(game_id);
            let mut run_data = game.get_run_data();
            let existing_slot = run_data.find_skill_slot(selected_choice);

            if existing_slot != 255 {
                let current_level = run_data.get_slot_level(existing_slot);
                run_data.set_slot_level(existing_slot, InternalImpl::sat_add_u8(current_level, 1, 10));
            } else if run_data.active_slot_count < 3 {
                let added_slot = run_data.add_skill(selected_choice, tree_skill.level);
                assert!(added_slot != 255, "Failed to add skill to run loadout");
            } else {
                assert!(false, "Upgrade draft offered a non-active skill");
            }

            game.set_run_data(run_data);
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
                        player,
                        event_slot,
                        selected_slot,
                        selected_choice,
                    },
                );
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
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

        fn choice_hash(seed: felt252, event_slot: u8, card_index: u8, reroll_count: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_SKILL');
            let event_slot_felt: felt252 = event_slot.into();
            let card_index_felt: felt252 = card_index.into();
            let reroll_count_felt: felt252 = reroll_count.into();
            let state = state.update(event_slot_felt);
            let state = state.update(card_index_felt);
            let state = state.update(reroll_count_felt);
            state.finalize()
        }

        fn active_skill_count(run_data: @RunData) -> u8 {
            let mut count: u8 = 0;
            let mut slot: u8 = 0;
            loop {
                if slot >= 3 {
                    break;
                }
                if run_data.get_slot_skill(slot) != 0 {
                    count += 1;
                }
                slot += 1;
            };
            count
        }

        fn active_skill_at(run_data: @RunData, index: u8) -> u8 {
            let mut seen: u8 = 0;
            let mut slot: u8 = 0;
            loop {
                if slot >= 3 {
                    break;
                }
                let skill = run_data.get_slot_skill(slot);
                if skill != 0 {
                    if seen == index {
                        return skill;
                    }
                    seen += 1;
                }
                slot += 1;
            };
            assert!(false, "Active skill index out of range");
            0
        }

        fn pool_size(run_data: @RunData) -> u8 {
            if (*run_data.active_slot_count) < 3 {
                Self::inactive_skill_count(run_data)
            } else {
                Self::active_skill_count(run_data)
            }
        }

        fn inactive_skill_count(run_data: @RunData) -> u8 {
            let mut count: u8 = 0;
            let mut skill_id: u8 = 1;
            loop {
                if skill_id > 15 {
                    break;
                }
                if !run_data.has_skill(skill_id) {
                    count += 1;
                }
                skill_id += 1;
            };
            count
        }

        fn inactive_skill_at(run_data: @RunData, index: u8) -> u8 {
            let mut seen: u8 = 0;
            let mut skill_id: u8 = 1;
            loop {
                if skill_id > 15 {
                    break;
                }
                if !run_data.has_skill(skill_id) {
                    if seen == index {
                        return skill_id;
                    }
                    seen += 1;
                }
                skill_id += 1;
            };
            assert!(false, "Inactive skill index out of range");
            0
        }

        fn draw_card_from_pool(
            seed: felt252, event_slot: u8, card_index: u8, reroll_count: u8, run_data: @RunData,
        ) -> u8 {
            let h = Self::choice_hash(seed, event_slot, card_index, reroll_count);
            let h_u256: u256 = h.into();

            if (*run_data.active_slot_count) < 3 {
                let inactive_count = Self::inactive_skill_count(run_data);
                assert!(inactive_count > 0, "No inactive skills available for draft");
                let idx_u256: u256 = h_u256 % inactive_count.into();
                let idx: u8 = idx_u256.try_into().unwrap();
                Self::inactive_skill_at(run_data, idx)
            } else {
                let count = Self::active_skill_count(run_data);
                assert!(count > 0, "No active skills available for draft");
                let idx_u256: u256 = h_u256 % count.into();
                let idx: u8 = idx_u256.try_into().unwrap();
                Self::active_skill_at(run_data, idx)
            }
        }

        fn next_skill_in_pool(current_skill: u8, run_data: @RunData) -> u8 {
            if (*run_data.active_slot_count) < 3 {
                let mut next_skill = if current_skill >= 15 { 1 } else { current_skill + 1 };
                let mut steps: u8 = 0;
                loop {
                    if !run_data.has_skill(next_skill) {
                        return next_skill;
                    }
                    next_skill = if next_skill >= 15 { 1 } else { next_skill + 1 };
                    steps += 1;
                    if steps >= 15 {
                        break;
                    }
                };
                assert!(false, "No inactive skills available for pool iteration");
                0
            } else {
                let count = Self::active_skill_count(run_data);
                assert!(count > 0, "No active skills available for draft");

                let mut idx: u8 = 0;
                loop {
                    if idx >= count {
                        break;
                    }
                    if Self::active_skill_at(run_data, idx) == current_skill {
                        let next_idx = if idx + 1 >= count { 0 } else { idx + 1 };
                        return Self::active_skill_at(run_data, next_idx);
                    }
                    idx += 1;
                };

                Self::active_skill_at(run_data, 0)
            }
        }

        fn draw_three_skills(
            seed: felt252, event_slot: u8, reroll_count: u8, run_data: @RunData,
        ) -> (u8, u8, u8) {
            assert!(Self::pool_size(run_data) >= 3, "Draft pool too small");

            let choice_1 = Self::draw_card_from_pool(seed, event_slot, 0, reroll_count, run_data);

            let mut choice_2 = Self::draw_card_from_pool(seed, event_slot, 1, reroll_count, run_data);
            loop {
                if choice_2 != choice_1 {
                    break;
                }
                choice_2 = Self::next_skill_in_pool(choice_2, run_data);
            };

            let mut choice_3 = Self::draw_card_from_pool(seed, event_slot, 2, reroll_count, run_data);
            loop {
                if choice_3 != choice_1 && choice_3 != choice_2 {
                    break;
                }
                choice_3 = Self::next_skill_in_pool(choice_3, run_data);
            };

            (choice_1, choice_2, choice_3)
        }

        fn reroll_cost(reroll_count: u8) -> u16 {
            let mut cost: u16 = 5;
            let mut i: u8 = 0;
            loop {
                if i >= reroll_count {
                    break;
                }
                cost = cost * 3;
                i += 1;
            };
            cost
        }
    }
}
