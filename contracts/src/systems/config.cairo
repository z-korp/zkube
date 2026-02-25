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
        // Cube Thresholds
        cube_3_percent: u8,
        cube_2_percent: u8,
        // Consumable Costs
        combo_cost: u8,
        score_cost: u8,
        harvest_cost: u8,
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
    fn settings_exists(self: @T, settings_id: u32) -> bool;
    fn get_cube_token_address(self: @T) -> ContractAddress;
}

#[dojo::contract]
mod config_system {
    use dojo::model::ModelStorage;
    use dojo::world::{WorldStorage, WorldStorageTrait};
    use game_components_minigame::extensions::settings::interface::{
        IMinigameSettings, IMinigameSettingsDetails,
    };
    use game_components_minigame::extensions::settings::settings::SettingsComponent;
    use game_components_minigame::extensions::settings::structs::{GameSetting, GameSettingDetails};
    use game_components_minigame::interface::{IMinigameDispatcher, IMinigameDispatcherTrait};
    use openzeppelin_introspection::src5::SRC5Component;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_block_timestamp, get_caller_address};
    use zkube::constants::DEFAULT_NS;
    use zkube::constants::DEFAULT_SETTINGS::{
        DEFAULT_SETTINGS_ID, GET_DEFAULT_SETTINGS, GET_DEFAULT_SETTINGS_METADATA,
    };
    use zkube::helpers::encoding::U256BytesUsedTraitImpl;
    use zkube::models::config::{GameSettings, GameSettingsMetadata, GameSettingsTrait};
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

        // Custom settings will start at ID 1
        self.settings_counter.write(DEFAULT_SETTINGS_ID);

        let (game_systems_address, _) = world.dns(@"game_system").unwrap();
        let minigame_dispatcher = IMinigameDispatcher { contract_address: game_systems_address };
        let minigame_token_address = minigame_dispatcher.token_address();

        self
            .settings
            .create_settings(
                game_systems_address,
                DEFAULT_SETTINGS_ID,
                "Default",
                "The official zKube settings with progressive difficulty. Games using these settings earn cubes, track quests, and appear on leaderboards.",
                array![GameSetting { name: "Difficulty", value: "Progressive" }].span(),
                minigame_token_address,
            );
    }

    #[abi(embed_v0)]
    impl MinigameSettingsImpl of IMinigameSettings<ContractState> {
        fn settings_exist(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let game_settings: GameSettings = world.read_model(settings_id);
            game_settings.exists()
        }
    }

    #[abi(embed_v0)]
    impl MinigameSettingsDetailsImpl of IMinigameSettingsDetails<ContractState> {
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
                    felt_to_bytearray(name),
                    description.clone(),
                    generate_settings_array(game_settings),
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
            // Cube Thresholds
            cube_3_percent: u8,
            cube_2_percent: u8,
            // Consumable Costs
            combo_cost: u8,
            score_cost: u8,
            harvest_cost: u8,
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
                    cube_3_percent,
                    cube_2_percent,
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
                // Cube Thresholds
                cube_3_percent,
                cube_2_percent,
                // Consumable Costs
                combo_cost,
                score_cost,
                harvest_cost,
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
            };

            // Create metadata
            let metadata = GameSettingsMetadata {
                settings_id,
                name,
                description: description.clone(),
                created_by: get_caller_address(),
                created_at: get_block_timestamp(),
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
                    felt_to_bytearray(name),
                    description.clone(),
                    generate_settings_array(game_settings),
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

        fn settings_exists(self: @ContractState, settings_id: u32) -> bool {
            let mut world: WorldStorage = self.world(@DEFAULT_NS());
            let settings = world.read_model(settings_id);
            settings.exists()
        }

        fn get_cube_token_address(self: @ContractState) -> ContractAddress {
            self.cube_token_address.read()
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
            cube_3_percent: u8,
            cube_2_percent: u8,
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

            // Validate cube thresholds
            assert!(cube_3_percent <= 100, "Cube 3 percent must be <= 100");
            assert!(cube_2_percent <= 100, "Cube 2 percent must be <= 100");
            assert!(cube_3_percent < cube_2_percent, "Cube 3 threshold must be < cube 2 threshold");

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
        // Unpack constraint values for display
        let (
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
        ) =
            game_settings
            .unpack_lines_budgets();
        let (
            veryeasy_dual_chance,
            master_dual_chance,
            veryeasy_secondary_no_bonus,
            master_secondary_no_bonus,
        ) =
            game_settings
            .unpack_chances();

        array![
            // Basic settings
            GameSetting { name: "Mode", value: difficulty_label(game_settings.get_mode()) },
            // Level Scaling
            GameSetting { name: "Base Moves", value: format!("{}", game_settings.base_moves) },
            GameSetting { name: "Max Moves", value: format!("{}", game_settings.max_moves) },
            GameSetting { name: "Base Ratio", value: format_ratio(game_settings.base_ratio_x100) },
            GameSetting { name: "Max Ratio", value: format_ratio(game_settings.max_ratio_x100) },
            // Cube Thresholds
            GameSetting {
                name: "3-Cube Threshold", value: format!("{}%", game_settings.cube_3_percent),
            },
            GameSetting {
                name: "2-Cube Threshold", value: format!("{}%", game_settings.cube_2_percent),
            },
            // Consumable Costs
            GameSetting { name: "Combo Cost", value: format!("{}", game_settings.combo_cost) },
            GameSetting { name: "Score Cost", value: format!("{}", game_settings.score_cost) },
            GameSetting { name: "Harvest Cost", value: format!("{}", game_settings.harvest_cost) },
            // Difficulty Progression (non-linear tier thresholds)
            GameSetting {
                name: "VeryEasy", value: format!("Levels 1-{}", game_settings.tier_1_threshold - 1),
            },
            GameSetting {
                name: "Easy",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_1_threshold,
                    game_settings.tier_2_threshold - 1,
                ),
            },
            GameSetting {
                name: "Medium",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_2_threshold,
                    game_settings.tier_3_threshold - 1,
                ),
            },
            GameSetting {
                name: "MediumHard",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_3_threshold,
                    game_settings.tier_4_threshold - 1,
                ),
            },
            GameSetting {
                name: "Hard",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_4_threshold,
                    game_settings.tier_5_threshold - 1,
                ),
            },
            GameSetting {
                name: "VeryHard",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_5_threshold,
                    game_settings.tier_6_threshold - 1,
                ),
            },
            GameSetting {
                name: "Expert",
                value: format!(
                    "Levels {}-{}",
                    game_settings.tier_6_threshold,
                    game_settings.tier_7_threshold - 1,
                ),
            },
            GameSetting {
                name: "Master", value: format!("Levels {}+", game_settings.tier_7_threshold),
            },
            // Constraint Settings
            GameSetting {
                name: "Constraints",
                value: if game_settings.constraints_enabled != 0 {
                    "Enabled"
                } else {
                    "Disabled"
                },
            },
            GameSetting {
                name: "Constraint Start",
                value: format!("Level {}", game_settings.constraint_start_level),
            },
            // Constraint Distribution (VeryEasy to Master)
            GameSetting {
                name: "Lines Range",
                value: format!(
                    "{}-{} to {}-{}",
                    veryeasy_min_lines,
                    veryeasy_max_lines,
                    master_min_lines,
                    master_max_lines,
                ),
            },
            GameSetting {
                name: "Budget Range",
                value: format!(
                    "{}-{} to {}-{}",
                    veryeasy_budget_min,
                    veryeasy_budget_max,
                    master_budget_min,
                    master_budget_max,
                ),
            },
            GameSetting {
                name: "Min Times", value: format!("{} to {}", veryeasy_min_times, master_min_times),
            },
            GameSetting {
                name: "Dual Chance",
                value: format!("{}%-{}%", veryeasy_dual_chance, master_dual_chance),
            },
            GameSetting {
                name: "Secondary NoBonus",
                value: format!("{}%-{}%", veryeasy_secondary_no_bonus, master_secondary_no_bonus),
            },
            // Block Distribution (VeryEasy to Master) - size = block width
            GameSetting {
                name: "Size-1 Weight",
                value: format!(
                    "{}-{}", game_settings.veryeasy_size1_weight, game_settings.master_size1_weight,
                ),
            },
            GameSetting {
                name: "Size-2 Weight",
                value: format!(
                    "{}-{}", game_settings.veryeasy_size2_weight, game_settings.master_size2_weight,
                ),
            },
            GameSetting {
                name: "Size-3 Weight",
                value: format!(
                    "{}-{}", game_settings.veryeasy_size3_weight, game_settings.master_size3_weight,
                ),
            },
            GameSetting {
                name: "Size-4 Weight",
                value: format!(
                    "{}-{}", game_settings.veryeasy_size4_weight, game_settings.master_size4_weight,
                ),
            },
            GameSetting {
                name: "Size-5 Weight",
                value: format!(
                    "{}-{}", game_settings.veryeasy_size5_weight, game_settings.master_size5_weight,
                ),
            },
            // Variance Settings
            GameSetting {
                name: "Early Variance", value: format!("{}%", game_settings.early_variance_percent),
            },
            GameSetting {
                name: "Mid Variance", value: format!("{}%", game_settings.mid_variance_percent),
            },
            GameSetting {
                name: "Late Variance", value: format!("{}%", game_settings.late_variance_percent),
            },
            // Level Tier Thresholds
            GameSetting {
                name: "Early Levels", value: format!("1-{}", game_settings.early_level_threshold),
            },
            GameSetting {
                name: "Mid Levels",
                value: format!(
                    "{}-{}",
                    game_settings.early_level_threshold + 1,
                    game_settings.mid_level_threshold,
                ),
            },
            // Level Cap
            GameSetting { name: "Level Cap", value: format!("{}", game_settings.level_cap) },
        ]
            .span()
    }

    /// Format a ratio value (e.g., 100 -> "1.00", 250 -> "2.50")
    fn format_ratio(value_x100: u16) -> ByteArray {
        let whole = value_x100 / 100;
        let frac = value_x100 % 100;
        if frac < 10 {
            format!("{}.0{}", whole, frac)
        } else {
            format!("{}.{}", whole, frac)
        }
    }

    fn difficulty_label(difficulty: Difficulty) -> ByteArray {
        match difficulty {
            Difficulty::None => "Unspecified",
            Difficulty::Increasing => "Increasing",
            Difficulty::VeryEasy => "Very Easy",
            Difficulty::Easy => "Easy",
            Difficulty::Medium => "Medium",
            Difficulty::MediumHard => "Medium Hard",
            Difficulty::Hard => "Hard",
            Difficulty::VeryHard => "Very Hard",
            Difficulty::Expert => "Expert",
            Difficulty::Master => "Master",
        }
    }
}
