use starknet::ContractAddress;
use zkube::models::config::{GameSettings, GameSettingsMetadata};
use zkube::types::difficulty::Difficulty;

#[starknet::interface]
pub trait IConfigSystem<T> {
    /// Add new game settings with default values for a given difficulty
    fn add_game_settings(
        ref self: T, name: felt252, description: ByteArray, difficulty: Difficulty,
    ) -> u32;

    /// Add new game settings with custom parameters
    fn add_custom_game_settings(
        ref self: T,
        name: felt252,
        description: ByteArray,
        difficulty: Difficulty,
        // Level Scaling
        base_moves: u16,
        max_moves: u16,
        base_ratio_x100: u16,
        max_ratio_x100: u16,
        // Difficulty Progression (non-linear tier thresholds)
        // Difficulty Progression (non-linear tier thresholds)
        tier_1_threshold: u8,
        tier_2_threshold: u8,
        tier_3_threshold: u8,
        tier_4_threshold: u8,
        tier_5_threshold: u8,
        tier_6_threshold: u8,
        tier_7_threshold: u8,
        // Constraint Settings
        constraints_enabled: u8,
        constraint_start_level: u8,
        // Constraint Distribution (packed - use pack_constraint_* helpers)
        constraint_lines_budgets: u64, // Packed: lines(4x4bits) + budgets(4x8bits) + times(2x4bits)
        constraint_chances: u32, // Packed: dual_chance(2x8bits) + secondary_no_bonus(2x8bits)
        // Block Distribution (VeryEasy to Master scaling)
        veryeasy_size1_weight: u8,
        veryeasy_size2_weight: u8,
        veryeasy_size3_weight: u8,
        veryeasy_size4_weight: u8,
        veryeasy_size5_weight: u8,
        master_size1_weight: u8,
        master_size2_weight: u8,
        master_size3_weight: u8,
        master_size4_weight: u8,
        master_size5_weight: u8,
        // Variance Settings
        early_variance_percent: u8,
        mid_variance_percent: u8,
        late_variance_percent: u8,
        // Level Tier Thresholds
        early_level_threshold: u8,
        mid_level_threshold: u8,
        // Level Cap
        level_cap: u8,
    ) -> u32;

    fn get_game_settings(self: @T, settings_id: u32) -> GameSettings;
    fn get_game_settings_metadata(self: @T, settings_id: u32) -> GameSettingsMetadata;
    /// Purchase access to a paid map
    fn purchase_map(ref self: T, settings_id: u32);
    /// Check if a player has access to a map (free or purchased)
    fn has_map_access(self: @T, player: ContractAddress, settings_id: u32) -> bool;
    /// Admin: set map pricing
    fn set_map_pricing(
        ref self: T,
        settings_id: u32,
        is_free: bool,
        price: u256,
        payment_token: ContractAddress,
    );
    /// Admin: set map enabled/disabled
    fn set_map_enabled(ref self: T, settings_id: u32, enabled: bool);
    /// Admin: set map theme
    fn set_map_theme(ref self: T, settings_id: u32, theme_id: u8);
    fn settings_exists(self: @T, settings_id: u32) -> bool;
}

#[dojo::contract]
mod config_system {
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_embeddable_game_standard::minigame::extensions::settings::interface::{
        IMinigameSettings, IMinigameSettingsDetails,
    };
    use game_components_embeddable_game_standard::minigame::extensions::settings::settings::SettingsComponent;
    use game_components_embeddable_game_standard::minigame::extensions::settings::structs::{
        GameSetting, GameSettingDetails,
    };
    use game_components_embeddable_game_standard::minigame::interface::{
        IMinigameDispatcher, IMinigameDispatcherTrait,
    };
    use openzeppelin_interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use core::num::traits::Zero;
    use zkube::constants::DEFAULT_NS;
    use zkube::constants::DEFAULT_SETTINGS::{
        DEFAULT_SETTINGS_ID, GET_DEFAULT_SETTINGS, GET_DEFAULT_SETTINGS_METADATA,
    };
    use zkube::helpers::encoding::U256BytesUsedTraitImpl;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
    use zkube::models::entitlement::MapEntitlement;
    use zkube::types::difficulty::Difficulty;
    use super::IConfigSystem;

    component!(path: SettingsComponent, storage: settings, event: SettingsEvent);
    component!(path: SRC5Component, storage: src5, event: SRC5Event);

    impl SettingsInternalImpl = SettingsComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl SRC5Impl = SRC5Component::SRC5Impl<ContractState>;

    #[storage]
    struct Storage {
        settings_counter: u32,
        cube_token_address: ContractAddress,
        #[substorage(v0)]
        settings: SettingsComponent::Storage,
        #[substorage(v0)]
        src5: SRC5Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        GameSettingsCreated: GameSettingsCreated,
        #[flat]
        SettingsEvent: SettingsComponent::Event,
        #[flat]
        SRC5Event: SRC5Component::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct GameSettingsCreated {
        settings_id: u32,
        name: felt252,
        difficulty: Difficulty,
        created_by: ContractAddress,
    }

    fn dojo_init(
        ref self: ContractState,
        creator_address: ContractAddress,
        cube_token_address: ContractAddress,
    ) {
        let mut world: WorldStorage = self.world(@DEFAULT_NS());
        self.settings.initializer();
        self.cube_token_address.write(cube_token_address);

        let current_timestamp = get_block_timestamp();

        // Create only the official default settings (ID 0)
        // Only games using these settings can mint cubes and track quest progress
        world.write_model(GET_DEFAULT_SETTINGS());
        world.write_model(GET_DEFAULT_SETTINGS_METADATA(current_timestamp, creator_address));

        // Register Map 2: Feudal Japan (paid)
        let japan_settings_id = 1_u32;
        let japan_settings = GameSettingsTrait::new_with_defaults(
            japan_settings_id, Difficulty::Increasing,
        );
        let japan_metadata = GameSettingsMetadata {
            settings_id: japan_settings_id,
            name: 'Feudal Japan',
            description: "Fast-paced puzzle action set in feudal Japan.",
            created_by: creator_address,
            created_at: current_timestamp,
            theme_id: 5,
            is_free: false,
            enabled: true,
            price: 0,
            payment_token: Zero::zero(),
        };
        world.write_model(@japan_settings);
        world.write_model(@japan_metadata);

        // Register Map 3: Ancient Persia (paid)
        let persia_settings_id = 2_u32;
        let persia_settings = GameSettingsTrait::new_with_defaults(
            persia_settings_id, Difficulty::Increasing,
        );
        let persia_metadata = GameSettingsMetadata {
            settings_id: persia_settings_id,
            name: 'Ancient Persia',
            description: "Strategic puzzle play in the heart of ancient Persia.",
            created_by: creator_address,
            created_at: current_timestamp,
            theme_id: 7,
            is_free: false,
            enabled: true,
            price: 0,
            payment_token: Zero::zero(),
        };
        world.write_model(@persia_settings);
        world.write_model(@persia_metadata);

        // Counter starts at 2 so next custom settings will be 3+
        self.settings_counter.write(persia_settings_id);

        let (game_systems_address, _) = world.dns(@"game_system").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
        let minigame_token_address = minigame_dispatcher.token_address();

        if !minigame_token_address.is_zero() {
            self
                .settings
                .create_settings(
                    game_systems_address,
                    DEFAULT_SETTINGS_ID,
                    GameSettingDetails {
                        name: "Default",
                        description: "zKube default settings with zone-based progressive difficulty.",
                        settings: array![GameSetting { name: 'MODE', value: 'PROGRESSIVE' }].span(),
                    },
                    minigame_token_address,
                );
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings.exists()
        }

        fn settings_exist_batch(self: @ContractState, settings_ids: Span<u32>) -> Array<bool> {
            let mut exists_batch = array![];
            let mut i: u32 = 0;

            loop {
                if i >= settings_ids.len() {
                    break;
                }

                let settings_id = *settings_ids.at(i);
                exists_batch.append(self.settings_exist(settings_id));
                i += 1;
            };

            exists_batch
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
        fn settings_count(self: @ContractState) -> u32 {
            self.settings_counter.read() + 1
        }

        fn settings_details(self: @ContractState, settings_id: u32) -> GameSettingDetails {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings: GameSettings = world.read_model(settings_id);
            let metadata: GameSettingsMetadata = world.read_model(settings_id);

            GameSettingDetails {
                name: felt_to_bytearray(metadata.name),
                description: metadata.description.clone(),
                settings: generate_settings_array(settings),
            }
        }

        fn settings_details_batch(
            self: @ContractState, settings_ids: Span<u32>,
        ) -> Array<GameSettingDetails> {
            let mut details_batch = array![];
            let mut i: u32 = 0;

            loop {
                if i >= settings_ids.len() {
                    break;
                }

                let settings_id = *settings_ids.at(i);
                details_batch.append(self.settings_details(settings_id));
                i += 1;
            };

            details_batch
        }
    }

    #[abi(embed_v0)]
    impl ConfigSystemImpl of IConfigSystem<ContractState> {
        fn add_game_settings(
            ref self: ContractState, name: felt252, description: ByteArray, difficulty: Difficulty,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');

            // Get the world dispatcher
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Increment settings counter
            let mut settings_id = self.settings_counter.read();
            settings_id += 1;
            self.settings_counter.write(settings_id);

            // Create the game settings with defaults
            let game_settings = GameSettingsTrait::new_with_defaults(settings_id, difficulty);

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
                theme_id: 1,
                is_free: true,
                enabled: true,
                price: 0,
                payment_token: Zero::zero(),
            };

            // Save to world
            world.write_model(@game_settings);
            world.write_model(@metadata);

            // Emit event
            self
                .emit(
                    GameSettingsCreated {
                        settings_id, name, difficulty, created_by: get_caller_address(),
                    },
                );

            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher {
                contract_address: game_systems_address,
            };
            let minigame_token_address = minigame_dispatcher.token_address();

            self
                .settings
                .create_settings(
                    game_systems_address,
                    settings_id,
                    GameSettingDetails {
                        name: felt_to_bytearray(name),
                        description: description.clone(),
                        settings: generate_settings_array(game_settings),
                    },
                    minigame_token_address,
                );

            settings_id
        }

        fn add_custom_game_settings(
            ref self: ContractState,
            name: felt252,
            description: ByteArray,
            difficulty: Difficulty,
            // Level Scaling
            base_moves: u16,
            max_moves: u16,
            base_ratio_x100: u16,
            max_ratio_x100: u16,
            // Difficulty Progression (non-linear tier thresholds)
            // Difficulty Progression (non-linear tier thresholds)
            tier_1_threshold: u8,
            tier_2_threshold: u8,
            tier_3_threshold: u8,
            tier_4_threshold: u8,
            tier_5_threshold: u8,
            tier_6_threshold: u8,
            tier_7_threshold: u8,
            // Constraint Settings
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint Distribution (packed)
            constraint_lines_budgets: u64,
            constraint_chances: u32,
            // Block Distribution (VeryEasy to Master)
            veryeasy_size1_weight: u8,
            veryeasy_size2_weight: u8,
            veryeasy_size3_weight: u8,
            veryeasy_size4_weight: u8,
            veryeasy_size5_weight: u8,
            master_size1_weight: u8,
            master_size2_weight: u8,
            master_size3_weight: u8,
            master_size4_weight: u8,
            master_size5_weight: u8,
            // Variance Settings
            early_variance_percent: u8,
            mid_variance_percent: u8,
            late_variance_percent: u8,
            // Level Tier Thresholds
            early_level_threshold: u8,
            mid_level_threshold: u8,
            // Level Cap
            level_cap: u8,
        ) -> u32 {
            // Validate input
            assert(difficulty != Difficulty::None, 'Invalid difficulty');
            self
                ._validate_settings(
                    base_moves,
                    max_moves,
                    base_ratio_x100,
                    max_ratio_x100,
                    tier_1_threshold,
                    tier_2_threshold,
                    tier_3_threshold,
                    tier_4_threshold,
                    tier_5_threshold,
                    tier_6_threshold,
                    tier_7_threshold,
                    constraints_enabled,
                    constraint_start_level,
                    constraint_lines_budgets,
                    constraint_chances,
                    veryeasy_size1_weight,
                    veryeasy_size2_weight,
                    veryeasy_size3_weight,
                    veryeasy_size4_weight,
                    veryeasy_size5_weight,
                    master_size1_weight,
                    master_size2_weight,
                    master_size3_weight,
                    master_size4_weight,
                    master_size5_weight,
                    early_variance_percent,
                    mid_variance_percent,
                    late_variance_percent,
                    early_level_threshold,
                    mid_level_threshold,
                    level_cap,
                );

            // Get the world dispatcher
            let mut world: WorldStorage = self.world(@DEFAULT_NS());

            // Increment settings counter
            let mut settings_id = self.settings_counter.read();
            settings_id += 1;
            self.settings_counter.write(settings_id);

            // Create the game settings with custom values
            let game_settings = GameSettings {
                settings_id,
                mode: difficulty.into(),
                // Level Scaling
                base_moves,
                max_moves,
                base_ratio_x100,
                max_ratio_x100,
                // Difficulty Progression (non-linear tier thresholds)
                // Difficulty Progression (non-linear tier thresholds)
                tier_1_threshold,
                tier_2_threshold,
                tier_3_threshold,
                tier_4_threshold,
                tier_5_threshold,
                tier_6_threshold,
                tier_7_threshold,
                // Constraint Settings
                constraints_enabled,
                constraint_start_level,
                // Constraint Distribution (packed)
                constraint_lines_budgets,
                constraint_chances,
                // Block Distribution (VeryEasy to Master)
                veryeasy_size1_weight,
                veryeasy_size2_weight,
                veryeasy_size3_weight,
                veryeasy_size4_weight,
                veryeasy_size5_weight,
                master_size1_weight,
                master_size2_weight,
                master_size3_weight,
                master_size4_weight,
                master_size5_weight,
                // Variance Settings
                early_variance_percent,
                mid_variance_percent,
                late_variance_percent,
                // Level Tier Thresholds
                early_level_threshold,
                mid_level_threshold,
                // Level Cap
                level_cap,
                // Mutator Settings (default: none)
                allowed_mutators: 0,
                // Endless Mode Settings (defaults)
                endless_difficulty_thresholds: 0,
                endless_score_multipliers: 0,
            };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
                theme_id: 1,
                is_free: true,
                enabled: true,
                price: 0,
                payment_token: Zero::zero(),
            };

            // Save to world
            world.write_model(@game_settings);
            world.write_model(@metadata);

            // Emit event
            self
                .emit(
                    GameSettingsCreated {
                        settings_id, name, difficulty, created_by: get_caller_address(),
                    },
                );

            let (game_systems_address, _) = world.dns(@"game_system").unwrap();
            let minigame_dispatcher = IMinigameDispatcher {
                contract_address: game_systems_address,
            };
            let minigame_token_address = minigame_dispatcher.token_address();

            self
                .settings
                .create_settings(
                    game_systems_address,
                    settings_id,
                    GameSettingDetails {
                        name: felt_to_bytearray(name),
                        description: description.clone(),
                        settings: generate_settings_array(game_settings),
                    },
                    minigame_token_address,
                );

            settings_id
        }

        fn get_game_settings(self: @ContractState, settings_id: u32) -> GameSettings {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn get_game_settings_metadata(
            self: @ContractState, settings_id: u32,
        ) -> GameSettingsMetadata {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            world.read_model(settings_id)
        }

        fn purchase_map(ref self: ContractState, settings_id: u32) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let caller = get_caller_address();

            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            assert!(metadata.enabled, "Map is not available");
            assert!(!metadata.is_free, "Map is free, no purchase needed");
            assert!(!metadata.price.is_zero(), "Map has no price set");
            assert!(!metadata.payment_token.is_zero(), "Map has no payment token set");

            let existing: MapEntitlement = world.read_model((caller, settings_id));
            assert!(existing.purchased_at == 0, "Map already purchased");

            let erc20 = IERC20Dispatcher { contract_address: metadata.payment_token };
            let success = erc20.transfer_from(caller, starknet::get_contract_address(), metadata.price);
            assert!(success, "Payment transfer failed");

            let entitlement = MapEntitlement {
                player: caller,
                settings_id,
                purchased_at: get_block_timestamp(),
            };
            world.write_model(@entitlement);
        }

        fn has_map_access(
            self: @ContractState, player: ContractAddress, settings_id: u32,
        ) -> bool {
            let world: WorldStorage = self.world(@DEFAULT_NS());
            let metadata: GameSettingsMetadata = world.read_model(settings_id);
            if metadata.is_free {
                return true;
            }

            let entitlement: MapEntitlement = world.read_model((player, settings_id));
            entitlement.purchased_at != 0
        }

        fn set_map_pricing(
            ref self: ContractState,
            settings_id: u32,
            is_free: bool,
            price: u256,
            payment_token: ContractAddress,
        ) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.is_free = is_free;
            metadata.price = price;
            metadata.payment_token = payment_token;
            world.write_model(@metadata);
        }

        fn set_map_enabled(ref self: ContractState, settings_id: u32, enabled: bool) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.enabled = enabled;
            world.write_model(@metadata);
        }

        fn set_map_theme(ref self: ContractState, settings_id: u32, theme_id: u8) {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let mut metadata: GameSettingsMetadata = world.read_model(settings_id);
            metadata.theme_id = theme_id;
            world.write_model(@metadata);
        }

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings = world.read_model(settings_id);
            settings.exists()
        }

    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Unpack constraint_lines_budgets field
        fn _unpack_lines_budgets(packed: u64) -> (u8, u8, u8, u8, u8, u8, u8, u8, u8, u8) {
            let veryeasy_min_lines: u8 = (packed & 0xF).try_into().unwrap();
            let master_min_lines: u8 = ((packed / 0x10) & 0xF).try_into().unwrap();
            let veryeasy_max_lines: u8 = ((packed / 0x100) & 0xF).try_into().unwrap();
            let master_max_lines: u8 = ((packed / 0x1000) & 0xF).try_into().unwrap();
            let veryeasy_budget_min: u8 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
            let veryeasy_budget_max: u8 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
            let master_budget_min: u8 = ((packed / 0x100000000) & 0xFF).try_into().unwrap();
            let master_budget_max: u8 = ((packed / 0x10000000000) & 0xFF).try_into().unwrap();
            let veryeasy_min_times: u8 = ((packed / 0x1000000000000) & 0xF).try_into().unwrap();
            let master_min_times: u8 = ((packed / 0x10000000000000) & 0xF).try_into().unwrap();
            (
                veryeasy_min_lines,
                master_min_lines,
                veryeasy_max_lines,
                master_max_lines,
                veryeasy_budget_min,
                veryeasy_budget_max,
                master_budget_min,
                master_budget_max,
                veryeasy_min_times,
                master_min_times,
            )
        }

        /// Unpack constraint_chances field
        fn _unpack_chances(packed: u32) -> (u8, u8, u8, u8) {
            let veryeasy_dual_chance: u8 = (packed & 0xFF).try_into().unwrap();
            let master_dual_chance: u8 = ((packed / 0x100) & 0xFF).try_into().unwrap();
            let veryeasy_secondary_no_bonus: u8 = ((packed / 0x10000) & 0xFF).try_into().unwrap();
            let master_secondary_no_bonus: u8 = ((packed / 0x1000000) & 0xFF).try_into().unwrap();
            (
                veryeasy_dual_chance,
                master_dual_chance,
                veryeasy_secondary_no_bonus,
                master_secondary_no_bonus,
            )
        }

        fn _validate_settings(
            self: @ContractState,
            base_moves: u16,
            max_moves: u16,
            base_ratio_x100: u16,
            max_ratio_x100: u16,
            // Difficulty tier thresholds
            tier_1_threshold: u8,
            tier_2_threshold: u8,
            tier_3_threshold: u8,
            tier_4_threshold: u8,
            tier_5_threshold: u8,
            tier_6_threshold: u8,
            tier_7_threshold: u8,
            constraints_enabled: u8,
            constraint_start_level: u8,
            // Constraint distribution (packed)
            constraint_lines_budgets: u64,
            constraint_chances: u32,
            // Block distribution (VeryEasy to Master)
            veryeasy_size1_weight: u8,
            veryeasy_size2_weight: u8,
            veryeasy_size3_weight: u8,
            veryeasy_size4_weight: u8,
            veryeasy_size5_weight: u8,
            master_size1_weight: u8,
            master_size2_weight: u8,
            master_size3_weight: u8,
            master_size4_weight: u8,
            master_size5_weight: u8,
            // Variance settings
            early_variance_percent: u8,
            mid_variance_percent: u8,
            late_variance_percent: u8,
            early_level_threshold: u8,
            mid_level_threshold: u8,
            level_cap: u8,
        ) {
            // Validate moves
            assert!(base_moves > 0, "Base moves must be positive");
            assert!(max_moves >= base_moves, "Max moves must be >= base moves");
            assert!(max_moves <= 255, "Max moves cannot exceed 255");

            // Validate ratios
            assert!(base_ratio_x100 > 0, "Base ratio must be positive");
            assert!(max_ratio_x100 >= base_ratio_x100, "Max ratio must be >= base ratio");

            // Validate difficulty tier thresholds (must be in ascending order)
            assert!(tier_1_threshold >= 2, "Tier 1 must be >= 2 (at least 1 VeryEasy level)");
            assert!(tier_2_threshold > tier_1_threshold, "Tier 2 must be > tier 1");
            assert!(tier_3_threshold > tier_2_threshold, "Tier 3 must be > tier 2");
            assert!(tier_4_threshold > tier_3_threshold, "Tier 4 must be > tier 3");
            assert!(tier_5_threshold > tier_4_threshold, "Tier 5 must be > tier 4");
            assert!(tier_6_threshold > tier_5_threshold, "Tier 6 must be > tier 5");
            assert!(tier_7_threshold > tier_6_threshold, "Tier 7 must be > tier 6");

            // Validate constraint settings
            assert!(constraints_enabled <= 1, "Constraints enabled must be 0 or 1");
            // constraint_start_level can be any value (high value = no constraints early)

            // Unpack constraint values for validation
            let (
                _veryeasy_min_lines,
                _master_min_lines,
                _veryeasy_max_lines,
                _master_max_lines,
                _veryeasy_budget_min_raw,
                veryeasy_budget_max,
                _master_budget_min_raw,
                master_budget_max,
                _veryeasy_min_times,
                _master_min_times,
            ) =
                Self::_unpack_lines_budgets(
                constraint_lines_budgets,
            );
            let (
                veryeasy_dual_chance,
                master_dual_chance,
                veryeasy_secondary_no_bonus,
                master_secondary_no_bonus,
            ) =
                Self::_unpack_chances(
                constraint_chances,
            );

            // Budget-only constraint model: budget_min is derived from budget_max (70% ceil).
            assert!(master_budget_max > 0, "Master budget_max must be > 0");
            let veryeasy_budget_min: u16 = (veryeasy_budget_max.into() * 70 + 99) / 100;
            let master_budget_min: u16 = (master_budget_max.into() * 70 + 99) / 100;
            assert!(
                veryeasy_budget_min <= veryeasy_budget_max.into(),
                "Derived VeryEasy budget_min must be <= budget_max",
            );
            assert!(
                master_budget_min <= master_budget_max.into(),
                "Derived Master budget_min must be <= budget_max",
            );

            // Validate dual chance and secondary no bonus chance
            assert!(veryeasy_dual_chance <= 100, "VeryEasy dual chance must be <= 100");
            assert!(master_dual_chance <= 100, "Master dual chance must be <= 100");
            assert!(
                veryeasy_secondary_no_bonus <= 100, "VeryEasy secondary no bonus must be <= 100",
            );
            assert!(master_secondary_no_bonus <= 100, "Master secondary no bonus must be <= 100");

            // Validate block weights (must have at least some weight to generate blocks)
            let veryeasy_total: u16 = veryeasy_size1_weight.into()
                + veryeasy_size2_weight.into()
                + veryeasy_size3_weight.into()
                + veryeasy_size4_weight.into()
                + veryeasy_size5_weight.into();
            let master_total: u16 = master_size1_weight.into()
                + master_size2_weight.into()
                + master_size3_weight.into()
                + master_size4_weight.into()
                + master_size5_weight.into();
            assert!(veryeasy_total > 0, "VeryEasy block weights must sum to > 0");
            assert!(master_total > 0, "Master block weights must sum to > 0");

            // Validate variance settings
            assert!(early_variance_percent <= 50, "Early variance must be <= 50%");
            assert!(mid_variance_percent <= 50, "Mid variance must be <= 50%");
            assert!(late_variance_percent <= 50, "Late variance must be <= 50%");

            // Validate level tier thresholds
            assert!(
                early_level_threshold < mid_level_threshold,
                "Early threshold must be < mid threshold",
            );

            // Validate level cap
            assert!(level_cap > 0, "Level cap must be positive");
            assert!(mid_level_threshold <= level_cap, "Mid threshold must be <= level cap");

        }
    }

    fn felt_to_bytearray(word: felt252) -> ByteArray {
        let mut bytes = Default::default();
        if word != 0 {
            bytes.append_word(word, U256BytesUsedTraitImpl::bytes_used(word.into()).into());
        }
        bytes
    }

    fn generate_settings_array(game_settings: GameSettings) -> Span<GameSetting> {
        array![
            GameSetting { name: 'MODE', value: difficulty_label(game_settings.get_mode()) },
            GameSetting { name: 'BASE_MOVES', value: game_settings.base_moves.into() },
            GameSetting { name: 'MAX_MOVES', value: game_settings.max_moves.into() },
            GameSetting { name: 'BASE_RATIO', value: game_settings.base_ratio_x100.into() },
            GameSetting { name: 'MAX_RATIO', value: game_settings.max_ratio_x100.into() },
            GameSetting { name: 'TIER1', value: game_settings.tier_1_threshold.into() },
            GameSetting { name: 'TIER2', value: game_settings.tier_2_threshold.into() },
            GameSetting { name: 'TIER3', value: game_settings.tier_3_threshold.into() },
            GameSetting { name: 'TIER4', value: game_settings.tier_4_threshold.into() },
            GameSetting { name: 'TIER5', value: game_settings.tier_5_threshold.into() },
            GameSetting { name: 'TIER6', value: game_settings.tier_6_threshold.into() },
            GameSetting { name: 'TIER7', value: game_settings.tier_7_threshold.into() },
            GameSetting { name: 'CONS_EN', value: game_settings.constraints_enabled.into() },
            GameSetting { name: 'CONS_START', value: game_settings.constraint_start_level.into() },
            GameSetting { name: 'LINES_BUDGET', value: game_settings.constraint_lines_budgets.into() },
            GameSetting { name: 'CHANCES', value: game_settings.constraint_chances.into() },
            GameSetting { name: 'VE_S1', value: game_settings.veryeasy_size1_weight.into() },
            GameSetting { name: 'VE_S2', value: game_settings.veryeasy_size2_weight.into() },
            GameSetting { name: 'VE_S3', value: game_settings.veryeasy_size3_weight.into() },
            GameSetting { name: 'VE_S4', value: game_settings.veryeasy_size4_weight.into() },
            GameSetting { name: 'VE_S5', value: game_settings.veryeasy_size5_weight.into() },
            GameSetting { name: 'MA_S1', value: game_settings.master_size1_weight.into() },
            GameSetting { name: 'MA_S2', value: game_settings.master_size2_weight.into() },
            GameSetting { name: 'MA_S3', value: game_settings.master_size3_weight.into() },
            GameSetting { name: 'MA_S4', value: game_settings.master_size4_weight.into() },
            GameSetting { name: 'MA_S5', value: game_settings.master_size5_weight.into() },
            GameSetting { name: 'VAR_E', value: game_settings.early_variance_percent.into() },
            GameSetting { name: 'VAR_M', value: game_settings.mid_variance_percent.into() },
            GameSetting { name: 'VAR_L', value: game_settings.late_variance_percent.into() },
            GameSetting { name: 'EARLY_TH', value: game_settings.early_level_threshold.into() },
            GameSetting { name: 'MID_TH', value: game_settings.mid_level_threshold.into() },
            GameSetting { name: 'LEVEL_CAP', value: game_settings.level_cap.into() },
        ]
            .span()
    }

    fn difficulty_label(difficulty: Difficulty) -> felt252 {
        match difficulty {
            Difficulty::None => 'NONE',
            Difficulty::Increasing => 'INCREASING',
            Difficulty::VeryEasy => 'VERY_EASY',
            Difficulty::Easy => 'EASY',
            Difficulty::Medium => 'MEDIUM',
            Difficulty::MediumHard => 'MEDIUM_HARD',
            Difficulty::Hard => 'HARD',
            Difficulty::VeryHard => 'VERY_HARD',
            Difficulty::Expert => 'EXPERT',
            Difficulty::Master => 'MASTER',
        }
    }
}
