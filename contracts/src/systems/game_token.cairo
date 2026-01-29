// SPDX-License-Identifier: MIT

use starknet::ContractAddress;

/// Custom interface for game token functions not provided by MinigameComponent
/// Note: mint_game() and token_address() are provided by MinigameComponent::MinigameImpl
#[starknet::interface]
pub trait IGameTokenSystems<T> {
    /// Get the player name for a game token
    fn player_name(self: @T, game_id: u64) -> felt252;
}

#[dojo::contract]
mod game_token_systems {
    use core::num::traits::Zero;
    use zkube::constants::DEFAULT_NS;
    use zkube::models::game::{Game, GameTrait};

    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};

    use game_components_minigame::interface::IMinigameTokenData;
    use game_components_minigame::minigame::MinigameComponent;

    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::ContractAddress;

    // Components
    component!(path: MinigameComponent, storage: minigame, event: MinigameEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    #[abi(embed_v0)]
    impl MinigameImpl = MinigameComponent::MinigameImpl<ContractState>;
    impl MinigameInternalImpl = MinigameComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        minigame: MinigameComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        MinigameEvent: MinigameComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    /// @title Dojo Init
    /// @notice Initializes the contract and registers with the MinigameRegistry
    /// @dev This is the constructor for the contract. It is called once when the contract is
    /// deployed.
    ///
    /// @param creator_address: the address of the creator of the game
    /// @param denshokan_address: the address of the FullTokenContract (MinigameToken)
    /// @param renderer_address: optional renderer address, defaults to 'renderer_systems' if None
    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        denshokan_address: ContractAddress,
        renderer_address: Option<ContractAddress>,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        let (config_system_address, _) = world.dns(@"config_system").unwrap();

        // Use provided renderer address or default to 'renderer_systems'
        let final_renderer_address = match renderer_address {
            Option::Some(addr) => addr,
            Option::None => {
                // Try to get renderer_systems, but don't fail if it doesn't exist yet
                match world.dns(@"renderer_systems") {
                    Option::Some((addr, _)) => addr,
                    Option::None => {
                        // Use zero address as fallback - can be updated later
                        starknet::contract_address_const::<0>()
                    },
                }
            },
        };

        self
            .minigame
            .initializer(
                creator_address,
                "zKube",
                "zKube is an onchain puzzle roguelike with 100+ levels, constraints, and star ratings.",
                "zKorp",
                "zKorp",
                "Puzzle",
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                Option::Some("#3c2fba"),
                Option::None, // client_url
                if final_renderer_address.is_zero() {
                    Option::None
                } else {
                    Option::Some(final_renderer_address)
                }, // renderer address
                Option::Some(config_system_address), // settings_address
                Option::None, // objectives_address (using Cartridge arcade)
                denshokan_address,
            );
    }

    // ------------------------------------------ //
    // ------------ IMinigameTokenData ---------- //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl GameTokenDataImpl of IMinigameTokenData<ContractState> {
        fn score(self: @ContractState, token_id: u64) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            // Return total score as the "score" for token metadata
            game.get_total_score().into()
        }

        fn game_over(self: @ContractState, token_id: u64) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(token_id);
            game.over
        }
    }

    // ------------------------------------------ //
    // ------------ Game Token Systems ---------- //
    // ------------------------------------------ //

    #[abi(embed_v0)]
    impl GameTokenSystemsImpl of super::IGameTokenSystems<ContractState> {
        fn player_name(self: @ContractState, game_id: u64) -> felt252 {
            self.minigame.get_player_name(game_id)
        }
    }
}
