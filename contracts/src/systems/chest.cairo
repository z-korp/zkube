// Starknet imports
use starknet::ContractAddress;

// Dojo imports
use dojo::world::WorldStorage;

// External imports
use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports
use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait};
use zkube::store::{Store, StoreTrait};

#[dojo::interface]
trait IChest<TContractState> {
    fn claim(ref self: ContractState, chest_id: u32);
    fn sponsor(ref self: ContractState, chest_id: u32, amount: u128);
    fn sponsor_from(ref self: ContractState, amount: u128, caller: ContractAddress);
}

#[dojo::contract]
mod chest {
    // Starknet imports

    use starknet::{ContractAddress, ClassHash};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports
    use zkube::components::payable::PayableComponent;


    // Local imports

    use super::{
        IChest, Proof, Bonus, Mode, Settings, SettingsTrait, Store, StoreTrait, WorldStorage
    };
    use zkube::models::chest::{ChestTrait, ChestAssert};
    use zkube::models::participation::{ParticipationTrait, ParticipationAssert};

    // Components
    component!(path: PayableComponent, storage: payable, event: PayableEvent);
    impl PayableInternalImpl = PayableComponent::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        payable: PayableComponent::Storage,
        current_chest_id: u8,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        PayableEvent: PayableComponent::Event,
    }

    // Constructor

    fn dojo_init(ref self: ContractState, token_address: ContractAddress,) {
        // [Setup] Datastore
        let mut world = self.world_default();
        let store = StoreTrait::new(world);

        // [Effect] Initialize components
        self.payable._initialize(token_address);

        // Create chest
        let mut chest_configs: Array<(u32, u32)> = ArrayTrait::new();
        chest_configs.append((1, 10_000)); // Wood Chest
        chest_configs.append((2, 25_000)); // Bronze Chest
        chest_configs.append((3, 50_000)); // Iron Chest
        chest_configs.append((4, 100_000)); // Silver Chest
        chest_configs.append((5, 200_000)); // Gold Chest
        chest_configs.append((6, 400_000)); // Platinum Chest
        chest_configs.append((7, 800_000)); // Emerald Chest
        chest_configs.append((8, 1_600_000)); // Ruby Chest
        chest_configs.append((9, 3_200_000)); // Sapphire Chest
        chest_configs.append((10, 6_400_000)); // Diamond Chest

        let mut i = 0;
        loop {
            if i >= chest_configs.len() {
                break;
            }
            let (id, target_points) = *chest_configs.at(i);
            let chest = ChestTrait::new(id.into(), target_points.into(), 0);
            store.set_chest(chest);
            i += 1;
        };

        self.current_chest_id.write(1);
    }

    // Implementations

    #[abi(embed_v0)]
    impl ChestSystemImpl of IChest<ContractState> {
        fn claim(ref self: ContractState, chest_id: u32) {
            let store = StoreTrait::new(world);
            let chest = store.chest(chest_id);
            chest.assert_exists();
            chest.assert_complete();

            let caller = get_caller_address();
            let mut participation = store.participation(chest_id, caller.into());
            participation.assert_exists();

            let rewards = participation.claim(chest.points, chest.prize);
            store.set_participation(participation);

            // Transfer the reward to the caller
            self.payable._refund(caller, rewards.into());
        // TODO Emit event
        }

        fn sponsor(ref self: ContractState, chest_id: u32, amount: u128) {
            let store = StoreTrait::new(world);
            let mut chest = store.chest(chest_id);
            chest.assert_exists();
            chest.assert_not_complete();

            chest.add_prize(amount);
            store.set_chest(chest);

            let caller = get_caller_address();
            self.payable._pay(caller, amount.into());
        }

        fn sponsor_from(ref self: ContractState, amount: u128, caller: ContractAddress) {
            self.payable._pay(caller, amount.into());
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// This function is handy since the ByteArray can't be const.
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"zkube")
        }
    }
}
