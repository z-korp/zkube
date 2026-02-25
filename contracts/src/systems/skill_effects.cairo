use zkube::helpers::skill_effects::{BonusEffect, WorldEffects};

#[starknet::interface]
pub trait ISkillEffectsSystem<T> {
    /// Compute bonus effect for a specific active skill being used.
    fn get_bonus_effect(self: @T, skill_id: u8, level: u8, branch_id: u8) -> BonusEffect;

    /// Get branch_id for a skill from the player's skill tree data.
    fn get_branch_id(self: @T, skill_data: felt252, skill_id: u8) -> u8;

    /// Compute aggregated world effects from all active world skills in a run.
    /// Takes packed run_data (felt252) and packed skill_data (felt252).
    fn get_world_effects(self: @T, run_data: felt252, skill_data: felt252) -> WorldEffects;
}

#[dojo::contract]
mod skill_effects_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::packing::RunDataPackingTrait;
    use zkube::helpers::skill_effects::{self, BonusEffect, WorldEffects};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl SkillEffectsSystemImpl of super::ISkillEffectsSystem<ContractState> {
        fn get_bonus_effect(
            self: @ContractState, skill_id: u8, level: u8, branch_id: u8,
        ) -> BonusEffect {
            let _ = DEFAULT_NS();
            skill_effects::bonus_effect_for_skill(skill_id, level, branch_id)
        }

        fn get_branch_id(self: @ContractState, skill_data: felt252, skill_id: u8) -> u8 {
            let _ = DEFAULT_NS();
            skill_effects::get_branch_id_for_skill(skill_data, skill_id)
        }

        fn get_world_effects(
            self: @ContractState, run_data: felt252, skill_data: felt252,
        ) -> WorldEffects {
            let _ = DEFAULT_NS();
            let unpacked_run_data = RunDataPackingTrait::unpack(run_data);
            let branch_ids = skill_effects::build_branch_ids(skill_data);
            skill_effects::aggregate_world_effects(@unpacked_run_data, branch_ids.span())
        }
    }
}
