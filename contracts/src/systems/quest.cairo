/// Quest system for zkube
/// Handles daily quest registration, progress tracking, and reward distribution

use starknet::ContractAddress;

#[starknet::interface]
pub trait IQuestSystem<T> {
    /// Claim a completed quest reward
    fn claim(ref self: T, quest_id: felt252, interval_id: u64);
    /// Progress a task for a player (called by game_system)
    fn progress(ref self: T, player: ContractAddress, task_id: felt252, count: u32);
}

#[dojo::contract]
pub mod quest_system {
    use quest::components::questable::QuestableComponent;
    use quest::components::questable::QuestableComponent::InternalImpl as QuestableInternalImpl;
    use quest::interfaces::IQuestRewarder;
    use starknet::ContractAddress;

    use crate::constants::DEFAULT_NS;
    use crate::elements::quests::index::{IQuest, QUEST_COUNT, QuestProps, QuestType};
    use crate::elements::quests::finisher;
    use crate::helpers::game_libs::{GameLibsImpl, ICubeTokenDispatcherTrait};

    use super::IQuestSystem;

    // Components

    component!(path: QuestableComponent, storage: questable, event: QuestableEvent);

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        questable: QuestableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        QuestableEvent: QuestableComponent::Event,
    }

    // Initialization

    fn dojo_init(ref self: ContractState) {
        let world = self.world(@DEFAULT_NS());
        let registry = starknet::get_contract_address();

        // Register all quests
        let mut quest_id: u8 = QUEST_COUNT;
        while quest_id > 0 {
            let quest_type: QuestType = quest_id.into();
            let props: QuestProps = quest_type.props(registry);
            self
                .questable
                .create(
                    world: world,
                    id: props.id,
                    rewarder: registry, // This contract handles rewards
                    start: props.start,
                    end: props.end,
                    duration: props.duration,
                    interval: props.interval,
                    tasks: props.tasks.span(),
                    conditions: props.conditions.span(),
                    metadata: props.metadata,
                    to_store: true,
                );
            quest_id -= 1;
        };
    }

    // IQuestRewarder - callbacks from questable component

    #[abi(embed_v0)]
    impl QuestRewarderImpl of IQuestRewarder<ContractState> {
        fn on_quest_unlock(
            ref self: ContractState, player: ContractAddress, quest_id: felt252, interval_id: u64,
        ) {
            // No action needed on unlock
        }

        fn on_quest_complete(
            ref self: ContractState, player: ContractAddress, quest_id: felt252, interval_id: u64,
        ) {
            // When any daily quest is completed, progress the DailyFinisher quest
            let world = self.world(@DEFAULT_NS());
            let player_felt: felt252 = player.into();

            // Check if this is one of the 9 daily quests (not DailyFinisher itself)
            if quest_id == QuestType::DailyPlayerOne.identifier()
                || quest_id == QuestType::DailyPlayerTwo.identifier()
                || quest_id == QuestType::DailyPlayerThree.identifier()
                || quest_id == QuestType::DailyClearerOne.identifier()
                || quest_id == QuestType::DailyClearerTwo.identifier()
                || quest_id == QuestType::DailyClearerThree.identifier()
                || quest_id == QuestType::DailyComboOne.identifier()
                || quest_id == QuestType::DailyComboTwo.identifier()
                || quest_id == QuestType::DailyComboThree.identifier() {
                // Progress the DailyFinisher quest
                self
                    .questable
                    .progress(world, player_felt, finisher::DailyFinisher::identifier(), 1, true);
            }
        }

        fn on_quest_claim(
            ref self: ContractState, player: ContractAddress, quest_id: felt252, interval_id: u64,
        ) {
            let world = self.world(@DEFAULT_NS());

            // Get reward amount for this quest
            let quest: QuestType = quest_id.into();
            let (amount, _task) = quest.reward();

            // Mint CUBE tokens as reward
            if amount > 0 {
                let libs = GameLibsImpl::new(world);
                libs.cube.mint(player, amount.into());
            }

            // Note: Achievement progression for DailyMaster would be handled here
            // if we add the achievement system later
        }
    }

    // External interface

    #[abi(embed_v0)]
    impl QuestSystemImpl of IQuestSystem<ContractState> {
        /// Claim a completed quest
        fn claim(ref self: ContractState, quest_id: felt252, interval_id: u64) {
            let world = self.world(@DEFAULT_NS());
            let caller = starknet::get_caller_address();
            self.questable.claim(world, caller.into(), quest_id, interval_id);
        }

        /// Progress a task for a player
        /// This is called by game_system when relevant actions occur
        fn progress(ref self: ContractState, player: ContractAddress, task_id: felt252, count: u32) {
            let world = self.world(@DEFAULT_NS());
            let player_felt: felt252 = player.into();
            self.questable.progress(world, player_felt, task_id, count.into(), true);
        }
    }
}
