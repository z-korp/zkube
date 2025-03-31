// Starknet imports

use starknet::ContractAddress;

// Dojo imports

use dojo::world::{WorldStorage, WorldStorageTrait};

// External imports

use stark_vrf::ecvrf::{Proof, Point, ECVRFTrait};

// Internal imports

use zkube::types::bonus::Bonus;
use zkube::types::mode::Mode;
use zkube::models::settings::{Settings, SettingsTrait, SettingsAssert};
use zkube::store::{Store, StoreTrait};

#[starknet::interface]
trait IPlay<T> {
    fn create(
        ref self: T, token_id: u256, mode: Mode, proof: Proof, seed: felt252, beta: felt252
    ) -> u32;
    fn surrender(ref self: T);
    fn move(ref self: T, row_index: u8, start_index: u8, final_index: u8,);
    fn apply_bonus(ref self: T, bonus: Bonus, row_index: u8, line_index: u8);
}

#[dojo::contract]
mod play {
    // Starknet imports

    use starknet::{ContractAddress, ClassHash, Felt252TryIntoContractAddress};
    use starknet::info::{
        get_block_timestamp, get_block_number, get_caller_address, get_contract_address
    };

    // Component imports

    use zkube::components::hostable::HostableComponent;
    use zkube::components::playable::PlayableComponent;
    use zkube::systems::chest::{IChestDispatcher, IChestDispatcherTrait};
    use zkube::systems::zkorp::{IZKorpDispatcher, IZKorpDispatcherTrait};
    use zkube::systems::tournament::{ITournamentSystemDispatcher, ITournamentSystemDispatcherTrait};
    use zkube::interfaces::ierc721_game_credits::{
        ierc721_game_credits, IERC721GameCreditsDispatcherTrait
    };

    // Game standard implementations
    use tournaments::components::game::game_component;
    use tournaments::components::interfaces::{IGameDetails, IGameToken, ISettings};
    use tournaments::components::libs::lifecycle::{LifecycleAssertionsImpl, LifecycleAssertionsTrait};
    use tournaments::components::models::game::{TokenMetadata};
    use tournaments::components::models::lifecycle::{Lifecycle};

    // Local imports

    use super::{
        IPlay, Proof, Bonus, Mode, Settings, SettingsTrait, SettingsAssert, Store, StoreTrait,
        WorldStorage, WorldStorageTrait,
    };

    // Components

    component!(path: HostableComponent, storage: hostable, event: HostableEvent);
    impl HostableInternalImpl = HostableComponent::InternalImpl<ContractState>;
    component!(path: PlayableComponent, storage: playable, event: PlayableEvent);
    impl PlayableInternalImpl = PlayableComponent::InternalImpl<ContractState>;
    component!(path: game_component, storage: game, event: GameEvent);

    #[abi(embed_v0)]
    impl GameImpl = game_component::GameImpl<ContractState>;
    impl GameInternalImpl = game_component::InternalImpl<ContractState>;

    // Storage

    #[storage]
    struct Storage {
        #[substorage(v0)]
        hostable: HostableComponent::Storage,
        #[substorage(v0)]
        playable: PlayableComponent::Storage,
        #[substorage(v0)]
        game: game_component::Storage,
    }

    // Events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        HostableEvent: HostableComponent::Event,
        #[flat]
        PlayableEvent: PlayableComponent::Event,
        #[flat]
        GameEvent: GameComponent::Event,
    }

    // Constructor

    fn dojo_init(ref self: ContractState) {
        self.erc721.initializer("zKube Games", "ZKUBE", "zkube.games");
        self
            .game
            .initializer(
                creator_address,
                'zKube',
                "Dark Shuffle is a turn-based, collectible card game. Build your deck, battle monsters, and explore a procedurally generated world.",
                'zKorp',
                'zKorp',
                'Strategy',
                "https://zkube.vercel.app/assets/pwa-512x512.png",
                DEFAULT_NS(),
                'Game',
                'score',
                'Settings',
            );
    }

    // Required Game Standard implementations
    #[abi(embed_v0)]
    impl SettingsImpl of ISettings<ContractState> {
        fn setting_exists(self: @ContractState, settings_id: u32) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            settings.exists()
        }
    }

    #[abi(embed_v0)]
    impl GameDetailsImpl of IGameDetails<ContractState> {
        fn score(self: @ContractState, game_id: u64) -> u32 {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let game: Game = world.read_model(game_id);
            game.hero_xp.into()
        }
    }

    // Implementations

    #[abi(embed_v0)]
    impl PlayImpl of IPlay<ContractState> {
        fn create(
            ref self: ContractState,
            token_id: u256,
            mode: Mode, // handle in settings?
            proof: Proof, // replace with cartridge vrf?
            seed: felt252, // replace with cartridge vrf?
            beta: felt252, // replace with cartridge vrf?
        ) -> u32 {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);

            let settings = store.settings();
            // [Check] Games are not paused
            settings.assert_are_games_unpaused();

            // [Effect] Create a game
            let (
                game_id,
                tournament_id,
                tournament_amount,
                chest_amount,
                referrer_amount,
                zkorp_amount
            ) =
                self
                .hostable
                ._create(world, proof, seed, beta, mode, price);

            if (mode != Mode::Free) {
                // [Effect] Burn the nft
                erc721.burn(token_id);
            }

            // [Return] Game ID
            game_id
        }

        fn surrender(ref self: ContractState) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to surrender otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

            self.playable._surrender(world);
        }

        fn move(ref self: ContractState, row_index: u8, start_index: u8, final_index: u8,) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to move otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

            self.playable._move(world, row_index, start_index, final_index);
        }

        fn apply_bonus(ref self: ContractState, bonus: Bonus, row_index: u8, line_index: u8) {
            let mut world = self.world_default();
            let store = StoreTrait::new(world);
            let settings = store.settings();

            // [Check] If we unlocked the chests, we don't want users to be able
            // to apply_bonus otherwise it will mess up the reward distribution
            // Worst case we refund those users
            settings.assert_are_chests_locked();

            self.playable._apply_bonus(world, bonus, row_index, line_index);
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
