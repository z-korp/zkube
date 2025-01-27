// Starknet imports
use starknet::info::{get_caller_address};
use starknet::ContractAddress;

#[starknet::interface]
trait ITest<T> {
    fn test_try_into_64_32(ref self: T, key: u32);
    fn test_into_contract_felt_32(ref self: T, key: u32);
}

#[dojo::contract]
mod test {
    // Dojo imports
    use dojo::model::{ModelStorage, ModelValueStorage};
    use dojo::world::{WorldStorage, IWorldDispatcherTrait, WorldStorageTrait};

    // Local imports

    use zkube::models::index::TestModel;
    use super::{ITest, get_caller_address, ContractAddress};

    // Implementations
    #[abi(embed_v0)]
    impl TestImpl of ITest<ContractState> {
        fn test_try_into_64_32(ref self: ContractState, key: u32) {
            let mut world = self.world_default();
            let a: u32 = 10000;
            let b: u64 = a.try_into().unwrap();
            let c: u64 = a.try_into().unwrap();

            let mut model: TestModel = world.read_model(key);
            model.v_u64 = b + c;
            world.write_model(@model);
        }

        fn test_into_contract_felt_32(ref self: ContractState, key: u32) {
            let a: ContractAddress = get_caller_address();
            let _b: felt252 = a.into();
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(crate::default_namespace())
        }
    }
}
