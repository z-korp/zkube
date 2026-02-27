#[starknet::interface]
pub trait IDraftSystem<T> {
    /// Open the initial draft at run start (called from game.create).
    /// Draws 3 skills from pool of 12 — player picks 1.
    fn open_initial_draft(ref self: T, game_id: u64);

    /// Open boss draft after clearing boss levels (10, 20, 30, 40, 50).
    /// If loadout < 3: draw from full pool (add new or upgrade existing).
    /// If loadout >= 3: draw from loadout only (upgrade only).
    fn open_boss_upgrade(ref self: T, game_id: u64, completed_level: u8);

    /// Reroll one of the 3 choices. Cost = 5 × 3^n CUBE.
    fn reroll(ref self: T, game_id: u64, reroll_slot: u8);

    /// Select a choice. Adds new skill or upgrades existing one.
    /// When upgrading level 2 → 3, branch is randomly assigned.
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
    use starknet::get_caller_address;
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{DraftOpened, DraftRerolled, DraftSelected};
    use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
    use zkube::helpers::packing::{
        RunData, RunDataHelpersTrait, SkillTreeDataPackingTrait,
    };
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::token;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameSeed, GameTrait};
    use zkube::models::skill_tree::{PlayerSkillTree, PlayerSkillTreeTrait};

    const DRAFT_TYPE_INITIAL: u8 = 1;
    const DRAFT_TYPE_BOSS_UPGRADE: u8 = 2;
    const TOTAL_SKILLS: u8 = 12;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl DraftSystemImpl of super::IDraftSystem<ContractState> {
        fn open_initial_draft(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let game_seed: GameSeed = world.read_model(game_id);

            let mut draft: DraftState = world.read_model(game_id);
            if draft.game_id != game_id {
                draft = DraftStateTrait::new(game_id, game_seed.seed);
            }

            // Don't open if already active
            if draft.active {
                return;
            }

            let picks_made = run_data.active_slot_count;
            if picks_made >= 1 {
                return; // Initial draft is 1 pick only
            }

            let (choice_1, choice_2, choice_3) = InternalImpl::draw_three_from_pool(
                game_seed.seed, picks_made, 0, @run_data,
            );

            draft.active = true;
            draft.draft_type = DRAFT_TYPE_INITIAL;
            draft.picks_made = picks_made;
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;
            draft.reroll_count = 0;
            draft.spent_cubes = 0;
            draft.selected_slot = 0;
            draft.selected_choice = 0;

            world.write_model(@draft);

            let player = get_caller_address();
            world
                .emit_event(
                    @DraftOpened {
                        game_id,
                        player,
                        event_slot: picks_made,
                        event_type: DRAFT_TYPE_INITIAL,
                        trigger_level: 0,
                        zone: 0,
                        choice_1,
                        choice_2,
                        choice_3,
                    },
                );
        }

        fn open_boss_upgrade(ref self: ContractState, game_id: u64, completed_level: u8) {
            // Only valid after boss levels
            assert!(
                completed_level == 10
                    || completed_level == 20
                    || completed_level == 30
                    || completed_level == 40
                    || completed_level == 50,
                "Not a boss level",
            );

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            let run_data = game.get_run_data();
            let game_seed: GameSeed = world.read_model(game_id);

            let mut draft: DraftState = world.read_model(game_id);
            if draft.game_id != game_id {
                draft = DraftStateTrait::new(game_id, game_seed.seed);
            }

            if draft.active {
                return;
            }

            // Determine choices based on loadout state
            let active_count = run_data.active_slot_count;
            let (choice_1, choice_2, choice_3) = if active_count < 3 {
                // Loadout not full: draw from full unpicked pool (add new or upgrade)
                // Mix existing loadout skills + unpicked skills
                InternalImpl::draw_mixed_pool(game_seed.seed, completed_level, @run_data)
            } else {
                // Loadout full: upgrade only — show existing loadout skills
                InternalImpl::draw_active_skills_for_upgrade(@run_data)
            };

            // If no valid choices, skip
            if choice_1 == 0 && choice_2 == 0 && choice_3 == 0 {
                return;
            }

            draft.active = true;
            draft.draft_type = DRAFT_TYPE_BOSS_UPGRADE;
            draft.picks_made = 0; // Not used for boss upgrade
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;
            draft.reroll_count = 0;
            draft.spent_cubes = 0;
            draft.selected_slot = 0;
            draft.selected_choice = 0;

            world.write_model(@draft);

            let player = get_caller_address();
            world
                .emit_event(
                    @DraftOpened {
                        game_id,
                        player,
                        event_slot: 0,
                        event_type: DRAFT_TYPE_BOSS_UPGRADE,
                        trigger_level: completed_level,
                        zone: 0,
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

            // Only allow reroll on initial draft (boss upgrade shows fixed skills)
            assert!(draft.draft_type == DRAFT_TYPE_INITIAL, "Cannot reroll boss upgrade");

            let cost = InternalImpl::reroll_cost(draft.reroll_count);
            let libs = GameLibsImpl::new(world);
            libs.cube.burn(get_caller_address(), cost.into());

            let next_reroll = draft.reroll_count + 1;
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), reroll_slot.into(), next_reroll.into()].span(),
            );
            let reroll_seed = RandomImpl::from_vrf_enabled(game_seed.vrf_enabled, vrf_salt).seed;

            let mut new_choice = InternalImpl::draw_card_from_pool(
                reroll_seed, draft.picks_made, reroll_slot, next_reroll, @run_data,
            );

            // Ensure no duplicates with other choices
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
                        event_slot: draft.picks_made,
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
            assert!(selected_choice >= 1 && selected_choice <= TOTAL_SKILLS, "Invalid choice");

            let mut game: Game = world.read_model(game_id);
            let mut run_data = game.get_run_data();

            // Unified select logic: both initial and boss drafts
            // Determine if skill is already in loadout
            let existing_slot = run_data.find_skill_slot(selected_choice);
            let is_new_skill = existing_slot == 255;

            // Load player skill tree for level/branch data
            let mut skill_tree: PlayerSkillTree = world.read_model(player);
            if !skill_tree.exists() {
                skill_tree = PlayerSkillTreeTrait::new(player);
            }
            let skill_data = skill_tree.get_skill_tree_data();
            let tree_skill = skill_data.get_skill(selected_choice);

            if is_new_skill {
                // Add new skill to loadout at tree level, tree branch
                let added_slot = run_data.add_skill(
                    selected_choice, tree_skill.level, tree_skill.branch_id,
                );
                assert!(added_slot != 255, "Failed to add skill to run loadout");
            } else {
                // Upgrade existing skill: +1 level (capped at tree max)
                let current_level = run_data.get_slot_level(existing_slot);
                let max_level = tree_skill.level;

                if current_level < max_level {
                    let new_level = current_level + 1;
                    run_data.set_slot_level(existing_slot, new_level);

                    // When upgrading to level 3 (branch level), randomly assign branch
                    if new_level == 3 {
                        let game_seed: GameSeed = world.read_model(game_id);
                        let branch_hash = InternalImpl::branch_hash(
                            game_seed.seed, selected_choice,
                        );
                        let branch_u256: u256 = branch_hash.into();
                        let random_branch: u8 = (branch_u256 % 2).try_into().unwrap();
                        run_data.set_slot_branch(existing_slot, random_branch);
                    }
                }
            }

            game.set_run_data(run_data);
            world.write_model(@game);

            // Close draft (always 1 pick per draft event)
            let event_slot = draft.picks_made;
            draft.picks_made = draft.picks_made + 1;
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
        fn sat_add_u16(value: u16, delta: u16, max: u16) -> u16 {
            let sum: u32 = value.into() + delta.into();
            if sum > max.into() {
                max
            } else {
                sum.try_into().unwrap()
            }
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

        /// Hash function for deterministic card draws.
        fn choice_hash(
            seed: felt252, picks_made: u8, card_index: u8, reroll_count: u8,
        ) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_SKILL');
            let state = state.update(picks_made.into());
            let state = state.update(card_index.into());
            let state = state.update(reroll_count.into());
            state.finalize()
        }

        /// Count skills in the pool (all 12 skills minus already-picked ones).
        fn pool_size(run_data: @RunData) -> u8 {
            let mut count: u8 = 0;
            let mut skill_id: u8 = 1;
            loop {
                if skill_id > TOTAL_SKILLS {
                    break;
                }
                if !run_data.has_skill(skill_id) {
                    count += 1;
                }
                skill_id += 1;
            };
            count
        }

        /// Get the Nth unpicked skill from the pool (0-indexed).
        fn unpicked_skill_at(run_data: @RunData, index: u8) -> u8 {
            let mut seen: u8 = 0;
            let mut skill_id: u8 = 1;
            loop {
                if skill_id > TOTAL_SKILLS {
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
            assert!(false, "Unpicked skill index out of range");
            0
        }

        /// Draw a single card from the unpicked pool.
        fn draw_card_from_pool(
            seed: felt252, picks_made: u8, card_index: u8, reroll_count: u8, run_data: @RunData,
        ) -> u8 {
            let h = Self::choice_hash(seed, picks_made, card_index, reroll_count);
            let h_u256: u256 = h.into();
            let pool = Self::pool_size(run_data);
            assert!(pool > 0, "No skills available for draft");
            let idx_u256: u256 = h_u256 % pool.into();
            let idx: u8 = idx_u256.try_into().unwrap();
            Self::unpicked_skill_at(run_data, idx)
        }

        /// Get the next unpicked skill after current_skill (wrapping).
        fn next_skill_in_pool(current_skill: u8, run_data: @RunData) -> u8 {
            let mut next_skill = if current_skill >= TOTAL_SKILLS {
                1
            } else {
                current_skill + 1
            };
            let mut steps: u8 = 0;
            loop {
                if !run_data.has_skill(next_skill) {
                    return next_skill;
                }
                next_skill =
                    if next_skill >= TOTAL_SKILLS {
                        1
                    } else {
                        next_skill + 1
                    };
                steps += 1;
                if steps >= TOTAL_SKILLS {
                    break;
                }
            };
            assert!(false, "No skills available in pool");
            0
        }

        /// Draw 3 unique skills from the unpicked pool.
        fn draw_three_from_pool(
            seed: felt252, picks_made: u8, reroll_count: u8, run_data: @RunData,
        ) -> (u8, u8, u8) {
            let pool = Self::pool_size(run_data);
            assert!(pool >= 3, "Draft pool too small (need 3 choices)");

            let choice_1 = Self::draw_card_from_pool(seed, picks_made, 0, reroll_count, run_data);

            let mut choice_2 = Self::draw_card_from_pool(
                seed, picks_made, 1, reroll_count, run_data,
            );
            loop {
                if choice_2 != choice_1 {
                    break;
                }
                choice_2 = Self::next_skill_in_pool(choice_2, run_data);
            };

            let mut choice_3 = Self::draw_card_from_pool(
                seed, picks_made, 2, reroll_count, run_data,
            );
            loop {
                if choice_3 != choice_1 && choice_3 != choice_2 {
                    break;
                }
                choice_3 = Self::next_skill_in_pool(choice_3, run_data);
            };

            (choice_1, choice_2, choice_3)
        }

        /// For loadout-full boss upgrade: show all skills currently in loadout.
        /// Returns up to 3 choices (padded with 0 if fewer skills in loadout).
        fn draw_active_skills_for_upgrade(run_data: @RunData) -> (u8, u8, u8) {
            let c1 = run_data.get_slot_skill(0);
            let c2 = run_data.get_slot_skill(1);
            let c3 = run_data.get_slot_skill(2);
            (c1, c2, c3)
        }

        /// For boss draft when loadout < 3: draw 3 unique choices from the
        /// combined pool of existing loadout skills + unpicked skills.
        /// This allows player to either add a new skill or upgrade an existing one.
        fn draw_mixed_pool(
            seed: felt252, completed_level: u8, run_data: @RunData,
        ) -> (u8, u8, u8) {
            // Build candidate pool: all 12 skills (existing ones = upgrade, new ones = add)
            // For simplicity, draw from all 12 and let select() handle the logic.
            // We use a hash based on seed + completed_level for determinism.
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('BOSS_DRAFT');
            let state = state.update(completed_level.into());
            let h1 = state.finalize();

            let h1_u256: u256 = h1.into();
            let choice_1: u8 = (h1_u256 % TOTAL_SKILLS.into()).try_into().unwrap() + 1;

            let state2: HashState = PoseidonTrait::new();
            let state2 = state2.update(h1);
            let state2 = state2.update('BOSS_DRAFT_2');
            let h2 = state2.finalize();
            let h2_u256: u256 = h2.into();
            let mut choice_2: u8 = (h2_u256 % TOTAL_SKILLS.into()).try_into().unwrap() + 1;
            // Ensure uniqueness
            let mut steps: u8 = 0;
            loop {
                if choice_2 != choice_1 || steps >= TOTAL_SKILLS {
                    break;
                }
                choice_2 = if choice_2 >= TOTAL_SKILLS { 1 } else { choice_2 + 1 };
                steps += 1;
            };

            let state3: HashState = PoseidonTrait::new();
            let state3 = state3.update(h2);
            let state3 = state3.update('BOSS_DRAFT_3');
            let h3 = state3.finalize();
            let h3_u256: u256 = h3.into();
            let mut choice_3: u8 = (h3_u256 % TOTAL_SKILLS.into()).try_into().unwrap() + 1;
            steps = 0;
            loop {
                if (choice_3 != choice_1 && choice_3 != choice_2) || steps >= TOTAL_SKILLS {
                    break;
                }
                choice_3 = if choice_3 >= TOTAL_SKILLS { 1 } else { choice_3 + 1 };
                steps += 1;
            };

            (choice_1, choice_2, choice_3)
        }

        /// Hash for deterministic branch assignment when upgrading to level 3.
        fn branch_hash(seed: felt252, skill_id: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('BRANCH_RANDOM');
            let state = state.update(skill_id.into());
            state.finalize()
        }
    }
}
