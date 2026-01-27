// SPDX-License-Identifier: MIT
// zKube CUBE Token - Soulbound ERC1155

use starknet::ContractAddress;

/// CUBE token ID (single fungible token within ERC1155)
pub const CUBE_TOKEN_ID: u256 = 1;

#[starknet::interface]
pub trait ICubeToken<T> {
    /// Mint cubes to a recipient (only MINTER_ROLE)
    fn mint(ref self: T, recipient: ContractAddress, amount: u256);
    
    /// Burn cubes from an account (caller must be account or have MINTER_ROLE)
    fn burn(ref self: T, account: ContractAddress, amount: u256);
    
    /// Get cube balance for an account
    fn balance_of_cubes(self: @T, account: ContractAddress) -> u256;
}

#[starknet::interface]
pub trait IERC1155Metadata<T> {
    fn name(self: @T) -> ByteArray;
    fn symbol(self: @T) -> ByteArray;
}

#[dojo::contract]
pub mod cube_token {
    use core::num::traits::Zero;
    use dojo::world::IWorldDispatcherTrait;
    use dojo::world::WorldStorageTrait;
    use openzeppelin_access::accesscontrol::AccessControlComponent;
    use openzeppelin_access::accesscontrol::DEFAULT_ADMIN_ROLE;
    use openzeppelin_introspection::src5::SRC5Component;
    use openzeppelin_token::erc1155::ERC1155Component;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use zkube::constants::DEFAULT_NS;
    use super::{ICubeToken, IERC1155Metadata, CUBE_TOKEN_ID};

    component!(path: ERC1155Component, storage: erc1155, event: ERC1155Event);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);
    component!(path: AccessControlComponent, storage: accesscontrol, event: AccessControlEvent);

    // ERC1155 - only expose balance_of and other read functions, NOT transfers
    #[abi(embed_v0)]
    impl ERC1155Impl = ERC1155Component::ERC1155Impl<ContractState>;
    #[abi(embed_v0)]
    impl AccessControlImpl = AccessControlComponent::AccessControlImpl<ContractState>;

    // Internal implementations
    impl ERC1155InternalImpl = ERC1155Component::InternalImpl<ContractState>;
    impl AccessControlInternalImpl = AccessControlComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc1155: ERC1155Component::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
        #[substorage(v0)]
        accesscontrol: AccessControlComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC1155Event: ERC1155Component::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
        #[flat]
        AccessControlEvent: AccessControlComponent::Event,
    }

    pub const MINTER_ROLE: felt252 = 'MINTER_ROLE';

    /// Soulbound hook - blocks all transfers except mint (from=0) and burn (to=0)
    pub impl ERC1155SoulboundHooks of ERC1155Component::ERC1155HooksTrait<ContractState> {
        fn before_update(
            ref self: ERC1155Component::ComponentState<ContractState>,
            from: ContractAddress,
            to: ContractAddress,
            token_ids: Span<u256>,
            values: Span<u256>,
        ) {
            // Allow mint (from == 0) and burn (to == 0)
            // Block all other transfers
            assert!(
                from.is_zero() || to.is_zero(),
                "CubeToken is soulbound - transfers not allowed"
            );
        }

        fn after_update(
            ref self: ERC1155Component::ComponentState<ContractState>,
            from: ContractAddress,
            to: ContractAddress,
            token_ids: Span<u256>,
            values: Span<u256>,
        ) {
            // No-op
        }
    }

    fn dojo_init(ref self: ContractState) {
        self.erc1155.initializer("");
        self.accesscontrol.initializer();

        // Get deployer account from transaction info
        let deployer_account = starknet::get_tx_info().unbox().account_contract_address;
        self.accesscontrol._grant_role(DEFAULT_ADMIN_ROLE, deployer_account);

        // Grant MINTER_ROLE to game_system and shop_system via world DNS
        let world = self.world(@DEFAULT_NS());
        
        // Grant to game_system
        match world.dns_address(@"game_system") {
            Option::Some(game_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, game_system);
            },
            Option::None => {},
        };

        // Grant to shop_system
        match world.dns_address(@"shop_system") {
            Option::Some(shop_system) => {
                self.accesscontrol._grant_role(MINTER_ROLE, shop_system);
            },
            Option::None => {},
        };
    }

    #[abi(embed_v0)]
    impl CubeTokenImpl of ICubeToken<ContractState> {
        fn mint(ref self: ContractState, recipient: ContractAddress, amount: u256) {
            self.accesscontrol.assert_only_role(MINTER_ROLE);
            self.erc1155.update(
                Zero::zero(),  // from = 0 (mint)
                recipient,
                array![CUBE_TOKEN_ID].span(),
                array![amount].span()
            );
        }

        fn burn(ref self: ContractState, account: ContractAddress, amount: u256) {
            // Allow if caller is the account owner OR has MINTER_ROLE
            let caller = get_caller_address();
            if account != caller {
                // Must have MINTER_ROLE to burn on behalf of others
                self.accesscontrol.assert_only_role(MINTER_ROLE);
            }
            self.erc1155.update(
                account,
                Zero::zero(),  // to = 0 (burn)
                array![CUBE_TOKEN_ID].span(),
                array![amount].span()
            );
        }

        fn balance_of_cubes(self: @ContractState, account: ContractAddress) -> u256 {
            self.erc1155.balance_of(account, CUBE_TOKEN_ID)
        }
    }

    #[abi(embed_v0)]
    impl ERC1155MetadataImpl of IERC1155Metadata<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            "zKube Cubes"
        }

        fn symbol(self: @ContractState) -> ByteArray {
            "CUBE"
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
                    contract_name: "ERC1155",
                    instance_name: format!("{}", instance_name),
                    contract_address: cube_token_address,
                    block_number: 1,
                );
        }
    }
}
