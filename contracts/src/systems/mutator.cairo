use zkube::models::mutator::MutatorDef;

#[starknet::interface]
pub trait IMutatorSystem<T> {
    fn register_mutator(
        ref self: T,
        mutator_id: u8,
        name: felt252,
        zone_id: u8,
        moves_modifier_encoded: u8,
        ratio_modifier_encoded: u8,
        difficulty_offset_encoded: u8,
        combo_score_mult_x100: u16,
        star_threshold_modifier_encoded: u8,
        endless_ramp_mult_x100: u16,
    );
    fn get_mutator(self: @T, mutator_id: u8) -> MutatorDef;
    fn get_zone_mutator(self: @T, zone_id: u8, index: u8) -> MutatorDef;
}

#[dojo::contract]
mod mutator_system {
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use zkube::constants::DEFAULT_NS;
    use zkube::models::mutator::MutatorDef;
    use super::IMutatorSystem;

    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl MutatorSystemImpl of IMutatorSystem<ContractState> {
        fn register_mutator(
            ref self: ContractState,
            mutator_id: u8,
            name: felt252,
            zone_id: u8,
            moves_modifier_encoded: u8,
            ratio_modifier_encoded: u8,
            difficulty_offset_encoded: u8,
            combo_score_mult_x100: u16,
            star_threshold_modifier_encoded: u8,
            endless_ramp_mult_x100: u16,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            world
                .write_model(
                    @MutatorDef {
                        mutator_id,
                        name,
                        zone_id,
                        moves_modifier_encoded,
                        ratio_modifier_encoded,
                        difficulty_offset_encoded,
                        combo_score_mult_x100,
                        star_threshold_modifier_encoded,
                        endless_ramp_mult_x100,
                    },
                );
        }

        fn get_mutator(self: @ContractState, mutator_id: u8) -> MutatorDef {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(mutator_id)
        }

        fn get_zone_mutator(self: @ContractState, zone_id: u8, index: u8) -> MutatorDef {
            assert!(zone_id > 0, "invalid zone id");
            assert!(index < 3, "invalid mutator index");

            // Convention: mutator_id = (zone_id - 1) * 3 + index + 1
            let mutator_id_u16: u16 = (zone_id.into() - 1_u16) * 3_u16 + index.into() + 1_u16;
            let mutator_id: u8 = mutator_id_u16.try_into().unwrap();

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(mutator_id)
        }
    }
}
