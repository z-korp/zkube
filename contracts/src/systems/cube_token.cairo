// SPDX-License-Identifier: MIT
// zKube zCubes Token - ERC20

use starknet::ContractAddress;

#[starknet::interface]
pub trait ICubeToken<T> {
    /// Mint cubes to a recipient (only MINTER_ROLE)
    fn mint(ref self: T, recipient: ContractAddress, amount: u256);

    /// Burn cubes from an account (caller must be account or have MINTER_ROLE)
    fn burn(ref self: T, account: ContractAddress, amount: u256);

    /// Grant MINTER_ROLE to game, move, quest, and skill_tree systems (only DEFAULT_ADMIN_ROLE)
    fn grant_minter_roles(ref self: T);

    /// Dev-only: mint cubes to caller (only DEFAULT_ADMIN_ROLE)
    fn mint_dev(ref self: T, amount: u256);
}

#[dojo::contract]
pub mod cube_token {
    use dojo::world::{IWorldDispatcherTrait, WorldStorageTrait};
    use openzeppelin_access::accesscontrol::{AccessControlComponent, DEFAULT_ADMIN_ROLE};
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use zkube::constants::DEFAULT_NS;
    use super::ICubeToken;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);

    // ERC20 with 0 decimals (whole cubes only)
    impl ERC20ImmutableConfig of ERC20Component::ImmutableConfig {
        const DECIMALS: u8 = 0;
    }

    // Expose standard ERC20 functions (including transfers)
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlImpl =
        AccessControlComponent::AccessControlImpl<ContractState>;

    // Internal implementations
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
    }

    pub const MINTER_ROLE: felt252 = 'MINTER_ROLE';

    fn dojo_init(ref self: ContractState) {
        self.erc20.initializer("zCubes", "ZCUBE");
        self.accesscontrol.initializer();

        // Get deployer account from transaction info
        let deployer_account = starknet::get_tx_info().unbox().account_contract_address;
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, deployer_account);

        // Try to grant MINTER_ROLE to systems that mint/burn cubes via world DNS.
        // These may not be registered yet if cube_token inits first in the migration batch.
        // Use grant_minter_roles() post-deploy to fix if needed.
        let world = self.world(@DEFAULT_NS());

        // Grant to game_system (if already registered)
        match world.dns_address(@"game_system") {
            Option::Some(game_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, game_system);
            },
            Option::None => {},
        }

        // Grant to move_system (if already registered) - handles game over cube minting
        match world.dns_address(@"move_system") {
            Option::Some(move_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, move_system);
            },
            Option::None => {},
        }

        // Grant to quest_system (if already registered)
        match world.dns_address(@"quest_system") {
            Option::Some(quest_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, quest_system);
            },
            Option::None => {},
        }

        // Grant to skill_tree_system (if already registered) - burns cubes for skill upgrades
        match world.dns_address(@"skill_tree_system") {
            Option::Some(skill_tree_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, skill_tree_system);
            },
            Option::None => {},
        };
    }

    #[abi(embed_v0)]
    impl CubeTokenImpl of ICubeToken<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc20.mint(recipient, amount);
        }

        fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
            // Allow if caller is the account owner OR has MINTER_ROLE
            let caller = get_caller_address();
            if account != caller {
                // Must have MINTER_ROLE to burn on behalf of others
                self.accesscontrol.assert_only_role(MINTER_ROLE);
            }
            self.erc20.burn(account, amount);
        }

        fn grant_minter_roles(ref self: ContractState) {
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);

            let world = self.world(@DEFAULT_NS());

            let game_system = world.dns_address(@"game_system").expect('game_system not in DNS');
            self.accesscontrol._grant_role(MINTER_ROLE, game_system);

            let move_system = world.dns_address(@"move_system").expect('move_system not in DNS');
            self.accesscontrol._grant_role(MINTER_ROLE, move_system);

            let quest_system = world.dns_address(@"quest_system").expect('quest_system not in DNS');
            self.accesscontrol._grant_role(MINTER_ROLE, quest_system);

            let skill_tree_system = world
                .dns_address(@"skill_tree_system")
                .expect('skill_tree not in DNS');
            self.accesscontrol._grant_role(MINTER_ROLE, skill_tree_system);
        }

        fn mint_dev(ref self: ContractState, amount: u256) {
            // Dev-only function: keep it admin-gated so it can't be abused on public deployments.
            self.accesscontrol.assert_only_role(DEFAULT_ADMIN_ROLE);
            let caller = starknet::get_caller_address();
            self.erc20.mint(caller, amount);
        }
    }

    /// External function to register contract with Torii for indexing
    #[generate_trait]
    #[abi(per_item)]
    impl ExternalImpl of ExternalTrait {
        #[external(v0)]
        fn register_external_contract(ref self: ContractState) {
            let mut world = self.world(@DEFAULT_NS());
            let cube_token_address = get_contract_address();
            let instance_name: felt252 = cube_token_address.into();
            world
                .dispatcher
                .register_external_contract(
                    namespace: DEFAULT_NS(),
                    contract_name: "erc20",
                    instance_name: format!("{}", instance_name),
                    contract_address: cube_token_address,
                    block_number: 1,
                );
        }
    }
}
