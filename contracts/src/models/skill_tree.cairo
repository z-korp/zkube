use starknet::ContractAddress;
use zkube::helpers::packing::{SkillTreeData, SkillTreeDataPacking, SkillTreeDataPackingTrait};

#[derive(Copy, Drop, Serde, IntrospectPacked)]
#[dojo::model]
pub struct PlayerSkillTree {
    #[key]
    pub player: ContractAddress,
    /// Packed skill data: 15 skills x 6 bits = 90 bits
    pub skill_data: felt252,
}

#[generate_trait]
pub impl PlayerSkillTreeImpl of PlayerSkillTreeTrait {
    fn new(player: ContractAddress) -> PlayerSkillTree {
        PlayerSkillTree { player, skill_data: SkillTreeDataPackingTrait::new().pack() }
    }

    fn get_skill_tree_data(self: PlayerSkillTree) -> SkillTreeData {
        SkillTreeDataPackingTrait::unpack(self.skill_data)
    }

    fn set_skill_tree_data(ref self: PlayerSkillTree, data: SkillTreeData) {
        self.skill_data = data.pack();
    }

    fn exists(self: PlayerSkillTree) -> bool {
        self.skill_data != 0
    }
}
