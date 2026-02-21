/// Achievement system for zkube
/// Handles achievement registration, progress tracking, and claiming

use starknet::ContractAddress;

#[starknet::interface]
pub trait IAchievementSystem<T> {
    /// Claim a completed achievement
    fn claim(ref self: T, achievement_id: felt252);
    /// Progress a task for a player (called by other systems)
    fn progress(ref self: T, player: ContractAddress, task_id: felt252, count: u32);
}

#[dojo::contract]
pub mod achievement_system {
    use achievement::components::achievable::AchievableComponent;
    use achievement::components::achievable::AchievableComponent::InternalImpl as AchievableInternalImpl;
    use achievement::interfaces::IAchievementRewarder;
    use starknet::ContractAddress;
    use crate::constants::DEFAULT_NS;
    use crate::elements::achievements::index::{ACHIEVEMENT_COUNT, Achievement, AchievementTrait};
    use super::IAchievementSystem;

    // Components

    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    // Initialization

    fn dojo_init(ref self: ContractState) {
        let world = self.world(@DEFAULT_NS());

        // Register all achievements
        let mut achievement_id: u8 = ACHIEVEMENT_COUNT;
        while achievement_id > 0 {
            let achievement: Achievement = achievement_id.into();
            self
                .achievable
                .create(
                    world: world,
                    id: achievement.identifier(),
                    rewarder: starknet::get_contract_address(), // This contract handles rewards
                    start: 0, // No time limit
                    end: 0, // No time limit
                    tasks: achievement.tasks(),
                    metadata: achievement.metadata(),
                    to_store: true,
                );
            achievement_id -= 1;
        };
    }

    // IAchievementRewarder - callbacks from achievable component

    #[abi(embed_v0)]
    impl AchievementRewarderImpl of IAchievementRewarder<ContractState> {
        fn on_achievement_claim(
            ref self: ContractState, recipient: ContractAddress, achievement_id: felt252,
        ) {
            // Achievement rewards are trophy points - no additional rewards needed
            // The achievement system itself handles trophy point tracking
            // `recipient` is the player claiming the achievement
            let _ = recipient; // Silence unused variable warning
        }
    }

    // External interface

    #[abi(embed_v0)]
    impl AchievementSystemImpl of IAchievementSystem<ContractState> {
        /// Claim a completed achievement
        fn claim(ref self: ContractState, achievement_id: felt252) {
            let world = self.world(@DEFAULT_NS());
            let caller = starknet::get_caller_address();
            self.achievable.claim(world, caller.into(), achievement_id);
        }

        /// Progress a task for a player
        /// This is called by game_system when relevant actions occur
        fn progress(
            ref self: ContractState, player: ContractAddress, task_id: felt252, count: u32,
        ) {
            let world = self.world(@DEFAULT_NS());
            let player_felt: felt252 = player.into();
            self.achievable.progress(world, player_felt, task_id, count.into(), true);
        }
    }
}
