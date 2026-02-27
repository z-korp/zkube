#[starknet::interface]
pub trait ISkillTreeSystem<T> {
    /// Upgrade a skill's level. Pre-branch: 0→1, 1→2. Post-branch: 3→4, 4→5.
    /// Burns cubes from player's wallet via CubeToken.
    fn upgrade_skill(ref self: T, skill_id: u8);

    /// Choose a branch at level 2→3 (branch: 0=A, 1=B).
    /// Also upgrades to level 3. Burns cubes.
    fn choose_branch(ref self: T, skill_id: u8, branch: u8);

    /// Respec a branch (costs 50% of total investment, resets to level 2).
    fn respec_branch(ref self: T, skill_id: u8);

    /// Read skill tree data for a player.
    fn get_skill_info(self: @T, player: starknet::ContractAddress, skill_id: u8) -> (u8, bool, u8);
}

#[dojo::contract]
mod skill_tree_system {
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use starknet::{ContractAddress, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::helpers::packing::{SkillTreeDataPackingTrait, SkillTreeHelpersTrait};
    use zkube::models::skill_tree::{PlayerSkillTree, PlayerSkillTreeTrait};
    use zkube::systems::config::{IConfigSystemDispatcher, IConfigSystemDispatcherTrait};
    use zkube::systems::cube_token::{ICubeTokenDispatcher, ICubeTokenDispatcherTrait};

    #[abi(embed_v0)]
    impl SkillTreeSystemImpl of super::ISkillTreeSystem<ContractState> {
        fn upgrade_skill(ref self: ContractState, skill_id: u8) {
            assert!(skill_id >= 1 && skill_id <= 12, "Invalid skill_id");

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let mut tree: PlayerSkillTree = world.read_model(player);
            if !tree.exists() {
                tree = PlayerSkillTreeTrait::new(player);
            }

            let mut data = tree.get_skill_tree_data();
            let mut skill = data.get_skill(skill_id);

            assert!(skill.level < 5, "Skill already at max level");

            if skill.level >= 2 {
                assert!(skill.branch_chosen, "Branch must be chosen before upgrading");
            }

            let cost: u16 = SkillTreeHelpersTrait::skill_upgrade_cost(skill.level);
            InternalImpl::burn_cubes(ref world, player, cost);

            skill.level += 1;
            data.set_skill(skill_id, skill);
            tree.set_skill_tree_data(data);
            world.write_model(@tree);
        }

        fn choose_branch(ref self: ContractState, skill_id: u8, branch: u8) {
            assert!(skill_id >= 1 && skill_id <= 12, "Invalid skill_id");
            assert!(branch <= 1, "Invalid branch");

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let mut tree: PlayerSkillTree = world.read_model(player);
            if !tree.exists() {
                tree = PlayerSkillTreeTrait::new(player);
            }

            let mut data = tree.get_skill_tree_data();
            let mut skill = data.get_skill(skill_id);

            assert!(skill.level == 2, "Skill must be at branch point level");
            assert!(!skill.branch_chosen, "Branch already chosen");

            let cost: u16 = SkillTreeHelpersTrait::skill_upgrade_cost(skill.level);
            InternalImpl::burn_cubes(ref world, player, cost);

            skill.branch_chosen = true;
            skill.branch_id = branch;
            skill.level = 3;

            data.set_skill(skill_id, skill);
            tree.set_skill_tree_data(data);
            world.write_model(@tree);
        }

        fn respec_branch(ref self: ContractState, skill_id: u8) {
            assert!(skill_id >= 1 && skill_id <= 12, "Invalid skill_id");

            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let player = get_caller_address();

            let mut tree: PlayerSkillTree = world.read_model(player);
            if !tree.exists() {
                tree = PlayerSkillTreeTrait::new(player);
            }

            let mut data = tree.get_skill_tree_data();
            let mut skill = data.get_skill(skill_id);

            assert!(skill.branch_chosen, "Branch not chosen");
            assert!(skill.level >= 3, "No branch levels to respec");

            let cost: u16 = SkillTreeHelpersTrait::branch_respec_cost(skill.level);
            InternalImpl::burn_cubes(ref world, player, cost);

            skill.level = 2;
            skill.branch_chosen = false;
            skill.branch_id = 0;

            data.set_skill(skill_id, skill);
            tree.set_skill_tree_data(data);
            world.write_model(@tree);
        }

        fn get_skill_info(
            self: @ContractState, player: ContractAddress, skill_id: u8,
        ) -> (u8, bool, u8) {
            assert!(skill_id >= 1 && skill_id <= 12, "Invalid skill_id");

            let world: WorldStorage = self.world(@DEFAULT_NS());
            let tree: PlayerSkillTree = world.read_model(player);

            let data = if tree.exists() {
                tree.get_skill_tree_data()
            } else {
                SkillTreeDataPackingTrait::new()
            };
            let skill = data.get_skill(skill_id);
            (skill.level, skill.branch_chosen, skill.branch_id)
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn burn_cubes(ref world: WorldStorage, player: ContractAddress, cost: u16) {
            let config_address = world
                .dns_address(@"config_system")
                .expect('ConfigSystem not found');
            let config = IConfigSystemDispatcher { contract_address: config_address };
            let cube_token_address = config.get_cube_token_address();
            let cube_token = ICubeTokenDispatcher { contract_address: cube_token_address };

            let cost_u256: u256 = cost.into();
            cube_token.burn(player, cost_u256);
        }
    }
}
