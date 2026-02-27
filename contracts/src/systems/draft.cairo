#[starknet::interface]
pub trait IDraftSystem<T> {
    /// Open the initial draft at run start (called from game.create).
    /// Builds pool from all 12 skills, draws 3 choices.
    fn open_initial_draft(ref self: T, game_id: u64, skill_data: felt252);

    /// Open boss draft after clearing boss levels (10, 20, 30, 40).
    /// Pool = all 12 when loadout < 3, upgrades-only when full.
    fn open_boss_upgrade(ref self: T, game_id: u64, completed_level: u8, skill_data: felt252);

    /// Reroll one of the 3 choices. Cost = 5 × 3^n CUBE.
    /// Only allowed when loadout < 3 (mixed pool).
    fn reroll(ref self: T, game_id: u64, reroll_slot: u8);

    /// Select a choice. Adds new skill or upgrades existing one.
    /// Encoding: 1-12 = skill (add/upgrade/branch A), 13-24 = branch B upgrade.
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
        RunData, RunDataHelpersTrait, SkillTreeData, SkillTreeDataPackingTrait,
    };
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::token;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameSeed, GameTrait};
    use zkube::models::skill_tree::{PlayerSkillTree, PlayerSkillTreeTrait};

    const DRAFT_TYPE_INITIAL: u8 = 1;
    const DRAFT_TYPE_BOSS: u8 = 2;
    const TOTAL_SKILLS: u8 = 12;
    const MAX_RUN_LEVEL: u8 = 5;
    const BRANCH_LEVEL: u8 = 3;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl DraftSystemImpl of super::IDraftSystem<ContractState> {
        fn open_initial_draft(ref self: ContractState, game_id: u64, skill_data: felt252) {
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

            // Initial draft: 1 pick only
            if run_data.active_slot_count >= 1 {
                return;
            }

            let tree_data = SkillTreeDataPackingTrait::unpack(skill_data);
            let pool = InternalImpl::build_pool(@run_data, @tree_data);
            let (choice_1, choice_2, choice_3) = InternalImpl::draw_three(
                pool.span(), game_seed.seed, 0,
            );

            draft.active = true;
            draft.draft_type = DRAFT_TYPE_INITIAL;
            draft.picks_made = 0;
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
                        event_type: DRAFT_TYPE_INITIAL,
                        trigger_level: 0,
                        zone: 0,
                        choice_1,
                        choice_2,
                        choice_3,
                    },
                );
        }

        fn open_boss_upgrade(
            ref self: ContractState, game_id: u64, completed_level: u8, skill_data: felt252,
        ) {
            // Only valid after boss levels (L50 = endgame, no draft)
            assert!(
                completed_level == 10
                    || completed_level == 20
                    || completed_level == 30
                    || completed_level == 40,
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

            let tree_data = SkillTreeDataPackingTrait::unpack(skill_data);
            let pool = InternalImpl::build_pool(@run_data, @tree_data);
            let (choice_1, choice_2, choice_3) = InternalImpl::draw_three(
                pool.span(), game_seed.seed, completed_level,
            );

            // If pool was empty
            if choice_1 == 0 && choice_2 == 0 && choice_3 == 0 {
                return;
            }

            draft.active = true;
            draft.draft_type = DRAFT_TYPE_BOSS;
            draft.picks_made = 0;
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
                        event_type: DRAFT_TYPE_BOSS,
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

            // Rerolls disabled when loadout is full (upgrade-only mode)
            assert!(run_data.active_slot_count < 3, "Cannot reroll upgrade-only draft");

            let cost = InternalImpl::reroll_cost(draft.reroll_count);
            let libs = GameLibsImpl::new(world);
            let player = get_caller_address();
            libs.cube.burn(player, cost.into());

            // Rebuild pool for the reroll draw
            let skill_tree: PlayerSkillTree = world.read_model(player);
            let tree_data = SkillTreeDataPackingTrait::unpack(skill_tree.skill_data);
            let pool = InternalImpl::build_pool(@run_data, @tree_data);

            let next_reroll = draft.reroll_count + 1;
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), reroll_slot.into(), next_reroll.into()].span(),
            );
            let reroll_seed = RandomImpl::from_vrf_enabled(game_seed.vrf_enabled, vrf_salt).seed;

            // Get the 2 choices we need to avoid
            let exclude_1 = if reroll_slot == 0 {
                draft.choice_2
            } else {
                draft.choice_1
            };
            let exclude_2 = if reroll_slot == 2 {
                draft.choice_1
            } else {
                draft.choice_3
            };

            let new_choice = InternalImpl::draw_one(
                pool.span(), reroll_seed, exclude_1, exclude_2,
            );

            if reroll_slot == 0 {
                draft.choice_1 = new_choice;
            } else if reroll_slot == 1 {
                draft.choice_2 = new_choice;
            } else {
                draft.choice_3 = new_choice;
            }

            draft.reroll_count = next_reroll;
            draft.spent_cubes = InternalImpl::sat_add_u16(draft.spent_cubes, cost, 65535);
            world.write_model(@draft);

            world
                .emit_event(
                    @DraftRerolled {
                        game_id,
                        player,
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

            let raw_choice: u8 = if selected_slot == 0 {
                draft.choice_1
            } else if selected_slot == 1 {
                draft.choice_2
            } else {
                draft.choice_3
            };
            assert!(raw_choice >= 1, "Invalid choice (empty slot)");

            // Decode: 1-12 = skill (add/upgrade/branch A), 13-24 = branch B
            let (skill_id, is_branch_b) = if raw_choice > TOTAL_SKILLS {
                (raw_choice - TOTAL_SKILLS, true)
            } else {
                (raw_choice, false)
            };
            assert!(skill_id >= 1 && skill_id <= TOTAL_SKILLS, "Invalid skill_id");

            let mut game: Game = world.read_model(game_id);
            let mut run_data = game.get_run_data();

            let existing_slot = run_data.find_skill_slot(skill_id);
            let is_new_skill = existing_slot == 255;

            // Load player skill tree for starting level/branch
            let mut skill_tree: PlayerSkillTree = world.read_model(player);
            if !skill_tree.exists() {
                skill_tree = PlayerSkillTreeTrait::new(player);
            }
            let tree_data = skill_tree.get_skill_tree_data();
            let tree_skill = tree_data.get_skill(skill_id);

            if is_new_skill {
                // Add new skill at tree level + tree branch
                let added_slot = run_data.add_skill(
                    skill_id, tree_skill.level, tree_skill.branch_id,
                );
                assert!(added_slot != 255, "Failed to add skill to run loadout");
            } else {
                // Upgrade existing skill: +1 run level (cap at 5)
                let current_level = run_data.get_slot_level(existing_slot);
                assert!(current_level < MAX_RUN_LEVEL, "Skill already at max run level");

                let new_level = current_level + 1;
                run_data.set_slot_level(existing_slot, new_level);

                // At branch level, set the branch from the encoded choice
                if new_level == BRANCH_LEVEL {
                    if is_branch_b {
                        run_data.set_slot_branch(existing_slot, 1);
                    } else {
                        run_data.set_slot_branch(existing_slot, 0);
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
            draft.selected_choice = raw_choice;
            world.write_model(@draft);

            world
                .emit_event(
                    @DraftSelected {
                        game_id,
                        player,
                        event_slot,
                        selected_slot,
                        selected_choice: raw_choice,
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

        /// Build the draft pool based on loadout state and skill tree.
        /// Returns encoded choices: 1-12 = skill (add/upgrade/branch A), 13-24 = branch B.
        fn build_pool(run_data: @RunData, tree_data: @SkillTreeData) -> Array<u8> {
            let mut pool: Array<u8> = array![];
            let loadout_full = *run_data.active_slot_count >= 3;

            let mut skill_id: u8 = 1;
            loop {
                if skill_id > TOTAL_SKILLS {
                    break;
                }

                let in_loadout = run_data.has_skill(skill_id);

                if !in_loadout {
                    // Not in loadout: "add new" entry (only if loadout not full)
                    if !loadout_full {
                        pool.append(skill_id);
                    }
                } else {
                    // In loadout: upgrade entries
                    let run_level = run_data.get_active_level(skill_id);
                    if run_level < MAX_RUN_LEVEL {
                        let next_level = run_level + 1;
                        if next_level != BRANCH_LEVEL {
                            // Normal upgrade (no branch choice needed)
                            pool.append(skill_id);
                        } else {
                            // Upgrading to branch level — check tree for branch lock
                            let tree_skill = tree_data.get_skill(skill_id);
                            if tree_skill.branch_chosen {
                                // Branch locked in tree: only that branch
                                if tree_skill.branch_id == 0 {
                                    pool.append(skill_id); // Branch A
                                } else {
                                    pool.append(skill_id + TOTAL_SKILLS); // Branch B (13-24)
                                }
                            } else {
                                // No branch locked: both options
                                pool.append(skill_id); // Branch A
                                pool.append(skill_id + TOTAL_SKILLS); // Branch B
                            }
                        }
                    }
                    // else: maxed at MAX_RUN_LEVEL, no entry
                }

                skill_id += 1;
            };

            pool
        }

        /// Draw 3 unique choices from the pool.
        /// Handles pools smaller than 3 by padding with 0.
        fn draw_three(pool: Span<u8>, seed: felt252, salt: u8) -> (u8, u8, u8) {
            let len: u32 = pool.len();
            if len == 0 {
                return (0, 0, 0);
            }
            if len == 1 {
                return (*pool.at(0), 0, 0);
            }
            if len == 2 {
                return (*pool.at(0), *pool.at(1), 0);
            }

            // Draw first
            let h1 = Self::pool_hash(seed, salt, 0);
            let h1_u256: u256 = h1.into();
            let idx1: u32 = (h1_u256 % len.into()).try_into().unwrap();
            let c1 = *pool.at(idx1);

            // Draw second (skip idx1)
            let h2 = Self::pool_hash(seed, salt, 1);
            let h2_u256: u256 = h2.into();
            let raw2: u32 = (h2_u256 % (len - 1).into()).try_into().unwrap();
            let idx2: u32 = if raw2 >= idx1 {
                raw2 + 1
            } else {
                raw2
            };
            let c2 = *pool.at(idx2);

            // Draw third (skip idx1 and idx2)
            let h3 = Self::pool_hash(seed, salt, 2);
            let h3_u256: u256 = h3.into();
            let raw3: u32 = (h3_u256 % (len - 2).into()).try_into().unwrap();
            let (lo, hi) = if idx1 <= idx2 {
                (idx1, idx2)
            } else {
                (idx2, idx1)
            };
            let mut idx3: u32 = raw3;
            if idx3 >= lo {
                idx3 += 1;
            }
            if idx3 >= hi {
                idx3 += 1;
            }
            let c3 = *pool.at(idx3);

            (c1, c2, c3)
        }

        /// Draw one choice from pool, excluding two values.
        fn draw_one(pool: Span<u8>, seed: felt252, exclude_1: u8, exclude_2: u8) -> u8 {
            let h: felt252 = Self::pool_hash(seed, 0, 0);
            let h_u256: u256 = h.into();
            let len: u32 = pool.len();
            let start: u32 = (h_u256 % len.into()).try_into().unwrap();

            let mut offset: u32 = 0;
            loop {
                if offset >= len {
                    break;
                }
                let idx = (start + offset) % len;
                let choice = *pool.at(idx);
                if choice != exclude_1 && choice != exclude_2 {
                    return choice;
                }
                offset += 1;
            };
            // Fallback: all excluded — return first pool entry
            *pool.at(0)
        }

        /// Deterministic hash for pool draws.
        fn pool_hash(seed: felt252, salt: u8, card_index: u8) -> felt252 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_POOL');
            let state = state.update(salt.into());
            let state = state.update(card_index.into());
            state.finalize()
        }
    }
}
