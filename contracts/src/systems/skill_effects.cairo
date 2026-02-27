use zkube::helpers::skill_effects::{ActiveEffect, PassiveEffect};

#[starknet::interface]
pub trait ISkillEffectsSystem<T> {
    /// Compute active effect for a specific active skill being used.
    fn get_active_effect(self: @T, skill_id: u8, level: u8, branch_id: u8) -> ActiveEffect;

    /// Get branch_id for a skill from the player's skill tree data.
    fn get_branch_id(self: @T, skill_data: felt252, skill_id: u8) -> u8;

    /// Compute aggregated passive effects from all passive skills in a run.
    /// Takes packed run_data (felt252).
    fn get_passive_effects(self: @T, run_data: felt252) -> PassiveEffect;
}

#[dojo::contract]
mod skill_effects_system {
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::packing::RunDataPackingTrait;
    use zkube::helpers::skill_effects::{self, ActiveEffect, PassiveEffect};

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl SkillEffectsSystemImpl of super::ISkillEffectsSystem<ContractState> {
        fn get_active_effect(
            self: @ContractState, skill_id: u8, level: u8, branch_id: u8,
        ) -> ActiveEffect {
            let _ = DEFAULT_NS();
            skill_effects::active_effect_for_skill(skill_id, level, branch_id)
        }

        fn get_branch_id(self: @ContractState, skill_data: felt252, skill_id: u8) -> u8 {
            let _ = DEFAULT_NS();
            skill_effects::get_branch_id_for_skill(skill_data, skill_id)
        }

        fn get_passive_effects(
            self: @ContractState, run_data: felt252,
        ) -> PassiveEffect {
            let _ = DEFAULT_NS();
            let unpacked_run_data = RunDataPackingTrait::unpack(run_data);
            skill_effects::get_passive_effects(@unpacked_run_data)
        }
    }
}
