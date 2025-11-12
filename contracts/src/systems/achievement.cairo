use starknet::ContractAddress;
use zkube::models::game::Game;

#[starknet::interface]
pub trait IAchievementSystem<T> {
    fn update_progress_when_game_over(ref self: T, game: Game, caller: ContractAddress);
}

#[dojo::contract]
mod achievement_system {
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use starknet::{get_block_timestamp, get_caller_address, ContractAddress};

    use achievement::store::StoreTrait;
    use achievement::components::achievable::AchievableComponent;

    use zkube::types::trophy::{Trophy, TrophyTrait, TROPHY_COUNT};
    use zkube::types::task::{Task, TaskTrait};
    use zkube::constants::{DEFAULT_NS};
    use zkube::models::game::Game;

    component!(path: AchievableComponent, storage: achievable, event: AchievableEvent);
    impl AchievableInternalImpl = AchievableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        achievable: AchievableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        AchievableEvent: AchievableComponent::Event,
    }

    fn dojo_init(ref self: ContractState) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());

        // [Event] Emit all Trophy events
        let mut trophy_id: u8 = TROPHY_COUNT;
        while trophy_id > 0 {
            let trophy: Trophy = trophy_id.into();
            self
                .achievable
                .create(
                    world,
                    id: trophy.identifier(),
                    hidden: trophy.hidden(),
                    index: trophy.index(),
                    points: trophy.points(),
                    start: trophy.start(),
                    end: trophy.end(),
                    group: trophy.group(),
                    icon: trophy.icon(),
                    title: trophy.title(),
                    description: trophy.description(),
                    tasks: trophy.tasks(),
                    data: trophy.data(),
                );
            trophy_id -= 1;
        }
    }

    #[abi(embed_v0)]
    impl AchievementSystemImpl of super::IAchievementSystem<ContractState> {
        fn update_progress_when_game_over(
            ref self: ContractState, game: Game, caller: ContractAddress
        ) {
            let world = self.world(@DEFAULT_NS());

            // Can only be called by the game contract
            let (contract_address, _) = world.dns(@"game_system").unwrap();
            assert(get_caller_address() == contract_address, 'Invalid caller');

            let store = StoreTrait::new(world);
            let time = get_block_timestamp();
            let time_u64: u64 = time.into();

            // [Trophy] Update Mastering tasks progression
            let value: u32 = game.combo_counter.into();
            if Trophy::ComboInitiator.assess(value) {
                let level = Trophy::ComboInitiator.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::ComboExpert.assess(value) {
                let level = Trophy::ComboExpert.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::ComboMaster.assess(value) {
                let level = Trophy::ComboMaster.level();
                let task_id = Task::Mastering.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }

            // [Trophy] Update Chaining tasks progression
            let value: u32 = game.max_combo.into();
            if Trophy::TripleThreat.assess(value) {
                let level = Trophy::TripleThreat.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::SixShooter.assess(value) {
                let level = Trophy::SixShooter.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::NineLives.assess(value) {
                let level = Trophy::NineLives.level();
                let task_id = Task::Chaining.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }

            // [Trophy] Update Playing tasks progression
            let value: u32 = game.moves.into();
            if Trophy::GameBeginner.assess(value) {
                let level = Trophy::GameBeginner.level();
                let task_id = Task::Playing.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::GameExperienced.assess(value) {
                let level = Trophy::GameExperienced.level();
                let task_id = Task::Playing.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::GameVeteran.assess(value) {
                let level = Trophy::GameVeteran.level();
                let task_id = Task::Playing.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }

            // [Trophy] Update Scoring tasks progression
            let value_u32: u32 = game.score.into();
            let value_u128: u128 = game.score.into();

            if Trophy::ScoreApprentice.assess(value_u32) {
                let level = Trophy::ScoreApprentice.level();
                let task_id = Task::Scoring.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::ScoreExpert.assess(value_u32) {
                let level = Trophy::ScoreExpert.level();
                let task_id = Task::Scoring.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }
            if Trophy::ScoreMaster.assess(value_u32) {
                let level = Trophy::ScoreMaster.level();
                let task_id = Task::Scoring.identifier(level);
                store.progress(caller.into(), task_id, 1_u128, time_u64);
            }

            // [Trophy] Update Cumulative Scoring tasks progression
            if Trophy::ScoreCollector.assess(value_u32) {
                let level = Trophy::ScoreCollector.level();
                let task_id = Task::CumulativeScoring.identifier(level);
                store.progress(caller.into(), task_id, value_u128, time_u64);
            }
            if Trophy::ScoreAccumulator.assess(value_u32) {
                let level = Trophy::ScoreAccumulator.level();
                let task_id = Task::CumulativeScoring.identifier(level);
                store.progress(caller.into(), task_id, value_u128, time_u64);
            }
            if Trophy::ScoreLegend.assess(value_u32) {
                let level = Trophy::ScoreLegend.level();
                let task_id = Task::CumulativeScoring.identifier(level);
                store.progress(caller.into(), task_id, value_u128, time_u64);
            }
        }
    }
}
