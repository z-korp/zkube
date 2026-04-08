use starknet::ContractAddress;

#[starknet::interface]
pub trait IProgressSystem<T> {
    /// Gated progress emitter for quest + achievement tasks.
    /// Only callable by whitelisted systems (move, level, story, game).
    /// Silently skips non-star-eligible settings.
    fn emit_progress(
        ref self: T, player: ContractAddress, task_id: felt252, count: u128, settings_id: u32,
    );

    /// Batch version of emit_progress — one cross-contract call for multiple tasks.
    /// Each element in `tasks` is a (task_id, count) pair.
    fn emit_progress_bulk(
        ref self: T, player: ContractAddress, tasks: Span<(felt252, u128)>, settings_id: u32,
    );

    /// Ungated progress call for internal use (e.g. apply_bonus in game_system).
    /// Only callable by game_system.
    fn progress(ref self: T, player_id: felt252, task_id: felt252, count: u128);
}

/// Public quest claiming — called by the client to claim completed quests
#[starknet::interface]
pub trait IQuestClaim<T> {
    fn quest_claim(ref self: T, player: ContractAddress, quest_id: felt252, interval_id: u64);
}

#[dojo::contract]
mod progress_system {
    use achievement::component::Component as AchievementComponent;
    use achievement::component::Component::AchievementTrait;
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use openzeppelin_introspection::src5::SRC5Component;
    use quest::component::Component as QuestComponent;
    use quest::component::Component::QuestTrait;
    use core::num::traits::Zero;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::elements::achievements::index::{AchievementDefsTrait, AchievementPointsTrait};
    use zkube::elements::quests::index::{
        QUEST_BONUS_I, QUEST_BONUS_II, QUEST_COMBO_I, QUEST_COMBO_II, QUEST_COMBO_III,
        QUEST_DAILY_CHALLENGER, QUEST_DAILY_FINISHER, QUEST_LINE_CLEAR_I, QUEST_LINE_CLEAR_II,
        QUEST_LINE_CLEAR_III, QUEST_WEEKLY_CHALLENGER, QUEST_WEEKLY_GRINDER, QuestDefsTrait,
    };
    use zkube::elements::tasks::index::Task;
    use zkube::elements::tasks::interface::TaskTrait;
    use zkube::external::zstar_token::{IZStarTokenDispatcher, IZStarTokenDispatcherTrait};
    use zkube::models::player::{PlayerMeta, PlayerMetaTrait};
    use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
    use super::IProgressSystem;

    component!(path: AchievementComponent, storage: achievement, event: AchievementEvent);
    component!(path: QuestComponent, storage: quest, event: QuestEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl AchievementInternalImpl = AchievementComponent::InternalImpl<ContractState>;
    impl QuestInternalImpl = QuestComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievement: AchievementComponent::Storage,
        #[substorage(v0)]
        quest: QuestComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievementEvent: AchievementComponent::Event,
        #[flat]
        QuestEvent: QuestComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    fn dojo_init(ref self: ContractState) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let registry_address = get_contract_address();

        let mut achievements = AchievementDefsTrait::all();
        while let Option::Some(props) = achievements.pop_front() {
            self
                .achievement
                .create(world, props.id, props.start, props.end, props.tasks, props.metadata, true);
        }

        let mut quests = QuestDefsTrait::all(registry_address);
        while let Option::Some(props) = quests.pop_front() {
            self
                .quest
                .create(
                    world,
                    props.id,
                    props.start,
                    props.end,
                    props.duration,
                    props.interval,
                    props.tasks,
                    props.conditions,
                    props.metadata,
                    true,
                );
        }
    }

    // ── Achievement hooks
    // ────────────────────────────────────────────

    impl AchievementHooksImpl of AchievementTrait<ContractState> {
        fn on_completion(
            ref self: AchievementComponent::ComponentState<ContractState>,
            player_id: felt252,
            achievement_id: felt252,
        ) {
            let mut contract = self.get_contract_mut();
            let mut world: WorldStorage = contract.world(@DEFAULT_NS());
            let player: ContractAddress = player_id.try_into().unwrap();
            let mut player_meta: PlayerMeta = world.read_model(player);
            if !player_meta.exists() {
                player_meta = PlayerMetaTrait::new(player);
            }
            player_meta.increment_xp(AchievementPointsTrait::xp_for(achievement_id));
            world.write_model(@player_meta);
        }

        fn on_claim(
            ref self: AchievementComponent::ComponentState<ContractState>,
            player_id: felt252,
            achievement_id: felt252,
        ) {
            let _ = player_id;
            let _ = achievement_id;
        }
    }

    // ── Quest hooks
    // ──────────────────────────────────────────────────

    impl QuestHooksImpl of QuestTrait<ContractState> {
        fn on_quest_unlock(
            ref self: QuestComponent::ComponentState<ContractState>,
            player_id: felt252,
            quest_id: felt252,
            interval_id: u64,
        ) {
            let _ = player_id;
            let _ = quest_id;
            let _ = interval_id;
        }

        fn on_quest_complete(
            ref self: QuestComponent::ComponentState<ContractState>,
            player_id: felt252,
            quest_id: felt252,
            interval_id: u64,
        ) {
            let _ = interval_id;
            if !InternalImpl::is_daily_rotating_quest(quest_id) {
                return;
            }
            let mut contract = self.get_contract_mut();
            let world = contract.world(@DEFAULT_NS());
            contract.quest.progress(world, player_id, Task::DailyQuestDone.identifier(), 1, true);
        }

        fn on_quest_claim(
            ref self: QuestComponent::ComponentState<ContractState>,
            player_id: felt252,
            quest_id: felt252,
            interval_id: u64,
        ) {
            let _ = interval_id;
            let reward = InternalImpl::quest_star_reward(quest_id);
            if reward == 0 {
                return;
            }
            let mut contract = self.get_contract_mut();
            let world: WorldStorage = contract.world(@DEFAULT_NS());
            let player: ContractAddress = player_id.try_into().unwrap();
            match world.dns_address(@"config_system") {
                Option::Some(config_address) => {
                    let config = IConfigSystemDispatcher { contract_address: config_address };
                    let zstar_address = config.get_zstar_address();
                    if !zstar_address.is_zero() {
                        let zstar = IZStarTokenDispatcher { contract_address: zstar_address };
                        zstar.mint(player, reward.into());
                    }
                },
                Option::None => {},
            }
        }
    }

    // ── Public interface
    // ─────────────────────────────────────────────

    #[abi(embed_v0)]
    impl ProgressSystemImpl of IProgressSystem<ContractState> {
        fn emit_progress(
            ref self: ContractState,
            player: ContractAddress,
            task_id: felt252,
            count: u128,
            settings_id: u32,
        ) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let move_system = world
                .dns_address(@"move_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let level_system = world
                .dns_address(@"level_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let story_system = world
                .dns_address(@"story_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let game_system = world
                .dns_address(@"game_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let daily_system = world
                .dns_address(@"daily_challenge_system")
                .unwrap_or(core::num::traits::Zero::zero());

            assert(
                caller == move_system
                    || caller == level_system
                    || caller == story_system
                    || caller == game_system
                    || caller == daily_system,
                'Unauthorized progress emitter',
            );

            match world.dns_address(@"config_system") {
                Option::Some(config_address) => {
                    let config = IConfigSystemDispatcher { contract_address: config_address };
                    if !config.is_star_eligible(settings_id) {
                        return;
                    }
                },
                Option::None => { return; },
            }

            let player_id: felt252 = player.into();
            self.quest.progress(world, player_id, task_id, count, true);
            self.achievement.progress(world, player_id, task_id, count, true);
        }

        fn emit_progress_bulk(
            ref self: ContractState,
            player: ContractAddress,
            tasks: Span<(felt252, u128)>,
            settings_id: u32,
        ) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let move_system = world
                .dns_address(@"move_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let level_system = world
                .dns_address(@"level_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let story_system = world
                .dns_address(@"story_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let game_system = world
                .dns_address(@"game_system")
                .unwrap_or(core::num::traits::Zero::zero());
            let daily_system = world
                .dns_address(@"daily_challenge_system")
                .unwrap_or(core::num::traits::Zero::zero());

            assert(
                caller == move_system
                    || caller == level_system
                    || caller == story_system
                    || caller == game_system
                    || caller == daily_system,
                'Unauthorized progress emitter',
            );

            match world.dns_address(@"config_system") {
                Option::Some(config_address) => {
                    let config = IConfigSystemDispatcher { contract_address: config_address };
                    if !config.is_star_eligible(settings_id) {
                        return;
                    }
                },
                Option::None => { return; },
            }

            let player_id: felt252 = player.into();
            let mut i: u32 = 0;
            let len = tasks.len();
            while i < len {
                let (task_id, count) = *tasks.at(i);
                self.quest.progress(world, player_id, task_id, count, true);
                self.achievement.progress(world, player_id, task_id, count, true);
                i += 1;
            };
        }

        fn progress(ref self: ContractState, player_id: felt252, task_id: felt252, count: u128) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let game_system = world
                .dns_address(@"game_system")
                .unwrap_or(core::num::traits::Zero::zero());
            assert(caller == game_system, 'Unauthorized progress caller');

            self.quest.progress(world, player_id, task_id, count, true);
            self.achievement.progress(world, player_id, task_id, count, true);
        }
    }

    // ── Quest claiming (public, called by client)
    // ─────────────────────────────────────────────

    #[abi(embed_v0)]
    impl QuestClaimImpl of super::IQuestClaim<ContractState> {
        fn quest_claim(
            ref self: ContractState, player: ContractAddress, quest_id: felt252, interval_id: u64,
        ) {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            self.quest.claim(world, player.into(), quest_id, interval_id);
        }
    }

    // ── Internal helpers
    // ─────────────────────────────────────────────

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn is_daily_rotating_quest(quest_id: felt252) -> bool {
            quest_id == QUEST_LINE_CLEAR_I
                || quest_id == QUEST_LINE_CLEAR_II
                || quest_id == QUEST_LINE_CLEAR_III
                || quest_id == QUEST_COMBO_I
                || quest_id == QUEST_COMBO_II
                || quest_id == QUEST_COMBO_III
                || quest_id == QUEST_BONUS_I
                || quest_id == QUEST_BONUS_II
                || quest_id == QUEST_DAILY_CHALLENGER
        }

        /// zStar reward per quest claim.
        /// Daily rotating quests: 1 star each
        /// Daily Finisher (3 quests done): 2 stars
        /// Weekly quests: 5 stars each
        fn quest_star_reward(quest_id: felt252) -> u64 {
            if quest_id == QUEST_WEEKLY_GRINDER || quest_id == QUEST_WEEKLY_CHALLENGER {
                5
            } else if quest_id == QUEST_DAILY_FINISHER {
                2
            } else if quest_id == QUEST_LINE_CLEAR_I
                || quest_id == QUEST_LINE_CLEAR_II
                || quest_id == QUEST_LINE_CLEAR_III
                || quest_id == QUEST_COMBO_I
                || quest_id == QUEST_COMBO_II
                || quest_id == QUEST_COMBO_III
                || quest_id == QUEST_BONUS_I
                || quest_id == QUEST_BONUS_II
                || quest_id == QUEST_DAILY_CHALLENGER {
                1
            } else {
                0
            }
        }
    }
}
