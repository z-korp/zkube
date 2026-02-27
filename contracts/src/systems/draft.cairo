#[starknet::interface]
pub trait IDraftSystem<T> {
    fn open_initial_draft(ref self: T, game_id: u64);
    fn open_boss_upgrade(ref self: T, game_id: u64, completed_level: u8);
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
    use starknet::get_caller_address;
    use zkube::constants::DEFAULT_NS;
    use zkube::events::{DraftOpened, DraftRerolled, DraftSelected};
    use zkube::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};
    use zkube::helpers::packing::{RunData, RunDataHelpersTrait, SkillTreeDataPackingTrait};
    use zkube::helpers::random::RandomImpl;
    use zkube::helpers::token;
    use zkube::models::draft::{DraftState, DraftStateTrait};
    use zkube::models::game::{Game, GameSeed, GameTrait};
    use zkube::models::skill_tree::{PlayerSkillTree, PlayerSkillTreeTrait};

    const PHASE_INITIAL_DRAFT: u8 = 0;
    const PHASE_BOSS_UPGRADE: u8 = 1;
    const MAX_SKILL_ID: u8 = 12;
    const ACTIVE_SKILL_MAX_ID: u8 = 4;
    const MAX_BOSS_RUN_LEVEL: u8 = 15;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl DraftSystemImpl of super::IDraftSystem<ContractState> {
        fn open_initial_draft(ref self: ContractState, game_id: u64) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let game: Game = world.read_model(game_id);
            assert!(game.game_id == game_id, "Game not found");
            assert!(!game.over, "Game is over");

            let run_data = game.get_run_data();
            let game_seed: GameSeed = world.read_model(game_id);

            let mut draft: DraftState = world.read_model(game_id);
            if draft.game_id != game_id {
                draft = DraftStateTrait::new(game_id, game_seed.seed);
            }

            assert!(!draft.active, "Draft already active");
            assert!(draft.picks_made == 0, "Initial draft already completed");

            let pool = InternalImpl::build_initial_pool(@run_data);
            assert!(pool.len() >= 3, "Insufficient draft pool");

            let (choice_1, choice_2, choice_3) = InternalImpl::draw_three_initial(
                pool.span(), draft.seed, draft.picks_made, 0,
            );

            draft.active = true;
            draft.phase = PHASE_INITIAL_DRAFT;
            draft.reroll_count = 0;
            draft.spent_cubes = 0;
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;

            world.write_model(@draft);

            let player = get_caller_address();
            world
                .emit_event(
                    @DraftOpened {
                        game_id,
                        player,
                        event_slot: draft.picks_made,
                        event_type: PHASE_INITIAL_DRAFT,
                        trigger_level: 0,
                        zone: 0,
                        choice_1,
                        choice_2,
                        choice_3,
                    },
                );
        }

        fn open_boss_upgrade(ref self: ContractState, game_id: u64, completed_level: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            let game: Game = world.read_model(game_id);
            assert!(game.game_id == game_id, "Game not found");
            assert!(!game.over, "Game is over");

            let run_data = game.get_run_data();
            let game_seed: GameSeed = world.read_model(game_id);

            let mut draft: DraftState = world.read_model(game_id);
            if draft.game_id != game_id {
                draft = DraftStateTrait::new(game_id, game_seed.seed);
            }

            if draft.active {
                return;
            }

            let active_pool = InternalImpl::build_boss_pool(@run_data);
            let pool_len = active_pool.len();
            if pool_len == 0 {
                return;
            }

            let mut choice_1: u8 = 0;
            let mut choice_2: u8 = 0;
            let mut choice_3: u8 = 0;

            if pool_len >= 1 {
                choice_1 = *active_pool.at(0);
            }
            if pool_len >= 2 {
                choice_2 = *active_pool.at(1);
            }
            if pool_len >= 3 {
                choice_3 = *active_pool.at(2);
            }

            draft.active = true;
            draft.phase = PHASE_BOSS_UPGRADE;
            draft.choice_1 = choice_1;
            draft.choice_2 = choice_2;
            draft.choice_3 = choice_3;
            draft.reroll_count = 0;
            draft.spent_cubes = 0;

            world.write_model(@draft);

            let player = get_caller_address();
            world
                .emit_event(
                    @DraftOpened {
                        game_id,
                        player,
                        event_slot: draft.picks_made,
                        event_type: PHASE_BOSS_UPGRADE,
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
            assert!(game.game_id == game_id, "Game not found");
            let run_data = game.get_run_data();

            let game_seed: GameSeed = world.read_model(game_id);
            let mut draft: DraftState = world.read_model(game_id);
            assert!(draft.game_id == game_id, "Draft state missing");
            assert!(draft.active, "No active draft");
            assert!(draft.phase == PHASE_INITIAL_DRAFT, "Reroll only available in initial draft");
            assert!(reroll_slot < 3, "Invalid reroll slot");

            let reroll_cost = InternalImpl::reroll_cost(draft.reroll_count);
            let libs = GameLibsImpl::new(world);
            let player = get_caller_address();
            libs.cube.burn(player, reroll_cost.into());

            let next_reroll_count = draft.reroll_count + 1;
            let vrf_salt = core::poseidon::poseidon_hash_span(
                array![game_id.into(), reroll_slot.into(), next_reroll_count.into()].span(),
            );
            let reroll_seed = RandomImpl::from_vrf_enabled(game_seed.vrf_enabled, vrf_salt).seed;

            let pool = InternalImpl::build_initial_pool(@run_data);
            let mut exclude_1: u8 = 0;
            let mut exclude_2: u8 = 0;

            if reroll_slot == 0 {
                exclude_1 = draft.choice_2;
                exclude_2 = draft.choice_3;
            } else if reroll_slot == 1 {
                exclude_1 = draft.choice_1;
                exclude_2 = draft.choice_3;
            } else {
                exclude_1 = draft.choice_1;
                exclude_2 = draft.choice_2;
            }

            let new_choice = InternalImpl::draw_one_no_duplicates(
                pool.span(), reroll_seed, draft.picks_made, next_reroll_count, reroll_slot, exclude_1,
                exclude_2,
            );

            if reroll_slot == 0 {
                draft.choice_1 = new_choice;
            } else if reroll_slot == 1 {
                draft.choice_2 = new_choice;
            } else {
                draft.choice_3 = new_choice;
            }

            draft.reroll_count = next_reroll_count;
            draft.spent_cubes = InternalImpl::sat_add_u16(draft.spent_cubes, reroll_cost, 65535);
            world.write_model(@draft);

            world
                .emit_event(
                    @DraftRerolled {
                        game_id,
                        player,
                        event_slot: draft.picks_made,
                        reroll_slot,
                        reroll_cost,
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

            let selected_choice = InternalImpl::choice_by_slot(@draft, selected_slot);
            assert!(selected_choice >= 1, "Invalid choice slot");

            let mut game: Game = world.read_model(game_id);
            assert!(game.game_id == game_id, "Game not found");
            let mut run_data = game.get_run_data();

            let event_slot = draft.picks_made;

            if draft.phase == PHASE_INITIAL_DRAFT {
                let mut skill_tree: PlayerSkillTree = world.read_model(player);
                if !skill_tree.exists() {
                    skill_tree = PlayerSkillTreeTrait::new(player);
                }

                let skill_data = skill_tree.get_skill_tree_data();
                let tree_skill = skill_data.get_skill(selected_choice);
                let skill_slot = run_data.add_skill(selected_choice, tree_skill.level, tree_skill.branch_id);
                assert!(skill_slot != 255, "Failed to add skill to run loadout");

                if draft.picks_made < 2 {
                    draft.picks_made += 1;
                    draft.reroll_count = 0;

                    let pool = InternalImpl::build_initial_pool(@run_data);
                    assert!(pool.len() >= 3, "Insufficient draft pool");

                    let (choice_1, choice_2, choice_3) = InternalImpl::draw_three_initial(
                        pool.span(), draft.seed, draft.picks_made, draft.reroll_count,
                    );
                    draft.choice_1 = choice_1;
                    draft.choice_2 = choice_2;
                    draft.choice_3 = choice_3;
                } else {
                    draft.active = false;
                    draft.picks_made = 3;
                    draft.choice_1 = 0;
                    draft.choice_2 = 0;
                    draft.choice_3 = 0;
                    run_data.award_all_active_charges(1);
                }
            } else {
                assert!(draft.phase == PHASE_BOSS_UPGRADE, "Invalid draft phase");

                let skill_slot = run_data.find_skill_slot(selected_choice);
                assert!(skill_slot != 255, "Selected skill not in loadout");

                let current_level = run_data.get_slot_level(skill_slot);
                let next_level = if current_level >= MAX_BOSS_RUN_LEVEL {
                    MAX_BOSS_RUN_LEVEL
                } else {
                    current_level + 1
                };
                run_data.set_slot_level(skill_slot, next_level);

                draft.active = false;
                draft.choice_1 = 0;
                draft.choice_2 = 0;
                draft.choice_3 = 0;
            }

            game.set_run_data(run_data);
            world.write_model(@game);
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

        fn choice_by_slot(draft: @DraftState, selected_slot: u8) -> u8 {
            if selected_slot == 0 {
                *draft.choice_1
            } else if selected_slot == 1 {
                *draft.choice_2
            } else {
                *draft.choice_3
            }
        }

        fn build_initial_pool(run_data: @RunData) -> Array<u8> {
            let mut pool: Array<u8> = array![];
            let mut skill_id: u8 = 1;
            loop {
                if skill_id > MAX_SKILL_ID {
                    break;
                }
                if !run_data.has_skill(skill_id) {
                    pool.append(skill_id);
                }
                skill_id += 1;
            };
            pool
        }

        fn build_boss_pool(run_data: @RunData) -> Array<u8> {
            let mut pool: Array<u8> = array![];
            let mut slot: u8 = 0;
            loop {
                if slot >= 3 || slot >= *run_data.active_slot_count {
                    break;
                }

                let skill_id = run_data.get_slot_skill(slot);
                if skill_id >= 1 && skill_id <= ACTIVE_SKILL_MAX_ID {
                    pool.append(skill_id);
                }
                slot += 1;
            };
            pool
        }

        fn draw_three_initial(
            pool: Span<u8>, seed: felt252, picks_made: u8, reroll_count: u8,
        ) -> (u8, u8, u8) {
            let len: u32 = pool.len();
            if len == 0 {
                return (0, 0, 0);
            }

            let idx_1 = Self::draft_index(seed, picks_made, 0, reroll_count, len);
            let choice_1 = *pool.at(idx_1);

            let idx_2_raw = Self::draft_index(seed, picks_made, 1, reroll_count, len);
            let choice_2 = Self::next_skill_in_pool(pool, idx_2_raw, choice_1, 0);

            let idx_3_raw = Self::draft_index(seed, picks_made, 2, reroll_count, len);
            let choice_3 = Self::next_skill_in_pool(pool, idx_3_raw, choice_1, choice_2);

            (choice_1, choice_2, choice_3)
        }

        fn draw_one_no_duplicates(
            pool: Span<u8>, seed: felt252, picks_made: u8, reroll_count: u8, card_index: u8,
            exclude_1: u8, exclude_2: u8,
        ) -> u8 {
            let len: u32 = pool.len();
            assert!(len > 0, "Empty draft pool");
            let start = Self::draft_index(seed, picks_made, card_index, reroll_count, len);
            Self::next_skill_in_pool(pool, start, exclude_1, exclude_2)
        }

        fn next_skill_in_pool(pool: Span<u8>, start: u32, exclude_1: u8, exclude_2: u8) -> u8 {
            let len = pool.len();
            let mut offset: u32 = 0;
            loop {
                if offset >= len {
                    break;
                }
                let idx = (start + offset) % len;
                let skill_id = *pool.at(idx);
                if skill_id != exclude_1 && skill_id != exclude_2 {
                    return skill_id;
                }
                offset += 1;
            };
            *pool.at(start)
        }

        fn draft_index(
            seed: felt252, picks_made: u8, card_index: u8, reroll_count: u8, len: u32,
        ) -> u32 {
            let state: HashState = PoseidonTrait::new();
            let state = state.update(seed);
            let state = state.update('DRAFT_SKILL');
            let state = state.update(picks_made.into());
            let state = state.update(card_index.into());
            let state = state.update(reroll_count.into());
            let hash = state.finalize();
            let hash_u256: u256 = hash.into();
            (hash_u256 % len.into()).try_into().unwrap()
        }
    }
}

#[cfg(test)]
mod draft_tests {
    use core::hash::HashStateTrait;
    use core::poseidon::{HashState, PoseidonTrait};
    use zkube::helpers::packing::{RunData, RunDataPackingTrait, RunDataHelpersTrait};

    // Re-implement the pure internal functions here for testing since
    // InternalImpl is inside the dojo::contract module and not accessible.

    const MAX_SKILL_ID: u8 = 12;
    const ACTIVE_SKILL_MAX_ID: u8 = 4;

    fn build_initial_pool(run_data: @RunData) -> Array<u8> {
        let mut pool: Array<u8> = array![];
        let mut skill_id: u8 = 1;
        loop {
            if skill_id > MAX_SKILL_ID {
                break;
            }
            if !run_data.has_skill(skill_id) {
                pool.append(skill_id);
            }
            skill_id += 1;
        };
        pool
    }

    fn build_boss_pool(run_data: @RunData) -> Array<u8> {
        let mut pool: Array<u8> = array![];
        let mut slot: u8 = 0;
        loop {
            if slot >= 3 || slot >= *run_data.active_slot_count {
                break;
            }
            let skill_id = run_data.get_slot_skill(slot);
            if skill_id >= 1 && skill_id <= ACTIVE_SKILL_MAX_ID {
                pool.append(skill_id);
            }
            slot += 1;
        };
        pool
    }

    fn next_skill_in_pool(pool: Span<u8>, start: u32, exclude_1: u8, exclude_2: u8) -> u8 {
        let len = pool.len();
        let mut offset: u32 = 0;
        loop {
            if offset >= len {
                break;
            }
            let idx = (start + offset) % len;
            let skill_id = *pool.at(idx);
            if skill_id != exclude_1 && skill_id != exclude_2 {
                return skill_id;
            }
            offset += 1;
        };
        *pool.at(start)
    }

    fn draft_index(
        seed: felt252, picks_made: u8, card_index: u8, reroll_count: u8, len: u32,
    ) -> u32 {
        let state: HashState = PoseidonTrait::new();
        let state = state.update(seed);
        let state = state.update('DRAFT_SKILL');
        let state = state.update(picks_made.into());
        let state = state.update(card_index.into());
        let state = state.update(reroll_count.into());
        let hash = state.finalize();
        let hash_u256: u256 = hash.into();
        (hash_u256 % len.into()).try_into().unwrap()
    }

    fn draw_three(
        pool: Span<u8>, seed: felt252, picks_made: u8, reroll_count: u8,
    ) -> (u8, u8, u8) {
        let len: u32 = pool.len();
        if len == 0 {
            return (0, 0, 0);
        }
        let idx_1 = draft_index(seed, picks_made, 0, reroll_count, len);
        let choice_1 = *pool.at(idx_1);
        let idx_2_raw = draft_index(seed, picks_made, 1, reroll_count, len);
        let choice_2 = next_skill_in_pool(pool, idx_2_raw, choice_1, 0);
        let idx_3_raw = draft_index(seed, picks_made, 2, reroll_count, len);
        let choice_3 = next_skill_in_pool(pool, idx_3_raw, choice_1, choice_2);
        (choice_1, choice_2, choice_3)
    }

    fn draw_one(
        pool: Span<u8>, seed: felt252, picks_made: u8, reroll_count: u8, card_index: u8,
        exclude_1: u8, exclude_2: u8,
    ) -> u8 {
        let len: u32 = pool.len();
        assert!(len > 0, "Empty draft pool");
        let start = draft_index(seed, picks_made, card_index, reroll_count, len);
        next_skill_in_pool(pool, start, exclude_1, exclude_2)
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

    // ========================================================================
    //  Tests
    // ========================================================================

    #[test]
    fn test_build_initial_pool_empty_loadout() {
        // Empty loadout should give all 12 skills
        let run_data = RunDataPackingTrait::new();
        let pool = build_initial_pool(@run_data);
        assert!(pool.len() == 12, "Empty loadout should yield pool of 12");
        // Verify all skills 1-12 are present
        let mut i: u32 = 0;
        loop {
            if i >= 12 {
                break;
            }
            assert!(*pool.at(i) == (i + 1).try_into().unwrap(), "Pool should contain sequential skill IDs");
            i += 1;
        };
    }

    #[test]
    fn test_build_initial_pool_with_one_skill() {
        // Loadout with skill 3 should exclude it from pool
        let mut run_data = RunDataPackingTrait::new();
        run_data.add_skill(3, 1, 0); // Add Harvest at level 1, branch A
        let pool = build_initial_pool(@run_data);
        assert!(pool.len() == 11, "Pool should have 11 entries (12 - 1 in loadout)");
        // Verify skill 3 is not in pool
        let mut i: u32 = 0;
        loop {
            if i >= pool.len() {
                break;
            }
            assert!(*pool.at(i) != 3, "Skill 3 should not be in pool");
            i += 1;
        };
    }

    #[test]
    fn test_build_initial_pool_full_loadout() {
        // Full 3-slot loadout should exclude all 3
        let mut run_data = RunDataPackingTrait::new();
        run_data.add_skill(1, 1, 0); // ComboSurge
        run_data.add_skill(5, 1, 0); // Rhythm
        run_data.add_skill(9, 1, 0); // High Stakes
        let pool = build_initial_pool(@run_data);
        assert!(pool.len() == 9, "Pool should have 9 entries (12 - 3 in loadout)");
        // Verify none of 1, 5, 9 are in pool
        let mut i: u32 = 0;
        loop {
            if i >= pool.len() {
                break;
            }
            let s = *pool.at(i);
            assert!(s != 1 && s != 5 && s != 9, "Loadout skills should not be in pool");
            i += 1;
        };
    }

    #[test]
    fn test_build_boss_pool_active_skills_only() {
        // Boss pool should only contain active skills (1-4) from loadout
        let mut run_data = RunDataPackingTrait::new();
        run_data.add_skill(1, 2, 0); // ComboSurge (active)
        run_data.add_skill(5, 3, 0); // Rhythm (passive - should be excluded)
        run_data.add_skill(3, 1, 0); // Harvest (active)
        let pool = build_boss_pool(@run_data);
        assert!(pool.len() == 2, "Boss pool should have 2 active skills");
        assert!(*pool.at(0) == 1, "First boss pool entry should be ComboSurge (1)");
        assert!(*pool.at(1) == 3, "Second boss pool entry should be Harvest (3)");
    }

    #[test]
    fn test_build_boss_pool_no_active_skills() {
        // All passive skills — boss pool should be empty
        let mut run_data = RunDataPackingTrait::new();
        run_data.add_skill(5, 2, 0); // Rhythm (passive)
        run_data.add_skill(6, 1, 0); // Cascade Mastery (passive)
        run_data.add_skill(11, 1, 0); // Structural Integrity (passive)
        let pool = build_boss_pool(@run_data);
        assert!(pool.len() == 0, "Boss pool with all passives should be empty");
    }

    #[test]
    fn test_build_boss_pool_empty_loadout() {
        let run_data = RunDataPackingTrait::new();
        let pool = build_boss_pool(@run_data);
        assert!(pool.len() == 0, "Boss pool with empty loadout should be empty");
    }

    #[test]
    fn test_draw_three_uniqueness() {
        // Draw 3 from a pool of 12 — all should be unique
        let pool: Array<u8> = array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        let seed: felt252 = 'test_seed_1';
        let (c1, c2, c3) = draw_three(pool.span(), seed, 0, 0);
        assert!(c1 != c2, "Choice 1 and 2 must differ");
        assert!(c1 != c3, "Choice 1 and 3 must differ");
        assert!(c2 != c3, "Choice 2 and 3 must differ");
        // All should be in valid range
        assert!(c1 >= 1 && c1 <= 12, "Choice 1 out of range");
        assert!(c2 >= 1 && c2 <= 12, "Choice 2 out of range");
        assert!(c3 >= 1 && c3 <= 12, "Choice 3 out of range");
    }

    #[test]
    fn test_draw_three_different_seeds() {
        // Different seeds should produce different draws
        let pool: Array<u8> = array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        let (a1, a2, a3) = draw_three(pool.span(), 'seed_alpha', 0, 0);
        let (b1, b2, b3) = draw_three(pool.span(), 'seed_beta', 0, 0);
        // With different seeds, at least one choice should differ
        assert!(a1 != b1 || a2 != b2 || a3 != b3, "Different seeds should produce different draws");
    }

    #[test]
    fn test_draw_three_small_pool() {
        // Pool of exactly 3 — all 3 should be drawn (no duplicates possible)
        let pool: Array<u8> = array![7, 3, 11];
        let seed: felt252 = 'small_pool_test';
        let (c1, c2, c3) = draw_three(pool.span(), seed, 0, 0);
        // All 3 must be unique
        assert!(c1 != c2 && c1 != c3 && c2 != c3, "All 3 from small pool must be unique");
        // All must be from the pool
        let valid = (c1 == 7 || c1 == 3 || c1 == 11)
            && (c2 == 7 || c2 == 3 || c2 == 11)
            && (c3 == 7 || c3 == 3 || c3 == 11);
        assert!(valid, "All choices must come from the pool");
    }

    #[test]
    fn test_draw_one_excludes_correctly() {
        let pool: Array<u8> = array![1, 2, 3, 4, 5];
        let seed: felt252 = 'reroll_test';
        let result = draw_one(pool.span(), seed, 0, 1, 0, 2, 4);
        // Result should not be 2 or 4
        assert!(result != 2, "Should exclude 2");
        assert!(result != 4, "Should exclude 4");
        assert!(result >= 1 && result <= 5, "Result should be in pool");
    }

    #[test]
    fn test_draw_one_with_no_exclusions() {
        let pool: Array<u8> = array![7, 8, 9];
        let seed: felt252 = 'no_excl';
        let result = draw_one(pool.span(), seed, 0, 0, 0, 0, 0);
        assert!(result == 7 || result == 8 || result == 9, "Result should be from pool");
    }

    #[test]
    fn test_next_skill_wraps_around() {
        // When starting near end of pool and all but one are excluded
        let pool: Array<u8> = array![1, 2, 3];
        // Start at index 2 (skill 3), exclude 3 and 2 — should wrap to 1
        let result = next_skill_in_pool(pool.span(), 2, 3, 2);
        assert!(result == 1, "Should wrap around to skill 1");
    }

    #[test]
    fn test_next_skill_no_exclusions() {
        let pool: Array<u8> = array![5, 6, 7, 8];
        let result = next_skill_in_pool(pool.span(), 1, 0, 0);
        assert!(result == 6, "Should return skill at start index");
    }

    #[test]
    fn test_reroll_cost_sequence() {
        assert!(reroll_cost(0) == 5, "First reroll should cost 5");
        assert!(reroll_cost(1) == 15, "Second reroll should cost 15");
        assert!(reroll_cost(2) == 45, "Third reroll should cost 45");
        assert!(reroll_cost(3) == 135, "Fourth reroll should cost 135");
        assert!(reroll_cost(4) == 405, "Fifth reroll should cost 405");
        assert!(reroll_cost(5) == 1215, "Sixth reroll should cost 1215");
    }

    #[test]
    fn test_draft_index_deterministic() {
        // Same inputs should produce same output
        let idx1 = draft_index('seed', 0, 0, 0, 10);
        let idx2 = draft_index('seed', 0, 0, 0, 10);
        assert!(idx1 == idx2, "draft_index should be deterministic");
        // Different card_index should produce different result
        let idx3 = draft_index('seed', 0, 1, 0, 10);
        assert!(idx1 != idx3, "Different card_index should give different index");
    }

    #[test]
    fn test_draft_index_in_range() {
        // Result should always be < len
        let idx = draft_index('any_seed', 2, 1, 3, 7);
        assert!(idx < 7, "Index should be less than pool length");
    }

    #[test]
    fn test_full_initial_draft_flow() {
        // Simulate full 3-pick initial draft
        let mut run_data = RunDataPackingTrait::new();
        let seed: felt252 = 'full_draft_flow';

        // Pick 1: pool has all 12 skills
        let pool1 = build_initial_pool(@run_data);
        assert!(pool1.len() == 12, "Initial pool should have 12");
        let (c1, c2, c3) = draw_three(pool1.span(), seed, 0, 0);
        assert!(c1 != c2 && c1 != c3 && c2 != c3, "Picks 1 all unique");
        // Select choice 1
        run_data.add_skill(c1, 1, 0);

        // Pick 2: pool has 11 skills
        let pool2 = build_initial_pool(@run_data);
        assert!(pool2.len() == 11, "Pool after 1 pick should have 11");
        let (d1, d2, d3) = draw_three(pool2.span(), seed, 1, 0);
        assert!(d1 != d2 && d1 != d3 && d2 != d3, "Picks 2 all unique");
        assert!(d1 != c1 && d2 != c1 && d3 != c1, "Already-picked skill excluded from pool");
        // Select choice 2
        run_data.add_skill(d1, 1, 0);

        // Pick 3: pool has 10 skills
        let pool3 = build_initial_pool(@run_data);
        assert!(pool3.len() == 10, "Pool after 2 picks should have 10");
        let (e1, e2, e3) = draw_three(pool3.span(), seed, 2, 0);
        assert!(e1 != e2 && e1 != e3 && e2 != e3, "Picks 3 all unique");
        // Select choice 3 — loadout now full
        run_data.add_skill(e1, 1, 0);
        assert!(run_data.active_slot_count == 3, "Loadout should be full");
    }

    #[test]
    fn test_boss_upgrade_flow() {
        // Create a loadout with 2 actives + 1 passive
        let mut run_data = RunDataPackingTrait::new();
        run_data.add_skill(1, 3, 0); // ComboSurge L3
        run_data.add_skill(4, 2, 0); // Tsunami L2
        run_data.add_skill(8, 1, 0); // Endgame Focus L1 (passive)

        let pool = build_boss_pool(@run_data);
        assert!(pool.len() == 2, "Boss pool should only have the 2 active skills");
        assert!(*pool.at(0) == 1, "First entry should be ComboSurge");
        assert!(*pool.at(1) == 4, "Second entry should be Tsunami");
    }

    #[test]
    fn test_draw_three_picks_from_different_positions() {
        // Use multiple seeds to verify the index spread
        let pool: Array<u8> = array![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        let (a1, _, _) = draw_three(pool.span(), 0, 0, 0);
        let (b1, _, _) = draw_three(pool.span(), 1, 0, 0);
        let (c1, _, _) = draw_three(pool.span(), 2, 0, 0);
        let (d1, _, _) = draw_three(pool.span(), 3, 0, 0);
        let (e1, _, _) = draw_three(pool.span(), 4, 0, 0);
        // With 5 different seeds on a pool of 12, not all first picks should be identical
        let all_same = a1 == b1 && b1 == c1 && c1 == d1 && d1 == e1;
        assert!(!all_same, "Multiple seeds should produce variety in picks");
    }
}
